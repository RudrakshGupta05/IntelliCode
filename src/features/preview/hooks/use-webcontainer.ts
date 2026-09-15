import { useCallback, useEffect, useRef, useState } from "react";
import { WebContainer } from "@webcontainer/api";
import { buildFileTree, getFilePath } from "../utils/file-tree";
import { Id } from "../../../../convex/_generated/dataModel";
import { useFiles } from "@/features/projects/hooks/use-files";

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

const getWebContainer = async (): Promise<WebContainer> => {
    if (webcontainerInstance) {
        return webcontainerInstance;
    }
    if (!bootPromise) {
        bootPromise = WebContainer.boot({
            coep: "credentialless",
        }).catch((err) => {
            bootPromise = null;
            throw err;
        });
    }
    webcontainerInstance = await bootPromise;
    return webcontainerInstance;
};

interface UseWebContainerProps {
    projectId: Id<"projects">;
    enabled: boolean;
    settings?: {
        installCommand?: string;
        devCommand?: string;
    };
}

export const useWebContainer = ({
    projectId,
    enabled,
    settings,
}: UseWebContainerProps) => {
    const [status, setStatus] = useState<"idle" | "booting" | "installing" | "running" | "error">("idle");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [restartKey, setRestartKey] = useState(0);
    const [terminalOutput, setTerminalOutput] = useState<string>("");

    const containerRef = useRef<WebContainer | null>(null);
    const devProcessRef = useRef<any>(null);
    const installProcessRef = useRef<any>(null);
    const runIdRef = useRef(0);
    const syncedFilesRef = useRef<Map<string, string>>(new Map());

    const files = useFiles(projectId);
    const filesRef = useRef(files);
    filesRef.current = files;

    const hasPackageJson = Boolean(files && files.some((f) => f.name === "package.json"));

    const appendOutput = useCallback((data: string) => {
        setTerminalOutput((prev) => {
            if (prev.length > 300000) {
                return prev.slice(-150000) + data;
            }
            return prev + data;
        });
    }, []);

    // Main lifecycle effect for booting and launching the dev server
    useEffect(() => {
        if (!enabled) {
            if (devProcessRef.current) {
                try {
                    devProcessRef.current.kill();
                } catch {}
                devProcessRef.current = null;
            }
            if (installProcessRef.current) {
                try {
                    installProcessRef.current.kill();
                } catch {}
                installProcessRef.current = null;
            }
            setStatus("idle");
            setPreviewUrl(null);
            setError(null);
            return;
        }

        // Wait until project files have loaded and package.json exists
        if (!hasPackageJson) {
            setStatus("idle");
            setPreviewUrl(null);
            return;
        }

        const currentRunId = ++runIdRef.current;
        let unsubscribeServerReady: (() => void) | undefined;

        const start = async () => {
            try {
                // Kill previous processes before starting a new run
                if (devProcessRef.current) {
                    try {
                        devProcessRef.current.kill();
                    } catch {}
                    devProcessRef.current = null;
                }
                if (installProcessRef.current) {
                    try {
                        installProcessRef.current.kill();
                    } catch {}
                    installProcessRef.current = null;
                }

                setStatus("booting");
                setError(null);
                setPreviewUrl(null);
                setTerminalOutput("");

                appendOutput("🚀 Booting WebContainer environment...\n");
                const container = await getWebContainer();
                if (currentRunId !== runIdRef.current) return;
                containerRef.current = container;

                // Subscribe to server-ready port listener
                unsubscribeServerReady = container.on("server-ready", (_port, url) => {
                    if (currentRunId !== runIdRef.current) return;
                    setPreviewUrl(url);
                    setStatus("running");
                    appendOutput(`\n✨ Dev server ready! Preview active at ${url}\n`);
                });

                // Mount initial files from Convex
                const currentFiles = filesRef.current || [];
                appendOutput(`📁 Mounting ${currentFiles.length} project files...\n`);
                const fileTree = buildFileTree(currentFiles);
                const safeTree = JSON.parse(JSON.stringify(fileTree));
                await container.mount(safeTree);
                if (currentRunId !== runIdRef.current) return;

                // Prime syncedFilesRef cache
                const filesMap = new Map(currentFiles.map((f) => [f._id, f]));
                syncedFilesRef.current.clear();
                for (const file of currentFiles) {
                    if (file.type === "file" && file.content !== undefined) {
                        const path = getFilePath(file, filesMap);
                        syncedFilesRef.current.set(path, file.content);
                    }
                }

                // Install dependencies
                setStatus("installing");
                const rawInstall = settings?.installCommand?.trim();
                const installCmd = (!rawInstall || rawInstall.startsWith("rpm") || rawInstall.includes("create "))
                    ? "npm install --legacy-peer-deps"
                    : rawInstall;
                const [installBin, ...installArgs] = installCmd.trim().split(/\s+/);
                appendOutput(`\n📦 Running: ${installCmd}\n\n`);

                const installProcess = await container.spawn(installBin, installArgs);
                installProcessRef.current = installProcess;

                installProcess.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            if (currentRunId === runIdRef.current) {
                                appendOutput(data);
                            }
                        },
                    })
                );

                const installExitCode = await installProcess.exit;
                installProcessRef.current = null;
                if (currentRunId !== runIdRef.current) return;

                if (installExitCode !== 0) {
                    throw new Error(`Package installation failed (exit code ${installExitCode}). Check terminal output for details.`);
                }

                // Start Dev Server
                const rawDev = settings?.devCommand?.trim();
                const devCmd = (!rawDev || rawDev.startsWith("rpm") || rawDev.includes("create "))
                    ? "npm run dev"
                    : rawDev;
                const [devBin, ...devArgs] = devCmd.trim().split(/\s+/);
                appendOutput(`\n⚡ Starting server: ${devCmd}\n\n`);

                const devProcess = await container.spawn(devBin, devArgs);
                if (currentRunId !== runIdRef.current) {
                    devProcess.kill();
                    return;
                }
                devProcessRef.current = devProcess;

                devProcess.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            if (currentRunId === runIdRef.current) {
                                appendOutput(data);
                            }
                        },
                    })
                );

                // If dev server crashes or exits unexpectedly
                devProcess.exit.then((exitCode) => {
                    if (currentRunId === runIdRef.current && exitCode !== 0) {
                        setError(`Dev server exited with code ${exitCode}`);
                        setStatus("error");
                    }
                });
            } catch (err) {
                if (currentRunId !== runIdRef.current) return;
                let msg = err instanceof Error ? err.message : "Failed to run WebContainer";
                if (msg.includes("Unable to create more instances")) {
                    msg = "Only one WebContainer instance can run at a time in Safari. Please close other IntelliCode tabs and click Restart.";
                }
                appendOutput(`\n❌ Error: ${msg}\n`);
                setError(msg);
                setStatus("error");
            }
        };

        start();

        return () => {
            unsubscribeServerReady?.();
        };
    }, [
        projectId,
        enabled,
        hasPackageJson,
        restartKey,
        settings?.devCommand,
        settings?.installCommand,
        appendOutput,
    ]);

    // Live sync effect: incrementally write file changes into the running container without restarting
    useEffect(() => {
        const container = containerRef.current;
        if (!container || status !== "running" || !files) {
            return;
        }

        const filesMap = new Map(files.map((f) => [f._id, f]));
        let cancelled = false;

        const syncModifiedFiles = async () => {
            try {
                for (const file of files) {
                    if (cancelled) return;
                    if (file.type === "file" && !file.storageId && file.content !== undefined) {
                        const filePath = getFilePath(file, filesMap);
                        const previousContent = syncedFilesRef.current.get(filePath);

                        // Only write file if it's new or content has changed
                        if (previousContent !== file.content) {
                            const lastSlash = filePath.lastIndexOf("/");
                            if (lastSlash > 0) {
                                await container.fs.mkdir(filePath.slice(0, lastSlash), { recursive: true });
                            }
                            await container.fs.writeFile(filePath, file.content);
                            syncedFilesRef.current.set(filePath, file.content);
                        }
                    }
                }
            } catch (err) {
                console.error("Live file sync error:", err);
            }
        };

        syncModifiedFiles();

        return () => {
            cancelled = true;
        };
    }, [files, status]);

    // Clean up WebContainer on page unload so Safari releases the instance slot
    useEffect(() => {
        const handleUnload = () => {
            if (webcontainerInstance) {
                try {
                    webcontainerInstance.teardown();
                } catch {}
                webcontainerInstance = null;
                bootPromise = null;
            }
        };
        window.addEventListener("beforeunload", handleUnload);
        return () => {
            window.removeEventListener("beforeunload", handleUnload);
        };
    }, []);

    const restart = useCallback(() => {
        if (devProcessRef.current) {
            try {
                devProcessRef.current.kill();
            } catch {}
            devProcessRef.current = null;
        }
        if (installProcessRef.current) {
            try {
                installProcessRef.current.kill();
            } catch {}
            installProcessRef.current = null;
        }
        if (webcontainerInstance) {
            try {
                webcontainerInstance.teardown();
            } catch {}
            webcontainerInstance = null;
        }
        bootPromise = null;
        setRestartKey((k) => k + 1);
    }, []);

    return {
        status,
        previewUrl,
        error,
        restart,
        terminalOutput,
    };
};
