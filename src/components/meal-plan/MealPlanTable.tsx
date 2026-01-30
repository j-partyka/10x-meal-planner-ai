import type { MealPlanDto } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MealCellContent } from "./MealCellContent";

export interface MealPlanTableProps {
  mealPlan: MealPlanDto;
  maxHeight?: string;
  "data-test-id"?: string;
}

const MEAL_KEYS = ["breakfast", "lunch", "dinner"] as const;
const MEAL_LABELS: Record<(typeof MEAL_KEYS)[number], string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

function formatDayHeader(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function MealPlanTable({
  mealPlan,
  maxHeight,
  "data-test-id": dataTestId,
}: MealPlanTableProps) {
  const days = mealPlan.days;
  if (!days.length) return null;

  return (
    <div
      className="w-full overflow-auto"
      style={maxHeight ? { maxHeight } : undefined}
      data-test-id={dataTestId}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              scope="col"
              className="min-w-[100px] sticky left-0 z-10 bg-muted/95 text-sm font-medium"
            >
              <span className="sr-only">Meal</span>
            </TableHead>
            {days.map((day, colIndex) => (
              <TableHead
                key={day.date}
                scope="col"
                className="min-w-[180px] min-h-[44px] px-3 py-3 text-sm font-medium"
              >
                {formatDayHeader(day.date)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {MEAL_KEYS.map((mealKey) => (
            <TableRow key={mealKey}>
              <TableHead
                scope="row"
                className="sticky left-0 z-10 min-w-[100px] bg-muted/50 py-3 text-left text-sm font-medium"
              >
                {MEAL_LABELS[mealKey]}
              </TableHead>
              {days.map((day) => (
                <TableCell
                  key={day.date}
                  className="min-w-[180px] min-h-[44px] px-3 py-3 align-top text-sm"
                >
                  <MealCellContent
                    meal={day[mealKey]}
                    data-test-id="meal-cell-content"
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
