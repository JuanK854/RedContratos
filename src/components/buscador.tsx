"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, Building2, ArrowUp, ArrowDown, CornerDownLeft } from "lucide-react";
import { API_URL } from "@/lib/config";
import { ScoreBadge } from "@/components/score-badge";

interface SearchResult {
  id: string;
  name: string;
  rfc: string;
  score: number;
  flags: string[];
}

interface BackendResult {
  rfc: string;
  nombre: string;
  score: number;
  flag_fantasma: boolean;
  flag_fraccionamiento: boolean;
  flag_espejo: boolean;
}

function mapBackendResult(r: BackendResult): SearchResult {
  const flags: string[] = [];
  if (r.flag_fantasma) flags.push("Empresa Fantasma");
  if (r.flag_fraccionamiento) flags.push("Fraccionamiento");
  if (r.flag_espejo) flags.push("Contrato Espejo");
  return {
    id: r.rfc,
    name: r.nombre,
    rfc: r.rfc,
    score: r.score,
    flags,
  };
}

export function Buscador() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(true);
    setSelectedIndex(-1);

    try {
      const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults((data.results || []).map(mapBackendResult));
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchResults(value);
    }, 300);
  };

  const handleSelect = (result: SearchResult) => {
    setQuery(result.name);
    setOpen(false);
    setSelectedIndex(-1);
    router.push(`/explorador?rfc=${encodeURIComponent(result.rfc)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedEl = dropdownRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white/40 transition-colors duration-300" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="Buscar RFC, empresa o dependencia..."
          className="w-full h-10 pl-10 pr-10 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/15 transition-all duration-300"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 animate-spin" />
        )}
        {query && !loading && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 hover:text-white/50 transition-colors duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto rounded-lg border border-white/5 bg-[#0f0f0f] shadow-2xl shadow-black/50 z-50 animate-fade-in"
        >
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-200 ${
                index === selectedIndex ? "bg-white/[0.04]" : "hover:bg-white/[0.03]"
              }`}
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.03] border border-white/5">
                <Building2 className="h-4 w-4 text-white/25" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium truncate transition-colors duration-200 ${
                      index === selectedIndex ? "text-white/90" : "text-white/70"
                    }`}
                  >
                    {result.name}
                  </span>
                  {result.flags.length > 0 && (
                    <span className="shrink-0 rounded-full bg-red-500/5 border border-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400/60">
                      {result.flags.length} alerta{result.flags.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <ScoreBadge score={result.score} size="sm" />
                  <span className="text-xs text-white/15 font-mono">RFC: {result.rfc}</span>
                </div>
              </div>
            </button>
          ))}

          <div className="flex items-center justify-between border-t border-white/[0.03] px-4 py-2.5 text-[10px] text-white/15">
            <div className="flex items-center gap-1.5">
              <kbd className="rounded bg-white/[0.03] border border-white/5 px-1.5 py-0.5 font-mono">
                <ArrowUp className="h-3 w-3" />
              </kbd>
              <kbd className="rounded bg-white/[0.03] border border-white/5 px-1.5 py-0.5 font-mono">
                <ArrowDown className="h-3 w-3" />
              </kbd>
              <span>para navegar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="rounded bg-white/[0.03] border border-white/5 px-1.5 py-0.5 font-mono">
                <CornerDownLeft className="h-3 w-3" />
              </kbd>
              <span>para seleccionar</span>
            </div>
          </div>
        </div>
      )}

      {open && query && !loading && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-white/5 bg-[#0f0f0f] shadow-2xl shadow-black/50 z-50 px-4 py-8 text-center animate-fade-in">
          <Search className="mx-auto h-8 w-8 text-white/10 mb-3" />
          <p className="text-sm text-white/25">No se encontraron resultados para "{query}"</p>
        </div>
      )}
    </div>
  );
}
