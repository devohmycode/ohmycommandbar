import React from "react";
import {
  Copy, Check, Pin, Trash2, ClipboardPaste, Clock,
  Link, Mail, Phone, Code, FolderOpen, Hash, Braces, Palette, FileText, Type,
} from "lucide-react";
import type { ClipboardEntry } from "@/hooks/use-clipboard-history";

const CONTENT_TYPE_META: Record<
  ClipboardEntry["contentType"],
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  text:   { icon: Type,       label: "Text" },
  link:   { icon: Link,       label: "Link" },
  email:  { icon: Mail,       label: "Email" },
  phone:  { icon: Phone,      label: "Phone" },
  code:   { icon: Code,       label: "Code" },
  path:   { icon: FolderOpen, label: "File Path" },
  number: { icon: Hash,       label: "Number" },
  json:   { icon: Braces,     label: "JSON" },
  color:  { icon: Palette,    label: "Color" },
  image:  { icon: FileText,   label: "Image" },
};

export function getClipboardIcon(contentType: ClipboardEntry["contentType"]) {
  return CONTENT_TYPE_META[contentType]?.icon ?? Type;
}

function ActionButton({
  onClick,
  icon,
  label,
  active,
  accent,
  destructive,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  accent?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition-all duration-200 cursor-pointer ${
        destructive
          ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
          : accent
            ? "bg-[var(--accent-coral-dim)] border-[var(--accent-coral-border)] text-[var(--accent-coral)]"
            : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ClipboardDetailPanel({
  entry,
  onCopy,
  onPaste,
  onPin,
  onDelete,
  copied,
}: {
  entry: ClipboardEntry;
  onCopy: () => void;
  onPaste: () => void;
  onPin: () => void;
  onDelete: () => void;
  copied: boolean;
}) {
  const meta = CONTENT_TYPE_META[entry.contentType] ?? CONTENT_TYPE_META.text;
  const Icon = meta.icon;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center animate-slide-right">
      {/* Icon */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
        <Icon className="h-6 w-6 text-white/50" />
      </div>

      {/* Type & Source */}
      <div className="space-y-1">
        <div className="flex items-center justify-center gap-2">
          {entry.pinned && <Pin className="h-3 w-3 text-[var(--accent-coral)]" />}
          <p className="text-[13px] font-semibold text-white/90 tracking-tight">{meta.label}</p>
        </div>
        <div className="flex items-center justify-center gap-2 text-[10px] text-white/30">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5">
            {entry.sourceApp}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {formatTimestamp(entry.timestamp)}
          </span>
        </div>
      </div>

      {/* Content Preview */}
      <div className="w-full max-w-[280px] rounded-xl bg-white/[0.03] border border-white/[0.05] px-4 py-3 text-left">
        {entry.contentType === "color" ? (
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-lg border border-white/10 flex-shrink-0"
              style={{ backgroundColor: entry.content.trim() }}
            />
            <span
              className="text-[11px] text-white/50"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {entry.content.trim()}
            </span>
          </div>
        ) : (
          <pre
            className="text-[11px] text-white/50 whitespace-pre-wrap break-words leading-relaxed max-h-[120px] overflow-hidden"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {entry.preview}
          </pre>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-[10px] text-white/25">
        <span>{entry.wordCount} word{entry.wordCount !== 1 ? "s" : ""}</span>
        <span className="text-white/10">|</span>
        <span>{entry.charCount} char{entry.charCount !== 1 ? "s" : ""}</span>
      </div>

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
          onClick={onPin}
          active={entry.pinned}
          icon={<Pin className="h-3 w-3" />}
          label={entry.pinned ? "Unpin" : "Pin"}
          accent={entry.pinned}
        />
        <ActionButton
          onClick={onDelete}
          icon={<Trash2 className="h-3 w-3" />}
          label="Delete"
          destructive
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
