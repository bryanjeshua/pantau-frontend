"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { ChatMessage, ChatSession, RegulationRef } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Send,
  ShieldCheck,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function formatSessionDate(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

// ─── sub-components ─────────────────────────────────────────────────────────

function RegulationRefs({ refs }: { refs: RegulationRef[] }) {
  const [open, setOpen] = useState(false);
  if (!refs || refs.length === 0) return null;
  return (
    <div className="mt-3 rounded-lg border border-primary/15 bg-primary/4 overflow-hidden text-xs">
      <button
        className="flex w-full items-center gap-2 px-3 py-2 text-primary/80 hover:text-primary hover:bg-primary/8 transition-colors font-medium"
        onClick={() => setOpen(!open)}
      >
        <BookOpen className="h-3.5 w-3.5 shrink-0" />
        <span>{refs.length} referensi regulasi</span>
        {open
          ? <ChevronUp className="h-3 w-3 ml-auto" />
          : <ChevronDown className="h-3 w-3 ml-auto" />}
      </button>
      {open && (
        <div className="border-t border-primary/15 divide-y divide-primary/10">
          {refs.map((ref, i) => (
            <div key={i} className="px-3 py-2.5 space-y-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-semibold text-primary/90">{ref.peraturan}</span>
                <span className="text-muted-foreground">{ref.pasal}</span>
              </div>
              <p className="text-foreground/70 leading-relaxed">{ref.isi}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  const time = new Date(msg.created_at).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 group">
        <div className="max-w-[72%] space-y-1">
          <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground shadow-sm">
            {msg.content}
          </div>
          <p className="text-[11px] text-muted-foreground text-right px-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {time}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 group">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 mt-0.5">
        <ShieldCheck className="h-4 w-4 text-indigo-600" />
      </div>
      <div className="max-w-[80%] space-y-0.5">
        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground/60 uppercase mb-1.5 pl-0.5">
          PANTAU AI
        </p>
        <div className="rounded-2xl rounded-tl-sm bg-card border border-border/60 px-4 py-3 text-sm leading-relaxed shadow-sm">
          {msg.content}
          {msg.regulation_refs && (
            <RegulationRefs refs={msg.regulation_refs as RegulationRef[]} />
          )}
        </div>
        <p className="text-[11px] text-muted-foreground px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {time}
        </p>
      </div>
    </div>
  );
}

// ─── constants ───────────────────────────────────────────────────────────────

const SUGGESTED: Array<{ category: string; q: string }> = [
  { category: "Pengadaan", q: "Berapa batas nilai pengadaan langsung untuk barang?" },
  { category: "Regulasi",  q: "Kapan penunjukan langsung diperbolehkan?" },
  { category: "Honorarium", q: "Syarat pembayaran honorarium ASN itu apa?" },
  { category: "Anggaran",  q: "Apa yang dimaksud dengan SHSR dalam perencanaan anggaran?" },
];

const CATEGORY_COLOR: Record<string, string> = {
  Pengadaan:  "bg-blue-50 text-blue-700",
  Regulasi:   "bg-violet-50 text-violet-700",
  Honorarium: "bg-amber-50 text-amber-700",
  Anggaran:   "bg-emerald-50 text-emerald-700",
};

// ─── page ────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const searchParams = useSearchParams();
  const [sessions, setSessions]           = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages]           = useState<ChatMessage[]>([]);
  const [input, setInput]                 = useState("");
  const [sending, setSending]             = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prefillHandled = useRef(false);

  useEffect(() => {
    api.chat
      .getSessions()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  }, []);

  // Auto-send if ?q= param present (from finding detail page)
  useEffect(() => {
    const q = searchParams.get("q");
    if (!q || prefillHandled.current) return;
    prefillHandled.current = true;
    async function autoSend() {
      try {
        const session = await api.chat.createSession(truncate(q!, 50));
        setSessions((prev) => [session as ChatSession, ...prev]);
        setActiveSession(session.id);
        setMessages([]);
        sendMessage(q!, session.id);
      } catch { /* silently fail */ }
    }
    autoSend();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Load messages when session switches
  useEffect(() => {
    if (!activeSession) return;
    async function load() {
      setLoadingMessages(true);
      try {
        const msgs = await api.chat.getMessages(activeSession!);
        setMessages(msgs);
      } catch { /* silently fail */ }
      finally { setLoadingMessages(false); }
    }
    load();
  }, [activeSession]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function createSession() {
    try {
      const session = await api.chat.createSession();
      setSessions((prev) => [session as ChatSession, ...prev]);
      setActiveSession(session.id);
      setMessages([]);
      setTimeout(() => textareaRef.current?.focus(), 50);
    } catch { /* silently fail */ }
  }

  async function sendMessage(content: string, sessionOverride?: string) {
    const sid = sessionOverride ?? activeSession;
    if (!content.trim() || !sid || sending) return;

    const isFirstMessage = messages.length === 0;

    setSending(true);
    const optimisticUser: ChatMessage = {
      id: `temp-${crypto.randomUUID()}`,
      session_id: sid,
      role: "user",
      content: content.trim(),
      regulation_refs: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput("");

    try {
      const reply = await api.chat.sendMessage(sid, content.trim());
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUser.id),
        optimisticUser,
        reply,
      ]);
      // Set session title from first message if none
      if (isFirstMessage) {
        const title = truncate(content.trim(), 45);
        setSessions((prev) =>
          prev.map((s) => (s.id === sid ? { ...s, title } : s))
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
    } finally {
      setSending(false);
    }
  }

  async function handleSuggestedClick(q: string) {
    try {
      const session = await api.chat.createSession(truncate(q, 50));
      setSessions((prev) => [session as ChatSession, ...prev]);
      setActiveSession(session.id);
      setMessages([]);
      sendMessage(q, session.id);
    } catch { /* silently fail */ }
  }

  const activeSessionData = sessions.find((s) => s.id === activeSession);

  return (
    <div className="flex h-full bg-background">

      {/* ── Session sidebar ─────────────────────────────────────────────── */}
      <div className="w-60 shrink-0 border-r bg-zinc-50/60 flex flex-col">

        {/* Sidebar header */}
        <div className="px-4 pt-5 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground tracking-tight leading-none">PANTAU AI</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Konsultasi Regulasi</p>
            </div>
          </div>
          <button
            onClick={createSession}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/4 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Konsultasi Baru
          </button>
        </div>

        {/* Session list */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {loadingSessions ? (
              <div className="space-y-1.5 px-1 pt-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/60 text-center px-3 pt-6 leading-relaxed">
                Mulai konsultasi baru untuk mengajukan pertanyaan regulasi
              </p>
            ) : (
              sessions.map((s) => {
                const isActive = activeSession === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSession(s.id)}
                    className={`w-full rounded-lg px-3 py-2.5 text-left transition-all ${
                      isActive
                        ? "bg-indigo-50 border border-indigo-100 shadow-sm"
                        : "hover:bg-zinc-100/80 border border-transparent"
                    }`}
                  >
                    <p className={`text-xs font-medium truncate leading-snug ${isActive ? "text-indigo-900" : "text-foreground"}`}>
                      {s.title ?? "Konsultasi Baru"}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${isActive ? "text-indigo-500" : "text-muted-foreground/60"}`}>
                      {formatSessionDate(s.created_at)}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Sidebar footer */}
        <div className="px-4 py-3 border-t border-border/40">
          <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
            Berbasis PP 12/2019, Perpres 16/2018, Permendagri 77/2020
          </p>
        </div>
      </div>

      {/* ── Chat area ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {!activeSession ? (
          /* ── Empty state ──────────────────────────────────────────────── */
          <div className="flex-1 flex flex-col items-center justify-center p-10">
            <div className="w-full max-w-lg">

              {/* Icon + heading */}
              <div className="flex flex-col items-center text-center mb-10">
                <div className="relative mb-5">
                  <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/25">
                    <ShieldCheck className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -inset-1 rounded-2xl bg-indigo-400/15 -z-10 blur-md" />
                </div>
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  Konsultasi Regulasi Keuangan
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
                  Tanya apa saja tentang regulasi keuangan daerah. Jawaban berbasis
                  peraturan yang terverifikasi dan ter-index.
                </p>
              </div>

              {/* Suggested questions */}
              <div>
                <p className="text-[10px] font-semibold tracking-widest text-muted-foreground/50 uppercase mb-3 text-center">
                  Pertanyaan Umum
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {SUGGESTED.map(({ category, q }) => (
                    <button
                      key={q}
                      onClick={() => handleSuggestedClick(q)}
                      className="group flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-4 text-left shadow-sm hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
                    >
                      <span className={`self-start rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${CATEGORY_COLOR[category] ?? "bg-muted text-muted-foreground"}`}>
                        {category}
                      </span>
                      <p className="text-xs text-foreground/80 leading-snug group-hover:text-foreground transition-colors">
                        {q}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground/40 text-center mt-8">
                Jawaban AI bukan merupakan pendapat hukum resmi. Verifikasi mandiri tetap diperlukan.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Chat header ─────────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-6 py-3.5 border-b border-border/50 bg-background/80 backdrop-blur-sm shrink-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/10">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {activeSessionData?.title ?? "Konsultasi Baru"}
                </p>
                {activeSessionData && (
                  <p className="text-[11px] text-muted-foreground">
                    {formatSessionDate(activeSessionData.created_at)}
                  </p>
                )}
              </div>
            </div>

            {/* ── Messages ─────────────────────────────────────────────── */}
            <ScrollArea className="flex-1">
              <div className="px-6 py-6 max-w-2xl mx-auto">
                {loadingMessages ? (
                  <div className="space-y-5">
                    {[1, 2].map((i) => (
                      <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
                        <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
                        <Skeleton className={`h-20 rounded-2xl ${i % 2 === 0 ? "w-1/2" : "w-3/4"}`} />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center">
                      <ShieldCheck className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Mulai dengan mengetik pertanyaan di bawah.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {messages.map((msg) => (
                      <MessageBubble key={msg.id} msg={msg} />
                    ))}
                    {sending && (
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 mt-0.5">
                          <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                        </div>
                        <div className="rounded-2xl rounded-tl-sm bg-card border border-border/60 px-4 py-3 shadow-sm">
                          <div className="flex gap-1.5 items-center">
                            {[0, 1, 2].map((i) => (
                              <span
                                key={i}
                                className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
                                style={{ animationDelay: `${i * 0.18}s` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* ── Input bar ─────────────────────────────────────────────── */}
            <div className="border-t border-border/50 bg-background px-6 py-4 shrink-0">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-end gap-2 rounded-xl border border-border bg-card shadow-sm focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all px-3 py-2.5">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(input);
                      }
                    }}
                    placeholder="Tanya tentang regulasi keuangan daerah…"
                    rows={1}
                    disabled={sending}
                    className="flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50 min-h-[22px] leading-relaxed"
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || sending}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all mb-0.5"
                  >
                    {sending
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Send className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground/40 mt-2 text-center">
                  Enter untuk kirim · Shift+Enter untuk baris baru · Jawaban berdasarkan regulasi ter-index
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
