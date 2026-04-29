"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ShieldCheck, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Email atau password salah. Silakan coba lagi.");
    } else {
      router.push("/");
    }
    setLoading(false);
  }

  async function loginDemo() {
    setEmail("demo@pantau.id");
    setPassword("PantauDemo123!");
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: "demo@pantau.id",
      password: "PantauDemo123!",
    });
    if (authError) {
      setError("Akun demo tidak tersedia. Hubungi administrator.");
    } else {
      router.push("/");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">PANTAU</h1>
              <p className="text-sm text-slate-400">Platform Audit Keuangan Daerah</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm" htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="auditor@pemda.go.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-white/10 bg-white/10 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:ring-indigo-400"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm" htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-white/10 bg-white/10 pr-10 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Masuk...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>

          {/* Demo button */}
          <div className="mt-4 border-t border-white/10 pt-4">
            <button
              onClick={loginDemo}
              disabled={loading}
              className="w-full rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 transition-colors hover:border-indigo-400/30 hover:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Masuk..." : "Masuk sebagai demo"}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          © 2024 PANTAU · Didukung Microsoft Azure + Gemini AI
        </p>
      </div>
    </div>
  );
}
