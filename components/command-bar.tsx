"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Search, ChevronRight, ChevronUp, ChevronDown, FileText, Zap,
  Hash, Copy, Check, Star, Plus, Pencil, Settings, Pin, ClipboardPaste,
  Link, ExternalLink,
} from "lucide-react";
import { SettingsPanel } from "@/components/settings-menu";
import { SnippetForm } from "@/components/snippet-form";
import { QuicklinkForm } from "@/components/quicklink-form";
import { ICON_MAP } from "@/components/icon-picker";
import { useSnippets, type Snippet } from "@/hooks/use-snippets";
import { useQuicklinks, type Quicklink } from "@/hooks/use-quicklinks";
import { resolvePlaceholders, previewPlaceholders } from "@/lib/resolve-placeholders";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

/* ───────────────── Types ───────────────── */

interface CommandItem {
  id: string;
  label: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  keywords?: string[];
  body?: string;
  link?: string;
  tags?: string[];
  pinned?: boolean;
  itemType?: "snippet" | "quicklink";
  action?: () => void;
}

const ACTION_CREATE_ID = "__action_create__";
const ACTION_CREATE_QUICKLINK_ID = "__action_create_quicklink__";

/* ───────────────── Tag Badge ───────────────── */

function TagBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-white/40 tracking-wide">
      {label}
    </span>
  );
}

/* ───────────────── Detail Panel ───────────────── */

