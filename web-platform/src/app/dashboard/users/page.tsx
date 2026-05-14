'use client';

import { useApi } from '@/hooks/useApi';
import { useEffect, useState } from 'react';
import { Search, Filter, UserPlus, MoreHorizontal, UserCheck, UserX, MapPin, Users } from 'lucide-react';

interface UserData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  dni: string;
  role: string;
  phone?: string;
  isActive: boolean;
  zone?: { name: string; district: string };
  createdAt: string;
}

const roleBadge: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: 'Admin', color: 'text-rose-600', bg: 'bg-rose-50' },
  operator: { label: 'Operador', color: 'text-amber-600', bg: 'bg-amber-50' },
  citizen: { label: 'Ciudadano', color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

export default function UsersPage() {
  const { apiFetch } = useApi();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (roleFilter) params.set('role', roleFilter);
        const data = await apiFetch(`/api/v1/users?${params}`);
        setUsers(data.data.users);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [apiFetch, search, roleFilter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admin: users.filter(u => u.role === 'admin').length,
      operator: users.filter(u => u.role === 'operator').length,
      citizen: users.filter(u => u.role === 'citizen').length,
    };
  }, [users]);

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Gestión de Usuarios</h1>
          <p className="text-slate-500 mt-2 font-medium text-lg">Administra ciudadanos, operadores y administradores del sistema.</p>
        </div>
        <button className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-emerald-600/20 active:scale-95">
          <UserPlus className="w-5 h-5" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Quick Stats Mini-grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Admins', value: stats.admin, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Operadores', value: stats.operator, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Ciudadanos', value: stats.citizen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((s) => (
          <div key={s.label} className={`p-4 rounded-3xl ${s.bg} border border-slate-100 flex flex-col items-center justify-center text-center transition-transform hover:scale-105`}>
            <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-5">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o DNI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent text-sm font-bold text-slate-700 focus:bg-white focus:border-emerald-500/20 transition-all placeholder:text-slate-300"
          />
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-12 pr-10 py-4 rounded-2xl bg-slate-50 border-2 border-transparent text-xs font-black text-slate-600 focus:bg-white focus:border-emerald-500/20 appearance-none transition-all cursor-pointer uppercase tracking-widest"
            >
              <option value="">Todos los roles</option>
              <option value="admin">Administradores</option>
              <option value="operator">Operadores</option>
              <option value="citizen">Ciudadanos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="w-16 h-16 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Sincronizando Usuarios...</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  {['Usuario', 'Identificación', 'Rol', 'Zona Asignada', 'Estado', 'Acciones'].map((h) => (
                    <th key={h} className="px-8 py-6 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u, idx) => (
                  <tr 
                    key={u._id} 
                    className="hover:bg-slate-50/50 transition-all duration-300 group"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-black text-sm border border-white shadow-sm transition-transform group-hover:scale-110">
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <div>
                          <div className="text-[15px] font-black text-slate-900 leading-none tracking-tight">{u.firstName} {u.lastName}</div>
                          <div className="text-xs font-bold text-slate-400 mt-1.5">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col">
                         <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">DNI</span>
                         <span className="text-sm font-bold text-slate-700">{u.dni}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${roleBadge[u.role]?.bg} ${roleBadge[u.role]?.color} border-current opacity-80`}>
                        {roleBadge[u.role]?.label}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {u.zone ? (
                        <div className="flex items-center gap-2 group/zone">
                          <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover/zone:bg-emerald-50 group-hover/zone:text-emerald-500 transition-colors">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-700 block leading-none">{u.zone.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1 block">{u.zone.district}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-300 italic">
                          <div className="w-8 h-8 rounded-full border border-dashed border-slate-200 flex items-center justify-center">
                             <MoreHorizontal className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold">Sin zona</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl border ${u.isActive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{u.isActive ? 'Activo' : 'Inactivo'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <button className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white hover:shadow-xl border border-transparent hover:border-slate-100 transition-all text-slate-400 hover:text-emerald-600 group/btn">
                        <MoreHorizontal className="w-5 h-5 group-hover/btn:rotate-90 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-32">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200">
                          <Users className="w-10 h-10" />
                        </div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Sin resultados encontrados</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Footer Actions */}
        <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total registros: {users.length}</p>
          <div className="flex gap-3">
            <button className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 bg-white text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all" disabled>Anterior</button>
            <button className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 bg-white text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all" disabled>Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}
