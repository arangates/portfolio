import type { FinancialEvent } from "@portfolio/api/calendar-calculations";

export type CalendarViewMode = "month" | "week" | "day" | "year" | "agenda";

export interface FinancialCalendarProps {
  month: string;
  today: string;
  timeZone: string;
  events: FinancialEvent[];
  undatedContracts: number;
}
