import { defineTool } from "streaming-agent";
import { z } from "zod";
import { wise } from "../wise";

export const getRatesTool = defineTool(
  "GetWiseRates",
  "Get exchange rates from Wise. Provide source and/or target currency codes (e.g. USD, EUR, GBP)",
  z.object({
    source: z.string().nullable().describe("Source currency code (e.g. USD), or null for all"),
    target: z.string().nullable().describe("Target currency code (e.g. EUR), or null for all"),
  }),
  async ({ source, target }) => {
    const rates = await wise.getRates(source ?? undefined, target ?? undefined);
    return rates.map((r) => `${r.source} → ${r.target}: ${r.rate}`).join("\n");
  },
  { isSensitive: true },
);
