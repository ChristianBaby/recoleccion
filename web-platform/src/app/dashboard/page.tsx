'use client';

import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useEffect, useState } from 'react';
import { 
  Users, 
  Map as MapIcon, 
  Truck, 
  Recycle, 
  Car,
  Settings,
  Shield,
  Database,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Stats {
  users: number;
  zones: number;
  routes: number;
  vehicles: number;
  wasteTypes: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { apiFetch } = useApi();
  const [stats, setStats] = useState<Stats>({ users: 0, zones: 0, routes: 0, vehicles: 0, wasteTypes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [zones, routes, vehicles, wasteTypes] = await Promise.all([
          apiFetch('/api/v1/zones'),
          apiFetch('/api/v1/routes'),
          apiFetch('/api/v1/vehicles'),
          apiFetch('/api/v1/waste-types'),
        ]);

        let userCount = 0;
        if (user?.role === 'admin') {
          try {
            const users = await apiFetch('/api/v1/users');
            userCount = users.data.meta?.total || users.data.users?.length || 0;
          } catch { userCount = 0; }
        }

        setStats({
          users: userCount,
          zones: zones.data?.length || 0,
          routes: routes.data?.length || 0,
          vehicles: vehicles.data?.length || 0,
          wasteTypes: wasteTypes.data?.length || 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [apiFetch, user]);

  const cards = [
    { label: 'Zonas', value: stats.zones, icon: MapIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Rutas', value: stats.routes, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Vehículos', value: stats.vehicles, icon: Car, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Tipos Residuos', value: stats.wasteTypes, icon: Recycle, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  ];

  if (user?.role === 'admin') {
    cards.unshift({ label: 'Usuarios', value: stats.users, icon: Users, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100' });
  }

  return (
    <div className="space-y-12 animate-fade-in pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">{user?.firstName}</span> 👋
          </h1>
          <p className="text-slate-500 mt-3 text-lg font-medium max-w-2xl">
            Bienvenido al panel de control de <span className="text-emerald-600 font-bold">EcoRutas</span>. Gestiona la recolección de residuos de forma eficiente.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 py-2 bg-emerald-50 rounded-xl text-emerald-700 text-sm font-bold border border-emerald-100">
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${cards.length === 5 ? 'xl:grid-cols-5' : 'xl:grid-cols-4'} gap-6`}>
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="relative group bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-2 overflow-hidden"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${card.bg}`} />
              
              <div className="flex items-center justify-between mb-6 relative">
                <div className={`p-4 rounded-2xl ${card.bg} ${card.color} border ${card.border} transition-transform group-hover:scale-110 duration-500`}>
                  <Icon className="w-7 h-7" />
                </div>
                {loading ? (
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                ) : (
                  <div className="text-right">
                    <span className={`text-4xl font-black ${card.color} tracking-tighter`}>
                      {card.value}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] relative">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Status System - 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50" />
          
          <div className="flex items-center justify-between mb-10 relative">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-200">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Estado del Sistema</h2>
                <p className="text-slate-400 text-sm font-medium">Monitoreo de servicios core</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Operativo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
            {[
              { label: 'Rastreo GPS', desc: 'Conexión satelital activa', status: 'Activo', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
              { label: 'Notificaciones', desc: 'Push & Email Gateway', status: 'Online', icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
              { label: 'Base de Datos', desc: 'MongoDB Atlas Cluster', status: 'Sincronizada', icon: Database, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
              { label: 'Seguridad SSL', desc: 'Encriptación AES-256', status: 'Protegido', icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
            ].map((item) => (
              <div key={item.label} className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100 group transition-all hover:bg-white hover:shadow-md hover:border-slate-200">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${item.bg} ${item.color} border ${item.border}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${item.bg} ${item.color} border ${item.border}`}>
                    {item.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">{item.label}</h3>
                <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Credentials - 2 cols */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-slate-900/20 text-white relative overflow-hidden group">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500 rounded-full -mb-32 -mr-32 opacity-10 group-hover:opacity-20 transition-opacity blur-3xl" />
          
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Acceso Demo</h2>
              <p className="text-slate-400 text-sm font-medium">Entorno de pruebas</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { role: 'Administrador', email: 'admin@residuos.cusco.gob.pe', pass: 'admin123', color: 'bg-rose-500' },
              { role: 'Operador', email: 'operador@residuos.cusco.gob.pe', pass: 'operator123', color: 'bg-amber-500' },
              { role: 'Ciudadano', email: 'ciudadano@gmail.com', pass: 'citizen123', color: 'bg-emerald-500' },
            ].map((cred) => (
              <div key={cred.role} className="p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${cred.color} shadow-[0_0_8px] shadow-current`} />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-300">{cred.role}</span>
                  </div>
                  <code className="text-[10px] font-black bg-white/10 text-white px-2.5 py-1 rounded-lg border border-white/5">{cred.pass}</code>
                </div>
                <p className="text-sm font-bold text-slate-100 truncate">{cred.email}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-start gap-4 p-5 bg-white/5 rounded-3xl border border-white/5">
            <AlertCircle className="w-6 h-6 text-emerald-400 shrink-0" />
            <p className="text-xs font-medium text-slate-300 leading-relaxed">
              Use estas credenciales para explorar las diferentes funcionalidades del sistema según el rol del usuario.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