function DetailPanel({
  item,
  onEdit,
  onCopy,
  onPaste,
  onPin,
  copied,
}: {
  item: CommandItem;
  onEdit: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onPin: () => void;
  copied: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center animate-slide-right">
      {/* Icon */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
        <item.icon className="h-6 w-6 text-white/50" />
      </div>

      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center justify-center gap-2">
          {item.pinned && <Pin className="h-3 w-3 text-[var(--accent-coral)]" />}
          <p className="text-[13px] font-semibold text-white/90 tracking-tight">{item.label}</p>
        </div>
        {item.subtitle && (
          <p className="text-[11px] font-mono text-white/30 tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {item.subtitle}
          </p>
        )}
      </div>

      {/* Body preview */}
      {item.body && (
        <div className="w-full max-w-[280px] rounded-xl bg-white/[0.03] border border-white/[0.05] px-4 py-3 text-left">
          <pre
            className="text-[11px] text-white/50 whitespace-pre-wrap break-words leading-relaxed"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {previewPlaceholders(item.body)}
          </pre>
        </div>
      )}

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {item.tags.map((tag) => (
            <TagBadge key={tag} label={tag} />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 mt-1">
        <ActionButton
          onClick={onCopy}
          active={copied}
          icon={copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          label={copied ? "Copied!" : "Copy"}
          accent={copied}
        />
        <ActionButton
          onClick={onPaste}
          icon={<ClipboardPaste className="h-3 w-3" />}
          label="Paste"
        />
        <ActionButton
          onClick={onEdit}
          icon={<Pencil className="h-3 w-3" />}
          label="Edit"
        />
        <ActionButton
          onClick={onPin}
          active={item.pinned}
          icon={<Pin className="h-3 w-3" />}
          label={item.pinned ? "Unpin" : "Pin"}
          accent={item.pinned}
        />
      </div>

      {/* Hint */}
      <p className="text-[10px] text-white/20 tracking-wide">
        <span className="text-white/30">Enter</span> copy
        <span className="mx-2 text-white/10">|</span>
        <span className="text-white/30">Ctrl+Enter</span> paste
      </p>
    </div>
  );
}

function ActionButton({
  onClick,
  icon,
  label,
  active,
  accent,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition-all duration-200 cursor-pointer ${
        accent
          ? "bg-[var(--accent-coral-dim)] border-[var(--accent-coral-border)] text-[var(--accent-coral)]"
          : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ───────────────── Kbd ───────────────── */

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] border border-white/[0.08] bg-white/[0.04] px-1 text-[9px] font-medium text-white/30"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {children}
    </kbd>
  );
}

/* ───────────────── Helpers ───────────────── */

function snippetToItem(snippet: Snippet): CommandItem {
  const Icon = ICON_MAP[snippet.icon] ?? ICON_MAP["Code"];
  return {
    id: snippet.id,
    label: snippet.name,
    subtitle: snippet.keyword,
    icon: Icon,
    category: snippet.pinned ? "Pinned" : "Snippets",
    keywords: [snippet.keyword, ...snippet.tags],
    body: snippet.body,
    tags: snippet.tags,
    pinned: snippet.pinned,
    itemType: "snippet",
  };
}

function quicklinkToItem(quicklink: Quicklink): CommandItem {
  const Icon = ICON_MAP[quicklink.icon] ?? ICON_MAP["Globe"];
  return {
    id: quicklink.id,
    label: quicklink.name,
    subtitle: quicklink.link,
    icon: Icon,
    category: quicklink.pinned ? "Pinned" : "Quicklinks",
    keywords: [...quicklink.tags],
    link: quicklink.link,
    tags: quicklink.tags,
    pinned: quicklink.pinned,
    itemType: "quicklink",
  };
}

/* ───────────────── Main Command Bar ───────────────── */

export function CommandBar() {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { snippets, addSnippet, updateSnippet, deleteSnippet, togglePin: toggleSnippetPin, duplicateSnippet } = useSnippets();
  const { quicklinks, addQuicklink, updateQuicklink, deleteQuicklink, togglePin: toggleQuicklinkPin, duplicateQuicklink } = useQuicklinks();

  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingQuicklink, setIsCreatingQuicklink] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [editingQuicklink, setEditingQuicklink] = useState<Quicklink | null>(null);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const refocusSearch = useCallback(() => {
    requestAnimationFrame(() => searchRef.current?.focus());
  }, []);

  useEffect(() => {
    const savedOpacity = localStorage.getItem("glass-opacity");
    if (savedOpacity) {
      const alpha = Number(savedOpacity) / 100;
      document.documentElement.style.setProperty(
        "--glass-bg",
        `rgba(10, 10, 14, ${alpha})`
      );
    }
    const savedShortcut = localStorage.getItem("shortcut");
    if (savedShortcut) {
      try {
        const { modifiers, key } = JSON.parse(savedShortcut);
        invoke("change_shortcut", { modifiers, key }).catch(() => {});
      } catch {}
    }
    if (localStorage.getItem("always-on-top") === "true") {
      getCurrentWindow().setAlwaysOnTop(true).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const appWindow = getCurrentWindow();
    if (collapsed) {
      appWindow.setSize(new LogicalSize(750, 44));
    } else {
      appWindow.setSize(new LogicalSize(750, 500));
    }
  }, [collapsed]);

  useEffect(() => {
    const unlisten = listen("window-expanded", () => {
      setCollapsed(false);
      refocusSearch();
    });
    return () => { unlisten.then((fn) => fn()); };
  }, [refocusSearch]);

  const sortedSnippets = useMemo(() => {
    return [...snippets].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
  }, [snippets]);

  const sortedQuicklinks = useMemo(() => {
    return [...quicklinks].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
  }, [quicklinks]);

  const items = useMemo(() => [
    ...sortedSnippets.map(snippetToItem),
    ...sortedQuicklinks.map(quicklinkToItem),
  ], [sortedSnippets, sortedQuicklinks]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords?.some((kw) => kw.toLowerCase().includes(q))
    );
  }, [query, items]);

  const openCreateForm = useCallback(() => {
    setIsCreating(true);
    setIsCreatingQuicklink(false);
    setEditingSnippet(null);
    setEditingQuicklink(null);
    setShowSettings(false);
  }, []);

  const openCreateQuicklinkForm = useCallback(() => {
    setIsCreatingQuicklink(true);
    setIsCreating(false);
    setEditingSnippet(null);
    setEditingQuicklink(null);
    setShowSettings(false);
  }, []);

  const createActionItem: CommandItem = useMemo(() => ({
    id: ACTION_CREATE_ID,
    label: query.trim() ? `Create "${query.trim()}"` : "Create a snippet",
    subtitle: "Ctrl+N",
    icon: Plus,
    category: "Actions",
    keywords: ["create", "new", "add", "snippet"],
    action: openCreateForm,
  }), [query, openCreateForm]);

  const createQuicklinkActionItem: CommandItem = useMemo(() => ({
    id: ACTION_CREATE_QUICKLINK_ID,
    label: query.trim() ? `Quicklink "${query.trim()}"` : "Create a quicklink",
    subtitle: "Ctrl+L",
    icon: Link,
    category: "Actions",
    keywords: ["create", "new", "add", "quicklink", "link", "url"],
    action: openCreateQuicklinkForm,
  }), [query, openCreateQuicklinkForm]);

  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    const ordered: Record<string, CommandItem[]> = {};
    if (groups["Pinned"]) ordered["Pinned"] = groups["Pinned"];
    for (const [key, value] of Object.entries(groups)) {
      if (key !== "Pinned") ordered[key] = value;
    }
    // Always append the create actions
    ordered["Actions"] = [createActionItem, createQuicklinkActionItem];
    return ordered;
  }, [filtered, createActionItem, createQuicklinkActionItem]);

  const flatList = useMemo(() => {
    const list: CommandItem[] = [];
    for (const cat of Object.keys(grouped)) {
      list.push(...grouped[cat]);
    }
    return list;
  }, [grouped]);

  const selectedItem = flatList[selectedIndex] ?? flatList[0];

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      const resolved = await resolvePlaceholders(text);
      await navigator.clipboard.writeText(resolved);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }, []);

  const pasteSnippet = useCallback(async (body: string) => {
    try {
      await invoke("paste_snippet", { body });
    } catch {}
  }, []);

  const openLink = useCallback(async (link: string) => {
    try {
      const resolved = await resolvePlaceholders(link);
      await invoke("open_link", { url: resolved });
    } catch {}
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const showForm = isCreating || isCreatingQuicklink || editingSnippet !== null || editingQuicklink !== null;
    if (e.key === "Escape") {
      e.preventDefault();
      if (showSettings) {
        setShowSettings(false);
      }
      // Always refocus search and clear query
      setQuery("");
      setSelectedIndex(0);
      refocusSearch();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && !showForm && selectedItem?.action) {
      e.preventDefault();
      selectedItem.action();
    } else if (e.key === "Enter" && e.ctrlKey && !showForm && selectedItem?.body) {
      e.preventDefault();
      pasteSnippet(selectedItem.body);
    } else if (e.key === "Enter" && !e.ctrlKey && !showForm && selectedItem?.link) {
      e.preventDefault();
      openLink(selectedItem.link);
    } else if (e.key === "Enter" && !e.ctrlKey && !showForm && selectedItem?.body) {
      e.preventDefault();
      copyToClipboard(selectedItem.body);
    } else if (e.key === "c" && e.ctrlKey && !showForm && selectedItem?.link) {
      e.preventDefault();
      copyToClipboard(selectedItem.link);
    } else if (e.key === "e" && e.ctrlKey && !showForm && selectedItem) {
      e.preventDefault();
      startEdit();
    } else if (e.key === "d" && e.ctrlKey && !showForm && selectedItem) {
      e.preventDefault();
      if (selectedItem.itemType === "quicklink") duplicateQuicklink(selectedItem.id);
      else duplicateSnippet(selectedItem.id);
    } else if (e.key === "p" && e.ctrlKey && !showForm && selectedItem) {
      e.preventDefault();
      if (selectedItem.itemType === "quicklink") toggleQuicklinkPin(selectedItem.id);
      else toggleSnippetPin(selectedItem.id);
    } else if (e.key === "n" && e.ctrlKey && !showForm) {
      e.preventDefault();
      openCreateForm();
    } else if (e.key === "l" && e.ctrlKey && !showForm) {
      e.preventDefault();
      openCreateQuicklinkForm();
    }
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    Pinned: <Pin className="h-3 w-3" />,
    Snippets: <Zap className="h-3 w-3" />,
    Quicklinks: <Link className="h-3 w-3" />,
    Actions: <Plus className="h-3 w-3" />,
    Scenarios: <Zap className="h-3 w-3" />,
    Policies: <Hash className="h-3 w-3" />,
    "Supporting Docs": <FileText className="h-3 w-3" />,
  };

  const closeForm = () => { setIsCreating(false); setIsCreatingQuicklink(false); setEditingSnippet(null); setEditingQuicklink(null); refocusSearch(); };

  const handleSaveNew = (data: Omit<Snippet, "id">) => { addSnippet(data); closeForm(); };
  const handleSaveEdit = (data: Omit<Snippet, "id">) => {
    if (editingSnippet) updateSnippet(editingSnippet.id, data);
    closeForm();
  };
  const handleDelete = () => {
    if (editingSnippet) deleteSnippet(editingSnippet.id);
    closeForm();
  };

  const handleSaveNewQuicklink = (data: Omit<Quicklink, "id">) => { addQuicklink(data); closeForm(); };
  const handleSaveEditQuicklink = (data: Omit<Quicklink, "id">) => {
    if (editingQuicklink) updateQuicklink(editingQuicklink.id, data);
    closeForm();
  };
  const handleDeleteQuicklink = () => {
    if (editingQuicklink) deleteQuicklink(editingQuicklink.id);
    closeForm();
  };

  const startEdit = () => {
    if (!selectedItem) return;
    if (selectedItem.itemType === "quicklink") {
      const ql = quicklinks.find((q) => q.id === selectedItem.id);
      if (ql) { setEditingQuicklink(ql); setIsCreating(false); setIsCreatingQuicklink(false); setEditingSnippet(null); }
    } else {
      const snippet = snippets.find((s) => s.id === selectedItem.id);
      if (snippet) { setEditingSnippet(snippet); setIsCreating(false); setIsCreatingQuicklink(false); setEditingQuicklink(null); }
    }
  };

  const showForm = isCreating || isCreatingQuicklink || editingSnippet !== null || editingQuicklink !== null;

  return (
    <div
      className="fixed inset-0 flex flex-col rounded-none glass-panel-strong glass-shine overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {/* ─── Search Bar ─── */}
      <div
        data-tauri-drag-region=""
        className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-2.5"
      >
        <Search className="h-4 w-4 text-white/20 flex-shrink-0" />
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
          placeholder="Search snippets & quicklinks..."
          className="flex-1 bg-transparent text-[13px] font-light text-white/90 placeholder-white/25 outline-none tracking-wide"
          autoFocus
        />

        <div className="flex items-center gap-1.5">
          <ToolbarButton
            onClick={openCreateForm}
            label="New snippet"
          >
            <Plus className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={openCreateQuicklinkForm}
            label="New quicklink"
          >
            <Link className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => { setShowSettings(!showSettings); closeForm(); }}
            active={showSettings}
            label="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </ToolbarButton>
          <div className="h-4 w-px bg-white/[0.06] mx-0.5" />
          <ToolbarButton
            onClick={() => setCollapsed(!collapsed)}
            label={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </ToolbarButton>
        </div>
      </div>

      {/* ─── Body ─── */}
      {!collapsed && (
        <div className="flex flex-1 min-h-0 animate-fade-in">
          {/* Left: Results */}
          <div className="w-[340px] flex-shrink-0 overflow-y-auto glass-scrollbar border-r border-white/[0.04]">
            {Object.keys(grouped).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
                <div className="h-10 w-10 rounded-xl bg-white/[0.03] flex items-center justify-center">
                  <Search className="h-4 w-4 text-white/15" />
                </div>
                <div className="space-y-1">
                  <p className="text-[12px] font-medium text-white/40">
                    {items.length === 0 ? "No snippets yet" : "No results"}
                  </p>
                  <p className="text-[10px] text-white/20">
                    {items.length === 0 ? "Press Ctrl+N to create one" : "Try a different query"}
                  </p>
                </div>
              </div>
            ) : (
              Object.entries(grouped).map(([category, catItems]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 px-4 pt-4 pb-1.5">
                    <span className="text-white/20">{categoryIcons[category]}</span>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/25">
                      {category}
                    </span>
                    <span className="text-[9px] text-white/15">{catItems.length}</span>
                  </div>
                  {catItems.map((item, i) => {
                    const globalIdx = flatList.indexOf(item);
                    const isSelected = globalIdx === selectedIndex;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedIndex(globalIdx);
                          if (item.action) { item.action(); return; }
                          closeForm(); setShowSettings(false);
                        }}
                        onDoubleClick={() => {
                          if (item.action) return;
                          setSelectedIndex(globalIdx);
                          setShowSettings(false);
                          if (item.itemType === "quicklink") {
                            const ql = quicklinks.find((q) => q.id === item.id);
                            if (ql) { setEditingQuicklink(ql); setIsCreating(false); setIsCreatingQuicklink(false); setEditingSnippet(null); }
                          } else {
                            const snippet = snippets.find((s) => s.id === item.id);
                            if (snippet) { setEditingSnippet(snippet); setIsCreating(false); setIsCreatingQuicklink(false); setEditingQuicklink(null); }
                          }
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`group flex w-full items-center gap-3 px-4 py-2 text-left transition-all duration-150 ${
                          isSelected
                            ? "bg-white/[0.06] item-selected"
                            : "hover:bg-white/[0.03]"
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-150 ${
                            isSelected
                              ? "bg-white/[0.08] text-white/80"
                              : "bg-white/[0.03] text-white/30 group-hover:text-white/50"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {item.pinned && <Pin className="h-2.5 w-2.5 text-[var(--accent-coral)] flex-shrink-0" />}
                            <p
                              className={`text-[12px] truncate transition-colors duration-150 ${
                                isSelected
                                  ? "text-white/90 font-medium"
                                  : "text-white/60 group-hover:text-white/80"
                              }`}
                            >
                              {item.label}
                            </p>
                          </div>
                          {item.subtitle && (
                            <p
                              className="text-[10px] text-white/25 truncate mt-0.5"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <ChevronRight className="h-3 w-3 flex-shrink-0 text-white/20" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Right: Detail / Form / Settings */}
          <div className="flex-1 min-w-0">
            {showSettings ? (
              <SettingsPanel onClose={() => setShowSettings(false)} />
            ) : showForm ? (
              isCreating ? (
                <SnippetForm onSave={handleSaveNew} onCancel={closeForm} defaultName={query.trim()} />
              ) : isCreatingQuicklink ? (
                <QuicklinkForm onSave={handleSaveNewQuicklink} onCancel={closeForm} defaultName={query.trim()} />
              ) : editingSnippet ? (
                <SnippetForm
                  initial={editingSnippet}
                  onSave={handleSaveEdit}
                  onCancel={closeForm}
                  onDelete={handleDelete}
                />
              ) : editingQuicklink ? (
                <QuicklinkForm
                  initial={editingQuicklink}
                  onSave={handleSaveEditQuicklink}
                  onCancel={closeForm}
                  onDelete={handleDeleteQuicklink}
                />
              ) : null
            ) : selectedItem?.action ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center animate-slide-right">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-coral-dim)] border border-[var(--accent-coral-border)]">
                  {selectedItem.id === ACTION_CREATE_QUICKLINK_ID
                    ? <Link className="h-6 w-6 text-[var(--accent-coral)]" />
                    : <Plus className="h-6 w-6 text-[var(--accent-coral)]" />
                  }
                </div>
                <div className="space-y-1">
                  <p className="text-[13px] font-semibold text-white/90 tracking-tight">{selectedItem.label}</p>
                  <p className="text-[11px] text-white/30">
                    {selectedItem.id === ACTION_CREATE_QUICKLINK_ID ? "Open the quicklink editor" : "Open the snippet editor"}
                  </p>
                </div>
                <p className="text-[10px] text-white/20 tracking-wide">
                  Press <span className="text-white/30">Enter</span> to create
                </p>
              </div>
            ) : selectedItem?.itemType === "quicklink" ? (
              <QuicklinkDetailPanel
                item={selectedItem}
                onEdit={startEdit}
                onOpen={() => selectedItem.link && openLink(selectedItem.link)}
                onCopy={() => selectedItem.link && copyToClipboard(selectedItem.link)}
                onPin={() => toggleQuicklinkPin(selectedItem.id)}
                copied={copied}
              />
            ) : selectedItem ? (
              <DetailPanel
                item={selectedItem}
                onEdit={startEdit}
                onCopy={() => selectedItem.body && copyToClipboard(selectedItem.body)}
                onPaste={() => selectedItem.body && pasteSnippet(selectedItem.body)}
                onPin={() => toggleSnippetPin(selectedItem.id)}
                copied={copied}
              />
            ) : null}
          </div>
        </div>
      )}

      {/* ─── Footer ─── */}
      {!collapsed && (
        <div className="flex items-center justify-between border-t border-white/[0.04] px-4 py-1.5">
          <span className="text-[10px] text-white/20 tabular-nums">
            {flatList.length} item{flatList.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-3">
            {showForm ? (
              <>
                <FooterShortcut keys={["Ctrl", "↵"]} label="Save" />
                <FooterShortcut keys={["Esc"]} label="Cancel" />
                {(editingSnippet || editingQuicklink) && <FooterShortcut keys={["Ctrl", "⌫"]} label="Delete" />}
              </>
            ) : showSettings ? (
              <FooterShortcut keys={["Esc"]} label="Close" />
            ) : selectedItem?.itemType === "quicklink" ? (
              <>
                <FooterShortcut keys={["↵"]} label="Open" />
                <FooterShortcut keys={["Ctrl", "C"]} label="Copy" />
                <FooterShortcut keys={["Ctrl", "E"]} label="Edit" />
                <FooterShortcut keys={["Ctrl", "L"]} label="New" />
                <FooterShortcut keys={["Esc"]} label="Reset" />
              </>
            ) : (
              <>
                <FooterShortcut keys={["↵"]} label="Copy" />
                <FooterShortcut keys={["Ctrl", "↵"]} label="Paste" />
                <FooterShortcut keys={["Ctrl", "E"]} label="Edit" />
                <FooterShortcut keys={["Ctrl", "N"]} label="New" />
                <FooterShortcut keys={["Esc"]} label="Reset" />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────── Quicklink Detail Panel ───────────────── */

function QuicklinkDetailPanel({
  item,
  onEdit,
  onOpen,
  onCopy,
  onPin,
  copied,
}: {
  item: CommandItem;
  onEdit: () => void;
  onOpen: () => void;
  onCopy: () => void;
  onPin: () => void;
  copied: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center animate-slide-right">
      {/* Icon */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
        <item.icon className="h-6 w-6 text-white/50" />
      </div>

      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center justify-center gap-2">
          {item.pinned && <Pin className="h-3 w-3 text-[var(--accent-coral)]" />}
          <p className="text-[13px] font-semibold text-white/90 tracking-tight">{item.label}</p>
        </div>
      </div>

      {/* URL preview */}
      {item.link && (
        <div className="w-full max-w-[280px] rounded-xl bg-white/[0.03] border border-white/[0.05] px-4 py-3 text-left">
          <p
            className="text-[11px] text-white/50 break-all leading-relaxed"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {previewPlaceholders(item.link)}
          </p>
        </div>
      )}

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {item.tags.map((tag) => (
            <TagBadge key={tag} label={tag} />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 mt-1">
        <ActionButton
          onClick={onOpen}
          icon={<ExternalLink className="h-3 w-3" />}
          label="Open"
        />
        <ActionButton
          onClick={onCopy}
          active={copied}
          icon={copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          label={copied ? "Copied!" : "Copy Link"}
          accent={copied}
        />
        <ActionButton
          onClick={onEdit}
          icon={<Pencil className="h-3 w-3" />}
          label="Edit"
        />
        <ActionButton
          onClick={onPin}
          active={item.pinned}
          icon={<Pin className="h-3 w-3" />}
          label={item.pinned ? "Unpin" : "Pin"}
          accent={item.pinned}
        />
      </div>

      {/* Hint */}
      <p className="text-[10px] text-white/20 tracking-wide">
        <span className="text-white/30">Enter</span> open
        <span className="mx-2 text-white/10">|</span>
        <span className="text-white/30">Ctrl+C</span> copy link
      </p>
    </div>
  );
}

/* ───────────────── Sub-components ───────────────── */

function ToolbarButton({
  children,
  onClick,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 cursor-pointer ${
        active
          ? "bg-white/[0.08] text-white/70"
          : "text-white/25 hover:text-white/50 hover:bg-white/[0.04]"
      }`}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function FooterShortcut({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center gap-1">
      {keys.map((k, i) => (
        <Kbd key={i}>{k}</Kbd>
      ))}
      <span className="text-[9px] text-white/20 ml-0.5">{label}</span>
    </div>
  );
}
