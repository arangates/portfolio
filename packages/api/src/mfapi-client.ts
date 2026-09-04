import "server-only";

import { z } from "zod";

const BASE_URL = "https://api.mfapi.in";

const catalogItemSchema = z.object({
  schemeCode: z.number().int().positive(),
  schemeName: z.string().min(1),
  isinGrowth: z.string().nullable().optional(),
  isinDivReinvestment: z.string().nullable().optional(),
});

const metadataSchema = z.object({
  fund_house: z.string().default("Unknown"),
  scheme_type: z.string().default("Unknown"),
  scheme_category: z.string().default("Unknown"),
  scheme_code: z.number().int().positive(),
  scheme_name: z.string().min(1),
  isin_growth: z.string().nullable().optional(),
  isin_div_reinvestment: z.string().nullable().optional(),
});

const navSchema = z.object({
  date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/),
  nav: z.string().refine((value) => Number.isFinite(Number(value)) && Number(value) > 0),
});

const fundResponseSchema = z.object({
  meta: metadataSchema,
  data: z.array(navSchema),
  status: z.string().optional(),
});

export type MfapiCatalogItem = z.infer<typeof catalogItemSchema>;
export type MfapiFund = z.infer<typeof fundResponseSchema>;

async function request(path: string, attempts = 2): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        headers: { Accept: "application/json", "User-Agent": "Selvam/1.0" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`MFAPI returned HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("MFAPI request failed");
}

export async function fetchMfapiCatalog() {
  const payload = await request("/mf?limit=50000&offset=0");
  return z.array(catalogItemSchema).parse(payload);
}

export async function fetchMfapiFund(
  schemeCode: number,
  range?: { startDate?: string; endDate?: string },
) {
  const params = new URLSearchParams();
  if (range?.startDate) params.set("startDate", range.startDate);
  if (range?.endDate) params.set("endDate", range.endDate);
  const query = params.size ? `?${params.toString()}` : "";
  return fundResponseSchema.parse(await request(`/mf/${schemeCode}${query}`));
}

export function mfapiDateToIso(value: string) {
  const [day, month, year] = value.split("-");
  if (!day || !month || !year) throw new Error(`Invalid MFAPI date: ${value}`);
  return `${year}-${month}-${day}`;
}
