'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api, ApiError } from '@/lib/api'
import type { ApiResponse, WasteType, WasteCategory } from '@/types'
import { toast } from 'sonner'

// ─── Paleta por categoría (alineada con NTP 900.058) ─────────────────────────
const CATEGORY = {
  ORGANIC:       { label: 'Orgánicos',       bg: 'bg-amber-50/40',   border: 'border-amber-250',  text: 'text-amber-900',  dot: '#92400e' },
  RECYCLABLE:    { label: 'Reciclables',      bg: 'bg-blue-50/40',    border: 'border-blue-250',   text: 'text-blue-900',   dot: '#1e40af' },
  NON_RECYCLABLE:{ label: 'No reciclables',  bg: 'bg-slate-50',      border: 'border-slate-200',  text: 'text-slate-800',  dot: '#334155' },
  HAZARDOUS:     { label: 'Peligrosos',       bg: 'bg-orange-50/40',  border: 'border-orange-250', text: 'text-orange-900', dot: '#c2410c' },
} as const

const DEFAULT_COLORS: Record<WasteCategory, string> = {
  ORGANIC:        '#92400e',
  RECYCLABLE:     '#1e40af',
  NON_RECYCLABLE: '#334155',
  HAZARDOUS:      '#c2410c',
}

interface FormState {
  name: string
  category: WasteCategory
  description: string
  colorCode: string
  examples: string[]
  instructions: string
  newExample: string
}

const defaultForm: FormState = {
  name: '', category: 'RECYCLABLE', description: '',
  colorCode: DEFAULT_COLORS.RECYCLABLE,
  examples: [], instructions: '', newExample: '',
}

type FilterCategory = WasteCategory | 'ALL'

