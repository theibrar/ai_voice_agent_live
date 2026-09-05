"use client";

import React, { useState, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { KnowledgeSource, KnowledgeSourceType } from "@/lib/types";
import {
  BookOpen,
  Plus,
  Search,
  UploadCloud,
  Globe,
  FileText,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Bot,
  RefreshCw,
  X,
  FileSpreadsheet,
  FileCode,
  File,
  ArrowUpRight,
} from "lucide-react";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";

export default function KnowledgeBasePage() {
  const { knowledgeSources, addKnowledgeSource, deleteKnowledgeSource, addToast } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [testQuery, setTestQuery] = useState("What is your SLA and SOC2 compliance policy?");
  const [testResults, setTestResults] = useState<{ sourceName: string; text: string; score: number }[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteModalDoc, setDeleteModalDoc] = useState<any | null>(null);

  // Add source form state
  const [sourceName, setSourceName] = useState("");
  const [sourceType, setSourceType] = useState<KnowledgeSourceType>("document");
  const [rawText, setRawText] = useState("");
  const [urlInput, setUrlInput] = useState("");

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileSizeKb, setFileSizeKb] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const quickFileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredSources = knowledgeSources.filter((kb) =>
    kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kb.contentPreview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileProcess = (file: File) => {
    if (!file) return;

    setSelectedFile(file);
    const calculatedSizeKb = Math.max(1, Math.round(file.size / 1024));
    setFileSizeKb(calculatedSizeKb);

    // Auto-populate document source name
    setSourceName(file.name);

    const isMarkdown = file.name.toLowerCase().endsWith(".md") || file.name.toLowerCase().endsWith(".markdown");
    const isTextLike =
      isMarkdown ||
      file.name.toLowerCase().endsWith(".txt") ||
      file.name.toLowerCase().endsWith(".json") ||
      file.name.toLowerCase().endsWith(".csv") ||
      file.name.toLowerCase().endsWith(".tsv") ||
      file.name.toLowerCase().endsWith(".html") ||
      file.name.toLowerCase().endsWith(".xml") ||
      file.name.toLowerCase().endsWith(".yml") ||
      file.name.toLowerCase().endsWith(".yaml") ||
      file.type.startsWith("text/");

    if (isTextLike) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = (e.target?.result as string) || "";
        setRawText(content);
        addToast({
          title: isMarkdown ? "Markdown Document Loaded" : "Document Loaded",
          description: isMarkdown
            ? `${file.name} parsed. Markdown structure ready for optimal AI voice grounding.`
            : `${file.name} loaded (${calculatedSizeKb} KB).`,
          type: "success",
        });
      };
      reader.onerror = () => {
        addToast({
          title: "File Read Error",
          description: "Could not read file text content.",
          type: "error",
        });
      };
      reader.readAsText(file);
    } else {
      // PDF, DOCX, XLSX, etc.
      const docType = file.name.split(".").pop()?.toUpperCase() || "Document";
      const samplePreview = `[Indexed ${docType} Document: ${file.name}]\nFile Size: ${calculatedSizeKb} KB\nStatus: Vector embeddings generated.\n\nExtracted enterprise context from ${file.name} for conversational voice agent grounding.`;
      setRawText(samplePreview);
      addToast({
        title: "Document Attached",
        description: `${file.name} (${calculatedSizeKb} KB) attached. Ready to index into Vector DB.`,
        type: "success",
      });
    }
  };

  const handleQuickUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSourceType("document");
      handleFileProcess(file);
      setShowAddModal(true);
    }
    e.target.value = "";
  };

  const handleTestSearch = () => {
    if (!testQuery.trim()) return;

    // Simulate semantic vector lookup
    const results = [
      {
        sourceName: "Apex Enterprise Architecture & Security FAQ 2026.pdf",
        text: "SOC2 Type II compliance: Apex Voice Systems undergoes annual third-party audits. All audio frames are processed in-memory with zero persistent audio storage unless HIPAA encrypted recording is explicitly enabled.",
        score: 0.96,
      },
      {
        sourceName: "Apex Enterprise Architecture & Security FAQ 2026.pdf",
        text: "Latency benchmarks: Edge speech recognition (Deepgram Nova-2) + LLM streaming (Claude 3.5 / GPT-4o) + Voice synthesis achieves 280ms average global round-trip latency.",
        score: 0.91,
      },
      {
        sourceName: "Apex Pricing, Tier Matrix & Volume Discounts.xlsx",
        text: "Enterprise volume discount: Accounts processing above 50,000 minutes per month qualify for Tier 3 pricing at $0.08 per minute.",
        score: 0.85,
      },
    ];

    setTestResults(results);
    addToast({ title: "Semantic Query Complete", description: "Found 3 vector matches.", type: "success" });
  };

  const handleCreateSource = () => {
    if (!sourceName.trim()) {
      addToast({
        title: "Validation Error",
        description: "Please provide a document title or upload a file.",
        type: "warning",
      });
      return;
    }

    // Split content into meaningful chunks
    let chunks = [];
    if (rawText.trim()) {
      const parts = rawText
        .split(/\n#{1,6}\s+|\n\n+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const sourceChunks = parts.length > 0 ? parts : [rawText.trim()];
      chunks = sourceChunks.slice(0, 30).map((chunkText, idx) => ({
        id: `chk-${Date.now()}-${idx}`,
        text: chunkText.slice(0, 600),
        tokenCount: Math.max(12, Math.ceil(chunkText.length / 4)),
        similarityScore: Number((0.88 + Math.random() * 0.11).toFixed(2)),
      }));
    } else {
      chunks = [
        {
          id: `chk-${Date.now()}`,
          text: "Synthesized vector embeddings for knowledge retrieval.",
          tokenCount: 45,
          similarityScore: 0.95,
        },
      ];
    }

    const calculatedSize = fileSizeKb > 0 ? fileSizeKb : Math.max(15, Math.ceil((rawText.length || 500) / 1024));
    const calculatedChunks = Math.max(chunks.length, Math.ceil((rawText.length || 500) / 250));

    const newSource: KnowledgeSource = {
      id: `kb-${Date.now()}`,
      name: sourceName.trim(),
      type: sourceType,
      status: "indexed",
      chunkCount: calculatedChunks,
      sizeKb: calculatedSize,
      lastIndexed: new Date().toISOString(),
      assignedAgentIds: ["agent-1"],
      url: sourceType === "url" ? urlInput : undefined,
      contentPreview: rawText.slice(0, 320) || "Custom indexed enterprise document context for voice agents.",
      chunks: chunks,
    };

    addKnowledgeSource(newSource);
    setShowAddModal(false);
    setSourceName("");
    setRawText("");
    setUrlInput("");
    setSelectedFile(null);
    setFileSizeKb(0);
  };

  const getSourceIcon = (kb: KnowledgeSource) => {
    const isMarkdown = kb.name.toLowerCase().endsWith(".md") || kb.name.toLowerCase().endsWith(".markdown");
    const isSpreadsheet = kb.name.toLowerCase().endsWith(".xlsx") || kb.name.toLowerCase().endsWith(".csv");

    if (kb.type === "document") {
      if (isMarkdown) return <FileCode className="w-5 h-5 text-[#3157D5]" />;
      if (isSpreadsheet) return <FileSpreadsheet className="w-5 h-5 text-[#16A36A]" />;
      return <FileText className="w-5 h-5 text-[#3157D5]" />;
    }
    if (kb.type === "url") return <Globe className="w-5 h-5 text-indigo-500" />;
    if (kb.type === "text") return <FileText className="w-5 h-5 text-amber-500" />;
    if (kb.type === "faq") return <HelpCircle className="w-5 h-5 text-violet-500" />;
    return <File className="w-5 h-5 text-[#78849A]" />;
  };

  return (
    <div className="space-y-6">
      {/* Hidden quick upload input */}
      <input
        ref={quickFileInputRef}
        type="file"
        accept="*/*,.md,.markdown,.txt,.pdf,.docx,.doc,.csv,.json,.xlsx,.pptx"
        onChange={handleQuickUpload}
        className="hidden"
      />

      <PageHeader
        title="Knowledge Base & Grounding"
        description="Index documents, websites, and FAQs into vector embeddings for real-time AI voice grounding."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => quickFileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E5EAF2] hover:border-[#3157D5] text-[#172033] hover:text-[#3157D5] text-xs font-semibold rounded-xl card-shadow transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-[#3157D5]" />
              <span>Upload Document</span>
            </button>
            <button
              onClick={() => {
                setSourceType("document");
                setShowAddModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Knowledge Source</span>
            </button>
          </div>
        }
      />

      {/* Main Grid: Left Sources, Right Test Search Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Sources List & Upload Dropzone */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Stats bar */}
          <div className="p-4 bg-white rounded-2xl border border-[#E5EAF2] card-shadow flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#78849A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search indexed knowledge files, Markdown docs, URLs, or FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] placeholder-[#78849A] outline-none focus:border-[#3157D5]"
              />
            </div>
            <span className="text-xs text-[#78849A] font-semibold">{filteredSources.length} Sources</span>
          </div>

          {/* Document Format Tip Banner */}
          <div className="p-3.5 bg-gradient-to-r from-[#EEF2FD] to-[#F4F7FB] rounded-2xl border border-[#3157D5]/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white text-[#3157D5] border border-[#3157D5]/20 flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-xs text-[#172033] leading-relaxed">
                <span className="font-bold text-[#3157D5]">Markdown (.md) files</span> provide optimal semantic precision for AI voice agents with structured headings and lists. All document formats (<span className="font-semibold">.pdf, .docx, .txt, .csv, .json</span>) are supported.
              </p>
            </div>
            <button
              onClick={() => quickFileInputRef.current?.click()}
              className="text-xs text-[#3157D5] font-bold hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <span>Upload .md</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sources Cards */}
          <div className="space-y-3">
            {filteredSources.length > 0 ? (
              filteredSources.map((kb) => {
                const isMd = kb.name.toLowerCase().endsWith(".md") || kb.name.toLowerCase().endsWith(".markdown");
                return (
                  <div
                    key={kb.id}
                    className="p-4 bg-white rounded-2xl border border-[#E5EAF2] card-shadow hover:border-[#3157D5]/30 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#EEF2FD] flex items-center justify-center shrink-0">
                          {getSourceIcon(kb)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-[#172033] leading-snug">{kb.name}</h3>
                            {isMd && (
                              <span className="text-[10px] font-bold bg-[#EEF2FD] text-[#3157D5] px-1.5 py-0.5 rounded border border-[#3157D5]/20">
                                Markdown (.md)
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#78849A]">
                            {kb.chunkCount} vector chunks • {kb.sizeKb} KB • Last indexed {new Date(kb.lastIndexed).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <StatusPill status={kb.status} size="sm" />
                    </div>

                    <p className="text-xs text-[#78849A] bg-[#F4F7FB] p-3 rounded-xl border border-[#E5EAF2] leading-relaxed mb-3 line-clamp-2">
                      {kb.contentPreview}
                    </p>

                    <div className="flex items-center justify-between text-xs text-[#78849A] pt-2 border-t border-[#EDF2F7]">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Bot className="w-3.5 h-3.5 text-[#3157D5]" />
                        Assigned to {kb.assignedAgentIds.length} Voice Agents
                      </span>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={async () => {
                            addToast({
                              title: "Re-indexing Triggered",
                              description: `Refreshing vector chunks for ${kb.name}`,
                              type: "info",
                            });
                            try {
                              const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1') + `/knowledge/${kb.id}`;
                              await fetch(apiUrl, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ...kb, status: "indexed" }),
                              });
                            } catch (err) {
                              console.warn("Failed to sync knowledge source in DB:", err);
                            }
                          }}
                          className="text-xs text-[#3157D5] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Sync Chunks</span>
                        </button>

                        <button
                          onClick={() => setDeleteModalDoc(kb)}
                          className="text-xs text-[#78849A] hover:text-rose-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Delete from Vector DB"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-[#E5EAF2] card-shadow space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033]">No Knowledge Sources Indexed</h3>
                  <p className="text-xs text-[#78849A] max-w-sm mx-auto mt-1">
                    Your vector database is empty. Upload Markdown (.md), PDFs, spreadsheets, or add URLs to ground your voice agents.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => quickFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#E5EAF2] hover:border-[#3157D5] text-[#172033] hover:text-[#3157D5] text-xs font-bold rounded-xl card-shadow transition-all cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-[#3157D5]" />
                    <span>Upload Document (.md, .pdf)</span>
                  </button>
                  <button
                    onClick={() => {
                      setSourceType("document");
                      setShowAddModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3157D5] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#2646B8] transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Knowledge Source</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Test Semantic Search Simulator */}
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-2xl border border-[#E5EAF2] card-shadow space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#3157D5]" />
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                  Test Semantic Search
                </h3>
              </div>
              <span className="text-[10px] font-bold text-[#16A36A] bg-[#E8F7F0] px-2 py-0.5 rounded-full">
                Vector DB
              </span>
            </div>

            <p className="text-xs text-[#78849A] leading-relaxed">
              Test how your voice agent retrieves and cites context when callers ask spontaneous questions.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="Ask any question about your documents..."
                className="w-full px-3 py-2 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] outline-none focus:border-[#3157D5]"
              />

              <button
                onClick={handleTestSearch}
                className="w-full py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Vector DB</span>
              </button>
            </div>

            {/* Test Results Display */}
            {testResults.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-[#EDF2F7]">
                <span className="text-[11px] font-bold text-[#172033] block">Top Semantic Matches:</span>
                {testResults.map((res, i) => (
                  <div key={i} className="p-3 bg-[#F4F7FB] rounded-xl border border-[#E5EAF2] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#172033] truncate max-w-[170px]">{res.sourceName}</span>
                      <span className="text-[10px] font-bold text-[#16A36A] bg-[#E8F7F0] px-1.5 py-0.2 rounded">
                        {Math.round(res.score * 100)}% Match
                      </span>
                    </div>
                    <p className="text-[11px] text-[#78849A] leading-relaxed italic">{res.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Knowledge Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101A33]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5EAF2] max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#172033]">Add Knowledge Source</h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedFile(null);
                  setRawText("");
                  setSourceName("");
                  setUrlInput("");
                  setFileSizeKb(0);
                }}
                className="text-[#78849A] hover:text-[#172033] p-1 rounded-lg hover:bg-[#F4F7FB] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type selector */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "document", label: "Upload Document", icon: UploadCloud },
                { id: "url", label: "Web URL", icon: Globe },
                { id: "text", label: "Raw Text", icon: FileText },
                { id: "faq", label: "FAQ Pairs", icon: HelpCircle },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSourceType(t.id as KnowledgeSourceType);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      sourceType === t.id
                        ? "bg-[#EEF2FD] border-[#3157D5] text-[#3157D5] font-bold shadow-2xs"
                        : "bg-[#F4F7FB] border-[#E5EAF2] text-[#78849A] hover:border-[#CBD5E1]"
                    }`}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-[11px] block">{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Document Upload Tab Content */}
            {sourceType === "document" && (
              <div className="space-y-3">
                {/* Markdown (.md) recommendation banner */}
                <div className="p-3 bg-[#EEF2FD] border border-[#3157D5]/20 rounded-xl flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#3157D5] shrink-0 mt-0.5" />
                  <div className="text-[11px] text-[#172033] leading-relaxed">
                    <span className="font-bold text-[#3157D5]">Markdown (.md) Recommended:</span>{" "}
                    AI voice agents understand structured Markdown files (.md) with maximum clarity and speed. All document types (.pdf, .docx, .txt, .csv, .json, etc.) are accepted.
                  </div>
                </div>

                {/* Dropzone or selected file card */}
                {!selectedFile ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileProcess(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-[#3157D5] bg-[#EEF2FD]"
                        : "border-[#CBD5E1] hover:border-[#3157D5] bg-[#F8FAFC] hover:bg-white"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="*/*,.md,.markdown,.txt,.pdf,.docx,.doc,.csv,.json,.xlsx,.pptx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileProcess(file);
                      }}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-[#EEF2FD] text-[#3157D5] flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-[#172033]">
                      Click to browse or drop your document here
                    </p>
                    <p className="text-[11px] text-[#78849A] mt-1">
                      Accepts all formats • <span className="font-semibold text-[#3157D5]">.md</span>, .txt, .pdf, .docx, .csv, .json
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase shadow-2xs border ${
                        selectedFile.name.toLowerCase().endsWith(".md") || selectedFile.name.toLowerCase().endsWith(".markdown")
                          ? "bg-[#EEF2FD] text-[#3157D5] border-[#3157D5]/30"
                          : "bg-white text-[#172033] border-[#E5EAF2]"
                      }`}>
                        {selectedFile.name.split(".").pop() || "DOC"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-[#172033] truncate max-w-[220px]">
                            {selectedFile.name}
                          </p>
                          <span className="text-[10px] font-bold text-[#16A36A] bg-[#E8F7F0] px-1.5 py-0.5 rounded">
                            ✓ Ready
                          </span>
                        </div>
                        <p className="text-[11px] text-[#78849A]">
                          {fileSizeKb} KB • {selectedFile.name.toLowerCase().endsWith(".md") ? "Structured Markdown (.md)" : "Document File"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] text-[#3157D5] font-semibold hover:underline cursor-pointer"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setRawText("");
                          setFileSizeKb(0);
                        }}
                        className="p-1 text-[#78849A] hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="*/*,.md,.markdown,.txt,.pdf,.docx,.doc,.csv,.json,.xlsx,.pptx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileProcess(file);
                      }}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Document Title input */}
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                Source Name / Title
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Product Return Guidelines 2026.md"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] outline-none focus:border-[#3157D5]"
              />
            </div>

            {/* Web URL input */}
            {sourceType === "url" && (
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Target Webpage URL
                </label>
                <input
                  type="url"
                  placeholder="https://company.com/docs/api-reference"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] outline-none focus:border-[#3157D5]"
                />
              </div>
            )}

            {/* Content / Policy Text / Extracted Document Preview */}
            {(sourceType === "text" || sourceType === "faq" || sourceType === "document" || sourceType === "url") && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#172033]">
                    {sourceType === "document"
                      ? "Document Content & Extracted Text"
                      : sourceType === "faq"
                      ? "FAQ Pairs & Grounding Rules"
                      : "Policy / Knowledge Content"}
                  </label>
                  {rawText.length > 0 && (
                    <span className="text-[10px] text-[#78849A]">
                      {rawText.length} characters
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  placeholder={
                    sourceType === "document"
                      ? "Extracted document text will appear here. You can also paste or edit content directly..."
                      : sourceType === "faq"
                      ? "Q: How do returns work?\nA: Customers have 30 days to return hardware for a full refund."
                      : "Paste text contents, enterprise guidelines, or document summaries..."
                  }
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F4F7FB] border border-[#E5EAF2] rounded-xl text-xs text-[#172033] outline-none focus:border-[#3157D5] font-mono leading-relaxed"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5EAF2]">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedFile(null);
                  setRawText("");
                  setSourceName("");
                  setUrlInput("");
                  setFileSizeKb(0);
                }}
                className="px-3 py-2 text-xs font-semibold text-[#78849A] hover:text-[#172033] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSource}
                className="px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Index into Vector DB</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Delete Confirmation Dialog */}
      <ConfirmDeleteModal
        isOpen={!!deleteModalDoc}
        onClose={() => setDeleteModalDoc(null)}
        onConfirm={async () => {
          if (deleteModalDoc) {
            await deleteKnowledgeSource(deleteModalDoc.id);
          }
        }}
        itemName={deleteModalDoc?.name}
        itemType="Knowledge Source Document"
      />
    </div>
  );
}
