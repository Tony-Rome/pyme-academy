import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/format";

interface Props {
  onPick: (account: { email: string; password: string }) => void;
}

/** Atajo solo para la demo con API simulada: rellena el formulario con una cuenta de ejemplo. */
export function DemoAccounts({ onPick }: Props) {
  const accounts = useQuery({
    queryKey: ["demo-accounts"],
    queryFn: async () => (await import("@/mocks/store")).demoAccounts,
    staleTime: Infinity,
  });

  if (!accounts.data) return null;

  return (
    <section aria-labelledby="demo-accounts" className="mt-6 space-y-2 border-t pt-4">
      <h2 id="demo-accounts" className="text-sm font-medium">
        Cuentas de demostración
      </h2>
      <p className="text-xs text-muted-foreground">
        Datos de ejemplo. Elige una para rellenar el formulario y luego pulsa «Entrar».
      </p>
      <ul className="flex flex-col gap-1.5">
        {accounts.data.map((account) => (
          <li key={account.email}>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={() => onPick(account)}
            >
              {ROLE_LABELS[account.role]} · {account.fullName}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