export default function WasteTypesPage() {
  const { accessToken, user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [items, setItems] = useState<WasteType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterCategory>('ALL')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<WasteType | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [saving, setSaving] = useState(false)

  const fetchItems = useCallback(async () => {
    if (!accessToken) return
    try {
      const res = await api.get<ApiResponse<WasteType[]>>('/waste-types', accessToken)
      setItems(res.data ?? [])
    } catch {
      toast.error('Error al cargar el catálogo de residuos')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => { fetchItems() }, [fetchItems])

  const filtered = useMemo(() => {
    let list = items
    if (filter !== 'ALL') list = list.filter((i) => i.category === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.examples.some((e) => e.toLowerCase().includes(q)),
      )
    }
    return list
  }, [items, filter, search])

  function openCreate() {
    setEditItem(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  function openEdit(item: WasteType) {
    setEditItem(item)
    setForm({
      name: item.name,
      category: item.category,
      description: item.description ?? '',
      colorCode: item.colorCode,
      examples: item.examples,
      instructions: item.instructions ?? '',
      newExample: '',
    })
    setShowModal(true)
  }

  function addExample() {
    const ex = form.newExample.trim()
    if (!ex || form.examples.includes(ex)) return
    setForm((f) => ({ ...f, examples: [...f.examples, ex], newExample: '' }))
  }

  function removeExample(idx: number) {
    setForm((f) => ({ ...f, examples: f.examples.filter((_, i) => i !== idx) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken) return

    if (form.examples.length === 0) {
      toast.error('Agrega al menos un ejemplo de residuo')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        category: form.category,
        description: form.description || undefined,
        colorCode: form.colorCode,
        examples: form.examples,
        instructions: form.instructions || undefined,
      }

      if (editItem) {
        await api.put(`/waste-types/${editItem.id}`, payload, accessToken)
        toast.success('Tipo de residuo actualizado')
      } else {
        await api.post('/waste-types', payload, accessToken)
        toast.success('Tipo de residuo creado')
      }

      setShowModal(false)
      fetchItems()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(item: WasteType) {
    if (!accessToken) return
    try {
      await api.patch(`/waste-types/${item.id}/toggle-status`, undefined, accessToken)
      toast.success(item.isActive ? 'Tipo deshabilitado' : 'Tipo habilitado')
      fetchItems()
    } catch {
      toast.error('Error al cambiar el estado')
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8 border-b border-slate-100 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">Catálogo de residuos</h1>
          <p className="text-slate-500 text-xs tracking-wider uppercase mt-1.5 font-bold">
            Catálogo institucional de segregación · NTP 900.058
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold tracking-wider uppercase rounded transition-colors"
          >
            Nuevo tipo
          </button>
        )}
      </div>

      {/* Search + category filter */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar residuo o ejemplo..."
          className="w-full sm:max-w-xs px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-800 transition-colors"
        />
        <div className="flex flex-wrap gap-1">
          {(['ALL', 'ORGANIC', 'RECYCLABLE', 'NON_RECYCLABLE', 'HAZARDOUS'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded text-xs font-bold tracking-wider uppercase transition-colors ${
                filter === cat
                  ? 'bg-teal-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'Todos' : CATEGORY[cat].label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-teal-700 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sin Resultados</p>
          <p className="text-slate-500 text-sm">
            {search ? 'No se encontraron residuos que coincidan con la búsqueda.' : 'No hay tipos de residuos registrados aún.'}
          </p>
          {isAdmin && !search && (
            <button onClick={openCreate} className="mt-4 text-xs font-bold uppercase tracking-wider text-teal-800 hover:text-teal-950">
              Agregar el primer tipo →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((item) => {
            const cat = CATEGORY[item.category]
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-5 flex flex-col justify-between ${cat.bg} ${cat.border} ${
                  !item.isActive ? 'opacity-50' : ''
                }`}
              >
                <div>
                  {/* Color swatch + name */}
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-8 h-8 rounded shrink-0 shadow-sm border border-white/50"
                      style={{ backgroundColor: item.colorCode }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm uppercase tracking-wide truncate ${cat.text}`}>
                        {item.name}
                      </p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${cat.text} opacity-70`}>
                        {cat.label}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className={`text-xs mb-4 leading-relaxed ${cat.text} opacity-85`}>
                      {item.description}
                    </p>
                  )}

                  {/* Examples */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {item.examples.slice(0, 4).map((ex, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/70 text-slate-700 border border-white/40"
                      >
                        {ex}
                      </span>
                    ))}
                    {item.examples.length > 4 && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/70 text-slate-400 font-bold">
                        +{item.examples.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom section (Instructions + Admin controls) */}
                <div className="mt-auto">
                  {item.instructions && (
                    <div className={`text-[11px] pt-3 border-t border-white/50 ${cat.text} opacity-75 leading-relaxed`}>
                      <span className="font-bold uppercase text-[9px] tracking-wide block mb-0.5">Instrucciones:</span>
                      {item.instructions}
                    </div>
                  )}

                  {isAdmin && (
                    <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-white/40">
                      <button
                        onClick={() => openEdit(item)}
                        className={`text-[10px] font-bold uppercase tracking-wider ${cat.text} opacity-75 hover:opacity-100 transition-opacity`}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggle(item)}
                        className={`text-[10px] font-bold uppercase tracking-wider ${cat.text} opacity-75 hover:opacity-100 transition-opacity`}
                      >
                        {item.isActive ? 'Desactivar' : 'Habilitar'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <h2 className="font-semibold text-slate-900 text-sm">
                {editItem ? 'EDITAR RESIDUO' : 'NUEVO RESIDUO'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 hover:text-slate-900 uppercase transition-colors"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Nombre *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Ej: Papel y cartón"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-800 transition-colors"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1.5">Categoría *</label>
                  <select
                    value={form.category}
                    onChange={(e) => {
                      const cat = e.target.value as WasteCategory
                      setForm({ ...form, category: cat, colorCode: DEFAULT_COLORS[cat] })
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-800 bg-white transition-colors"
                  >
                    {(Object.keys(CATEGORY) as WasteCategory[]).map((k) => (
                      <option key={k} value={k}>{CATEGORY[k].label}</option>
                    ))}
                  </select>
                </div>

                {/* Color code */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1.5">
                    Color identificador *
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.colorCode}
                      onChange={(e) => setForm({ ...form, colorCode: e.target.value })}
                      className="w-10 h-10 rounded border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.colorCode}
                      onChange={(e) => setForm({ ...form, colorCode: e.target.value })}
                      placeholder="#000000"
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-800 transition-colors"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1.5">Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    placeholder="Descripción breve del tipo de residuo..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-800 resize-none transition-colors"
                  />
                </div>

                {/* Examples */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1.5">
                    Ejemplos * <span className="font-normal text-slate-400">(al menos uno)</span>
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={form.newExample}
                      onChange={(e) => setForm({ ...form, newExample: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExample() } }}
                      placeholder="Ej: Botella de plástico"
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-800 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={addExample}
                      className="px-3 py-2 bg-slate-105 hover:bg-slate-200 text-slate-700 text-xs font-bold tracking-wider uppercase rounded"
                    >
                      Agregar
                    </button>
                  </div>
                  {form.examples.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.examples.map((ex, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded
                            bg-slate-100 text-slate-700"
                        >
                          {ex}
                          <button
                            type="button"
                            onClick={() => removeExample(i)}
                            className="text-slate-400 hover:text-red-500 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1.5">
                    Instrucciones de manejo
                  </label>
                  <textarea
                    value={form.instructions}
                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                    rows={2}
                    placeholder="¿Cómo debe depositarse este residuo?"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-800 resize-none transition-colors"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold tracking-wider text-slate-600 border border-slate-200 rounded hover:bg-slate-50 uppercase transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center px-4 py-2 bg-teal-800 hover:bg-teal-900 disabled:bg-teal-400 text-white text-xs font-bold tracking-wider uppercase rounded transition-colors"
                >
                  {saving && (
                    <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />
                  )}
                  {editItem ? 'Guardar cambios' : 'Crear tipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
