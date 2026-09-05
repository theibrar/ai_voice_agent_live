"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { formatDuration } from "@/lib/utils";
import {
  callVolumeByHour,
  callOutcomesDistribution,
  latencyPercentiles,
} from "@/lib/mock-data/analytics";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Award,
  Zap,
  DollarSign,
  Clock,
  CheckCircle2,
  Bot,
  Filter,
  Layers,
  Sparkles,
  AlertCircle,
  ArrowRight,
  TrendingDown,
} from "lucide-react";

export default function AnalyticsPage() {
  const { agents, funnelSteps, analyticsOverview, refreshAnalyticsOverview } = useAppStore();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [selectedFunnelStep, setSelectedFunnelStep] = useState(funnelSteps[2] || funnelSteps[0]);

  // Keep selectedFunnelStep synced if funnelSteps updates
  React.useEffect(() => {
    if (funnelSteps.length > 0) {
      setSelectedFunnelStep(funnelSteps[2] || funnelSteps[0]);
    }
  }, [funnelSteps]);

  const handleTimeRangeChange = (r: "7d" | "30d" | "90d") => {
    setTimeRange(r);
    refreshAnalyticsOverview(r);
  };

  const COLORS = ["#3157D5", "#5C82FF", "#1E40AF", "#93C5FD", "#0F172A"];

  const hourlyData = (analyticsOverview?.hourlyVolume && analyticsOverview.hourlyVolume.length > 0)
    ? analyticsOverview.hourlyVolume
    : callVolumeByHour;

  const outcomesData = (analyticsOverview?.callOutcomes && analyticsOverview.callOutcomes.length > 0)
    ? analyticsOverview.callOutcomes
    : callOutcomesDistribution;

  const latencyData = (analyticsOverview?.latencyPercentiles && analyticsOverview.latencyPercentiles.length > 0)
    ? analyticsOverview.latencyPercentiles
    : latencyPercentiles;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voice Analytics & Conversation Intelligence"
        description="Comprehensive insights across conversation funnels, step drop-off points, sub-second latency benchmarks, and conversion ROI."
        actions={
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E5EAF2] card-shadow">
            {(["7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => handleTimeRangeChange(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  timeRange === r
                    ? "bg-[#3157D5] text-white shadow-2xs font-bold"
                    : "text-[#78849A] hover:text-[#172033]"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        }
      />

      {/* 4 Top Level Analytics Metric Cards from PostgreSQL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-[#E5EAF2] card-shadow">
          <span className="text-xs font-semibold text-[#78849A] uppercase tracking-wider">Conversation Success</span>
          <div className="text-2xl font-bold text-[#0F172A] mt-1">
            {analyticsOverview?.conversationSuccess !== undefined ? `${analyticsOverview.conversationSuccess}%` : "88.4%"}
          </div>
          <span className="text-xs text-[#16A36A] font-semibold mt-1 block">Goal completion rate</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E5EAF2] card-shadow">
          <span className="text-xs font-semibold text-[#78849A] uppercase tracking-wider">Avg Resolution Cost</span>
          <div className="text-2xl font-bold text-[#0F172A] mt-1">
            ${analyticsOverview?.avgResolutionCost !== undefined ? analyticsOverview.avgResolutionCost.toFixed(2) : "0.42"}
          </div>
          <span className="text-xs text-[#3157D5] font-semibold mt-1 block">vs $6.50 human agent</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E5EAF2] card-shadow">
          <span className="text-xs font-semibold text-[#78849A] uppercase tracking-wider">P50 End-to-End Latency</span>
          <div className="text-2xl font-bold text-[#3157D5] mt-1">
            {analyticsOverview?.p50LatencyMs !== undefined ? `${analyticsOverview.p50LatencyMs}ms` : "280ms"}
          </div>
          <span className="text-xs text-[#3157D5] font-semibold mt-1 block">Natural speech turnaround</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E5EAF2] card-shadow">
          <span className="text-xs font-semibold text-[#78849A] uppercase tracking-wider">Funnel Retention</span>
          <div className="text-2xl font-bold text-[#3157D5] mt-1">
            {analyticsOverview?.funnelRetention !== undefined ? `${analyticsOverview.funnelRetention}%` : "74.5%"}
          </div>
          <span className="text-xs text-[#78849A] mt-1 block">Cold greeting to demo booking</span>
        </div>
      </div>

      {/* FEATURE 7: Dynamic Conversation Step Funnel & Drop-Off Analytics from PostgreSQL */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5EAF2] card-shadow space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#EDF2F7]">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#3157D5]" />
              <h2 className="text-base font-bold text-[#172033]">
                Dynamic Conversation Step Funnel & Friction Analytics
              </h2>
            </div>
            <p className="text-xs text-[#78849A] mt-0.5">
              Inspect where prospects disconnect during dialog turns. AI identifies friction and prescribes prompt tweaks.
            </p>
          </div>
          <span className="text-xs font-bold text-[#3157D5] bg-[#EEF2FD] px-3 py-1 rounded-full">
            {(analyticsOverview?.dialogRunsAnalyzed || 14280).toLocaleString()} Dialog Runs Analyzed
          </span>
        </div>

        {/* Step-by-Step Funnel Bars */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {funnelSteps.map((step) => {
            const isSelected = selectedFunnelStep.id === step.id;
            return (
              <div
                key={step.id}
                onClick={() => setSelectedFunnelStep(step)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "bg-[#EEF2FD] border-[#3157D5] ring-2 ring-[#3157D5]/20 shadow-md"
                    : "bg-[#F4F7FB] border-[#E5EAF2] hover:bg-[#EDF2F7]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#78849A] mb-1">
                    <span>STEP {step.stepNumber}</span>
                    <span className="px-1.5 py-0.5 rounded font-mono bg-[#EEF2FD] text-[#3157D5] font-bold">
                      -{step.dropOffRatePercent}%
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-[#172033] leading-snug line-clamp-2">{step.stepName}</h3>
                </div>

                <div>
                  <div className="w-full bg-[#E5EAF2] h-2 rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full rounded-full bg-[#3157D5]"
                      style={{ width: `${(step.completedCount / 10000) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-[#78849A]">
                    <span>{step.completedCount.toLocaleString()}</span>
                    <span>{Math.round((step.completedCount / 10000) * 100)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Step Drop-Off & AI Prescription Insight */}
        <div className="p-4 bg-[#F4F7FB] rounded-xl border border-[#E5EAF2] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-[#172033]">
                Step {selectedFunnelStep.stepNumber}: {selectedFunnelStep.stepName}
              </span>
              <span className="text-[10px] font-bold text-[#3157D5] bg-[#EEF2FD] px-2 py-0.5 rounded-full">
                Drop Reason: {selectedFunnelStep.dropOffReason}
              </span>
            </div>
            <p className="text-[#78849A]">
              Impact: {selectedFunnelStep.visitorsCount - selectedFunnelStep.completedCount} prospects dropped at this prompt.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#3157D5]/30 shadow-xs max-w-md w-full">
            <div className="flex items-center gap-1.5 text-[#3157D5] font-bold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Recommended Script Optimization:</span>
            </div>
            <p className="text-[11px] text-[#172033] leading-relaxed">
              &quot;{selectedFunnelStep.aiOptimizationTip}&quot;
            </p>
          </div>
        </div>
      </div>

      {/* Row 1 Charts: Volume Area & Outcome Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Volume Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#E5EAF2] card-shadow">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-[#172033]">Inbound vs Outbound Hourly Call Velocity</h2>
            <p className="text-xs text-[#78849A]">Distribution of call volume across global peak hours</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="anInbound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3157D5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3157D5" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="anOutbound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5C82FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#5C82FF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF2F7" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#78849A" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#78849A" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#090D16",
                    border: "none",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#FFFFFF" }}
                />
                <Area type="monotone" dataKey="inbound" stroke="#3157D5" strokeWidth={2.5} fillOpacity={1} fill="url(#anInbound)" name="Inbound" />
                <Area type="monotone" dataKey="outbound" stroke="#5C82FF" strokeWidth={2.5} fillOpacity={1} fill="url(#anOutbound)" name="Outbound" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Outcome Breakdown Donut (1 col) */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5EAF2] card-shadow flex flex-col justify-between">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-[#172033]">Call Outcomes</h2>
            <p className="text-xs text-[#78849A]">Resolution distribution</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {outcomesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#101A33",
                    border: "none",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#FFFFFF" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#EDF2F7]">
            {outcomesData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-[#78849A]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  {item.name}
                </span>
                <span className="font-bold text-[#172033]">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Latency Percentiles & Agent Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latency Percentiles (1 col) */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5EAF2] card-shadow flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-[#172033]">Voice Latency Percentiles (ms)</h2>
            <p className="text-xs text-[#78849A]">P50 vs P90 vs P99 response time breakdown</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EDF2F7" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#78849A" }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 9, fill: "#172033" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#101A33",
                    border: "none",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#FFFFFF" }}
                />
                <Bar dataKey="p50" fill="#3157D5" name="P50 Latency (ms)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="p90" fill="#5C82FF" name="P90 Latency (ms)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agent Performance Leaderboard (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#E5EAF2] card-shadow">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-[#172033]">Voice Agent Performance Leaderboard</h2>
            <p className="text-xs text-[#78849A]">Ranked by total handled calls, qualification percentage, and sentiment</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F7FB] text-[#78849A] uppercase tracking-wider font-semibold border-b border-[#E5EAF2]">
                <tr>
                  <th className="p-3">Agent</th>
                  <th className="p-3">Total Calls</th>
                  <th className="p-3">Success %</th>
                  <th className="p-3">Avg Duration</th>
                  <th className="p-3">Sentiment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF2]">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-[#F4F7FB]/60 transition-colors">
                    <td className="p-3 font-bold text-[#172033] flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px]"
                        style={{ backgroundColor: agent.color }}
                      >
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <span>{agent.name}</span>
                    </td>
                    <td className="p-3 font-mono font-medium">{(agent.metrics?.totalCalls || 0).toLocaleString()}</td>
                    <td className="p-3 font-semibold text-[#16A36A]">
                      {agent.metrics?.successRate !== undefined ? `${agent.metrics.successRate}%` : "94.2%"}
                    </td>
                    <td className="p-3 font-mono">
                      {formatDuration(agent.metrics?.avgDurationSeconds || 185)}
                    </td>
                    <td className="p-3 font-bold text-[#3157D5]">
                      {agent.metrics?.sentimentScore !== undefined ? `${agent.metrics.sentimentScore}%` : "91.5%"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
