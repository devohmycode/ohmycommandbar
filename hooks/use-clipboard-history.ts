"use client";

import { useState, useEffect, useCallback } from "react";

export interface ClipboardEntry {
  id: string;
  content: string;
  contentType: "text" | "link" | "email" | "phone" | "code" | "path" | "number" | "json" | "color" | "image";
  sourceApp: string;
  wordCount: number;
  charCount: number;
  timestamp: number;
  pinned: boolean;
  preview: string;
}

export function useClipboardHistory() {
  const [entries, setEntries] = useState<ClipboardEntry[]>([]);

  // Load initial history from Rust backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const history = await invoke<ClipboardEntry[]>("get_clipboard_history");
        if (!cancelled) setEntries(history);
      } catch {
        // Not running in Tauri context
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Listen for new clipboard entries from the Rust monitor
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    (async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        const fn_ = await listen<ClipboardEntry>("clipboard-changed", (event) => {
          setEntries((prev) => [event.payload, ...prev]);
        });
        unlisten = fn_;
      } catch {
        // Not running in Tauri context
      }
    })();
    return () => { unlisten?.(); };
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("delete_clipboard_entry", { id });
    } catch {}
  }, []);

  const clearHistory = useCallback(async () => {
    setEntries([]);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("clear_clipboard_history");
    } catch {}
  }, []);

  const togglePin = useCallback(async (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, pinned: !e.pinned } : e))
    );
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("toggle_clipboard_pin", { id });
    } catch {}
  }, []);

  const pasteEntry = useCallback(async (content: string) => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("paste_snippet", { body: content });
    } catch {}
  }, []);

  return { entries, deleteEntry, clearHistory, togglePin, pasteEntry };
}
