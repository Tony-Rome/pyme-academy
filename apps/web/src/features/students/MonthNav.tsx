import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currentYm, formatYm, shiftYm, type Ym } from "./month";

interface Props {
  ym: Ym;
  onChange: (ym: Ym) => void;
}

export function MonthNav({ ym, onChange }: Props) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Mes">
      <Button variant="outline" size="icon" aria-label="Mes anterior" onClick={() => onChange(shiftYm(ym, -1))}>
        <ChevronLeft />
      </Button>
      <span className="min-w-36 text-center text-sm font-medium" aria-live="polite">
        {formatYm(ym)}
      </span>
      <Button variant="outline" size="icon" aria-label="Mes siguiente" onClick={() => onChange(shiftYm(ym, 1))}>
        <ChevronRight />
      </Button>
      {ym !== currentYm() && (
        <Button variant="ghost" onClick={() => onChange(currentYm())}>
          Este mes
        </Button>
      )}
    </div>
  );
}
