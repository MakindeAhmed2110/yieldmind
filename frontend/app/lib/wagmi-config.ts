import { createConfig, http } from "wagmi";
import {
  arbitrum,
  avalanche,
  base,
  blast,
  bsc,
  celo,
  gnosis,
  linea,
  mainnet,
  mantle,
  mode,
  moonbeam,
  optimism,
  polygon,
  polygonZkEvm,
  scroll,
  sei,
  zksync,
} from "viem/chains";
import { injected } from "wagmi/connectors";

/**
 * Chains the wallet UI can switch to. LI.FI Earn / Composer cover many more;
 * vault discovery uses https://earn.li.fi — add viem chain defs here as you need them.
 */
const chains = [
  mainnet,
  arbitrum,
  optimism,
  base,
  polygon,
  bsc,
  avalanche,
  gnosis,
  zksync,
  linea,
  scroll,
  blast,
  mode,
  mantle,
  sei,
  polygonZkEvm,
  moonbeam,
  celo,
] as const;

const transports = Object.fromEntries(
  chains.map((chain) => [chain.id, http()] as const),
) as Record<(typeof chains)[number]["id"], ReturnType<typeof http>>;

export const wagmiConfig = createConfig({
  chains,
  connectors: [injected()],
  transports,
  ssr: false,
});
