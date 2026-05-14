import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', dni: '', email: '', password: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    const { firstName, lastName, dni, email, password, address } = form;
    if (!firstName || !lastName || !dni || !email || !password || !address) {
      Alert.alert('Error', 'Completa todos los campos obligatorios');
      return;
    }
    if (!/^\d{8}$/.test(dni)) { Alert.alert('Error', 'El DNI debe tener 8 dígitos'); return; }
    if (password.length < 6) { Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres'); return; }

    setLoading(true);
    try {
      await register(form);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || err.message);
    } finally { setLoading(false); }
  };

  const fields = [
    { key: 'firstName', icon: 'user', label: 'Nombres *', placeholder: 'Juan' },
    { key: 'lastName', icon: 'user', label: 'Apellidos *', placeholder: 'Pérez García' },
    { key: 'dni', icon: 'credit-card', label: 'DNI *', placeholder: '12345678', keyboard: 'numeric' as const },
    { key: 'email', icon: 'mail', label: 'Correo electrónico *', placeholder: 'correo@ejemplo.com', keyboard: 'email-address' as const },
    { key: 'password', icon: 'lock', label: 'Contraseña *', placeholder: '••••••••', secure: true },
    { key: 'phone', icon: 'phone', label: 'Teléfono', placeholder: '984111222', keyboard: 'phone-pad' as const },
    { key: 'address', icon: 'map-pin', label: 'Dirección *', placeholder: 'Av. Sol 123, Cusco' },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={24} color="#F8FAFC" />
          </TouchableOpacity>
          <View style={s.headerText}>
            <Text style={s.title}>Crear Cuenta</Text>
            <Text style={s.subtitle}>Regístrate como ciudadano</Text>
          </View>
        </View>

        <View style={s.card}>
          {fields.map(f => (
            <View key={f.key} style={s.fieldGroup}>
              <Text style={s.label}>{f.label}</Text>
              <View style={s.inputContainer}>
                <Feather name={f.icon as any} size={18} color="#64748B" style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder={f.placeholder}
                  placeholderTextColor="#64748B"
                  value={(form as any)[f.key]}
                  onChangeText={(v) => update(f.key, v)}
                  keyboardType={f.keyboard || 'default'}
                  secureTextEntry={f.secure}
                  autoCapitalize={f.key === 'email' ? 'none' : 'words'}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleRegister} disabled={loading}>
            <Text style={s.btnText}>{loading ? 'Registrando...' : 'Completar Registro'}</Text>
            {!loading && <Feather name="check-circle" size={20} color="#FFF" style={{ marginLeft: 8 }} />}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={s.linkBtn}>
            <Text style={s.linkText}>¿Ya tienes cuenta? <Text style={{ color: '#10B981', fontWeight: 'bold' }}>Inicia sesión</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#0F172A', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(30,41,59,0.8)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155', marginRight: 16 },
  headerText: { flex: 1 },
  title: { fontSize: 26, fontWeight: '900', color: '#10B981', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  card: { backgroundColor: 'rgba(30,41,59,0.7)', borderRadius: 24, padding: 28, borderWidth: 1, borderColor: 'rgba(51,65,85,0.8)', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, color: '#94A3B8', marginBottom: 8, fontWeight: '600', marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155', borderRadius: 16, paddingHorizontal: 16 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: Platform.OS === 'ios' ? 14 : 12, color: '#F8FAFC', fontSize: 15 },
  btn: { backgroundColor: '#10B981', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 12, flexDirection: 'row', justifyContent: 'center', shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkBtn: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#94A3B8', fontSize: 14 },
});
