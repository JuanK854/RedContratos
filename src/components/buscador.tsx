"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, Building2, User, ArrowUp, ArrowDown, CornerDownLeft } from "lucide-react";

interface SearchResult {
  id: string;
  name: string;
  rfc: string;
  type: "empresa" | "dependencia";
  description?: string;
}

export function Buscador() {
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
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      } else {
        setResults(mockSearch(q));
      }
    } catch {
      setResults(mockSearch(q));
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="Buscar RFC, empresa o dependencia..."
          className="w-full h-10 pl-10 pr-10 rounded-xl bg-slate-900 border border-white/10 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 animate-spin" />
        )}
        {query && !loading && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50 z-50"
        >
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                index === selectedIndex
                  ? "bg-slate-800"
                  : "hover:bg-slate-800"
              }`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  result.type === "empresa"
                    ? "bg-blue-500/10 text-blue-400"
                    : "bg-emerald-500/10 text-emerald-400"
                }`}
              >
                {result.type === "empresa" ? (
                  <Building2 className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium truncate ${
                      index === selectedIndex ? "text-red-500" : "text-slate-200"
                    }`}
                  >
                    {result.name}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      result.type === "empresa"
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {result.type === "empresa" ? "Empresa" : "Dependencia"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 truncate">
                  {result.description}
                  {result.rfc && (
                    <span className="ml-2 font-mono text-slate-600">RFC: {result.rfc}</span>
                  )}
                </p>
              </div>
            </button>
          ))}

          <div className="flex items-center justify-between border-t border-white/5 px-4 py-2 text-[10px] text-slate-600">
            <div className="flex items-center gap-1">
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono">
                <ArrowUp className="h-3 w-3" />
              </kbd>
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono">
                <ArrowDown className="h-3 w-3" />
              </kbd>
              <span>para navegar</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono">
                <CornerDownLeft className="h-3 w-3" />
              </kbd>
              <span>para seleccionar</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function mockSearch(q: string): SearchResult[] {
  const all: SearchResult[] = [
    {
      id: "1",
      name: "EDENRED MEXICO SA DE CV",
      rfc: "EME980311H54",
      type: "empresa",
      description: "Servicios de vales de despensa",
    },
    {
      id: "2",
      name: "GRUPO CONSTRUCTOR ROJAS SA",
      rfc: "GCR901215AB1",
      type: "empresa",
      description: "Construcción e infraestructura",
    },
    {
      id: "3",
      name: "Secretaría de Salud",
      rfc: "SSA000101000",
      type: "dependencia",
      description: "Gobierno Federal",
    },
    {
      id: "4",
      name: "TECNOLOGIAS AVANZADAS MX",
      rfc: "TAM150820QW3",
      type: "empresa",
      description: "Desarrollo de software",
    },
    {
      id: "5",
      name: "IMSS",
      rfc: "IMS431231ABC",
      type: "dependencia",
      description: "Instituto Mexicano del Seguro Social",
    },
    {
      id: "6",
      name: "ALMACENAJE Y DISTRIBUCION AVIOR SA DE CV",
      rfc: "ADV180523XY9",
      type: "empresa",
      description: "Almacenamiento y logística",
    },
    {
      id: "7",
      name: "INDAABIN",
      rfc: "INA000101000",
      type: "dependencia",
      description: "Instituto de Administración y Avalúos de Bienes Nacionales",
    },
    {
      id: "8",
      name: "BIRMEX",
      rfc: "BIR000101000",
      type: "dependencia",
      description: "Laboratorios de Biológicos y Reactivos de México",
    },
  ];

  const lower = q.toLowerCase();
  return all.filter(
    (r) =>
      r.name.toLowerCase().includes(lower) ||
      r.rfc.toLowerCase().includes(lower) ||
      (r.description && r.description.toLowerCase().includes(lower))
  );
}
