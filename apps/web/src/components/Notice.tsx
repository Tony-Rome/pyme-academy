import { X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Show = (message: string) => void;

const NoticeContext = createContext<Show>(() => {});

/** Mensaje breve de confirmación en la parte inferior (se oculta solo). */
export function NoticeProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const show = useCallback<Show>((text) => setMessage(text), []);

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setMessage(null), 6000);
    return () => window.clearTimeout(id);
  }, [message]);

  return (
    <NoticeContext.Provider value={show}>
      {children}
      {message && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-w-md items-start gap-2 rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-lg"
        >
          <p className="flex-1">{message}</p>
          <Button variant="ghost" size="icon-xs" aria-label="Cerrar aviso" onClick={() => setMessage(null)}>
            <X />
          </Button>
        </div>
      )}
    </NoticeContext.Provider>
  );
}

export const useNotice = () => useContext(NoticeContext);
