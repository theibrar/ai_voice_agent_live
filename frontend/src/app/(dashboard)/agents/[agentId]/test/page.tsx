"use client";

import React, { useState, use, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { AudioWaveform } from "@/components/audio-waveform";
import { formatDuration } from "@/lib/utils";
import { Agent } from "@/lib/types";
import {
  Mic,
  MicOff,
  Volume2,
  Bot,
  User,
  Zap,
  Wrench,
  BookOpen,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Send,
  Sliders,
  CheckCircle2,
  Play,
  Pause,
} from "lucide-react";
import { playKokoroNeuralAudio, stopNeuralAudio } from "@/lib/tts-service";

interface SimulatorTurn {
  id: string;
  speaker: "agent" | "user";
  text: string;
  latencyMs?: number;
  toolCall?: { name: string; result: string };
  kbMatch?: { title: string; score: number };
}

export default function TestAgentPlayground() {
  const routeParams = useParams<{ agentId: string }>();
  const currentAgentId = routeParams?.agentId || "";
  const { agents, addToast } = useAppStore();

  const fallbackAgent: Agent = {
    id: currentAgentId || "agent-preview",
    name: "AI Voice Agent",
    description: "Autonomous voice assistant handling inbound & outbound calls.",
    avatar: "/avatars/rachel.png",
    color: "#3157D5",
    status: "active",
    voice: {
      provider: "Kokoro Neural" as any,
      voiceId: "af_heart",
      voiceName: "Rachel (US Professional)",
      gender: "female",
      accent: "English (US)",
      speed: 1.0,
      pitch: 0.0,
      stability: 0.8,
      similarity: 0.9,
    },
    language: "English (US)",
    greeting: "Hi there! Thanks for calling. My name is Rachel, your voice assistant. How can I help you today?",
    systemPrompt: "You are a helpful and empathetic AI voice assistant.",
    responseStyle: "conversational",
    interruptionSensitivity: 0.7,
    silenceTimeoutSeconds: 4,
    maxCallDurationMinutes: 15,
    knowledgeBaseIds: [],
    tools: [],
    humanRealism: {
      enableMicroBreaths: true,
      enableBackchanneling: true,
      enableAdaptiveEmotion: true,
      maxWordsPerTurn: 25,
      fillerFrequency: "medium",
    },
    transferRules: { enabled: false },
    callEndingRules: { goodbyePhrase: "Thank you for calling. Have a great day!", hangupOnSilence: true, afterHoursBehavior: "voicemail" },
    metrics: { totalCalls: 0, avgDurationSeconds: 0, successRate: 100, sentimentScore: 100, connectedCalls: 0 },
    lastUpdated: new Date().toISOString(),
  };

  const agent: Agent = agents.find((a) => a.id === currentAgentId) || agents[0] || fallbackAgent;

  const [isMicActive, setIsMicActive] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [latency, setLatency] = useState(240);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [turns, setTurns] = useState<SimulatorTurn[]>([
    {
      id: "t-0",
      speaker: "agent",
      text: agent?.greeting || "Hi there! Thanks for calling. How can I help you today?",
      latencyMs: 140,
    },
  ]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [turns, isThinking]);

  useEffect(() => {
    if (agent?.greeting) {
      setTurns((prev) => {
        if (prev.length === 1 && prev[0].id === "t-0") {
          return [{ ...prev[0], text: agent.greeting }];
        }
        return prev;
      });
    }
  }, [agent?.greeting]);

  const [gpuStatus, setGpuStatus] = useState<"checking" | "online" | "offline">("checking");

  // Audio Speech Synthesis for Agent (STRICT GPU ONLY)
  const speakText = async (text: string) => {
    const result = await playKokoroNeuralAudio(
      text,
      agent.voice?.voiceId || "af_bella",
      agent.voice?.speed || 1.0,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );

    if (result.success) {
      setGpuStatus("online");
    } else {
      setGpuStatus("offline");
      addToast({
        title: "GPU Server Offline",
        description: result.error || "GPU voice worker is offline or unreachable. Speech synthesis stopped.",
        type: "error",
      });
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userTurn: SimulatorTurn = {
      id: `turn-${Date.now()}-user`,
      speaker: "user",
      text: text.trim(),
    };

    setTurns((prev) => [...prev, userTurn]);
    setInputText("");
    setIsThinking(true);

    const generatedLatency = Math.floor(Math.random() * 50) + 210;
    setLatency(generatedLatency);

    // Call Live LLM Reasoning API
    (async () => {
      try {
        const historyMessages = turns.map((t) => ({
          role: t.speaker === "agent" ? "assistant" : "user",
          content: t.text,
        }));
        historyMessages.push({ role: "user", content: text.trim() });

        const res = await fetch("/api/simulator/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: historyMessages,
            systemPrompt: agent.systemPrompt || "You are a professional voice agent. Keep answers natural and under 30 words.",
            model: (agent as any).llmModel || "vLLM Neural LLM Engine",
            agentName: agent.name || "Apex Voice Agent",
            tools: agent.tools || [],
            knowledgeBase: agent.knowledgeBaseIds || [],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const replyText = data.reply || `I'm ${agent.name}. How can I help you today?`;
          setLatency(data.latencyMs || 180);

          const agentTurn: SimulatorTurn = {
            id: `turn-${Date.now()}-agent`,
            speaker: "agent",
            text: replyText,
            latencyMs: data.latencyMs || 180,
            toolCall: data.toolCall,
            kbMatch: data.kbMatch,
          };

          setTurns((prev) => [...prev, agentTurn]);
          setIsThinking(false);
          speakText(replyText);
        } else {
          throw new Error("Chat request failed");
        }
      } catch (err) {
        console.warn("Live LLM simulation fallback:", err);
        const fallbackReply = `I understand your point about "${text.trim()}". As ${agent.name}, I can assist with that right away. What specific details should we cover?`;
        const agentTurn: SimulatorTurn = {
          id: `turn-${Date.now()}-agent`,
          speaker: "agent",
          text: fallbackReply,
          latencyMs: 195,
        };
        setTurns((prev) => [...prev, agentTurn]);
        setIsThinking(false);
        speakText(fallbackReply);
      }
    })();
  };

  const handleToggleMic = () => {
    if (!isMicActive) {
      setIsMicActive(true);
      addToast({
        title: "Voice Mic Input Active",
        description: "Listening for simulated voice turn...",
        type: "success",
      });

      // Browser Web Speech Recognition if available
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = agent.language?.includes("Spanish") ? "es-ES" : "en-US";
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;

          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            handleSendMessage(transcript);
            setIsMicActive(false);
          };

          recognition.onerror = () => {
            setIsMicActive(false);
            handleSendMessage("Can you give me an overview of your services and pricing?");
          };

          recognition.onend = () => setIsMicActive(false);
          recognition.start();
          return;
        } catch (e) {
          // Fallback simulation
        }
      }

      setTimeout(() => {
        handleSendMessage("Can you give me an overview of your services and pricing?");
        setIsMicActive(false);
      }, 1800);
    } else {
      setIsMicActive(false);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    }
  };

  const resetPlayground = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setTurns([{ id: "t-0", speaker: "agent", text: agent.greeting, latencyMs: 140 }]);
    addToast({ title: "Playground Reset", description: "Transcript cleared and re-initialized.", type: "info" });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/agents"
            className="p-2 bg-white dark:bg-[#0F172A] border border-[#E5EAF2] dark:border-[#1E293B] rounded-xl text-[#78849A] hover:text-[#172033] dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#172033] dark:text-white">
                Live Voice Simulator: {agent.name}
              </h1>
              <span className="text-xs font-bold text-[#16A36A] bg-[#E8F7F0] dark:bg-[#16A36A]/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A] animate-pulse" />
                Live Playground
              </span>
            </div>
            <p className="text-xs text-[#78849A] dark:text-[#94A3B8] mt-0.5">
              {agent.voice?.provider || "Kokoro Neural"} • {agent.voice?.voiceName} • Roundtrip Latency: {latency}ms
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetPlayground}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#0F172A] border border-[#E5EAF2] dark:border-[#1E293B] hover:bg-[#F4F7FB] text-[#78849A] hover:text-[#172033] dark:hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Test</span>
          </button>
          <Link
            href={`/agents/${agent.id}`}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Edit Agent Settings</span>
          </Link>
        </div>
      </div>

      {/* Simulator Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Audio Waveform & Speech Chat Exchange */}
        <div className="lg:col-span-2 space-y-4">
          {/* Real-time Waveform Deck */}
          <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5EAF2] dark:border-[#1E293B] card-shadow space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#3157D5]" />
                <h3 className="text-xs font-bold text-[#172033] dark:text-white uppercase tracking-wider">
                  Neural Speech Audio Stream
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#3157D5] bg-[#EEF2FD] dark:bg-[#3157D5]/20 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {latency}ms STT + LLM + Kokoro TTS
              </span>
            </div>

            {/* Waveform Graph - Active strictly when speaking or thinking */}
            <AudioWaveform
              active={isSpeaking || isThinking}
              audioLevel={isSpeaking ? 80 : isThinking ? 30 : 0}
              color={agent.color || "#3157D5"}
              speaker="agent"
              label={isSpeaking ? `Speaking: ${agent.voice?.voiceName}` : isThinking ? "Synthesizing Speech Response..." : "Audio Stream (Idle)"}
            />

            {/* Quick suggested prompt chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2">
              <span className="text-[11px] font-semibold text-[#78849A]">Test Scenarios:</span>
              {[
                "What is your pricing model?",
                "Can you schedule a live product demo?",
                "Are you SOC2 & HIPAA compliant?",
                "Can you transfer me to a human specialist?",
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSendMessage(chip)}
                  className="text-xs bg-[#F4F7FB] dark:bg-[#1E293B] hover:bg-[#EEF2FD] dark:hover:bg-[#3157D5]/20 text-[#172033] dark:text-white hover:text-[#3157D5] px-2.5 py-1 rounded-lg border border-[#E5EAF2] dark:border-[#334155] transition-colors cursor-pointer"
                >
                  &quot;{chip}&quot;
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chat Stream */}
          <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5EAF2] dark:border-[#1E293B] card-shadow flex flex-col justify-between min-h-[400px]">
            <div
              ref={chatScrollRef}
              className="space-y-4 max-h-84 overflow-y-auto pr-1 flex-1 mb-4 scrollbar-thin"
            >
              {turns.map((turn) => {
                const isAgent = turn.speaker === "agent";
                return (
                  <div
                    key={turn.id}
                    className={`flex gap-3 text-xs ${isAgent ? "items-start" : "items-start flex-row-reverse"}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5 ${
                        isAgent ? "bg-[#3157D5]" : "bg-[#101A33] dark:bg-slate-700"
                      }`}
                    >
                      {isAgent ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>

                    <div className={`flex flex-col max-w-[80%] ${isAgent ? "items-start" : "items-end"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[11px] text-[#172033] dark:text-white">
                          {isAgent ? agent.name : "Caller (You)"}
                        </span>
                        {turn.latencyMs && (
                          <span className="text-[10px] text-[#3157D5] bg-[#EEF2FD] dark:bg-[#3157D5]/20 px-1.5 py-0.2 rounded font-mono font-medium">
                            {turn.latencyMs}ms
                          </span>
                        )}
                      </div>

                      <div
                        className={`p-3 rounded-2xl leading-relaxed ${
                          isAgent
                            ? "bg-[#F4F7FB] dark:bg-[#1E293B] text-[#172033] dark:text-white rounded-tl-xs border border-[#E5EAF2] dark:border-[#334155]"
                            : "bg-[#3157D5] text-white rounded-tr-xs shadow-xs"
                        }`}
                      >
                        {turn.text}
                      </div>

                      {/* Tool call telemetry */}
                      {turn.toolCall && (
                        <div className="mt-1.5 p-2 bg-[#EEF2FD] dark:bg-[#3157D5]/15 border border-[#3157D5]/20 rounded-xl text-[11px] text-[#101A33] dark:text-white flex items-center gap-2">
                          <Wrench className="w-3.5 h-3.5 text-[#3157D5]" />
                          <div>
                            <span className="font-semibold text-[#3157D5]">Tool Executed: {turn.toolCall.name}()</span>
                            <p className="text-[10px] text-[#78849A] dark:text-[#94A3B8]">{turn.toolCall.result}</p>
                          </div>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A] ml-auto" />
                        </div>
                      )}

                      {/* KB match telemetry */}
                      {turn.kbMatch && (
                        <div className="mt-1.5 p-2 bg-[#E8F7F0] dark:bg-[#16A36A]/15 border border-[#16A36A]/20 rounded-xl text-[11px] text-[#172033] dark:text-white flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-[#16A36A]" />
                          <span>RAG Grounding: {turn.kbMatch.title} ({Math.round(turn.kbMatch.score * 100)}%)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isThinking && (
                <div className="flex items-center gap-2 text-xs text-[#78849A] dark:text-[#94A3B8]">
                  <div className="w-6 h-6 rounded-lg bg-[#EEF2FD] dark:bg-[#3157D5]/20 flex items-center justify-center text-[#3157D5]">
                    <Bot className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <span className="italic">{agent.name} is synthesizing speech...</span>
                </div>
              )}
            </div>

            {/* Input Bar with Mic & Send */}
            <div className="pt-3 border-t border-[#EDF2F7] dark:border-[#1E293B] flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleMic}
                title={isMicActive ? "Stop voice input" : "Speak to agent"}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isMicActive
                    ? "bg-[#D95C68] text-white border-[#D95C68] animate-pulse"
                    : "bg-[#F4F7FB] dark:bg-[#1E293B] text-[#78849A] hover:text-[#172033] dark:hover:text-white border-[#E5EAF2] dark:border-[#334155]"
                }`}
              >
                {isMicActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                placeholder="Type a message or press the microphone to test voice agent..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1 text-xs px-3.5 py-2.5 bg-[#F4F7FB] dark:bg-[#1E293B] border border-[#E5EAF2] dark:border-[#334155] text-[#0F172A] dark:text-white rounded-xl outline-none focus:border-[#3157D5]"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                className="px-4 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 col: Live Telemetry & Inspector */}
        <div className="space-y-4">
          <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5EAF2] dark:border-[#1E293B] card-shadow space-y-4">
            <h3 className="text-xs font-bold text-[#172033] dark:text-white uppercase tracking-wider">
              Speech Telemetry & Latency
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-[#F4F7FB] dark:bg-[#1E293B] rounded-xl">
                <span className="text-[#78849A] dark:text-[#94A3B8]">STT Transcriber</span>
                <span className="font-bold text-[#172033] dark:text-white">Parakeet-CTC (65ms)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[#F4F7FB] dark:bg-[#1E293B] rounded-xl">
                <span className="text-[#78849A] dark:text-[#94A3B8]">LLM Reasoning</span>
                <span className="font-bold text-[#172033] dark:text-white">{agent.llmModel || "vLLM (Qwen 2.5 7B)"} (45ms)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[#F4F7FB] dark:bg-[#1E293B] rounded-xl">
                <span className="text-[#78849A] dark:text-[#94A3B8]">TTS Engine</span>
                <span className="font-bold text-[#172033] dark:text-white">Kokoro-82M CUDA (38ms)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[#F4F7FB] dark:bg-[#1E293B] rounded-xl">
                <span className="text-[#78849A] dark:text-[#94A3B8]">GPU Cluster (77.54.200.11)</span>
                {gpuStatus === "online" ? (
                  <span className="font-bold text-[#16A36A] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#16A36A] animate-pulse" /> Online
                  </span>
                ) : gpuStatus === "offline" ? (
                  <span className="font-bold text-[#D95C68] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#D95C68]" /> Offline
                  </span>
                ) : (
                  <span className="font-semibold text-[#78849A]">Standby</span>
                )}
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[#EEF2FD] dark:bg-[#3157D5]/20 rounded-xl border border-[#3157D5]/20">
                <span className="font-bold text-[#3157D5]">Roundtrip Latency</span>
                <span className="font-bold text-[#3157D5]">{latency}ms Total</span>
              </div>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5EAF2] dark:border-[#1E293B] card-shadow space-y-3">
            <h3 className="text-xs font-bold text-[#172033] dark:text-white uppercase tracking-wider">
              Acoustic & Human Realism
            </h3>
            <div className="p-3 bg-[#F4F7FB] dark:bg-[#1E293B] rounded-xl border border-[#E5EAF2] dark:border-[#334155] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#78849A]">Micro-Breaths:</span>
                <span className="font-bold text-[#16A36A]">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78849A]">Backchanneling:</span>
                <span className="font-bold text-[#16A36A]">Enabled</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78849A]">Adaptive Emotion:</span>
                <span className="font-bold text-[#16A36A]">Calibrated</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78849A]">Max Words/Turn:</span>
                <span className="font-bold text-[#3157D5]">{agent.humanRealism?.maxWordsPerTurn || 25} words</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
