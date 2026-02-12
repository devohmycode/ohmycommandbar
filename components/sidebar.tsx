"use client";

import { useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  BookOpen,
  CreditCard,
  UserCog,
  ClipboardCheck,
  Settings,
  Database,
  Trash2,
  Bot,
} from "lucide-react";

const policyItems = [
  { id: "onboarding", label: "Onboarding", icon: BookOpen },
  { id: "credit-debit", label: "Credit/Debit", icon: CreditCard },
  { id: "personalization", label: "Personalization", icon: UserCog },
  { id: "evaluation", label: "Evaluation", icon: ClipboardCheck },
  { id: "advanced", label: "Advanced", icon: Settings },
];

export function Sidebar() {
  const [policiesOpen, setPoliciesOpen] = useState(true);
  const [activePolicy, setActivePolicy] = useState("onboarding");
  const [searchQuery, setSearchQuery] = useState("");
  const [memoryUsage] = useState(67);

  return (
    <aside className="relative flex h-full w-[260px] flex-shrink-0 flex-col rounded-xl glass-panel glass-shine">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-[var(--glass-border)] px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-400">
          <Bot className="h-4 w-4 text-foreground" style={{ color: "white" }} />
        </div>
        <span className="text-sm font-semibold text-foreground">
          Banking AI support agent
        </span>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 rounded-lg bg-[var(--glass-highlight)] px-3 py-2 border border-[var(--glass-border)]">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-foreground placeholder-muted-foreground outline-none"
          />
        </div>
      </div>

      {/* Policies Section */}
      <div className="flex-1 overflow-y-auto glass-scrollbar px-2">
        <button
          type="button"
          onClick={() => setPoliciesOpen(!policiesOpen)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-[var(--glass-highlight)] transition-colors"
        >
          {policiesOpen ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          Policies
        </button>

        {policiesOpen && (
          <div className="flex flex-col gap-0.5 pb-2">
            {policyItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePolicy === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePolicy(item.id)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-[var(--glass-highlight)] text-foreground border border-[var(--glass-border)]"
                      : "text-muted-foreground hover:bg-[var(--glass-highlight)] hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Memory Indicator */}
      <div className="border-t border-[var(--glass-border)] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Remaining memory
            </span>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Purge
          </button>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--glass-highlight)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all"
            style={{ width: `${memoryUsage}%` }}
          />
        </div>
      </div>
    </aside>
  );
}
