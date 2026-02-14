"use client";

import { useState, useEffect, useCallback } from "react";

export interface Snippet {
  id: string;
  name: string;
  icon: string;
  keyword: string;
  body: string;
  tags: string[];
  pinned?: boolean;
}

const STORAGE_KEY = "ohmycommandbar-snippets";

function loadSnippets(): Snippet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSnippets(snippets: Snippet[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
}

/** Send the keyword->body map to the Rust backend for text expansion. */
async function syncTriggersToBackend(snippets: Snippet[]) {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const triggers: Record<string, string> = {};
    for (const s of snippets) {
      if (s.keyword && s.body) {
        triggers[s.keyword] = s.body;
      }
    }
    await invoke("sync_triggers", { triggers });
  } catch {
    // Not running in Tauri (e.g. browser dev) – silently ignore
  }
}

export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);

  useEffect(() => {
    const loaded = loadSnippets();
    setSnippets(loaded);
    syncTriggersToBackend(loaded);
  }, []);

  const persist = useCallback((next: Snippet[]) => {
    setSnippets(next);
    saveSnippets(next);
    syncTriggersToBackend(next);
  }, []);

  const addSnippet = useCallback(
    (snippet: Omit<Snippet, "id">) => {
      const newSnippet: Snippet = { ...snippet, id: crypto.randomUUID() };
      persist([...snippets, newSnippet]);
      return newSnippet;
    },
    [snippets, persist]
  );

  const updateSnippet = useCallback(
    (id: string, updates: Partial<Omit<Snippet, "id">>) => {
      persist(
        snippets.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    },
    [snippets, persist]
  );

  const deleteSnippet = useCallback(
    (id: string) => {
      persist(snippets.filter((s) => s.id !== id));
    },
    [snippets, persist]
  );

  const togglePin = useCallback(
    (id: string) => {
      persist(
        snippets.map((s) =>
          s.id === id ? { ...s, pinned: !s.pinned } : s
        )
      );
    },
    [snippets, persist]
  );

  const duplicateSnippet = useCallback(
    (id: string) => {
      const original = snippets.find((s) => s.id === id);
      if (!original) return;
      const copy: Snippet = {
        ...original,
        id: crypto.randomUUID(),
        name: `${original.name} (copy)`,
        keyword: `${original.keyword}-copy`,
      };
      persist([...snippets, copy]);
    },
    [snippets, persist]
  );

  return { snippets, addSnippet, updateSnippet, deleteSnippet, togglePin, duplicateSnippet };
}
