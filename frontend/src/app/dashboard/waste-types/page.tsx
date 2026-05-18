'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api, ApiError } from '@/lib/api'
import type { ApiResponse, WasteType, WasteCategory } from '@/types'
import { toast } from 'sonner'
import { Plus, Pencil, Search, ToggleLeft, ToggleRight, X, Loader2, Recycle } from 'lucide-react'

// ─── Paleta por categoría (alineada con NTP 900.058) ─────────────────────────
const CATEGORY = {
  ORGANIC:       { label: 'Orgánicos',       bg: 'bg-amber-50',   border: 'border-amber-200',  text: 'text-amber-800',  dot: '#92400e' },
  RECYCLABLE:    { label: 'Reciclables',      bg: 'bg-blue-50',    border: 'border-blue-200',   text: 'text-blue-800',   dot: '#1e40af' },
  NON_RECYCLABLE:{ label: 'No reciclables',  bg: 'bg-slate-100',  border: 'border-slate-300',  text: 'text-slate-700',  dot: '#334155' },
  HAZARDOUS:     { label: 'Peligrosos',       bg: 'bg-orange-50',  border: 'border-orange-200', text: 'text-orange-800', dot: '#c2410c' },
} as const

// Colores predeterminados sugeridos por categoría
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Recycle size={18} className="text-emerald-600" />
              Catálogo de residuos
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              RF-05 / RF-06 · {items.length} tipo(s) registrados · NTP 900.058
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg
                text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <Plus size={16} /> Nuevo tipo
            </button>
          )}
        </div>

        {/* Search + category filter */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar residuo o ejemplo..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-1">
            {(['ALL', 'ORGANIC', 'RECYCLABLE', 'NON_RECYCLABLE', 'HAZARDOUS'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'Todos' : CATEGORY[cat].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-slate-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Recycle size={40} className="text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">
              {search ? 'Sin resultados para tu búsqueda' : 'Sin tipos de residuos registrados'}
            </p>
            {isAdmin && !search && (
              <button onClick={openCreate} className="mt-2 text-emerald-600 text-sm hover:underline">
                Agregar el primer tipo
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((item) => {
              const cat = CATEGORY[item.category]
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 ${cat.bg} ${cat.border} relative ${
                    !item.isActive ? 'opacity-50' : ''
                  }`}
                >
                  {/* Color swatch + name */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-lg shrink-0 shadow-sm border border-white/50"
                      style={{ backgroundColor: item.colorCode }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm leading-tight ${cat.text}`}>
                        {item.name}
                      </p>
                      <span className={`text-xs font-medium ${cat.text} opacity-70`}>
                        {cat.label}
                      </span>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-0.5 -mt-0.5 -mr-0.5">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1 rounded hover:bg-white/60 text-slate-500"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleToggle(item)}
                          className="p-1 rounded hover:bg-white/60 text-slate-500"
                        >
                          {item.isActive
                            ? <ToggleRight size={14} />
                            : <ToggleLeft size={14} />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className={`text-xs mb-2 leading-relaxed ${cat.text} opacity-80`}>
                      {item.description}
                    </p>
                  )}

                  {/* Examples */}
                  <div className="flex flex-wrap gap-1">
                    {item.examples.slice(0, 4).map((ex, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full bg-white/60 text-slate-600 border border-white/50"
                      >
                        {ex}
                      </span>
                    ))}
                    {item.examples.length > 4 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 text-slate-400">
                        +{item.examples.length - 4}
                      </span>
                    )}
                  </div>

                  {/* Instructions */}
                  {item.instructions && (
                    <p className={`text-xs mt-2 pt-2 border-t border-white/40 ${cat.text} opacity-70`}>
                      {item.instructions}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <h2 className="font-semibold text-slate-900">
                {editItem ? 'Editar tipo de residuo' : 'Nuevo tipo de residuo'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Ej: Papel y cartón"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Categoría *</label>
                  <select
                    value={form.category}
                    onChange={(e) => {
                      const cat = e.target.value as WasteCategory
                      setForm({ ...form, category: cat, colorCode: DEFAULT_COLORS[cat] })
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {(Object.keys(CATEGORY) as WasteCategory[]).map((k) => (
                      <option key={k} value={k}>{CATEGORY[k].label}</option>
                    ))}
                  </select>
                </div>

                {/* Color code */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Color identificador *
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.colorCode}
                      onChange={(e) => setForm({ ...form, colorCode: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.colorCode}
                      onChange={(e) => setForm({ ...form, colorCode: e.target.value })}
                      placeholder="#000000"
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    placeholder="Descripción breve del tipo de residuo..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                {/* Examples */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Ejemplos * <span className="font-normal text-slate-400">(al menos uno)</span>
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={form.newExample}
                      onChange={(e) => setForm({ ...form, newExample: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExample() } }}
                      placeholder="Ej: Botella de plástico"
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={addExample}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {form.examples.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.examples.map((ex, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full
                            bg-slate-100 text-slate-700"
                        >
                          {ex}
                          <button
                            type="button"
                            onClick={() => removeExample(i)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Instrucciones de manejo
                  </label>
                  <textarea
                    value={form.instructions}
                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                    rows={2}
                    placeholder="¿Cómo debe depositarse este residuo?"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
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
