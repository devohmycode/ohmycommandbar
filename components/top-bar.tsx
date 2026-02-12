"use client";

import { Bot, Play, Square, FlaskConical } from "lucide-react";

export function TopBar() {
  return (
    <div className="relative flex items-center justify-between rounded-xl glass-panel glass-shine px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-400">
            <Bot className="h-3.5 w-3.5" style={{ color: "white" }} />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Banking AI support agent
          </span>
        </div>
        <div className="h-4 w-px bg-[var(--glass-border)]" />
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg bg-[var(--glass-highlight)] border border-[var(--glass-border)] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <FlaskConical className="h-3.5 w-3.5" />
          Try it mode
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-600/30 transition-colors"
        >
          <Play className="h-3 w-3 fill-current" />
          Start
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg bg-[var(--glass-highlight)] border border-[var(--glass-border)] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Square className="h-3 w-3" />
          Dart
        </button>
      </div>
    </div>
  );
}
