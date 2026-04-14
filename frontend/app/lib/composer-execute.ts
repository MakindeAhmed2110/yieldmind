import { convertQuoteToRoute, executeRoute, getQuote } from "@lifi/sdk";
import type { ComposerQuoteParams } from "./composer";

/** Resolved from SDK so we do not import `@lifi/types` directly (not a top-level dependency). */
type ComposerRouteResult = Awaited<ReturnType<typeof executeRoute>>;

/**
 * Execute a Composer deposit/swap route inside YieldMind (wallet signs via LI.FI SDK).
 * @see https://docs.li.fi/composer/guides/sdk-integration
 */
export async function executeComposerDeposit(
  params: ComposerQuoteParams,
  options?: {
    onRouteUpdate?: (route: ComposerRouteResult) => void;
  },
): Promise<ComposerRouteResult> {
  const quote = await getQuote({
    fromChain: params.fromChain,
    toChain: params.toChain,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.fromAmount,
    fromAddress: params.fromAddress,
    toAddress: params.fromAddress,
  });
  const route = convertQuoteToRoute(quote);
  return executeRoute(route, {
    updateRouteHook: (updated) => {
      options?.onRouteUpdate?.(updated);
    },
  });
}
