"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Trash2 } from "lucide-react";
import { IconPicker } from "@/components/icon-picker";
import type { Quicklink } from "@/hooks/use-quicklinks";

interface QuicklinkFormProps {
  initial?: Quicklink;
  defaultName?: string;
  onSave: (data: Omit<Quicklink, "id">) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const PLACEHOLDERS = [
  { label: "Clipboard", value: "{clipboard}" },
  { label: "Date", value: "{date}" },
  { label: "Time", value: "{time}" },
  { label: "DateTime", value: "{datetime}" },
  { label: "Day", value: "{day}" },
  { label: "UUID", value: "{uuid}" },
];

export function QuicklinkForm({ initial, defaultName, onSave, onCancel, onDelete }: QuicklinkFormProps) {
  const [name, setName] = useState(initial?.name ?? defaultName ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "Globe");
  const [link, setLink] = useState(initial?.link ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !link.trim()) return;
    onSave({
      name: name.trim(),
      icon,
      link: link.trim(),
      tags,
    });
  };

  const insertPlaceholder = (placeholder: string) => {
    const input = linkRef.current;
    if (!input) {
      setLink((prev) => prev + placeholder);
      return;
    }
    const start = input.selectionStart ?? link.length;
    const end = input.selectionEnd ?? link.length;
    const newLink = link.slice(0, start) + placeholder + link.slice(end);
    setLink(newLink);
    requestAnimationFrame(() => {
      input.focus();
      const pos = start + placeholder.length;
      input.setSelectionRange(pos, pos);
    });
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addTag(); }
  };

  const handleFormKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    } else if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      if (name.trim() && link.trim()) {
        onSave({
          name: name.trim(),
          icon,
          link: link.trim(),
          tags,
        });
      }
    } else if (e.key === "Backspace" && e.ctrlKey && initial && onDelete) {
      e.preventDefault();
      e.stopPropagation();
      onDelete();
    }
  }, [onCancel, onSave, onDelete, name, icon, link, tags, initial]);

  useEffect(() => {
    window.addEventListener("keydown", handleFormKeyDown);
    return () => window.removeEventListener("keydown", handleFormKeyDown);
  }, [handleFormKeyDown]);

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-y-auto glass-scrollbar px-5 py-5 animate-slide-right">
      <h3 className="text-[13px] font-semibold text-white/80 mb-5 tracking-tight">
        {initial ? "Edit Quicklink" : "New Quicklink"}
      </h3>

      {/* Name */}
      <FormLabel>Name</FormLabel>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="My quicklink"
        className="form-input mb-4"
      />

      {/* Icon */}
      <FormLabel>Icon</FormLabel>
      <div className="mb-4">
        <IconPicker value={icon} onChange={setIcon} />
      </div>

      {/* Link */}
      <FormLabel>Link</FormLabel>
      <div className="flex flex-wrap gap-1 mb-2">
        {PLACEHOLDERS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => insertPlaceholder(p.value)}
            className="inline-flex items-center rounded-md bg-[var(--accent-coral-dim)] border border-[var(--accent-coral-border)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--accent-coral)] hover:bg-[var(--accent-coral)]/20 transition-colors cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>
      <input
        ref={linkRef}
        type="text"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="https://example.com/search?q={clipboard}"
        className="form-input mb-4"
        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px" }}
      />

      {/* Tags */}
      <FormLabel>Tags</FormLabel>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-white/40"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-white/60 cursor-pointer"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        onKeyDown={handleTagKeyDown}
        placeholder="Add tag + Enter"
        className="form-input mb-4"
      />

      {/* Actions */}
      <div className="mt-auto flex flex-col gap-2 pt-3">
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={!name.trim() || !link.trim()}
            className="flex-1 rounded-lg bg-[var(--accent-coral-dim)] border border-[var(--accent-coral-border)] px-3 py-2 text-[12px] font-medium text-[var(--accent-coral)] hover:bg-[var(--accent-coral)]/20 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-[12px] font-medium text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
        <div className="flex items-center justify-center gap-4 text-[9px] text-white/20">
          <span><kbd className="inline px-1 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] text-white/30 font-mono text-[8px]">Ctrl+↵</kbd> Save</span>
          <span><kbd className="inline px-1 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] text-white/30 font-mono text-[8px]">Esc</kbd> Cancel</span>
          {initial && onDelete && (
            <span><kbd className="inline px-1 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] text-white/30 font-mono text-[8px]">Ctrl+⌫</kbd> Delete</span>
          )}
        </div>
      </div>

      {initial && onDelete && (
        <div className="mt-3">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-rose-400/70">Delete?</span>
              <button
                type="button"
                onClick={onDelete}
                className="flex-1 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-[11px] font-medium text-rose-400/80 hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-white/40 hover:text-white/60 transition-colors cursor-pointer"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2 text-[11px] font-medium text-white/25 hover:text-rose-400/60 hover:border-rose-500/15 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .form-input {
          width: 100%;
          border-radius: 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 0.5rem 0.75rem;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
          outline: none;
          transition: border-color 0.2s;
        }
        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }
        .form-input:focus {
          border-color: var(--accent-coral-border);
        }
      `}</style>
    </form>
  );
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/25 mb-1.5 block">
      {children}
    </label>
  );
}
