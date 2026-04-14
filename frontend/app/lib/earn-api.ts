const EARN_BASE = "https://earn.li.fi";

export type EarnChain = {
  name: string;
  chainId: number;
  networkCaip: string;
};

export async function fetchEarnChains(): Promise<EarnChain[]> {
  const r = await fetch(`${EARN_BASE}/v1/earn/chains`);
  if (!r.ok) throw new Error(`Earn chains: ${r.status}`);
  return r.json();
}

export type EarnProtocol = {
  name: string;
  logoUri?: string;
  url: string;
};

export async function fetchEarnProtocols(): Promise<EarnProtocol[]> {
  const r = await fetch(`${EARN_BASE}/v1/earn/protocols`);
  if (!r.ok) throw new Error(`Earn protocols: ${r.status}`);
  return r.json();
}

export type ListVaultsParams = {
  chainId?: number;
  asset?: string;
  protocol?: string;
  minTvlUsd?: number;
  sortBy?: "apy" | "tvl";
  cursor?: string;
  limit?: number;
};

export async function fetchEarnVaults(params: ListVaultsParams = {}) {
  const q = new URLSearchParams();
  if (params.chainId != null) q.set("chainId", String(params.chainId));
  if (params.asset) q.set("asset", params.asset);
  if (params.protocol) q.set("protocol", params.protocol);
  if (params.minTvlUsd != null) q.set("minTvlUsd", String(params.minTvlUsd));
  if (params.sortBy) q.set("sortBy", params.sortBy);
  if (params.cursor) q.set("cursor", params.cursor);
  if (params.limit != null) q.set("limit", String(params.limit));
  const r = await fetch(`${EARN_BASE}/v1/earn/vaults?${q}`);
  if (!r.ok) throw new Error(`Earn vaults: ${r.status}`);
  return r.json() as Promise<{
    data: unknown[];
    nextCursor?: string;
    total: number;
  }>;
}

export async function fetchEarnVault(chainId: number, address: string) {
  const r = await fetch(
    `${EARN_BASE}/v1/earn/vaults/${chainId}/${address}`,
  );
  if (!r.ok) throw new Error(`Earn vault: ${r.status}`);
  return r.json();
}

export async function fetchEarnPortfolio(userAddress: string) {
  const r = await fetch(
    `${EARN_BASE}/v1/earn/portfolio/${userAddress}/positions`,
  );
  if (!r.ok) throw new Error(`Earn portfolio: ${r.status}`);
  return r.json() as Promise<{
    positions: Array<{
      chainId: number;
      protocolName: string;
      asset: {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
      };
      balanceUsd: string;
      balanceNative: string;
    }>;
  }>;
}

/** Composer / li.quest (swap + bridge + deposit). */
export { COMPOSER_PUBLIC_ORIGIN as COMPOSER_ORIGIN } from "./composer";
