import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import { NoticeProvider } from "./components/Notice";
import { queryClient } from "./lib/queryClient";
import "./styles.css";

// Sigue el tema del sistema (el tema oscuro de shadcn usa la clase "dark").
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
const applyTheme = () => document.documentElement.classList.toggle("dark", prefersDark.matches);
applyTheme();
prefersDark.addEventListener("change", applyTheme);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <NoticeProvider>
        <App />
      </NoticeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
