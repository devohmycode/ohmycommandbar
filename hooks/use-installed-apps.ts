"use client";

import { useState, useEffect, useCallback } from "react";

export interface InstalledApp {
  id: string;
  name: string;
  launch_path: string;
  location?: string | null;
  source: string;
}

export function useInstalledApps() {
  const [apps, setApps] = useState<InstalledApp[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const installed = await invoke<InstalledApp[]>("get_installed_apps");
        if (!cancelled) setApps(installed);
      } catch {
        // Not running in Tauri context
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const launchApp = useCallback(async (path: string) => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("launch_installed_app", { path });
    } catch {}
  }, []);

  return { apps, launchApp };
}
