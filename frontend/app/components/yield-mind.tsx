import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatUnits } from "viem";
import {
  useBalance,
  useConnect,
  useConnection,
  useDisconnect,
  useSignMessage,
} from "wagmi";
import {
  COMPOSER_ORIGIN,
  fetchEarnChains,
  fetchEarnProtocols,
} from "~/lib/earn-api";
import { executeComposerDeposit } from "~/lib/composer-execute";
import type { ComposerQuoteParams } from "~/lib/composer";
import { MatrixBackground } from "./matrix-background";

const SESSION_KEY = "yieldmind-session";

const WELCOME_MESSAGE = `Welcome, Wallet Holder!

The Best AI Agent for Maximizing Crypto Yields

I'm here to find you the best yield possible. I'll do everything for you but I need to understand your needs first. Let's get started by understanding what you're looking for in your yield-seeking adventures.

Use Connect wallet to link your own wallet — that is the account we use; YieldMind does not create or custody a separate wallet for you.

Let's get started. What do you want to do?`;

type Session = {
  address: `0x${string}`;
  message: string;
  signature: `0x${string}`;
};

type ChatLine = { role: "user" | "assistant"; content: string };

function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (s.address && s.message && s.signature) return s;
  } catch {
    /* ignore */
  }
  return null;
}

