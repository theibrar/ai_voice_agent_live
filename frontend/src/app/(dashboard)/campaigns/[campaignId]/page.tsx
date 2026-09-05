"use client";

import React, { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import {
  Megaphone,
  Bot,
  Phone,
  Clock,
  Play,
  Pause,
  ArrowLeft,
  Users,
  Award,
  CheckCircle2,
  TrendingUp,
  Activity,
  Calendar,
} from "lucide-react";

interface CampaignDetailPageProps {
  params: Promise<{ campaignId: string }>;
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const resolvedParams = use(params);
  const { campaigns, toggleCampaignStatus, contacts, calls } = useAppStore();

  const campaign = campaigns.find((c) => c.id === resolvedParams.campaignId) || campaigns[0];
  const campaignCalls = calls.filter((c) => c.campaignId === campaign.id);
  const campaignContacts = contacts.filter((c) => c.campaignId === campaign.id || true).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/campaigns"
            className="p-2 bg-white border border-[#E5EAF2] rounded-xl text-[#78849A] hover:text-[#172033] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#172033]">{campaign.name}</h1>
              <StatusPill status={campaign.status} />
              {campaign.customTypeTitle && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-md">
                  {campaign.customTypeTitle}
                </span>
              )}
            </div>
            <p className="text-xs text-[#78849A] mt-0.5">
              Assigned: {campaign.agentName} • Caller ID: {campaign.phoneNumber} • {campaign.schedule?.days?.join(", ") || "Mon-Fri"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleCampaignStatus(campaign.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer ${
              campaign.status === "active"
                ? "bg-[#FEF7EC] text-[#D99025] hover:bg-[#FDEBD0] border border-[#D99025]/30"
                : "bg-[#16A36A] text-white hover:bg-[#138A5A]"
            }`}
          >
            {campaign.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{campaign.status === "active" ? "Pause Campaign" : "Resume Campaign"}</span>
          </button>
        </div>
      </div>

      {/* Campaign Strategy & Agent Objective Grounding */}
      {campaign.campaignObjective && (
        <div className="p-4 bg-white rounded-2xl border border-[#E5EAF2] card-shadow space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#3157D5]">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Agent Conversational Strategy: {campaign.customTypeTitle || campaign.type.replace(/_/g, " ").toUpperCase()}</span>
          </div>
          <p className="text-xs text-[#78849A] leading-relaxed">
            "{campaign.campaignObjective}"
          </p>
        </div>
      )}

      {/* Conversion Funnel Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-[#E5EAF2] card-shadow">
          <span className="text-[11px] font-semibold text-[#78849A] uppercase tracking-wider">Total Target Leads</span>
          <div className="text-2xl font-bold text-[#172033] mt-1">{campaign.totalLeads.toLocaleString()}</div>
          <span className="text-[11px] text-[#78849A] mt-0.5 block">100% Audience Size</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E5EAF2] card-shadow">
          <span className="text-[11px] font-semibold text-[#78849A] uppercase tracking-wider">Connected Calls</span>
          <div className="text-2xl font-bold text-[#3157D5] mt-1">{campaign.connectedLeads.toLocaleString()}</div>
          <span className="text-[11px] text-[#16A36A] font-semibold mt-0.5 block">{campaign.answerRate}% Answer Rate</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E5EAF2] card-shadow">
          <span className="text-[11px] font-semibold text-[#78849A] uppercase tracking-wider">Qualified Leads</span>
          <div className="text-2xl font-bold text-[#16A36A] mt-1">{campaign.qualifiedLeads.toLocaleString()}</div>
          <span className="text-[11px] text-[#16A36A] font-semibold mt-0.5 block">{campaign.conversionRate}% Conversion</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E5EAF2] card-shadow">
          <span className="text-[11px] font-semibold text-[#78849A] uppercase tracking-wider">Concurrency Limit</span>
          <div className="text-2xl font-bold text-[#D99025] mt-1">{campaign.concurrencyLimit} Ports</div>
          <span className="text-[11px] text-[#78849A] mt-0.5 block">Retry: {campaign.retryAttempts}x ({campaign.retryIntervalMinutes}m gap)</span>
        </div>
      </div>

      {/* Campaign Lead Queue Table */}
      <div className="bg-white rounded-2xl border border-[#E5EAF2] card-shadow overflow-hidden">
        <div className="p-4 border-b border-[#E5EAF2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#3157D5]" />
            <h3 className="text-sm font-bold text-[#172033]">Lead Outreach Ledger</h3>
          </div>
          <span className="text-xs text-[#78849A]">Showing {campaignContacts.length} target records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F7FB] text-[#78849A] uppercase tracking-wider font-semibold border-b border-[#E5EAF2]">
              <tr>
                <th className="p-4">Contact</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Lead Score</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Outcome</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF2]">
              {campaignContacts.map((c) => (
                <tr key={c.id} className="hover:bg-[#F4F7FB]/60 transition-colors">
                  <td className="p-4 font-bold text-[#172033]">
                    {c.name}
                    <p className="text-[10px] text-[#78849A] font-normal">{c.company}</p>
                  </td>
                  <td className="p-4 font-mono">{c.phone}</td>
                  <td className="p-4">
                    <span className="font-bold text-[#3157D5] bg-[#EEF2FD] px-2 py-0.5 rounded-full">
                      Score {c.leadScore}
                    </span>
                  </td>
                  <td className="p-4">
                    <StatusPill status={c.status as any} size="sm" />
                  </td>
                  <td className="p-4 text-[#78849A]">{c.lastCallOutcome || "Queued for Dialing"}</td>
                  <td className="p-4 text-right">
                    <Link
                      href="/live-calls"
                      className="text-xs font-semibold text-[#3157D5] hover:underline"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
