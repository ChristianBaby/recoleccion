'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api, ApiError } from '@/lib/api'
import type { ApiResponse, Zone } from '@/types'
import { toast } from 'sonner'
import { Users, MapPin, X, Loader2, Search, CheckCircle2, AlertCircle } from 'lucide-react'

interface UserRow {
  id: string
  email: string
  firstName: string
  lastName: string
  dni: string
  district: string | null
  role: string
  isActive: boolean
  isVerified: boolean
  zoneId: string | null
  zone: { id: string; name: string; district: string; color: string } | null
  createdAt: string
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  OPERATOR: 'Operador',
  CITIZEN: 'Ciudadano',
}

export default function UsersPage() {
  const { accessToken } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('CITIZEN')
  const [filterZone, setFilterZone] = useState<'all' | 'with' | 'without'>('all')
  const [assignModal, setAssignModal] = useState<UserRow | null>(null)
  const [selectedZoneId, setSelectedZoneId] = useState('')
  const [assigning, setAssigning] = useState(false)

  const fetchUsers = useCallback(async () => {
    if (!accessToken) return
    try {
      const params = new URLSearchParams()
      if (filterRole) params.set('role', filterRole)
      if (filterZone === 'with') params.set('hasZone', 'true')
      if (filterZone === 'without') params.set('hasZone', 'false')
      const res = await api.get<ApiResponse<UserRow[]>>(`/users?${params}`, accessToken)
      setUsers(res.data ?? [])
    } catch {
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }, [accessToken, filterRole, filterZone])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  useEffect(() => {
    if (!accessToken) return
    api.get<ApiResponse<Zone[]>>('/zones', accessToken)
      .then((r) => setZones((r.data ?? []).filter((z) => z.isActive)))
      .catch(() => {})
  }, [accessToken])

  async function handleAssign() {
    if (!assignModal || !accessToken) return
    setAssigning(true)
    try {
      await api.patch(
        `/users/${assignModal.id}/assign-zone`,
        { zoneId: selectedZoneId || null },
        accessToken,
      )
      toast.success(selectedZoneId ? 'Zona asignada. Se notificó al ciudadano por email.' : 'Zona removida.')
      setAssignModal(null)
      fetchUsers()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al asignar zona')
    } finally {
      setAssigning(false)
    }
  }

  function openAssign(user: UserRow) {
    setAssignModal(user)
    setSelectedZoneId(user.zoneId ?? '')
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return !q ||
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.dni.includes(q)
  })

  const withoutZone = users.filter((u) => u.role === 'CITIZEN' && !u.zoneId).length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-emerald-600" /> Gestión de usuarios
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              RF-04 · {users.length} usuario(s)
              {withoutZone > 0 && (
                <span className="ml-2 text-amber-600 font-medium">
                  · {withoutZone} ciudadano(s) sin zona asignada
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email o DNI…"
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none
              focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">Todos los roles</option>
            <option value="CITIZEN">Ciudadanos</option>
            <option value="OPERATOR">Operadores</option>
            <option value="ADMIN">Administradores</option>
          </select>

          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none
              focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="all">Todas las zonas</option>
            <option value="with">Con zona asignada</option>
            <option value="without">Sin zona asignada</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-slate-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <Users size={40} className="text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">Sin usuarios que coincidan</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Usuario</th>
                  <th className="text-left px-4 py-3">DNI</th>
                  <th className="text-left px-4 py-3">Rol</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-left px-4 py-3">Zona asignada</th>
                  <th className="text-left px-4 py-3">Distrito</th>
                  <th className="text-left px-4 py-3">Registro</th>
                  <th className="text-center px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{u.dni}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className={`inline-flex items-center gap-1 text-xs ${u.isVerified ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {u.isVerified ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                          {u.isVerified ? 'Verificado' : 'Sin verificar'}
                        </span>
                        <span className={`text-xs ${u.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {u.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.zone ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: u.zone.color }} />
                          <span className="text-slate-700 text-xs">{u.zone.name}</span>
                        </div>
                      ) : (
                        <span className="text-amber-500 text-xs font-medium flex items-center gap-1">
                          <AlertCircle size={11} /> Sin zona
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{u.district ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openAssign(u)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium
                          text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg
                          transition-colors mx-auto"
                      >
                        <MapPin size={11} /> Asignar zona
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign zone modal */}
      {assignModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">Asignar zona</h2>
              <button onClick={() => setAssignModal(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-900">{assignModal.firstName} {assignModal.lastName}</p>
                <p className="text-xs text-slate-500">{assignModal.email}</p>
                {assignModal.district && (
                  <p className="text-xs text-slate-500 mt-0.5">Distrito declarado: <strong>{assignModal.district}</strong></p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Zona de recolección
                </label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">Sin zona asignada</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} — {z.district}
                    </option>
                  ))}
                </select>
              </div>

              {selectedZoneId && (
                <p className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                  Se enviará un email de notificación al ciudadano informando la zona asignada.
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setAssignModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg
                  hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {assigning && <Loader2 size={14} className="animate-spin" />}
                Confirmar asignación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
