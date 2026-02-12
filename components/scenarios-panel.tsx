"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, ShieldCheck, AlertTriangle, CreditCard, FileCheck, Award as IdCard, Users, BookMarked, Scale } from "lucide-react";

const scenarios = [
  {
    id: "new-account",
    label: "New account onboarding",
    icon: Users,
    active: true,
  },
  {
    id: "app-support",
    label: "Send application support",
    icon: FileText,
    active: false,
  },
  {
    id: "fraud-alert",
    label: "Fraud alert handling",
    icon: AlertTriangle,
    active: false,
  },
  {
    id: "credit-card",
    label: "Credit card replacement",
    icon: CreditCard,
    active: false,
  },
];

const supportingDocs = [
  {
    id: "compliance",
    label: "Compliance guidelines.pdf",
    icon: FileCheck,
  },
  {
    id: "id-verification",
    label: "ID verification checklist.png",
    icon: IdCard,
  },
  {
    id: "customer-flowmap",
    label: "Customer flowmap.png",
    icon: Users,
  },
  { id: "brand", label: "Brand", icon: BookMarked },
  { id: "rules", label: "Rules", icon: Scale },
];

interface ScenariosPanelProps {
  onScenarioSelect: (id: string) => void;
  selectedScenario: string;
}

export function ScenariosPanel({
  onScenarioSelect,
  selectedScenario,
}: ScenariosPanelProps) {
  const [scenariosExpanded, setScenariosExpanded] = useState(true);
  const [docsExpanded, setDocsExpanded] = useState(true);

  return (
    <div className="relative flex h-full w-[280px] flex-shrink-0 flex-col rounded-xl glass-panel glass-shine">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-4 py-3">
        <span className="text-sm font-semibold text-foreground">
          Scenarios
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Scenarios List */}
      <div className="flex-1 overflow-y-auto glass-scrollbar px-2 py-2">
        <button
          type="button"
          onClick={() => setScenariosExpanded(!scenariosExpanded)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-foreground hover:bg-[var(--glass-highlight)] transition-colors"
        >
          {scenariosExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          New account onboarding
        </button>

        {scenariosExpanded && (
          <div className="flex flex-col gap-0.5 pl-2 pb-2">
            {scenarios.map((item) => {
              const Icon = item.icon;
              const isActive = selectedScenario === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onScenarioSelect(item.id)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-[var(--glass-highlight)] text-foreground border border-[var(--glass-border)]"
                      : "text-muted-foreground hover:bg-[var(--glass-highlight)] hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Supporting Docs */}
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setDocsExpanded(!docsExpanded)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-[var(--glass-highlight)] transition-colors"
          >
            {docsExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            Supporting docs
          </button>

          {docsExpanded && (
            <div className="flex flex-col gap-0.5 pl-2">
              {supportingDocs.map((doc) => {
                const Icon = doc.icon;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-[var(--glass-highlight)] hover:text-foreground transition-colors"
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{doc.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
