"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Headphones,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Bot,
  CheckCircle2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useAppStore();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const [authError, setAuthError] = useState<string | null>(null);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setAuthError(null);

    const res = await login(data.email, data.password);
    setIsLoading(false);

    if (!res.success) {
      const errMsg = res.error || "Invalid email or password. Please check your credentials.";
      setAuthError(errMsg);
      addToast({
        title: "Authentication Failed",
        description: errMsg,
        type: "warning",
      });
      return;
    }

    addToast({
      title: "Welcome Back!",
      description: `Signed in successfully. Opening dashboard...`,
      type: "success",
    });

    if (res.isSuperAdmin) {
      router.push("/super-admin");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F4F7FB] selection:bg-[#3157D5]/20">
      {/* Left Form Area */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16 max-w-xl mx-auto w-full">
        {/* Brand Header with Super Admin Portal Switcher */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3157D5] to-[#5C82FF] flex items-center justify-center text-white shadow-md shadow-[#3157D5]/20">
              <Headphones className="w-5 h-5" />
            </div>
            <span className="font-bold text-base tracking-tight text-[#101A33]">
              APEX <span className="text-[#3157D5] font-black text-xs px-1.5 py-0.5 rounded-md bg-[#EEF2FD]">VOICE</span>
            </span>
          </div>

          <Link
            href="/super-admin/login"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F172A] hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            title="Open Master Super Admin Portal"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin Portal</span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="my-auto py-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#172033] tracking-tight">
              Sign in to Voice OS
            </h1>
            <p className="text-sm text-[#78849A] mt-2 leading-relaxed">
              Enter your authorized organization email and security password to access your dashboard.
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                Work Email Address
              </label>
              <input
                type="email"
                {...register("email")}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5EAF2] rounded-xl text-sm text-[#172033] placeholder-[#78849A] outline-none focus:border-[#3157D5] focus:ring-2 focus:ring-[#3157D5]/10 transition-all"
              />
              {errors.email && (
                <p className="text-xs text-[#D95C68] mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#172033]">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#3157D5] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 bg-white border border-[#E5EAF2] rounded-xl text-sm text-[#172033] placeholder-[#78849A] outline-none focus:border-[#3157D5] focus:ring-2 focus:ring-[#3157D5]/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78849A] hover:text-[#172033] p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[#D95C68] mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("rememberMe")}
                  className="w-4 h-4 rounded border-[#CBD5E1] text-[#3157D5] focus:ring-[#3157D5]"
                />
                <span className="text-xs text-[#78849A]">Remember this browser for 30 days</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#3157D5] hover:bg-[#2646B8] text-white text-sm font-semibold rounded-xl shadow-md shadow-[#3157D5]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center sm:text-left text-xs text-[#78849A]">
          Protected by Enterprise SSO & HIPAA Compliance Encryption.
        </div>
      </div>

      {/* Right Feature Panel (Desktop only) */}
      <div className="hidden lg:flex flex-1 bg-[#101A33] text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Background decorative glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#3157D5]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#16A36A]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Tag */}
        <div className="flex items-center justify-between relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#182647] border border-[#20325D] rounded-full text-xs font-semibold text-[#5C82FF]">
            <Activity className="w-3.5 h-3.5 text-[#16A36A] animate-pulse" />
            <span>Sub-300ms Global Voice AI Engine</span>
          </div>

          <span className="text-xs text-[#78849A]">v2.5 Enterprise</span>
        </div>

        {/* Center Showcase */}
        <div className="my-auto space-y-6 relative z-10 max-w-lg">
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Human-grade Voice Automation for Inbound & Outbound Teams.
            </h2>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Deploy conversational AI agents that understand tone, resolve complex queries, query CRM data in real time, and book qualified meetings on autopilot.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-[#182647]/80 rounded-xl border border-[#20325D]">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                <Zap className="w-3.5 h-3.5 text-[#D99025]" />
                <span>Ultra-Low Latency</span>
              </div>
              <p className="text-[11px] text-[#78849A]">280ms average speech turn with streaming synthesis.</p>
            </div>

            <div className="p-3.5 bg-[#182647]/80 rounded-xl border border-[#20325D]">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#16A36A]" />
                <span>SOC2 & HIPAA Ready</span>
              </div>
              <p className="text-[11px] text-[#78849A]">In-memory encryption and custom SIP gateway support.</p>
            </div>
          </div>

          {/* Testimonial / Stat Card */}
          <div className="p-4 bg-[#182647]/90 rounded-2xl border border-[#20325D] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#3157D5] text-white flex items-center justify-center font-bold text-xs">
                  SC
                </div>
                <div>
                  <p className="text-xs font-bold text-white">ScaleOps Enterprise</p>
                  <p className="text-[10px] text-[#78849A]">60,000 monthly call minutes</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#16A36A] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                94% Answer Rate
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] italic">
              “Apex Voice replaced our legacy IVR tree with proactive, conversational agents that qualified 4,300+ leads in our first month.”
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-[#78849A] relative z-10 pt-4 border-t border-[#182647]">
          <span>© 2026 Apex Technologies Inc.</span>
          <span>Designed for High-Volume Call Centers</span>
        </div>
      </div>
    </div>
  );
}
