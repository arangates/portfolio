import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createContext } from "@zerodha-coin/api/context";
import { appRouter } from "@zerodha-coin/api/routers/index";
import { NextRequest } from "next/server";

function handler(req: NextRequest) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
  });
}
export { handler as GET, handler as POST };
