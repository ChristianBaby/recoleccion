import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Salir', 
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        }
      }
    ]);
  };

  return (
    <ScrollView style={s.container}>
      <Text style={s.pageTitle}>Mi Perfil</Text>

      <View style={s.profileCard}>
        <View style={s.avatarBox}>
          <Text style={s.avatarText}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
        </View>
        <Text style={s.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={s.email}>{user?.email}</Text>
        
        <View style={s.badge}>
          <Text style={s.badgeText}>{user?.role === 'citizen' ? 'Ciudadano' : 'Operador'}</Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Datos Personales</Text>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>DNI</Text>
          <Text style={s.infoValue}>{user?.dni}</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Zona asignada</Text>
          <Text style={s.infoValue}>{user?.zone || 'Por asignar'}</Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Configuración</Text>
        <TouchableOpacity style={s.menuItem}>
          <Text style={s.menuItemText}>Notificaciones Push</Text>
          <Text style={s.menuItemArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.menuItem}>
          <Text style={s.menuItemText}>Privacidad y Términos</Text>
          <Text style={s.menuItemArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutBtnText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 20, paddingTop: 60 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 24 },
  profileCard: { backgroundColor: '#1E293B', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#334155' },
  avatarBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(16,185,129,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: '#10B981' },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#10B981' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 4 },
  email: { fontSize: 14, color: '#94A3B8', marginBottom: 12 },
  badge: { backgroundColor: 'rgba(59,130,246,0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' },
  badgeText: { color: '#3B82F6', fontSize: 12, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#F8FAFC', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1E293B', padding: 16, borderBottomWidth: 1, borderBottomColor: '#0F172A' },
  infoLabel: { color: '#94A3B8', fontSize: 14 },
  infoValue: { color: '#F8FAFC', fontSize: 14, fontWeight: '500' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', padding: 16, borderBottomWidth: 1, borderBottomColor: '#0F172A' },
  menuItemText: { color: '#F8FAFC', fontSize: 14 },
  menuItemArrow: { color: '#64748B', fontSize: 20 },
  logoutBtn: { backgroundColor: 'rgba(239,68,68,0.1)', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 40, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  logoutBtnText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },
});
