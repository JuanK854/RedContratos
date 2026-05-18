"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Network,
  AlertTriangle,
  FolderOpen,
  Menu,
  X,
} from "lucide-react";
import { Buscador } from "@/components/buscador";

const NAV_ITEMS = [
  { href: "/explorador", label: "Explorador de Grafos", icon: Network },
  { href: "/top", label: "Top Riesgo", icon: AlertTriangle },
  { href: "/alertas", label: "Alertas Activas", icon: FolderOpen },
];

interface NavbarProps {
  children: React.ReactNode;
}

export function Navbar({ children }: NavbarProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a]">
      {/* TOP BAR */}
      <header className="flex items-center h-14 px-4 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl shrink-0 z-50">
        {/* Mobile: Hamburger */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all duration-300 mr-2"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-6 group shrink-0">
          <div className="relative">
            <Network className="w-5 h-5 text-white/60" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </div>
          <span className="text-base font-bold tracking-tight hidden sm:inline">
            <span className="text-white">Red</span>
            <span className="text-white/40">Contratos</span>
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-xl">
          <Buscador />
        </div>

        {/* Live badge */}
        <div className="hidden sm:flex items-center gap-1.5 ml-4 shrink-0 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02]">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500/60 animate-pulse-live" />
          <span className="text-xs font-medium text-white/30">Live</span>
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-56 shrink-0 border-r border-white/5 bg-[#0a0a0a] flex-col py-4">
          <nav className="flex flex-col gap-0.5 px-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <SidebarLink icon={item.icon} label={item.label} active={isActive} />
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="relative w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col py-4 animate-slide-up">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 mb-2">
                <Network className="w-5 h-5 text-white/60" />
                <span className="text-base font-bold tracking-tight">
                  <span className="text-white">Red</span>
                  <span className="text-white/40">Contratos</span>
                </span>
              </div>
              <nav className="flex flex-col gap-0.5 px-3">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                      <SidebarLink icon={item.icon} label={item.label} active={isActive} />
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

function SidebarLink({
  icon: Icon,
  label,
  active,
}: {
  icon: typeof Network;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-300 cursor-pointer ${
        active
          ? "bg-white/[0.04] text-white/80 font-medium"
          : "text-white/30 hover:text-white/60 hover:bg-white/[0.02]"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}
