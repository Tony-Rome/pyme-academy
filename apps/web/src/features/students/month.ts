import { useSearchParams } from "react-router";

/** Un mes como "2026-11" (año-mes), que viaja en la dirección como ?mes=2026-11. */
export type Ym = string;

const YM = /^\d{4}-(0[1-9]|1[0-2])$/;

export function currentYm(): Ym {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftYm(ym: Ym, delta: number): Ym {
  const [year, month] = ym.split("-").map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Desde el comienzo del mes (incluido) hasta el comienzo del siguiente (excluido), en hora local. */
export function monthRange(ym: Ym): { from: string; to: string } {
  const [year, month] = ym.split("-").map(Number);
  return {
    from: new Date(year, month - 1, 1).toISOString(),
    to: new Date(year, month, 1).toISOString(),
  };
}

export function formatYm(ym: Ym): string {
  const [year, month] = ym.split("-").map(Number);
  const text = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Mes elegido, guardado en la dirección para que se conserve al recargar y al volver atrás. */
export function useMonth() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("mes");
  const ym = raw && YM.test(raw) ? raw : currentYm();

  function setYm(next: Ym) {
    setParams(
      (prev) => {
        const copy = new URLSearchParams(prev);
        if (next === currentYm()) copy.delete("mes");
        else copy.set("mes", next);
        return copy;
      },
      { replace: true },
    );
  }

  return { ym, setYm };
}
