"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import {
  Code, Terminal, FileText, Zap, Star, Hash, Bookmark, Tag,
  Braces, Globe, Link, Key, Lock, Mail, MessageSquare, Palette,
  Puzzle, Rocket, Shield, Sparkles, Wand2, Wrench, Coffee,
  Heart, Flame,
} from "lucide-react";

export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Code, Terminal, FileText, Zap, Star, Hash, Bookmark, Tag,
  Braces, Globe, Link, Key, Lock, Mail, MessageSquare, Palette,
  Puzzle, Rocket, Shield, Sparkles, Wand2, Wrench, Coffee,
  Heart, Flame,
};

const ICON_NAMES = Object.keys(ICON_MAP);

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const SelectedIcon = ICON_MAP[value] ?? ICON_MAP["Code"];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-[12px] text-white/60 hover:bg-white/[0.06] transition-colors cursor-pointer"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-coral-dim)] border border-[var(--accent-coral-border)] text-[var(--accent-coral)]">
          <SelectedIcon className="h-4 w-4" />
        </div>
        <span className="flex-1 text-left text-white/50">{value}</span>
        <ChevronDown className={`h-3 w-3 text-white/20 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 rounded-xl glass-panel-strong p-2.5 animate-scale-in">
          <div className="grid grid-cols-6 gap-1 max-h-[140px] overflow-y-auto glass-scrollbar">
            {ICON_NAMES.map((name) => {
              const Icon = ICON_MAP[name];
              const isSelected = value === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => { onChange(name); setOpen(false); }}
                  title={name}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "bg-[var(--accent-coral-dim)] text-[var(--accent-coral)]"
                      : "text-white/25 hover:bg-white/[0.06] hover:text-white/60"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
