"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import {
  Voicemail,
  Radio,
  Play,
  Pause,
  Sliders,
  CheckCircle2,
  Sparkles,
  Volume2,
  Save,
  RadioTower,
  ShieldCheck,
} from "lucide-react";

export default function SmartAMDPage() {
  const { addToast } = useAppStore();

  const [amdEnabled, setAmdEnabled] = useState(true);
  const [beepHz, setBeepHz] = useState(1000);
  const [beepDelayMs, setBeepDelayMs] = useState(1200);
  const [voicemailScript, setVoicemailScript] = useState(
    "Hi {{contact_name}}, this is Rachel following up on {{company}}'s voice automation setup. I sent an invite for a brief overview—call us back at {{callback_number}} or reply to our email. Have a wonderful day!"
  );
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSave = () => {
    addToast({
      title: "AMD 2.0 Settings Saved",
      description: "Carrier tone detection thresholds updated across outbound trunks.",
      type: "success",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart AMD 2.0 & Voicemail Drop Studio"
        description="Eliminate dead air and cut-off voicemails. Automatically detect carrier answering machine 1000Hz beep tones and drop high-converting, personalized voice audio."
        badge={
          <span className="flex items-center gap-1.5 px-3 py-1 bg-[#16A36A]/10 text-[#16A36A] border border-[#16A36A]/30 rounded-full text-xs font-bold">
            <Radio className="w-3.5 h-3.5" />
            99.4% Carrier Accuracy
          </span>
        }
        actions={
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save AMD Settings</span>
          </button>
        }
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Frequency Analyzer & Voicemail Script Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carrier Audio Frequency Analyzer */}
          <div className="p-6 bg-[#000000] text-white rounded-3xl border border-[#1F1F1F] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1F1F]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#3157D5] text-white flex items-center justify-center shadow-lg shadow-[#3157D5]/30">
                  <RadioTower className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                    Carrier Signal & Tone Detection Spectrum
                  </h2>
                  <p className="text-xs text-[#A1A1AA]">
                    Real-time carrier frequency lock across AT&T, Verizon, T-Mobile, and European PSTN.
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-[#3157D5] bg-[#3157D5]/20 px-2.5 py-1 rounded-full border border-[#3157D5]/30">
                1000Hz Tone Lock
              </span>
            </div>

            {/* Audio Waveform Oscilloscope */}
            <div className="space-y-1 pt-2">
              <div className="flex items-end gap-1 h-16 px-1">
                {[20, 35, 55, 75, 90, 60, 40, 65, 85, 95, 70, 45, 30, 50, 75, 90, 65, 40, 60, 80, 95, 70, 45, 30, 55, 80, 90, 65, 40, 60, 85, 70, 50, 35, 60, 80, 95, 70, 45, 30, 55, 75, 60, 40].map((height, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-[#3157D5] rounded-full transition-all duration-150"
                    style={{
                      height: `${height}%`,
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[11px] text-[#A1A1AA] font-mono pt-1">
                <span>Signal Frequency: {beepHz} Hz</span>
                <span>Post-Beep Audio Release Delay: {beepDelayMs}ms</span>
              </div>
            </div>
          </div>

          {/* Script Builder */}
          <div className="p-6 bg-white rounded-3xl border border-[#E5EAF2] card-shadow space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDF2F7]">
              <div>
                <h2 className="text-sm font-bold text-[#172033]">Personalized Voicemail Drop Script</h2>
                <p className="text-xs text-[#78849A]">Customize the message delivered when voicemail answers.</p>
              </div>

              {/* Variable Tokens */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {["{{contact_name}}", "{{company}}", "{{callback_number}}"].map((token) => (
                  <button
                    key={token}
                    type="button"
                    onClick={() => setVoicemailScript((prev) => `${prev} ${token}`)}
                    className="px-2 py-1 bg-[#EEF2FD] text-[#3157D5] font-mono font-bold text-xs rounded-lg hover:bg-[#E0E7FB] transition-colors"
                  >
                    +{token}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={4}
              value={voicemailScript}
              onChange={(e) => setVoicemailScript(e.target.value)}
              className="w-full p-4 bg-[#F4F7FB] border border-[#E5EAF2] rounded-2xl text-xs text-[#172033] outline-none focus:border-[#3157D5] leading-relaxed"
            />

            {/* Test Audio Drop Synthesis Button */}
            <div className="p-4 bg-[#F4F7FB] rounded-2xl border border-[#E5EAF2] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(!isPlaying);
                    addToast({
                      title: isPlaying ? "Audio Paused" : "Playing Voicemail Audio",
                      description: "Synthesizing 14.2s audio drop using Rachel voice model.",
                      type: "info",
                    });
                  }}
                  className="w-10 h-10 rounded-full bg-[#3157D5] text-white flex items-center justify-center shadow-md shadow-[#3157D5]/30 hover:bg-[#2646B8] transition-all"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div>
                  <span className="text-xs font-bold text-[#172033] block">Test Voicemail Synthesis</span>
                  <span className="text-[11px] text-[#78849A]">Duration: 14.2 seconds • Natural cadence</span>
                </div>
              </div>

              <span className="text-xs font-bold text-[#16A36A] bg-[#E8F7F0] px-3 py-1 rounded-full border border-[#16A36A]/20">
                TTS Voice Synced
              </span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Fine-Tuning Controls */}
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-3xl border border-[#E5EAF2] card-shadow space-y-5">
            <h2 className="text-sm font-bold text-[#172033]">Tone Detection Parameters</h2>

            {/* Threshold Sliders */}
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-[#172033] mb-1.5">
                  <span>Beep Target Frequency</span>
                  <span className="font-mono font-bold text-[#3157D5]">{beepHz} Hz</span>
                </div>
                <input
                  type="range"
                  min="800"
                  max="1400"
                  step="50"
                  value={beepHz}
                  onChange={(e) => setBeepHz(Number(e.target.value))}
                  className="w-full accent-[#3157D5]"
                />
                <span className="text-[10px] text-[#78849A] block mt-1">Standard carrier beep is 1000Hz ± 50Hz</span>
              </div>

              <div className="pt-2 border-t border-[#EDF2F7]">
                <div className="flex justify-between font-semibold text-[#172033] mb-1.5">
                  <span>Post-Beep Silence Delay</span>
                  <span className="font-mono font-bold text-[#3157D5]">{beepDelayMs} ms</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="100"
                  value={beepDelayMs}
                  onChange={(e) => setBeepDelayMs(Number(e.target.value))}
                  className="w-full accent-[#3157D5]"
                />
                <span className="text-[10px] text-[#78849A] block mt-1">Time to wait before starting audio delivery</span>
              </div>
            </div>

            {/* Carrier Profiles */}
            <div className="pt-3 border-t border-[#EDF2F7] space-y-2">
              <span className="text-[11px] font-bold text-[#78849A] uppercase tracking-wider block">
                Supported Carrier Beep Profiles:
              </span>
              {[
                { name: "AT&T Mobility Wireless", rate: "99.8% accurate" },
                { name: "Verizon Wireless PBX", rate: "99.6% accurate" },
                { name: "T-Mobile USA Voicemail", rate: "99.4% accurate" },
                { name: "RingCentral / 8x8 Cloud", rate: "99.1% accurate" },
              ].map((c) => (
                <div key={c.name} className="flex justify-between items-center text-xs p-2 bg-[#F4F7FB] rounded-xl">
                  <span className="font-semibold text-[#172033]">{c.name}</span>
                  <span className="text-[10px] text-[#16A36A] font-bold">{c.rate}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
