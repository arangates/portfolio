import "server-only";

import { createHash } from "node:crypto";

import { env } from "@portfolio/env/server";

const KITE_API_BASE = "https://api.kite.trade";
const KITE_LOGIN_URL = "https://kite.zerodha.com/connect/login";

export type KiteHolding = {
  tradingsymbol: string;
  exchange: string;
  instrument_token: number;
  isin: string;
  product: string;
  quantity: number;
  average_price: number;
  last_price: number;
  close_price: number;
  pnl: number;
  day_change: number;
  day_change_percentage: number;
  t1_quantity: number;
  realised_quantity: number;
  authorised_quantity: number;
  authorised_date: string;
  used_quantity: number;
  opening_quantity: number;
  collateral_quantity: number;
  collateral_type: string;
  discrepancy: boolean;
};

export type KitePosition = {
  tradingsymbol: string;
  exchange: string;
  instrument_token: number;
  product: string;
  quantity: number;
  average_price: number;
  last_price: number;
  close_price: number;
  pnl: number;
  m2m: number;
  multiplier: number;
  buy_quantity: number;
  sell_quantity: number;
  buy_price: number;
  sell_price: number;
  buy_value: number;
  sell_value: number;
  buy_m2m: number;
  sell_m2m: number;
  day_buy_quantity: number;
  day_sell_quantity: number;
  day_buy_price: number;
  day_sell_price: number;
  day_buy_value: number;
  day_sell_value: number;
  overnight_quantity: number;
  value: number;
  unrealised: number;
  realised: number;
};

export type KiteTrade = {
  trade_id: string;
  order_id: string;
  exchange: string;
  tradingsymbol: string;
  instrument_token: number;
  product: string;
  average_price: number;
  quantity: number;
  exchange_order_id: string;
  transaction_type: "BUY" | "SELL";
  fill_timestamp: string;
  order_timestamp: string;
  exchange_timestamp: string;
};

export type KiteProfile = {
  user_id: string;
  user_name: string;
  user_shortname: string;
  email: string;
  user_type: string;
  broker: string;
  exchanges: string[];
  products: string[];
  order_types: string[];
  avatar_url: string | null;
};

type KiteResponse<T> = {
  status: "success" | "error";
  data: T;
  message?: string;
  error_type?: string;
};

type KiteSessionResponse = {
  user_id: string;
  user_name: string;
  user_shortname: string;
  email: string;
  user_type: string;
  broker: string;
  exchanges: string[];
  products: string[];
  order_types: string[];
  avatar_url: string | null;
  access_token: string;
  public_token: string;
  enctoken: string;
  refresh_token: string;
  login_time: string;
};

function getApiKey() {
  const key = env.KITE_API_KEY;
  if (!key) throw new Error("KITE_API_KEY is not configured");
  return key;
}

function getApiSecret() {
  const secret = env.KITE_API_SECRET;
  if (!secret) throw new Error("KITE_API_SECRET is not configured");
  return secret;
}

async function kiteRequest<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${KITE_API_BASE}${path}`, {
    headers: {
      "X-Kite-Version": "3",
      Authorization: `token ${getApiKey()}:${accessToken}`,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Kite API error ${response.status}: ${body}`);
  }
  const json = (await response.json()) as KiteResponse<T>;
  if (json.status === "error") {
    throw new Error(`Kite API: ${json.message ?? json.error_type ?? "Unknown error"}`);
  }
  return json.data;
}

export function getKiteLoginUrl(redirectUrl: string) {
  const apiKey = getApiKey();
  return `${KITE_LOGIN_URL}?v=3&api_key=${apiKey}&redirect_url=${encodeURIComponent(redirectUrl)}`;
}

export async function createKiteSession(requestToken: string) {
  const apiKey = getApiKey();
  const apiSecret = getApiSecret();
  const checksum = createHash("sha256")
    .update(apiKey + requestToken + apiSecret)
    .digest("hex");

  const response = await fetch(`${KITE_API_BASE}/session/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Kite-Version": "3",
    },
    body: new URLSearchParams({
      api_key: apiKey,
      request_token: requestToken,
      checksum,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Kite session error ${response.status}: ${body}`);
  }
  const json = (await response.json()) as KiteResponse<KiteSessionResponse>;
  if (json.status === "error") {
    throw new Error(`Kite session: ${json.message ?? json.error_type ?? "Unknown error"}`);
  }
  return json.data;
}

export async function getKiteProfile(accessToken: string) {
  return kiteRequest<KiteProfile>("/user/profile", accessToken);
}

export async function getKiteHoldings(accessToken: string) {
  return kiteRequest<KiteHolding[]>("/portfolio/holdings", accessToken);
}

export async function getKitePositions(accessToken: string) {
  return kiteRequest<{ net: KitePosition[]; day: KitePosition[] }>(
    "/portfolio/positions",
    accessToken,
  );
}

export async function getKiteTrades(accessToken: string) {
  return kiteRequest<KiteTrade[]>("/trades", accessToken);
}
