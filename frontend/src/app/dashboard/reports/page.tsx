'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import type { ApiResponse, Zone } from '@/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  BarChart2,
  Download,
  Filter,
  Loader2,
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Trash2,
  Route,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WasteZone {
  zoneId: string
  zoneName: string
  district: string
  color: string
  executions: number
  categories: { category: string; name: string; colorCode: string; count: number }[]
}

interface ComplianceRoute {
  routeId: string
  routeName: string
  zone: { id: string; name: string; color: string }
  operator: { id: string; firstName: string; lastName: string } | null
  vehicle: { id: string; plate: string; type: string } | null
  dayOfWeek: number[]
  totalExecutions: number
  completed: number
  delayed: number
  cancelled: number
  inProgress: number
  compliancePct: number
  avgDelayMinutes: number
}

interface ParticipationData {
  summary: { totalCitizens: number; totalIncidents: number }
  byZone: {
    zoneId: string
    zoneName: string
    district: string
    color: string
    citizenCount: number
    incidents: { total: number; open: number; resolved: number; byType: Record<string, number> }
  }[]
}

// ─── CSV helper ───────────────────────────────────────────────────────────────

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const lines = [headers, ...rows].map((r) =>
    r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','),
  )
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  color = 'emerald',
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
      <BarChart2 size={32} className="opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ─── Tab: RF-14 Residuos por zona ────────────────────────────────────────────

