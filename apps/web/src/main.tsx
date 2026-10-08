import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, NavLink, Route, Routes } from "react-router-dom";
import { Board } from "./pages/Board.tsx";
import { Create } from "./pages/Create.tsx";
import { Trust } from "./pages/Trust.tsx";
import { Vault } from "./pages/Vault.tsx";
import "./styles.css";

const queryClient = new QueryClient();
const nav = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-11 items-center px-2 text-base ${isActive ? "font-bold underline" : "text-text-2"}`;

function Shell() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-2 py-4">
        <NavLink to="/" className="font-display text-2xl font-extrabold tracking-wide">
          SHIP OR BURN
        </NavLink>
        <nav className="flex gap-2" aria-label="Main">
          <NavLink to="/" end className={nav}>
            Ship Board
          </NavLink>
          <NavLink to="/new" className={nav}>
            Lock tokens
          </NavLink>
          <NavLink to="/how" className={nav}>
            How it works
          </NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Board />} />
          <Route path="/v/:id" element={<Vault />} />
          <Route path="/new" element={<Create />} />
          <Route path="/how" element={<Trust />} />
          <Route path="*" element={<p className="text-base">That page does not exist.</p>} />
        </Routes>
      </main>
    </div>
  );
}

// HashRouter keeps every route working from a static host or an IPFS gateway, with no server rewrites
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Shell />
      </HashRouter>
    </QueryClientProvider>
  </StrictMode>,
);
