'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Leaf, MapPin, Activity, Clock, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, login, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMsg('');
    try {
      const res = await fetch('/api/v1/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSeedMsg('Base de datos inicializada correctamente.');
      } else {
        setSeedMsg('Error: ' + data.error?.message);
      }
    } catch {
      setSeedMsg('Error de conexión');
    } finally {
      setSeeding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      {/* Panel Izquierdo - Branding & Info */}
      <div className="relative flex-[1.2] flex flex-col items-center justify-center px-8 py-20 lg:px-20 overflow-hidden bg-slate-50">
        {/* Abstract Gradient Mesh */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
          <div className="absolute top-[-10%] left-[-5%] w-[70%] h-[70%] rounded-full bg-emerald-200/50 blur-[120px]" />
          <div className="absolute bottom-[-5%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-100/50 blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-3xl w-full animate-fade-in">
          <div className="inline-flex items-center gap-3 p-2 pr-6 rounded-full bg-white shadow-sm border border-emerald-100 mb-12">
            <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Leaf className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-800">Sostenibilidad Urbana</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight mb-8 text-slate-900 leading-[0.9]">
            EcoRutas <br />
            <span className="text-emerald-600">Cusco</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-slate-500 font-semibold leading-relaxed mb-16 max-w-2xl">
            Gestión inteligente de residuos. <br className="hidden sm:block" />
            <span className="text-slate-400">Eficiencia tecnológica para una ciudad más limpia.</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[
              { icon: MapPin, title: 'Geolocalización', desc: 'Monitoreo de rutas y zonas' },
              { icon: Clock, title: 'Tiempo Real', desc: 'Tracking de flota en vivo' },
              { icon: Activity, title: 'Optimización', desc: 'Máxima eficiencia operativa' },
              { icon: ShieldCheck, title: 'Trazabilidad', desc: 'Reportes y analítica avanzada' },
            ].map((Feature, i) => (
              <div key={i} className="flex items-center gap-5 group">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/60 shadow-sm transition-all group-hover:scale-110 group-hover:border-emerald-300 group-hover:shadow-md">
                  <Feature.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm">{Feature.title}</h3>
                  <p className="text-sm text-slate-400 font-bold">{Feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel Derecho - Formulario de Acceso */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-20 relative z-10 bg-white lg:border-l border-slate-100">
        <div className="w-full max-w-md animate-fade-in">
          
          <div className="mb-12">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-3">Bienvenido</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accede al panel administrativo</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@cusco.gob.pe"
                required
                className="w-full px-6 py-5 rounded-2xl bg-slate-50 border-2 border-transparent text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-emerald-500/30 transition-all font-bold"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Contraseña</label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-6 py-5 rounded-2xl bg-slate-50 border-2 border-transparent text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-emerald-500/30 transition-all font-bold"
              />
            </div>

            {error && (
              <div className="flex items-center gap-3 p-5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-black uppercase tracking-tighter animate-shake">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black text-sm uppercase tracking-[0.2em] transition-all hover:shadow-2xl hover:shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Entrar al sistema
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Seed Action - Developer Only */}
          <div className="mt-16 pt-10 border-t border-slate-50 flex flex-col items-center">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="text-[10px] font-black text-slate-300 hover:text-emerald-500 uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              {seeding ? 'Inicializando...' : 'Click aquí para inicializar base de datos de prueba'}
            </button>
            {seedMsg && (
              <p className="mt-4 text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 animate-fade-in">
                {seedMsg}
              </p>
            )}
          </div>

          <div className="mt-12 flex flex-col items-center gap-1">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
               Municipalidad del Cusco
             </p>
             <p className="text-[9px] font-bold text-slate-200">
               © 2026 Gestión Ambiental
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
