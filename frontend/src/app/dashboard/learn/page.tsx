'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import type { ApiResponse, WasteType, WasteCategory } from '@/types'
import { Search, Loader2, BookOpen, Recycle } from 'lucide-react'

// NTP 900.058 color mapping
const CATEGORY_CONFIG: Record<WasteCategory, { label: string; bg: string; border: string; badge: string; dot: string }> = {
  ORGANIC:        { label: 'Orgánicos',      bg: 'bg-amber-50',    border: 'border-amber-200',  badge: 'bg-amber-800 text-white',    dot: '#92400e' },
  RECYCLABLE:     { label: 'Reciclables',    bg: 'bg-yellow-50',   border: 'border-yellow-200', badge: 'bg-yellow-500 text-white',   dot: '#eab308' },
  NON_RECYCLABLE: { label: 'No reciclables', bg: 'bg-slate-50',    border: 'border-slate-300',  badge: 'bg-slate-700 text-white',    dot: '#334155' },
  HAZARDOUS:      { label: 'Peligrosos',     bg: 'bg-red-50',      border: 'border-red-200',    badge: 'bg-red-600 text-white',      dot: '#dc2626' },
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
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen size={22} className="text-emerald-600" />
          Aprende a segregar
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Guía visual de clasificación de residuos sólidos — NTP 900.058
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar residuo (ej: botella, cáscara, pila…)"
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm
            focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveCategory('ALL')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
            activeCategory === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
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
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                activeCategory === cat
                  ? `${cfg.badge} border-transparent`
                  : `bg-white text-slate-600 border-slate-200 hover:border-slate-300`
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
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <Recycle size={48} className="text-slate-200 mb-3" />
          <p className="text-slate-400 text-sm">
            {search ? `Sin resultados para "${search}"` : 'No hay tipos de residuos registrados'}
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-2 text-xs text-emerald-600 hover:underline"
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
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cfg.dot }} />
                  <h2 className="text-base font-semibold text-slate-800">{cfg.label}</h2>
                  <span className="text-xs text-slate-400">{items.length} tipo(s)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
  cfg: { label: string; bg: string; border: string; badge: string; dot: string }
}) {
  return (
    <div className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5"
            style={{ backgroundColor: waste.colorCode }}
          />
          <h3 className="font-semibold text-slate-900 text-sm leading-snug">{waste.name}</h3>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>

      {/* Description */}
      {waste.description && (
        <p className="text-xs text-slate-600 mb-3 leading-relaxed">{waste.description}</p>
      )}

      {/* Examples */}
      {waste.examples.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Ejemplos</p>
          <div className="flex flex-wrap gap-1">
            {waste.examples.map((ex, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-white/70 rounded-full text-slate-600 border border-white/50">
                {ex}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {waste.instructions && (
        <div className="border-t border-white/50 pt-2.5 mt-2.5">
          <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Instrucciones</p>
          <p className="text-xs text-slate-600 leading-relaxed">{waste.instructions}</p>
        </div>
      )}
    </div>
  )
}
