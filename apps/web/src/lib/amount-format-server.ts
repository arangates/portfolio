import "server-only";
import { cookies } from "next/headers";
import { createAmountFormatter } from "./format";
export async function getAmountFormatter() {
  return createAmountFormatter(
    (await cookies()).get("selvam-amount-mode")?.value === "exact" ? "exact" : "compact",
  );
}
