import { createConfig, EVM } from "@lifi/sdk";
import { getWalletClient, switchChain } from "wagmi/actions";
import { wagmiConfig } from "~/lib/wagmi-config";

let configured = false;

/**
 * Call once on the client after WagmiProvider is mounted.
 * Wires LI.FI SDK execution to the active wagmi wallet (Composer / executeRoute).
 * @see https://docs.li.fi/composer/guides/sdk-integration
 */
export function ensureLifiSdk(): void {
  if (configured) return;
  configured = true;
  createConfig({
    integrator: "YieldMind",
    providers: [
      EVM({
        getWalletClient: async () => {
          const client = await getWalletClient(wagmiConfig);
          if (!client) {
            throw new Error("Connect a wallet to execute a Composer route.");
          }
          return client;
        },
        switchChain: async (chainId) => {
          await switchChain(wagmiConfig, {
            chainId: chainId as (typeof wagmiConfig.chains)[number]["id"],
          });
          const client = await getWalletClient(wagmiConfig);
          return client ?? undefined;
        },
      }),
    ],
  });
}
