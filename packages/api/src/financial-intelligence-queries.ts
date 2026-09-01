import "server-only";

import { getFirePlan } from "./fire-queries";
import { buildFinancialIntelligence } from "./financial-intelligence";
import { getHouseholdDashboard } from "./household-queries";
import { getPortfolioOverview } from "./portfolio-queries";

export async function getFinancialIntelligence(userId: string) {
  const [portfolio, fire, household] = await Promise.all([
    getPortfolioOverview(userId),
    getFirePlan(userId),
    getHouseholdDashboard(userId),
  ]);
  return buildFinancialIntelligence(portfolio, fire, household);
}
