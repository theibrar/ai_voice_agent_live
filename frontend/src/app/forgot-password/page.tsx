"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Headphones, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getApiBase } from "@/lib/auth-context";

const schema = z.object({
  email: z.string().email("Please enter a valid work email"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { addToast } = useAppStore();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>();

  const [authError, setAuthError] = useState<string | null>(null);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setAuthError(null);

    try {
      const apiUrl = getApiBase() + "/auth/forgot-password";
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email.trim() }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setLoading(false);
        const errMsg = resData.error || "No registered account found with this email address.";
        setAuthError(errMsg);
        addToast({
          title: "Account Not Found",
          description: errMsg,
          type: "warning",
        });
        return;
      }

      setLoading(false);
      setSubmitted(true);
      addToast({
        title: "Reset Link Sent",
        description: `Recovery instructions dispatched to ${data.email}`,
        type: "success",
      });
    } catch (err: any) {
      setLoading(false);
      const errMsg = "Unable to connect to authentication server. Please check backend.";
      setAuthError(errMsg);
      addToast({
        title: "Connection Error",
        description: errMsg,
        type: "warning",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F4F7FB]">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5EAF2] card-shadow p-8">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#3157D5] to-[#5C82FF] flex items-center justify-center text-white shadow-sm">
            <Headphones className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-[#101A33]">
            APEX <span className="text-[#3157D5] font-black text-xs px-1.5 py-0.5 rounded-md bg-[#EEF2FD]">VOICE</span>
          </span>
        </div>

        {!submitted ? (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#172033]">Reset Password</h2>
              <p className="text-xs text-[#78849A] mt-1 leading-relaxed">
                Enter your verified organization email and we will send you a secure password reset link.
              </p>
            </div>

            {authError && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#78849A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#E5EAF2] rounded-xl text-sm text-[#172033] placeholder-[#78849A] outline-none focus:border-[#3157D5] focus:ring-2 focus:ring-[#3157D5]/10"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-[#D95C68] mt-1">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Send Reset Instructions"
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#E8F7F0] text-[#16A36A] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">Check your inbox</h3>
            <p className="text-xs text-[#78849A] leading-relaxed">
              We have dispatched a reset link to{" "}
              <strong className="text-[#172033]">{getValues("email")}</strong>. Please follow the instructions to choose a new password.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-xs text-[#3157D5] font-semibold hover:underline mt-2 block mx-auto"
            >
              Didn't receive email? Try again
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-[#E5EAF2] text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#78849A] hover:text-[#172033] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
