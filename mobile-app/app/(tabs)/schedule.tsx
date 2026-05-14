import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../../src/api/client';
import { Feather } from '@expo/vector-icons';

const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function ScheduleScreen() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRoutes = async () => {
    try {
      const { data } = await api.get('/routes');
      setRoutes(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoutes(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoutes();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={s.loadingBox}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
    >
      <Text style={s.pageTitle}>Horarios de Recolección</Text>
      <Text style={s.pageSub}>Conoce los días y horarios que pasa el camión por tu zona.</Text>

      {routes.map((route) => (
        <View key={route._id} style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.cardTitleBox}>
              <Feather name="map" size={20} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={s.routeName}>{route.name}</Text>
            </View>
            <View style={[s.badge, { backgroundColor: `${route.zone?.color}15` || 'rgba(59,130,246,0.15)', borderColor: `${route.zone?.color}40` || 'rgba(59,130,246,0.4)' }]}>
              <Text style={[s.badgeText, { color: route.zone?.color || '#3B82F6' }]}>{route.zone?.name}</Text>
            </View>
          </View>

          <View style={s.daysRow}>
            {dayLabels.map((day, idx) => {
              const isActive = route.schedule?.dayOfWeek.includes(idx);
              return (
                <View key={day} style={[s.dayBox, isActive && s.dayBoxActive]}>
                  <Text style={[s.dayText, isActive && s.dayTextActive]}>{day}</Text>
                </View>
              );
            })}
          </View>

          <View style={s.timeRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="clock" size={16} color="#94A3B8" style={{ marginRight: 6 }} />
              <Text style={s.timeLabel}>Horario de inicio:</Text>
            </View>
            <Text style={s.timeValue}>{route.schedule?.startTime}</Text>
          </View>

          <View style={s.wasteTypesBox}>
            <Text style={s.wasteTypesLabel}>RESIDUOS A RECOLECTAR</Text>
            <View style={s.wasteTags}>
              {route.wasteTypes?.map((wt: any) => (
                <View key={wt._id} style={[s.wasteTag, { backgroundColor: `${wt.colorCode}15`, borderColor: `${wt.colorCode}40` }]}>
                  <View style={[s.wasteColorDot, { backgroundColor: wt.colorCode }]} />
                  <Text style={[s.wasteTagText, { color: wt.colorCode }]}>{wt.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ))}

      {routes.length === 0 && (
        <View style={s.emptyBox}>
          <Feather name="inbox" size={48} color="#334155" style={{ marginBottom: 16 }} />
          <Text style={s.emptyText}>No hay rutas programadas disponibles.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 24, paddingTop: 60 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#F8FAFC', marginBottom: 6, letterSpacing: -0.5 },
  pageSub: { fontSize: 15, color: '#94A3B8', marginBottom: 24, fontWeight: '500' },
  card: { backgroundColor: 'rgba(30,41,59,0.6)', borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  cardTitleBox: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  routeName: { fontSize: 18, fontWeight: '800', color: '#F8FAFC', flex: 1 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dayBox: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1E293B' },
  dayBoxActive: { backgroundColor: '#10B981', borderColor: '#10B981', shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  dayText: { fontSize: 12, color: '#64748B', fontWeight: '700' },
  dayTextActive: { color: '#FFF', fontWeight: 'bold' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0F172A', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#1E293B' },
  timeLabel: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  timeValue: { color: '#10B981', fontSize: 18, fontWeight: '900' },
  wasteTypesBox: { marginTop: 4 },
  wasteTypesLabel: { color: '#64748B', fontSize: 11, fontWeight: '800', marginBottom: 12, letterSpacing: 1 },
  wasteTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wasteTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  wasteColorDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  wasteTagText: { fontSize: 13, fontWeight: '700' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: '#94A3B8', fontSize: 15, fontWeight: '500' },
});