function WasteTab({
  zones,
  accessToken,
  from,
  to,
  zoneId,
}: {
  zones: Zone[]
  accessToken: string
  from: string
  to: string
  zoneId: string
}) {
  const [data, setData] = useState<WasteZone[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (zoneId) params.set('zoneId', zoneId)
    api
      .get<ApiResponse<WasteZone[]>>(`/reports/waste-by-zone?${params}`, accessToken)
      .then((r) => setData(r.data ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [accessToken, from, to, zoneId])

  useEffect(() => { load() }, [load])

  const totalExecutions = data.reduce((s, z) => s + z.executions, 0)
  const mostActive = data.reduce<WasteZone | null>(
    (best, z) => (!best || z.executions > best.executions ? z : best),
    null,
  )

  const chartData = data.map((z) => ({ name: z.zoneName, Ejecuciones: z.executions, fill: z.color }))

  function handleExport() {
    const rows = data.flatMap((z) =>
      z.categories.length > 0
        ? z.categories.map((c) => [z.zoneName, z.district, String(z.executions), c.name, c.category, String(c.count)])
        : [[z.zoneName, z.district, String(z.executions), '—', '—', '0']],
    )
    downloadCSV('residuos_por_zona.csv', rows, ['Zona', 'Distrito', 'Ejecuciones', 'Tipo Residuo', 'Categoría', 'Conteo'])
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon={<Route size={18} />} label="Total ejecuciones" value={totalExecutions} color="emerald" />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Zona más activa"
          value={mostActive?.zoneName ?? '—'}
          sub={mostActive ? `${mostActive.executions} ejecuciones` : undefined}
          color="blue"
        />
        <StatCard icon={<Trash2 size={18} />} label="Zonas monitoreadas" value={data.length} color="amber" />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Ejecuciones de rutas por zona</h3>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600
              border border-slate-200 rounded-lg px-3 py-1.5 transition-colors hover:border-emerald-300"
          >
            <Download size={13} /> Exportar CSV
          </button>
        </div>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-slate-300" />
          </div>
        ) : totalExecutions === 0 ? (
          <EmptyChart message="Sin ejecuciones registradas en el período seleccionado" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="Ejecuciones" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Detail table */}
      {data.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Zona</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Distrito</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ejecuciones</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipos de residuo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((z) => (
                <tr key={z.zoneId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: z.color }} />
                      <span className="font-medium text-slate-800">{z.zoneName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{z.district}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{z.executions}</td>
                  <td className="px-4 py-3">
                    {z.categories.length === 0 ? (
                      <span className="text-slate-400 text-xs">Sin datos</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {z.categories.map((c) => (
                          <span
                            key={c.category}
                            className="px-2 py-0.5 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: c.colorCode }}
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Tab: RF-15 Cumplimiento de rutas ────────────────────────────────────────

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function ComplianceTab({
  accessToken,
  from,
  to,
  zoneId,
}: {
  accessToken: string
  from: string
  to: string
  zoneId: string
}) {
  const [data, setData] = useState<ComplianceRoute[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (zoneId) params.set('zoneId', zoneId)
    api
      .get<ApiResponse<ComplianceRoute[]>>(`/reports/route-compliance?${params}`, accessToken)
      .then((r) => setData(r.data ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [accessToken, from, to, zoneId])

  useEffect(() => { load() }, [load])

  const totalRoutes = data.length
  const totalExec = data.reduce((s, r) => s + r.totalExecutions, 0)
  const avgCompliance =
    totalExec > 0
      ? Math.round(data.reduce((s, r) => s + r.compliancePct * r.totalExecutions, 0) / totalExec)
      : 0

  // Chart: top 15 routes by compliance (or all if fewer)
  const chartData = data.slice(0, 15).map((r) => ({
    name: r.routeName.length > 12 ? r.routeName.slice(0, 12) + '…' : r.routeName,
    Cumplimiento: r.compliancePct,
    fill: r.zone?.color ?? '#64748b',
  }))

  function handleExport() {
    const rows = data.map((r) => [
      r.routeName,
      r.zone?.name ?? '',
      r.operator ? `${r.operator.firstName} ${r.operator.lastName}` : '',
      r.vehicle?.plate ?? '',
      String(r.totalExecutions),
      String(r.completed),
      String(r.delayed),
      String(r.cancelled),
      `${r.compliancePct}%`,
      String(r.avgDelayMinutes),
    ])
    downloadCSV('cumplimiento_rutas.csv', rows, [
      'Ruta', 'Zona', 'Operador', 'Vehículo',
      'Total Ejec.', 'Completadas', 'Con Retraso', 'Canceladas', 'Cumplimiento %', 'Retraso Promedio (min)',
    ])
  }

  function complianceColor(pct: number) {
    if (pct >= 80) return 'text-emerald-600 bg-emerald-50'
    if (pct >= 50) return 'text-amber-600 bg-amber-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon={<Route size={18} />} label="Rutas activas" value={totalRoutes} color="blue" />
        <StatCard icon={<CheckCircle2 size={18} />} label="% Cumplimiento global" value={totalExec > 0 ? `${avgCompliance}%` : '—'} color="emerald" />
        <StatCard icon={<TrendingUp size={18} />} label="Ejecuciones totales" value={totalExec} sub="En el período" color="amber" />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">% Cumplimiento por ruta</h3>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600
              border border-slate-200 rounded-lg px-3 py-1.5 transition-colors hover:border-emerald-300"
          >
            <Download size={13} /> Exportar CSV
          </button>
        </div>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-slate-300" />
          </div>
        ) : totalExec === 0 ? (
          <EmptyChart message="Sin ejecuciones registradas — el gráfico se actualizará cuando los operadores inicien rutas" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
              <Tooltip
                formatter={(val) => [`${val}%`, 'Cumplimiento']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="Cumplimiento" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Table */}
      {data.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Ruta</th>
                <th className="text-left px-4 py-3">Zona</th>
                <th className="text-left px-4 py-3">Días</th>
                <th className="text-right px-4 py-3">Ejec.</th>
                <th className="text-right px-4 py-3">Compl.</th>
                <th className="text-right px-4 py-3">Retraso prom.</th>
                <th className="text-center px-4 py-3">Cumplimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((r) => (
                <tr key={r.routeId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{r.routeName}</p>
                    {r.operator && (
                      <p className="text-xs text-slate-400">
                        👤 {r.operator.firstName} {r.operator.lastName}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.zone?.color }} />
                      <span className="text-slate-600 text-xs">{r.zone?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-0.5 flex-wrap">
                      {r.dayOfWeek.map((d) => (
                        <span key={d} className="text-xs px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                          {DAY_NAMES[d]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{r.totalExecutions}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{r.completed}</td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {r.avgDelayMinutes > 0 ? `${r.avgDelayMinutes} min` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${complianceColor(r.compliancePct)}`}
                    >
                      {r.totalExecutions === 0 ? 'Sin datos' : `${r.compliancePct}%`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Tab: RF-16 Participación ciudadana ──────────────────────────────────────

const INCIDENT_LABELS: Record<string, string> = {
  WASTE_ACCUMULATION: 'Acumulación',
  DAMAGED_CONTAINER: 'Contenedor dañado',
  MISSED_COLLECTION: 'Recolección perdida',
  OTHER: 'Otro',
}

function ParticipationTab({
  accessToken,
  from,
  to,
  zoneId,
}: {
  accessToken: string
  from: string
  to: string
  zoneId: string
}) {
  const [data, setData] = useState<ParticipationData | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (zoneId) params.set('zoneId', zoneId)
    api
      .get<ApiResponse<ParticipationData>>(`/reports/citizen-participation?${params}`, accessToken)
      .then((r) => setData(r.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [accessToken, from, to, zoneId])

  useEffect(() => { load() }, [load])

  const byZone = data?.byZone ?? []
  const chartData = byZone.map((z) => ({
    name: z.zoneName,
    Ciudadanos: z.citizenCount,
    Incidencias: z.incidents.total,
    fill: z.color,
  }))

  function handleExport() {
    const rows = byZone.map((z) => [
      z.zoneName,
      z.district,
      String(z.citizenCount),
      String(z.incidents.total),
      String(z.incidents.open),
      String(z.incidents.resolved),
    ])
    downloadCSV('participacion_ciudadana.csv', rows, [
      'Zona', 'Distrito', 'Ciudadanos', 'Total Incidencias', 'Abiertas', 'Resueltas',
    ])
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard
              icon={<Users size={18} />}
              label="Ciudadanos registrados"
              value={data?.summary.totalCitizens ?? 0}
              sub="Usuarios activos"
              color="blue"
            />
            <StatCard
              icon={<AlertTriangle size={18} />}
              label="Total incidencias"
              value={data?.summary.totalIncidents ?? 0}
              sub="Reportadas"
              color="amber"
            />
            <StatCard
              icon={<CheckCircle2 size={18} />}
              label="Resueltas"
              value={byZone.reduce((s, z) => s + z.incidents.resolved, 0)}
              sub="Cerradas o resueltas"
              color="emerald"
            />
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700">Ciudadanos e incidencias por zona</h3>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600
                  border border-slate-200 rounded-lg px-3 py-1.5 transition-colors hover:border-emerald-300"
              >
                <Download size={13} /> Exportar CSV
              </button>
            </div>
            {byZone.length === 0 ? (
              <EmptyChart message="Sin datos de participación" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Ciudadanos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Incidencias" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Table */}
          {byZone.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Zona</th>
                    <th className="text-right px-4 py-3">Ciudadanos</th>
                    <th className="text-right px-4 py-3">Incidencias</th>
                    <th className="text-right px-4 py-3">Abiertas</th>
                    <th className="text-right px-4 py-3">Resueltas</th>
                    <th className="text-left px-4 py-3">Por tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {byZone.map((z) => (
                    <tr key={z.zoneId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.color }} />
                          <span className="font-medium text-slate-800">{z.zoneName}</span>
                        </div>
                        <p className="text-xs text-slate-400 pl-4">{z.district}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-600">{z.citizenCount}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">{z.incidents.total}</td>
                      <td className="px-4 py-3 text-right text-amber-600">{z.incidents.open}</td>
                      <td className="px-4 py-3 text-right text-emerald-600">{z.incidents.resolved}</td>
                      <td className="px-4 py-3">
                        {Object.keys(z.incidents.byType).length === 0 ? (
                          <span className="text-slate-300 text-xs">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(z.incidents.byType).map(([type, count]) => (
                              <span
                                key={type}
                                className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded"
                              >
                                {INCIDENT_LABELS[type] ?? type}: {count}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type TabKey = 'waste' | 'compliance' | 'participation'

const TABS: { key: TabKey; label: string; rf: string }[] = [
  { key: 'waste', label: 'Residuos por zona', rf: 'RF-14' },
  { key: 'compliance', label: 'Cumplimiento de rutas', rf: 'RF-15' },
  { key: 'participation', label: 'Participación ciudadana', rf: 'RF-16' },
]

export default function ReportsPage() {
  const { accessToken } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('waste')
  const [zones, setZones] = useState<Zone[]>([])

  // Default date range: last 30 days
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  const [from, setFrom] = useState(fmt(thirtyDaysAgo))
  const [to, setTo] = useState(fmt(today))
  const [zoneId, setZoneId] = useState('')

  useEffect(() => {
    if (!accessToken) return
    api
      .get<ApiResponse<Zone[]>>('/zones', accessToken)
      .then((r) => setZones((r.data ?? []).filter((z) => z.isActive)))
      .catch(() => {})
  }, [accessToken])

  if (!accessToken) return null

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
        <p className="text-slate-500 text-sm mt-1">
          Análisis de recolección de residuos, cumplimiento de rutas y participación ciudadana
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-slate-500 shrink-0">
          <Filter size={15} />
          <span className="text-sm font-medium">Filtros:</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none
              focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none
              focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Zona</label>
          <select
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none
              focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todas las zonas</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm
              font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                activeTab === tab.key
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {tab.rf}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'waste' && (
        <WasteTab zones={zones} accessToken={accessToken} from={from} to={to} zoneId={zoneId} />
      )}
      {activeTab === 'compliance' && (
        <ComplianceTab accessToken={accessToken} from={from} to={to} zoneId={zoneId} />
      )}
      {activeTab === 'participation' && (
        <ParticipationTab accessToken={accessToken} from={from} to={to} zoneId={zoneId} />
      )}
    </div>
  )
}
