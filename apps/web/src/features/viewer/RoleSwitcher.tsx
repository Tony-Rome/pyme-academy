import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/format";
import { useViewer } from "./useViewer";

/**
 * Solo para la demo con API simulada: permite "entrar" como director, profesor
 * o apoderado sin construir todavía el inicio de sesión.
 */
export function RoleSwitcher() {
  const queryClient = useQueryClient();
  const viewer = useViewer();

  const demoViewers = useQuery({
    queryKey: ["demo-viewers"],
    queryFn: async () => (await import("@/mocks/store")).demoViewers,
    staleTime: Infinity,
  });

  if (!viewer.data || !demoViewers.data) return null;

  const items = demoViewers.data.map((v) => ({
    value: v.id,
    label: `${ROLE_LABELS[v.role]} · ${v.fullName}`,
  }));

  async function change(id: string | null) {
    if (!id) return;
    const mockStore = await import("@/mocks/store");
    mockStore.setViewer(id);
    await queryClient.invalidateQueries();
  }

  return (
    <Select items={items} value={viewer.data.id} onValueChange={change}>
      <SelectTrigger size="sm" aria-label="Ver la aplicación como" className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
