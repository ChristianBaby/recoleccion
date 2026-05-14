import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import api from '../../src/api/client';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado');
        setLoading(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      try {
        const { data } = await api.get('/routes?status=active');
        setRoutes(data.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const centerOnUser = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  if (loading) {
    return (
      <View style={s.loadingBox}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={s.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <MapView
        ref={mapRef}
        style={s.map}
        initialRegion={{
          latitude: location?.coords.latitude || -13.52264,
          longitude: location?.coords.longitude || -71.96734,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        customMapStyle={mapStyle}
      >
        {routes.map(r => r.path?.coordinates && r.path.coordinates.length > 0 && (
          <Polyline
            key={r._id}
            coordinates={r.path.coordinates.map((c: any) => ({ latitude: c[1], longitude: c[0] }))}
            strokeColor="#10B981"
            strokeWidth={4}
          />
        ))}

        {routes.map(r => r.waypoints?.map((wp: any) => (
          <Marker
            key={wp.order}
            coordinate={{ latitude: wp.location.coordinates[1], longitude: wp.location.coordinates[0] }}
            title={wp.name}
            description={`Llegada estimada: ${wp.estimatedArrival}`}
            pinColor="#3B82F6"
          />
        )))}
      </MapView>

      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.cardTitle}>Tracking GPS</Text>
          <Text style={s.cardDesc}>Monitoreo en tiempo real de los camiones recolectores en tu zona.</Text>
        </View>
      </View>

      <TouchableOpacity style={s.fab} onPress={centerOnUser}>
        <Text style={s.fabIcon}>📍</Text>
      </TouchableOpacity>
    </View>
  );
}

const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
];

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  map: { width: '100%', height: '100%' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  loadingText: { color: '#94A3B8', marginTop: 12 },
  overlay: { position: 'absolute', top: 50, left: 16, right: 16 },
  card: { backgroundColor: 'rgba(30,41,59,0.9)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cardDesc: { color: '#94A3B8', fontSize: 13 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#10B981', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  fabIcon: { fontSize: 24 },
});