function saveSession(s: Session | null) {
  if (typeof window === "undefined") return;
  if (!s) sessionStorage.removeItem(SESSION_KEY);
  else sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function YieldMind() {
  const { address, status, chain } = useConnection();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();

  const { data: bal } = useBalance({
    address,
  });

  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    setSession(loadSession());
  }, []);

  useEffect(() => {
    if (address && session && session.address.toLowerCase() !== address.toLowerCase()) {
      saveSession(null);
      setSession(null);
    }
  }, [address, session]);

  const [messages, setMessages] = useState<ChatLine[]>([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);

  const [earnCoverage, setEarnCoverage] = useState<{
    chains: number;
    protocols: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [chains, protocols] = await Promise.all([
          fetchEarnChains(),
          fetchEarnProtocols(),
        ]);
        if (!cancelled) {
          setEarnCoverage({ chains: chains.length, protocols: protocols.length });
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [composerAction, setComposerAction] =
    useState<ComposerQuoteParams | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [executingComposer, setExecutingComposer] = useState(false);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const authPayload = useMemo(() => {
    if (!session) return undefined;
    return {
      address: session.address,
      message: session.message,
      signature: session.signature,
    };
  }, [session]);

  const handleSign = useCallback(async () => {
    if (!address) return;
    const message = [
      "YieldMind session",
      `Address: ${address}`,
      `Nonce: ${crypto.randomUUID()}`,
      `Time: ${new Date().toISOString()}`,
    ].join("\n");
    const signature = await signMessageAsync({ message });
    const next: Session = { address, message, signature };
    saveSession(next);
    setSession(next);
  }, [address, signMessageAsync]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setComposerAction(null);
    setComposerError(null);
    const nextMsgs: ChatLine[] = [...messages, { role: "user", content: text }];
    setMessages(nextMsgs);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMsgs.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          auth: authPayload,
          balanceHint: bal
            ? {
                formatted: formatUnits(bal.value, bal.decimals),
                symbol: bal.symbol,
                chainName: chain?.name,
              }
            : undefined,
        }),
      });
      const raw = await res.text();
      let data: {
        reply?: string;
        error?: string;
        composer?: ComposerQuoteParams;
      };
      try {
        data = JSON.parse(raw) as typeof data;
      } catch {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: `Chat response was not JSON (${res.status}). ${raw.slice(0, 240)}`,
          },
        ]);
        return;
      }
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: data.error ?? "Request failed.",
          },
        ]);
        return;
      }
      if (data.composer) {
        setComposerAction(data.composer);
      }
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply ?? "" },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Network error. Try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [authPayload, bal, chain?.name, input, loading, messages]);

  const runDepositInApp = useCallback(async () => {
    if (!composerAction || !address) return;
    if (address.toLowerCase() !== composerAction.fromAddress.toLowerCase()) {
      setComposerError("Switch to the wallet address used for this quote.");
      return;
    }
    setExecutingComposer(true);
    setComposerError(null);
    try {
      await executeComposerDeposit(composerAction);
      setComposerAction(null);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Composer route finished in your wallet. Check your transaction history and Earn positions.",
        },
      ]);
    } catch (e) {
      setComposerError(
        e instanceof Error ? e.message : "Composer execution failed.",
      );
    } finally {
      setExecutingComposer(false);
    }
  }, [address, composerAction]);

  const connected = status === "connected" && address;

  return (
    <div className="relative min-h-screen bg-black text-[#00ff41] font-mono text-sm">
      <MatrixBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#003311] px-4 py-3">
          <div>
            <h1 className="text-base font-bold tracking-wide text-[#00ff66]">
              YieldMind
            </h1>
            <p className="text-xs text-[#00cc55]">
              The Best AI Agent for Maximizing Crypto Yields
            </p>
            <p className="text-xs text-[#009922]">
              Earn Data API + Composer ({COMPOSER_ORIGIN})
              {earnCoverage
                ? ` · ${earnCoverage.chains}+ chains · ${earnCoverage.protocols}+ protocols indexed`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!connected && (
              <button
                type="button"
                disabled={isConnecting || !connectors[0]}
                onClick={() => connect({ connector: connectors[0]! })}
                className="rounded border border-[#00aa44] bg-[#001a0d] px-3 py-1.5 text-xs text-[#00ff66] hover:bg-[#002211] disabled:opacity-50"
              >
                {isConnecting ? "Connecting…" : "Connect wallet"}
              </button>
            )}
            {connected && (
              <>
                <span className="max-w-[200px] truncate text-xs text-[#00aa44]">
                  {address}
                </span>
                {!session && (
                  <button
                    type="button"
                    disabled={isSigning}
                    onClick={() => void handleSign()}
                    className="rounded border border-[#00aa44] bg-[#001a0d] px-3 py-1.5 text-xs text-[#00ff66] hover:bg-[#002211] disabled:opacity-50"
                  >
                    {isSigning ? "Sign in…" : "Sign to unlock AI session"}
                  </button>
                )}
                {session && (
                  <span className="text-xs text-[#009922]">Session signed</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    saveSession(null);
                    setSession(null);
                    disconnect();
                  }}
                  className="rounded border border-[#333] px-2 py-1 text-xs text-[#668866] hover:border-[#555]"
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        </header>

        <main className="flex flex-1 flex-col overflow-hidden pb-24">
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col space-y-4 overflow-y-auto px-4 py-6">
            {messages.map((m, i) => (
              <div
                key={`${i}-${m.role}`}
                className={
                  m.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
                }
              >
                {m.role === "user" ? (
                  <div className="max-w-[min(100%,42rem)] rounded-lg bg-[#1a1a1a] px-4 py-2 text-[#cccccc]">
                    {m.content}
                  </div>
                ) : (
                  <p className="max-w-[min(100%,42rem)] whitespace-pre-wrap leading-relaxed text-[#00ff41]">
                    {m.content}
                  </p>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <p className="text-[#009922] animate-pulse">Thinking…</p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </main>

        <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#003311] bg-black/90 backdrop-blur">
          {composerAction && (
            <div className="border-b border-[#003311] px-3 py-2">
              <div className="mx-auto flex max-w-4xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[#00aa44]">
                  Ready to run this Composer route in YieldMind (sign in your
                  wallet).
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={
                      executingComposer ||
                      !session ||
                      !address ||
                      address.toLowerCase() !==
                        composerAction.fromAddress.toLowerCase()
                    }
                    onClick={() => void runDepositInApp()}
                    className="rounded border border-[#00ff66] bg-[#001a0d] px-3 py-1.5 text-xs font-semibold text-[#00ff66] hover:bg-[#002211] disabled:opacity-40"
                  >
                    {executingComposer ? "Signing…" : "Execute deposit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setComposerAction(null);
                      setComposerError(null);
                    }}
                    className="rounded border border-[#444] px-2 py-1 text-xs text-[#888] hover:border-[#666]"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              {composerError && (
                <p className="mx-auto mt-1 max-w-4xl text-xs text-red-400">
                  {composerError}
                </p>
              )}
              {!session && (
                <p className="mx-auto mt-1 max-w-4xl text-xs text-[#665500]">
                  Sign the session first, then run the quote again so the server
                  can attach an executable route.
                </p>
              )}
            </div>
          )}
          <div className="mx-auto flex max-w-4xl gap-2 px-3 py-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Ask YieldMind…"
              className="min-w-0 flex-1 rounded border border-[#003311] bg-[#0a0a0a] px-3 py-2 text-[#00ff66] placeholder:text-[#004422] outline-none focus:border-[#00aa44]"
            />
            <button
              type="button"
              disabled={loading || !input.trim()}
              onClick={() => void send()}
              className="shrink-0 rounded border border-[#333] px-3 py-2 text-[#888] hover:border-[#00aa44] hover:text-[#00ff66] disabled:opacity-40"
              aria-label="Send"
            >
              →
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
