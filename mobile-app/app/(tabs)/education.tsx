import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../../src/api/client';
import { Feather } from '@expo/vector-icons';

export default function EducationScreen() {
  const [wasteTypes, setWasteTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const { data } = await api.get('/waste-types');
      setWasteTypes(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
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
      <Text style={s.pageTitle}>Guía de Reciclaje</Text>
      <Text style={s.pageSub}>Aprende a separar tus residuos correctamente (NTP 900.058).</Text>

      {wasteTypes.map((wt) => (
        <View key={wt._id} style={[s.card, { borderColor: `${wt.colorCode}40`, backgroundColor: `${wt.colorCode}0A` }]}>
          <View style={s.cardHeader}>
            <View style={[s.colorBox, { backgroundColor: wt.colorCode }]} />
            <Text style={s.cardTitle}>{wt.name}</Text>
          </View>
          
          <Text style={s.descText}>{wt.description}</Text>
          
          <View style={s.sectionBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Feather name="list" size={16} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={s.sectionLabel}>Ejemplos:</Text>
            </View>
            <View style={s.tagsRow}>
              {wt.examples?.map((ex: string) => (
                <View key={ex} style={s.tag}>
                  <Text style={s.tagText}>{ex}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[s.instructionBox, { backgroundColor: `${wt.colorCode}15`, borderColor: `${wt.colorCode}30` }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Feather name="info" size={16} color={wt.colorCode} style={{ marginRight: 6 }} />
              <Text style={[s.instructionLabel, { color: wt.colorCode }]}>¿Cómo desechar?</Text>
            </View>
            <Text style={s.instructionText}>{wt.handlingInstructions}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 24, paddingTop: 60 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#F8FAFC', marginBottom: 6, letterSpacing: -0.5 },
  pageSub: { fontSize: 15, color: '#94A3B8', marginBottom: 24, fontWeight: '500' },
  card: { borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  colorBox: { width: 32, height: 32, borderRadius: 16, marginRight: 16, borderWidth: 3, borderColor: '#1E293B', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#F8FAFC' },
  descText: { fontSize: 15, color: '#94A3B8', marginBottom: 20, lineHeight: 22 },
  sectionBox: { marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#64748B', letterSpacing: 0.5 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { backgroundColor: 'rgba(30,41,59,0.8)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  tagText: { color: '#CBD5E1', fontSize: 13, fontWeight: '600' },
  instructionBox: { padding: 16, borderRadius: 16, borderWidth: 1 },
  instructionLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  instructionText: { color: '#F8FAFC', fontSize: 14, lineHeight: 20, fontWeight: '500' },
});
