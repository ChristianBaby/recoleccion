'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api, ApiError } from '@/lib/api'
import type { ApiResponse, Zone } from '@/types'
import { toast } from 'sonner'
import {
  Users, MapPin, X, Loader2, Search,
  CheckCircle2, AlertCircle, UserPlus, Eye, EyeOff, ToggleLeft, ToggleRight,
} from 'lucide-react'

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

interface CreateUserForm {
  firstName: string
  lastName: string
  email: string
  dni: string
  phone: string
  password: string
  role: 'OPERATOR' | 'ADMIN'
}

const EMPTY_CREATE: CreateUserForm = {
  firstName: '', lastName: '', email: '', dni: '', phone: '', password: '', role: 'OPERATOR',
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  OPERATOR: 'Operador',
  CITIZEN: 'Ciudadano',
}

// ─── Create Staff Modal ───────────────────────────────────────────────────────

function CreateUserModal({
  onClose,
  onCreated,
  accessToken,
}: {
  onClose: () => void
  onCreated: () => void
  accessToken: string
}) {
  const [form, setForm] = useState<CreateUserForm>(EMPTY_CREATE)
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = (field: keyof CreateUserForm, value: string) =>
    setForm((p) => ({ ...p, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }
    setSaving(true)
    try {
      const body = {
        ...form,
        phone: form.phone.trim() || undefined,
      }
      await api.post('/users', body, accessToken)
      toast.success(`${ROLE_LABELS[form.role]} creado exitosamente`)
      onCreated()
      onClose()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al crear usuario')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <UserPlus size={16} className="text-emerald-600" />
            Crear usuario de personal
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Role selector */}
          <div className="flex gap-3">
            {(['OPERATOR', 'ADMIN'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => set('role', r)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  form.role === r
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                }`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">
                Nombres <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                placeholder="Juan Carlos"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">
                Apellidos <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                placeholder="Mamani Quispe"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-700 mb-1 block">
                Correo electrónico <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="operador@municipalidad.gob.pe"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">
                DNI <span className="text-red-500">*</span>
              </label>
              <input
                required
                maxLength={8}
                minLength={8}
                pattern="[0-9]{8}"
                value={form.dni}
                onChange={(e) => set('dni', e.target.value.replace(/\D/g, ''))}
                placeholder="12345678"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Teléfono</label>
              <input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="987654321"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-700 mb-1 block">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  required
                  type={showPass ? 'text' : 'password'}
                  minLength={8}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-10 text-sm
                    focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                    hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                El usuario podrá cambiar su contraseña desde su perfil.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg
                hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600
                hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors
                flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Crear {ROLE_LABELS[form.role].toLowerCase()}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

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

  async function handleToggleActive(user: UserRow) {
    if (!accessToken) return
    setTogglingId(user.id)
    try {
      await api.patch(`/users/${user.id}/toggle-active`, {}, accessToken)
      toast.success(user.isActive ? 'Usuario desactivado' : 'Usuario activado')
      fetchUsers()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al cambiar estado')
    } finally {
      setTogglingId(null)
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
              {users.length} usuario(s)
              {withoutZone > 0 && (
                <span className="ml-2 text-amber-600 font-medium">
                  · {withoutZone} ciudadano(s) sin zona asignada
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white
              rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <UserPlus size={15} /> Crear usuario
          </button>
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
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold
                  text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Usuario</th>
                  <th className="text-left px-4 py-3">DNI</th>
                  <th className="text-left px-4 py-3">Rol</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-left px-4 py-3">Zona asignada</th>
                  <th className="text-left px-4 py-3">Distrito</th>
                  <th className="text-left px-4 py-3">Registro</th>
                  <th className="text-center px-4 py-3">Acciones</th>
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
                        <span className={`inline-flex items-center gap-1 text-xs
                          ${u.isVerified ? 'text-emerald-600' : 'text-amber-500'}`}>
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
                          <div className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: u.zone.color }} />
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
                      {new Date(u.createdAt).toLocaleDateString('es-PE',
                        { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-center">
                        {/* Assign zone — only for CITIZEN */}
                        {u.role === 'CITIZEN' && (
                          <button
                            onClick={() => openAssign(u)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium
                              text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg
                              transition-colors"
                            title="Asignar zona"
                          >
                            <MapPin size={11} /> Zona
                          </button>
                        )}
                        {/* Toggle active */}
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={togglingId === u.id}
                          className={`inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium
                            rounded-lg transition-colors disabled:opacity-50 ${
                            u.isActive
                              ? 'text-red-600 bg-red-50 hover:bg-red-100'
                              : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                          }`}
                          title={u.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {togglingId === u.id
                            ? <Loader2 size={11} className="animate-spin" />
                            : u.isActive ? <ToggleRight size={11} /> : <ToggleLeft size={11} />}
                          {u.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create user modal */}
      {showCreateModal && accessToken && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchUsers}
          accessToken={accessToken}
        />
      )}

      {/* Assign zone modal */}
      {assignModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">Asignar zona</h2>
              <button
                onClick={() => setAssignModal(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-900">
                  {assignModal.firstName} {assignModal.lastName}
                </p>
                <p className="text-xs text-slate-500">{assignModal.email}</p>
                {assignModal.district && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Distrito declarado: <strong>{assignModal.district}</strong>
                  </p>
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
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300
                  rounded-lg hover:bg-slate-50"
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
