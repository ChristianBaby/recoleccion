'use client';

import { useApi } from '@/hooks/useApi';
import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { 
  Truck, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Calendar, 
  User, 
  Route as RouteIcon,
  Search,
  CheckCircle2,
  Clock3
} from 'lucide-react';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(m => m.Polyline), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(m => m.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const Polygon = dynamic(() => import('react-leaflet').then(m => m.Polygon), { ssr: false });

interface RouteData {
  _id: string;
  name: string;
  status: string;
  zone: { _id: string; name: string; district: string; color: string; geometry?: { coordinates: number[][][] } };
  vehicle: { plate: string; type: string };
  operator: { firstName: string; lastName: string; email: string };
  wasteTypes: { name: string; category: string; colorCode: string }[];
  schedule: { dayOfWeek: number[]; startTime: string; estimatedDuration: number };
  waypoints: { order: number; name: string; location: { coordinates: [number, number] }; estimatedArrival: string }[];
  path: { coordinates: number[][] };
}

const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const statusStyles: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Activa', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  draft: { label: 'Borrador', color: 'text-amber-600', bg: 'bg-amber-50' },
  inactive: { label: 'Inactiva', color: 'text-rose-600', bg: 'bg-rose-50' },
};

export default function RoutesPage() {
  const { apiFetch } = useApi();
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => { import('leaflet/dist/leaflet.css').then(() => setLeafletLoaded(true)); }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch('/api/v1/routes');
        setRoutes(data.data);
        if (data.data.length > 0) setSelectedRoute(data.data[0]._id);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [apiFetch]);

  const activeRoute = useMemo(() => routes.find(r => r._id === selectedRoute), [routes, selectedRoute]);
  const mapCenter = useMemo(() => [-13.52, -71.967] as [number, number], []);

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Rutas de Recolección</h1>
          <p className="text-slate-500 mt-2 font-medium text-lg">Planificación estratégica y control de itinerarios logísticos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar - Route list */}
        <div className="lg:col-span-4 space-y-5 max-h-[850px] overflow-y-auto pr-3 custom-scrollbar scroll-smooth">
          <div className="sticky top-0 bg-[#FBFDFF]/80 backdrop-blur-md pb-4 z-20">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar ruta específica..." 
                className="w-full pl-12 pr-4 py-3.5 rounded-[1.25rem] bg-white border border-slate-200 text-sm font-bold text-slate-700 focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sincronizando itinerarios...</p>
            </div>
          ) : routes.map((route, idx) => (
            <button
              key={route._id}
              onClick={() => setSelectedRoute(route._id)}
              className={`w-full text-left rounded-[2rem] p-6 transition-all duration-500 border-2 group relative overflow-hidden ${
                selectedRoute === route._id 
                  ? 'bg-white border-emerald-500 shadow-xl shadow-emerald-500/10 ring-8 ring-emerald-500/5 translate-x-2' 
                  : 'bg-white border-white hover:border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1'
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {selectedRoute === route._id && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500 rounded-full -mr-12 -mt-12 opacity-5 transition-opacity" />
              )}
              
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-black text-sm tracking-tight transition-colors ${selectedRoute === route._id ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {route.name}
                </h3>
                <span className={`text-[9px] font-black px-3 py-1 rounded-xl uppercase tracking-widest border ${statusStyles[route.status]?.bg} ${statusStyles[route.status]?.color} border-current opacity-80`}>
                  {statusStyles[route.status]?.label}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-4 mb-5">
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-white transition-colors">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">{route.vehicle?.plate}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-white transition-colors">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">{route.operator?.firstName[0]}. {route.operator?.lastName}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50 relative">
                <div className="flex items-center gap-1.5">
                  {route.schedule.dayOfWeek.map(d => (
                    <span key={d} className="text-[9px] font-black w-7 h-6 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover:bg-white transition-all border border-transparent group-hover:border-slate-100">
                      {dayLabels[d]}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-emerald-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-black tracking-widest">{route.schedule.startTime}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Main Content - Map + details */}
        <div className="lg:col-span-8 space-y-8">
          {/* Map Card */}
          <div className="bg-white rounded-[2.5rem] p-5 shadow-sm border border-slate-100 overflow-hidden relative group">
            <div className="relative h-[500px] w-full rounded-[2rem] overflow-hidden border border-slate-50 shadow-inner bg-slate-50">
              {leafletLoaded && !loading ? (
                <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {activeRoute?.zone?.geometry && (
                    <Polygon
                      positions={activeRoute.zone.geometry.coordinates[0].map(c => [c[1], c[0]] as [number, number])}
                      pathOptions={{ color: activeRoute.zone.color, fillOpacity: 0.08, weight: 3, dashArray: '10,10' }}
                    />
                  )}
                  {activeRoute?.path?.coordinates && activeRoute.path.coordinates.length > 0 && (
                    <Polyline
                      positions={activeRoute.path.coordinates.map(c => [c[1], c[0]] as [number, number])}
                      pathOptions={{ color: '#059669', weight: 5, lineCap: 'round', lineJoin: 'round', opacity: 0.8 }}
                    />
                  )}
                  {activeRoute?.waypoints.map((wp) => (
                    <CircleMarker
                      key={wp.order}
                      center={[wp.location.coordinates[1], wp.location.coordinates[0]]}
                      radius={8}
                      pathOptions={{ color: '#fff', fillColor: '#059669', fillOpacity: 1, weight: 4 }}
                    >
                      <Popup>
                        <div className="p-2 font-sans min-w-[140px]">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-6 h-6 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shadow-lg shadow-emerald-600/20">
                              {wp.order}
                            </div>
                            <strong className="text-slate-900 text-sm font-black tracking-tight">{wp.name}</strong>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <Clock className="w-3.5 h-3.5 text-emerald-500" /> Estimado: {wp.estimatedArrival}
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-6">
                  <div className="w-16 h-16 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Cargando Cartografía Operativa...</p>
                </div>
              )}
            </div>
            
            {/* Map Info Overlay */}
            <div className="absolute top-10 right-10 z-[1000] bg-white/90 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white shadow-2xl shadow-slate-900/10 hidden md:block transition-all hover:scale-105">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-lg">
                  <RouteIcon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Monitoreo de Itinerario</span>
              </div>
            </div>
          </div>

          {/* Details Card */}
          {activeRoute && (
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 animate-fade-in relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-40" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative">
                <div className="flex items-center gap-5">
                  <div className="p-4 rounded-[1.5rem] bg-slate-900 text-white shadow-2xl shadow-slate-900/20 transition-transform group-hover:scale-110 duration-500">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">Detalles del Itinerario</h3>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{activeRoute.name}</p>
                  </div>
                </div>
                <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 text-right">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Duración Estimada</p>
                  <p className="text-2xl font-black text-emerald-700 tracking-tighter">{activeRoute.schedule.estimatedDuration} <span className="text-sm font-bold opacity-70">MIN</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative">
                {/* Waypoints timeline */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Cronograma de Paradas</p>
                  </div>
                  <div className="relative pl-8 space-y-8">
                    <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500 via-slate-100 to-slate-50" />
                    {activeRoute.waypoints.map((wp, i) => (
                      <div key={wp.order} className="relative flex items-center gap-6 group/item">
                        <div className="absolute left-[-24px] w-4 h-4 rounded-full border-4 border-white bg-slate-200 group-hover/item:bg-emerald-500 group-hover/item:scale-125 transition-all duration-300 shadow-sm" />
                        <div className="flex-1 p-5 rounded-3xl bg-slate-50/50 border border-slate-100 group-hover/item:bg-white group-hover/item:border-emerald-100 group-hover/item:shadow-xl group-hover/item:shadow-slate-200/50 transition-all duration-500">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <span className="text-[10px] font-black text-slate-300 uppercase">#{wp.order}</span>
                               <span className="text-sm font-black text-slate-800 tracking-tight">{wp.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50/50 px-3 py-1 rounded-lg border border-emerald-100/50">
                              <Clock3 className="w-3.5 h-3.5" /> {wp.estimatedArrival}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right col info */}
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Residuos Clasificados</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {activeRoute.wasteTypes.map((wt) => (
                        <div key={wt.name} className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-emerald-100 group/wt">
                          <div className="w-3 h-3 rounded-full shadow-[0_0_8px] shadow-current transition-transform group-hover/wt:scale-125" style={{ background: wt.colorCode, color: wt.colorCode }} />
                          <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest truncate">{wt.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-8 rounded-[2rem] bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-2xl shadow-emerald-600/20 relative overflow-hidden group/info">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="flex items-center gap-4 mb-6 relative">
                      <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-lg font-black uppercase tracking-widest tracking-tight">Geofencing Activo</h4>
                    </div>
                    <div className="space-y-4 relative">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <span className="text-[11px] font-black uppercase tracking-widest text-emerald-100">Sectores</span>
                        <span className="text-sm font-bold text-white">{activeRoute.zone.name}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <span className="text-[11px] font-black uppercase tracking-widest text-emerald-100">Distrito</span>
                        <span className="text-sm font-bold text-white">{activeRoute.zone.district}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
