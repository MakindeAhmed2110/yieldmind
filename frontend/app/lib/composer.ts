/**
 * LI.FI Composer — GET /v1/quote pattern (vault token as `toToken` triggers Composer).
 * @see https://docs.li.fi/composer/guides/api-integration
 * @see https://docs.li.fi/composer/recipes/vault-deposits
 */

export const NATIVE_TOKEN = "0x0000000000000000000000000000000000000000";

/** Public site / API host (quotes). */
export const COMPOSER_PUBLIC_ORIGIN = "https://li.quest";

export const COMPOSER_API_BASE = `${COMPOSER_PUBLIC_ORIGIN}/v1`;

/** Jumper — LI.FI consumer UI; uses the same query shape as the quote API for deep links. */
export const JUMPER_ORIGIN = "https://jumper.exchange";

export type ComposerQuoteParams = {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  /** Amount in smallest units (string integer). */
  fromAmount: string;
  /** User wallet; `toAddress` matches for self-custody deposits. */
  fromAddress: string;
};

export function buildComposerQuoteSearchParams(
  p: ComposerQuoteParams,
): URLSearchParams {
  const q = new URLSearchParams();
  q.set("fromChain", String(p.fromChain));
  q.set("toChain", String(p.toChain));
  q.set("fromToken", p.fromToken);
  q.set("toToken", p.toToken);
  q.set("fromAmount", p.fromAmount);
  q.set("fromAddress", p.fromAddress);
  q.set("toAddress", p.fromAddress);
  return q;
}

/** Direct GET URL for `fetch` / curl (returns JSON quote with `transactionRequest`). */
export function buildComposerQuoteApiUrl(p: ComposerQuoteParams): string {
  return `${COMPOSER_API_BASE}/quote?${buildComposerQuoteSearchParams(p)}`;
}

/** Browser deep link to open the same route in Jumper. */
export function buildJumperDepositUrl(p: ComposerQuoteParams): string {
  return `${JUMPER_ORIGIN}/?${buildComposerQuoteSearchParams(p)}`;
}

export function summarizeComposerQuote(json: unknown): Record<string, unknown> {
  if (!json || typeof json !== "object") {
    return { error: "invalid_quote_response" };
  }
  const q = json as Record<string, unknown>;
  if (typeof q.message === "string" && q.message) {
    return {
      error: q.message,
      code: q.code,
    };
  }
  const action = q.action as Record<string, unknown> | undefined;
  const estimate = q.estimate as Record<string, unknown> | undefined;
  return {
    id: q.id,
    type: q.type,
    tool: q.tool,
    fromAmount: action?.fromAmount,
    toAmount: action?.toAmount,
    fromToken: action?.fromToken,
    toToken: action?.toToken,
    fromChainId: action?.fromChainId,
    toChainId: action?.toChainId,
    approvalAddress: estimate?.approvalAddress,
    executionDurationSec: estimate?.executionDuration,
    gasCosts: estimate?.gasCosts,
  };
}

export async function fetchComposerQuotePreview(
  p: ComposerQuoteParams,
): Promise<{ ok: boolean; summary: Record<string, unknown> }> {
  const url = buildComposerQuoteApiUrl(p);
  const res = await fetch(url);
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      summary: {
        error: `http_${res.status}`,
        ...(typeof data === "object" && data !== null ? (data as object) : {}),
      },
    };
  }
  return { ok: true, summary: summarizeComposerQuote(data) };
}
