'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import type { ApiResponse, WasteType, WasteCategory } from '@/types'

// NTP 900.058 color mapping - Estética editorial
const CATEGORY_CONFIG: Record<WasteCategory, { label: string; bg: string; border: string; badge: string; dot: string; text: string }> = {
  ORGANIC:        { label: 'Orgánicos',      bg: 'bg-amber-50/40',    border: 'border-amber-200',  badge: 'bg-amber-800 text-white',    dot: '#92400e', text: 'text-amber-900' },
  RECYCLABLE:     { label: 'Reciclables',    bg: 'bg-blue-50/40',     border: 'border-blue-200',   badge: 'bg-blue-800 text-white',     dot: '#1e40af', text: 'text-blue-900' },
  NON_RECYCLABLE: { label: 'No reciclables', bg: 'bg-slate-50',       border: 'border-slate-200',  badge: 'bg-slate-700 text-white',    dot: '#334155', text: 'text-slate-800' },
  HAZARDOUS:      { label: 'Peligrosos',     bg: 'bg-orange-50/40',   border: 'border-orange-200', badge: 'bg-orange-850 text-white',   dot: '#c2410c', text: 'text-orange-900' },
}

const ALL_CATEGORIES: WasteCategory[] = ['ORGANIC', 'RECYCLABLE', 'NON_RECYCLABLE', 'HAZARDOUS']

export default function LearnPage() {
  const { accessToken } = useAuth()
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<WasteCategory | 'ALL'>('ALL')

  useEffect(() => {
    if (!accessToken) return
    api
      .get<ApiResponse<WasteType[]>>('/waste-types', accessToken)
      .then((r) => setWasteTypes((r.data ?? []).filter((w) => w.isActive)))
      .catch(() => {})
      .finally(() => setLoading(false))

    // RF-16: Registrar visita educativa para el reporte de participación
    api.post('/page-visits/learn', {}, accessToken).catch(() => {})
  }, [accessToken])

  const filtered = useMemo(() => {
    return wasteTypes.filter((w) => {
      const matchCategory = activeCategory === 'ALL' || w.category === activeCategory
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        w.name.toLowerCase().includes(q) ||
        w.examples.some((e) => e.toLowerCase().includes(q)) ||
        (w.description?.toLowerCase().includes(q) ?? false)
      return matchCategory && matchSearch
    })
  }, [wasteTypes, search, activeCategory])

  const countByCategory = useMemo(
    () => Object.fromEntries(ALL_CATEGORIES.map((c) => [c, wasteTypes.filter((w) => w.category === c).length])),
    [wasteTypes],
  )

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8 border-b border-slate-100 pb-6">
        <h1 className="text-3xl font-light text-slate-900 tracking-tight">Aprende a segregar</h1>
        <p className="text-slate-500 text-xs tracking-wider uppercase mt-1.5 font-bold">
          Guía visual de clasificación de residuos sólidos — NTP 900.058
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar residuo (ej: botella, cáscara, pila…)"
          className="w-full sm:max-w-xs px-3 py-2.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-800 transition-colors bg-white"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5 mb-8">
        <button
          onClick={() => setActiveCategory('ALL')}
          className={`px-3 py-1.5 rounded text-xs font-bold tracking-wider uppercase transition-colors ${
            activeCategory === 'ALL'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todos ({wasteTypes.length})
        </button>
        {ALL_CATEGORIES.map((cat) => {
          const cfg = CATEGORY_CONFIG[cat]
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded text-xs font-bold tracking-wider uppercase transition-colors ${
                activeCategory === cat
                  ? 'bg-teal-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cfg.label} ({countByCategory[cat] ?? 0})
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-teal-700 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sin Resultados</p>
          <p className="text-slate-500 text-sm">
            {search ? `No hay resultados educativos para "${search}"` : 'No hay información de residuos cargada en la guía.'}
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-4 text-xs font-bold uppercase tracking-wider text-teal-800 hover:text-teal-950"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {(activeCategory === 'ALL' ? ALL_CATEGORIES : [activeCategory]).map((cat) => {
            const items = filtered.filter((w) => w.category === cat)
            if (items.length === 0) return null
            const cfg = CATEGORY_CONFIG[cat]
            return (
              <section key={cat}>
                <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{cfg.label}</h2>
                  <span className="text-[10px] text-slate-400 font-medium">({items.length} tipos de residuos)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((w) => (
                    <WasteCard key={w.id} waste={w} cfg={cfg} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function WasteCard({
  waste,
  cfg,
}: {
  waste: WasteType
  cfg: { label: string; bg: string; border: string; badge: string; dot: string; text: string }
}) {
  return (
    <div className={`rounded-xl border p-5 flex flex-col justify-between min-h-[160px] ${cfg.bg} ${cfg.border}`}>
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: waste.colorCode }}
            />
            <h3 className={`font-bold text-sm uppercase tracking-wide truncate ${cfg.text}`}>{waste.name}</h3>
          </div>
        </div>

        {/* Description */}
        {waste.description && (
          <p className={`text-xs mb-4 leading-relaxed ${cfg.text} opacity-85`}>{waste.description}</p>
        )}

        {/* Examples */}
        {waste.examples.length > 0 && (
          <div className="mb-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Ejemplos</span>
            <div className="flex flex-wrap gap-1.5">
              {waste.examples.map((ex, i) => (
                <span key={i} className="text-[10px] font-medium px-2.5 py-0.5 bg-white/70 rounded border border-white/40 text-slate-650">
                  {ex}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      {waste.instructions && (
        <div className="border-t border-white/50 pt-3 mt-3 text-[11px] leading-relaxed">
          <span className="font-bold uppercase text-[9px] tracking-wide block mb-0.5">Manejo correcto:</span>
          <p className={`${cfg.text} opacity-75`}>{waste.instructions}</p>
        </div>
      )}
    </div>
  )
}
