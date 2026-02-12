"use client";

import React from "react"

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  MessageSquare,
  User,
  Bot,
  Check,
  X,
  Edit3,
} from "lucide-react";

interface StatusBadgeProps {
  label: string;
  variant: "green" | "blue" | "red" | "orange" | "gray" | "cyan";
}

function StatusBadge({ label, variant }: StatusBadgeProps) {
  const variantStyles = {
    green:
      "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    blue: "bg-sky-500/15 text-sky-400 border-sky-500/25",
    red: "bg-rose-500/15 text-rose-400 border-rose-500/25",
    orange:
      "bg-amber-500/15 text-amber-400 border-amber-500/25",
    gray: "bg-neutral-500/15 text-neutral-400 border-neutral-500/25",
    cyan: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${variantStyles[variant]}`}
    >
      {label}
    </span>
  );
}

interface ScenarioStepProps {
  stepNumber: string;
  role: "ai" | "user" | "system";
  content: React.ReactNode;
}

function ScenarioStep({ stepNumber, role, content }: ScenarioStepProps) {
  const roleIcon =
    role === "ai" ? (
      <Bot className="h-3.5 w-3.5 text-sky-400" />
    ) : role === "user" ? (
      <User className="h-3.5 w-3.5 text-emerald-400" />
    ) : (
      <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
    );

  const roleLabel = role === "ai" ? "Aip" : role === "user" ? "Cst" : "Sys";

  return (
    <div className="flex gap-3 py-2 group">
      <div className="flex items-start gap-2 min-w-[60px]">
        <span className="text-[11px] text-muted-foreground font-mono">
          {stepNumber}
        </span>
        <div className="flex items-center gap-1">
          {roleIcon}
          <span className="text-[11px] text-muted-foreground">{roleLabel}</span>
        </div>
      </div>
      <div className="flex-1 text-sm text-foreground/90 leading-relaxed">
        {content}
      </div>
    </div>
  );
}

interface ScenarioSectionProps {
  number: number;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  showMarkDone?: boolean;
}

function ScenarioSection({
  number,
  title,
  children,
  defaultOpen = true,
  showMarkDone = false,
}: ScenarioSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--glass-border)] last:border-0">
      <div className="flex w-full items-center justify-between py-3 px-1 hover:bg-[var(--glass-highlight)] transition-colors rounded-md">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-1 items-center gap-2 bg-transparent border-0 p-0 cursor-pointer"
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-foreground">
            Scenario {number}: {title}
          </span>
        </button>
        {showMarkDone && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg bg-sky-500/20 border border-sky-500/30 px-2.5 py-1 text-[11px] text-sky-400 hover:bg-sky-500/30 transition-colors"
            >
              <Check className="h-3 w-3" />
              Mark Done
            </button>
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg bg-[var(--glass-highlight)] border border-[var(--glass-border)] px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Edit3 className="h-3 w-3" />
              Edit
            </button>
          </div>
        )}
      </div>
      {isOpen && <div className="pl-6 pb-3">{children}</div>}
    </div>
  );
}

export function ScenarioContent() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-xl glass-panel glass-shine">
      {/* Scenario Title */}
      <div className="border-b border-[var(--glass-border)] px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">
          Scenario: New account onboarding
        </h1>
      </div>

      {/* Scenario Steps */}
      <div className="flex-1 overflow-y-auto glass-scrollbar px-6 py-2">
        <ScenarioSection
          number={1}
          title="Generic Account Creation Inquiry"
          showMarkDone
        >
          <ScenarioStep
            stepNumber="01"
            role="ai"
            content={
              <span>
                {"Welcome to MainBank! I'd be happy to assist you with creating a new account. Let me guide you through the process."}
              </span>
            }
          />
          <ScenarioStep
            stepNumber="02"
            role="system"
            content={
              <span className="flex flex-wrap items-center gap-1.5">
                {"Customer provides info"} <StatusBadge label="fields confirmed" variant="green" />{" "}
                {"proceed to"} <StatusBadge label="Monthly Verification" variant="blue" />
              </span>
            }
          />
          <ScenarioStep
            stepNumber="03"
            role="system"
            content={
              <span className="flex flex-wrap items-center gap-1.5">
                {"Customer requests"} <StatusBadge label="Routing assistance" variant="cyan" />{" "}
                {"proceed to"} <StatusBadge label="Escalation" variant="orange" />
              </span>
            }
          />
        </ScenarioSection>

        <ScenarioSection number={2} title="Identity Verification">
          <ScenarioStep
            stepNumber="01"
            role="user"
            content={
              <span className="flex flex-wrap items-center gap-1.5">
                {"Updated password"}{" "}
                <StatusBadge label="Card confirmed" variant="green" />{" "}
                {"successfully"}
              </span>
            }
          />
          <ScenarioStep
            stepNumber="02"
            role="ai"
            content={
              <span className="flex flex-wrap items-center gap-1.5">
                {"Verification complete."}{" "}
                <StatusBadge label="ID verified" variant="green" />{" "}
                {"proceed to"}{" "}
                <StatusBadge label="Compliance checks" variant="blue" />
              </span>
            }
          />
          <ScenarioStep
            stepNumber="03"
            role="system"
            content={
              <span className="flex flex-wrap items-center gap-1.5">
                {"If rejected,"}{" "}
                <StatusBadge label="re-submit request" variant="red" />{" "}
                {"with"}{" "}
                <StatusBadge label="backup docs" variant="gray" />{" "}
                {"and retry"}
              </span>
            }
          />
        </ScenarioSection>

        <ScenarioSection number={3} title="Compliance Checks">
          <ScenarioStep
            stepNumber="01"
            role="ai"
            content={
              <span className="flex flex-wrap items-center gap-1.5">
                {"Running compliance verification against AML/KYC requirements."}
              </span>
            }
          />
          <ScenarioStep
            stepNumber="02"
            role="system"
            content={
              <span className="flex flex-wrap items-center gap-1.5">
                {"Status:"}{" "}
                <StatusBadge label="AML passed" variant="green" />{" "}
                <StatusBadge label="KYC passed" variant="green" />{" "}
                <StatusBadge label="Risk: Low" variant="blue" />
              </span>
            }
          />
          <ScenarioStep
            stepNumber="03"
            role="ai"
            content={
              <span className="flex flex-wrap items-center gap-1.5">
                {"Account approved. Sending welcome package and provisioning"}{" "}
                <StatusBadge label="Debit card" variant="cyan" />{" "}
                {"and"}{" "}
                <StatusBadge label="Online banking" variant="blue" />
              </span>
            }
          />
        </ScenarioSection>

        <ScenarioSection number={4} title="Account Activation" defaultOpen={false}>
          <ScenarioStep
            stepNumber="01"
            role="system"
            content={
              <span>
                {"Final activation steps and customer notification."}
              </span>
            }
          />
        </ScenarioSection>
      </div>
    </div>
  );
}
