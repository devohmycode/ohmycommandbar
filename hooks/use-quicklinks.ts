"use client";

import { useState, useEffect, useCallback } from "react";

export interface Quicklink {
  id: string;
  name: string;
  icon: string;       // key from ICON_MAP (default "Globe")
  link: string;       // URL, deeplink, or file path
  tags: string[];
  pinned?: boolean;
}

const STORAGE_KEY = "ohmycommandbar-quicklinks";

function loadQuicklinks(): Quicklink[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQuicklinks(quicklinks: Quicklink[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quicklinks));
}

export function useQuicklinks() {
  const [quicklinks, setQuicklinks] = useState<Quicklink[]>([]);

  useEffect(() => {
    setQuicklinks(loadQuicklinks());
  }, []);

  const persist = useCallback((next: Quicklink[]) => {
    setQuicklinks(next);
    saveQuicklinks(next);
  }, []);

  const addQuicklink = useCallback(
    (quicklink: Omit<Quicklink, "id">) => {
      const newQuicklink: Quicklink = { ...quicklink, id: crypto.randomUUID() };
      persist([...quicklinks, newQuicklink]);
      return newQuicklink;
    },
    [quicklinks, persist]
  );

  const updateQuicklink = useCallback(
    (id: string, updates: Partial<Omit<Quicklink, "id">>) => {
      persist(
        quicklinks.map((q) => (q.id === id ? { ...q, ...updates } : q))
      );
    },
    [quicklinks, persist]
  );

  const deleteQuicklink = useCallback(
    (id: string) => {
      persist(quicklinks.filter((q) => q.id !== id));
    },
    [quicklinks, persist]
  );

  const togglePin = useCallback(
    (id: string) => {
      persist(
        quicklinks.map((q) =>
          q.id === id ? { ...q, pinned: !q.pinned } : q
        )
      );
    },
    [quicklinks, persist]
  );

  const duplicateQuicklink = useCallback(
    (id: string) => {
      const original = quicklinks.find((q) => q.id === id);
      if (!original) return;
      const copy: Quicklink = {
        ...original,
        id: crypto.randomUUID(),
        name: `${original.name} (copy)`,
      };
      persist([...quicklinks, copy]);
    },
    [quicklinks, persist]
  );

  return { quicklinks, addQuicklink, updateQuicklink, deleteQuicklink, togglePin, duplicateQuicklink };
}
