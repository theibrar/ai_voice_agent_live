"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { formatDuration } from "@/lib/utils";
import {
  Bot,
  Plus,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Play,
  Pause,
  Copy,
  Sparkles,
  Volume2,
  Wrench,
  BookOpen,
  Trash2,
  Phone,
  Mic,
} from "lucide-react";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";

export default function AgentsPage() {
  const { agents, toggleAgentStatus, duplicateAgent, deleteAgent, refreshAgents } = useAppStore();

  useEffect(() => {
    refreshAgents();
  }, [refreshAgents]);


  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"most_calls" | "newest" | "highest_success">("most_calls");
  const [deleteModalAgent, setDeleteModalAgent] = useState<any | null>(null);

  const filteredAgents = agents
    .filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.voice.voiceName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : agent.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "most_calls") {
        return (b.metrics?.totalCalls || 0) - (a.metrics?.totalCalls || 0);
      }
      if (sortBy === "highest_success") {
        return (b.metrics?.successRate || 0) - (a.metrics?.successRate || 0);
      }
      return b.id.localeCompare(a.id);
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Voice Agents"
        description="Deploy and configure autonomous voice agents with ultra-low latency speech, custom tools, and knowledge grounding."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/templates"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F4F7FB] border border-[#E5EAF2] text-[#172033] text-xs font-semibold rounded-xl transition-all shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#3157D5]" />
              <span>Browse Templates</span>
            </Link>
            <Link
              href="/agents/new"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Agent</span>
            </Link>
          </div>
        }
      />

      {/* Filter and View Bar */}
      <div className="p-4 bg-white rounded-3xl border border-[#E2E8F0] card-shadow flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search agents by name, role, or prompt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#3157D5]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Agent Status Filter Tabs (Active, Paused, Draft, All) */}
          <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
            {[
              { id: "all", label: "All Agents" },
              { id: "active", label: "Active" },
              { id: "paused", label: "Paused" },
              { id: "draft", label: "Draft" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-[#3157D5] text-white shadow-2xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Clean Sort Selector */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none focus:border-[#3157D5] cursor-pointer"
          >
            <option value="most_calls">Sort: Most Call Volume</option>
            <option value="highest_success">Sort: Highest Success Rate</option>
            <option value="newest">Sort: Recently Updated</option>
          </select>

          {/* Grid / Table Toggle */}
          <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === "grid" ? "bg-[#3157D5] text-white shadow-2xs" : "text-[#64748B] hover:text-[#0F172A]"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === "table" ? "bg-[#3157D5] text-white shadow-2xs" : "text-[#64748B] hover:text-[#0F172A]"
              }`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Agents View */}
      {viewMode === "grid" ? (
        filteredAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className="p-5 bg-white rounded-2xl border border-[#E5EAF2] card-shadow card-hover flex flex-col justify-between"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                        style={{ backgroundColor: agent.color }}
                      >
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#172033] leading-snug">{agent.name}</h3>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="inline-block text-[10px] font-semibold text-[#3157D5] bg-[#EEF2FD] px-2 py-0.2 rounded-md">
                            {agent.voice.provider} • {agent.voice.voiceName}
                          </span>
                          {agent.assignedPhoneNumber && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                              <Phone className="w-2.5 h-2.5" />
                              {agent.assignedPhoneNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <StatusPill status={agent.status} size="sm" />
                  </div>

                  <p className="text-xs text-[#78849A] line-clamp-2 leading-relaxed mb-4">
                    {agent.description}
                  </p>

                  {/* Capabilities Badges */}
                  <div className="flex items-center gap-2 mb-4 text-[11px] text-[#78849A] flex-wrap">
                    <span className="flex items-center gap-1 bg-[#F4F7FB] px-2 py-0.5 rounded-md border border-[#E5EAF2]">
                      <Wrench className="w-3 h-3 text-[#3157D5]" />
                      {agent.tools.length} Tools Active
                    </span>
                    <span className="flex items-center gap-1 bg-[#F4F7FB] px-2 py-0.5 rounded-md border border-[#E5EAF2]">
                      <BookOpen className="w-3 h-3 text-[#16A36A]" />
                      {agent.knowledgeBaseIds.length} KB Sources
                    </span>
                    <span className="bg-[#F4F7FB] px-2 py-0.5 rounded-md border border-[#E5EAF2]">
                      {agent.language}
                    </span>
                  </div>

                  {/* Metrics Matrix (Live from Database) */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-[#F4F7FB] rounded-xl border border-[#E5EAF2] text-center mb-4">
                    <div>
                      <span className="text-[10px] text-[#78849A] block">Handled Calls</span>
                      <span className="text-xs font-bold text-[#172033]">
                        {(agent.metrics?.totalCalls ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#78849A] block">Success %</span>
                      <span className="text-xs font-bold text-[#16A36A]">
                        {(agent.metrics?.totalCalls ?? 0) > 0 ? `${agent.metrics?.successRate ?? 0}%` : "0%"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#78849A] block">Avg Duration</span>
                      <span className="text-xs font-bold text-[#172033]">
                        {(agent.metrics?.totalCalls ?? 0) > 0 ? formatDuration(agent.metrics?.avgDurationSeconds ?? 0) : "0:00"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-[#EDF2F7] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleAgentStatus(agent.id)}
                      title={agent.status === "active" ? "Pause Agent" : "Activate Agent"}
                      className="p-1.5 rounded-lg border border-[#E5EAF2] hover:bg-[#F4F7FB] text-[#78849A] hover:text-[#172033] transition-colors cursor-pointer"
                    >
                      {agent.status === "active" ? <Pause className="w-3.5 h-3.5 text-[#16A36A]" /> : <Play className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => duplicateAgent(agent.id)}
                      title="Duplicate Agent"
                      className="p-1.5 rounded-lg border border-[#E5EAF2] hover:bg-[#F4F4FB] text-[#78849A] hover:text-[#172033] transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteModalAgent(agent)}
                      title="Delete Agent"
                      className="p-1.5 rounded-lg border border-[#E5EAF2] hover:bg-rose-50 text-[#78849A] hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/agents/${agent.id}/test`}
                      className="px-2.5 py-1 text-xs font-semibold bg-[#EEF2FD] text-[#3157D5] hover:bg-[#E0E7FB] rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Audio</span>
                    </Link>

                    <Link
                      href={`/agents/${agent.id}`}
                      className="px-2.5 py-1 text-xs font-semibold bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0] rounded-lg transition-colors"
                    >
                      Configure
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#E5EAF2] card-shadow space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center mx-auto">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#172033]">No Voice Agents Provisioned</h3>
            <p className="text-xs text-[#78849A] max-w-sm mx-auto">
              Your database contains 0 registered voice agents. Click &apos;Create New Agent&apos; or browse templates to get started.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <Link
                href="/templates"
                className="px-3.5 py-2 bg-white hover:bg-[#F4F7FB] border border-[#E5EAF2] text-[#172033] text-xs font-semibold rounded-xl transition-all"
              >
                Browse Templates
              </Link>
              <Link
                href="/agents/new"
                className="px-4 py-2 bg-[#3157D5] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#2646B8] transition-all"
              >
                Create New Agent
              </Link>
            </div>
          </div>
        )
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-[#E5EAF2] card-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F7FB] text-[#78849A] uppercase tracking-wider font-semibold border-b border-[#E5EAF2]">
                <tr>
                  <th className="p-4">Agent Name</th>
                  <th className="p-4">Voice & Engine</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Calls Handled</th>
                  <th className="p-4">Success Rate</th>
                  <th className="p-4">Avg Duration</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF2]">
                {filteredAgents.length > 0 ? (
                  filteredAgents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-[#F4F7FB]/60 transition-colors">
                      <td className="p-4 font-bold text-[#172033] flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                          style={{ backgroundColor: agent.color }}
                        >
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span>{agent.name}</span>
                          <p className="text-[10px] text-[#78849A] font-normal">{agent.language}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-[#172033]">{agent.voice.voiceName}</span>
                        <p className="text-[10px] text-[#78849A]">Neural Ultra-HD Speech</p>
                      </td>
                      <td className="p-4">
                        <StatusPill status={agent.status} size="sm" />
                      </td>
                      <td className="p-4 font-mono font-medium">{agent.metrics.totalCalls.toLocaleString()}</td>
                      <td className="p-4 font-semibold text-[#16A36A]">{agent.metrics.successRate}%</td>
                      <td className="p-4 font-mono">{formatDuration(agent.metrics.avgDurationSeconds)}</td>
                      <td className="p-4 text-right space-x-2">
                        <Link
                          href={`/agents/${agent.id}/test`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EEF2FD] text-[#3157D5] font-semibold rounded-lg hover:bg-[#E0E7FB]"
                        >
                          <Volume2 className="w-3 h-3" /> Test
                        </Link>
                        <Link
                          href={`/agents/${agent.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#3157D5] text-white font-semibold rounded-lg hover:bg-[#2646B8]"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteModalAgent(agent)}
                          title="Delete Agent"
                          className="inline-flex items-center p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#64748B] text-xs">
                      No registered voice agents in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Professional Delete Confirmation Dialog */}
      <ConfirmDeleteModal
        isOpen={!!deleteModalAgent}
        onClose={() => setDeleteModalAgent(null)}
        onConfirm={async () => {
          if (deleteModalAgent) {
            await deleteAgent(deleteModalAgent.id);
          }
        }}
        itemName={deleteModalAgent?.name}
        itemType="Voice AI Agent"
      />
    </div>
  );
}
