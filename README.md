# Sistema Inteligente de Recolección de Residuos Sólidos — Cusco

**Proyecto universitario · Desarrollo de Software I · SCRUM**

Sistema web completo para la gestión de la recolección de residuos sólidos segregados en la ciudad del Cusco, con rastreo GPS en tiempo real, gestión de zonas geográficas, rutas con editor de mapa, reportes y módulos educativos para ciudadanos.

---

## Despliegue

| Componente | Plataforma | URL |
|---|---|---|
| Frontend (Next.js) | Vercel | [recoleccion-residuos.vercel.app](https://recoleccion-residuos.vercel.app) |
| Backend (Express) | Railway | API REST + WebSocket |
| Base de datos (PostgreSQL) | Railway | Gestionada vía Prisma ORM |

---

## Stack tecnológico

**Frontend**
- Next.js 14+ (App Router) con TypeScript
- Tailwind CSS v4
- Leaflet + react-leaflet — mapas interactivos con polígonos GeoJSON, rutas y marcadores GPS
- Socket.IO client — rastreo en tiempo real
- Sonner — notificaciones toast
- Lucide React — iconografía

**Backend**
- Express.js con TypeScript
- Prisma ORM + PostgreSQL
- Socket.IO — servidor de eventos en tiempo real
- JWT + bcrypt — autenticación y hash de contraseñas
- jsPDF + ExcelJS — generación de reportes PDF y Excel

**Infraestructura**
- Vercel (frontend con CI/CD automático desde `main`)
- Railway (backend + base de datos PostgreSQL, nixpacks)

---

## Arquitectura general

```
┌─────────────────────────────────┐     HTTPS / WS
│  Next.js (Vercel)               │ ◄──────────────► Express + Socket.IO (Railway)
│  - App Router (RSC + Client)    │                   │
│  - Leaflet (SSR desactivado)    │                   ├─ REST API  /api/v1/...
│  - Socket.IO client             │                   └─ Prisma ──► PostgreSQL
└─────────────────────────────────┘
```

Tres roles de usuario con paneles diferenciados:
- **ADMIN** — gestión completa del sistema
- **OPERATOR** — panel de turno con ruta del día y GPS
- **CITIZEN** — rastreo de camiones, horarios, incidencias y aprendizaje

---

## Funcionalidades implementadas

### RF-08 · Rastreo GPS en tiempo real

El módulo central del sistema. Los operadores emiten su posición al servidor vía Socket.IO y los ciudadanos la reciben instantáneamente en el mapa.

- El operador activa el GPS desde el panel de turno pulsando **Iniciar ruta**
- El navegador llama a `navigator.geolocation.watchPosition` y emite eventos `tracking:position` cada actualización
- El servidor distribuye la posición por salas Socket.IO: `zone:{id}` para ciudadanos de esa zona y `admin_room` para administradores
- Los ciudadanos ven los camiones activos con su velocidad y hora de última señal
- Al detener la ruta, el camión desaparece del mapa de todos los usuarios
- **Punto azul pulsante** para la posición propia del operador (idle antes de iniciar y sólido durante el tracking)
- **Botón "Mi ubicación"** superpuesto al mapa que hace `flyTo` a la posición actual

**Verificación de proximidad al inicio:** si el operador está a más de 500 m del primer waypoint al pulsar Iniciar, el sistema muestra una advertencia con la distancia exacta y le da la opción de confirmar o cancelar.

---

### RF-09 · Gestión de rutas con editor de mapa

El administrador crea y edita rutas directamente sobre el mapa interactivo.

- Formulario completo: nombre, zona, vehículo, operador, días de la semana, hora de inicio, duración estimada
- **Editor de waypoints en mapa**: clic para añadir paradas, arrastrar para reposicionar, lista lateral con nombres editables y orden numérico
- Estados de ruta: `DRAFT`, `ACTIVE`, `INACTIVE` con filtros por pestaña
- Cada waypoint guarda: orden, nombre, coordenadas y tiempo estimado de llegada
- La ruta se visualiza en el mapa del operador durante su turno: línea discontinua antes de iniciar, sólida durante el recorrido
- Los waypoints visitados (radio de 50 m) se marcan automáticamente con ✓ en tiempo real

---

### RF-03 · Gestión de zonas geográficas

- Creación de zonas mediante polígonos GeoJSON dibujados sobre el mapa (Leaflet Draw)
- Atributos: nombre, descripción, distrito, color personalizable, estado activo/inactivo
- Las zonas se muestran como capas semitransparentes en todos los mapas del sistema
- El administrador puede editar o desactivar zonas existentes

---

### RF-01 / RF-02 · Registro y autenticación

- Registro de ciudadanos con nombre, DNI, correo, contraseña, dirección y selección de zona
- Autenticación JWT con access token (corta duración) + refresh token (persistente)
- Roles: `ADMIN`, `OPERATOR`, `CITIZEN` con rutas protegidas
- Bloqueo de cuenta tras 5 intentos fallidos
- Perfil editable: datos personales, foto de avatar, cambio de zona (ciudadano)
- El administrador puede crear cuentas de OPERATOR y ADMIN directamente con contraseña

---

### RF-04 · Asignación de usuarios a zonas

- El administrador asigna zona tanto a ciudadanos como a operadores desde el panel de gestión de usuarios
- Validación `ZoneGuard`: ciudadanos sin zona ven mensaje orientativo; operadores y admins acceden sin restricción
- El ciudadano puede cambiar su propia zona desde su perfil

---

### RF-11 · Reporte de incidencias con imagen y geolocalización

- El ciudadano reporta desde el dashboard con tipo de incidencia, descripción, foto y coordenadas GPS
- Tipos: acumulación de residuos, contenedor dañado, recolección no realizada, otro
- Estados de gestión: `OPEN` → `IN_REVIEW` → `RESOLVED` → `CLOSED`
- El administrador gestiona el estado de cada incidencia desde su panel
- Código de seguimiento único generado automáticamente por registro
- Las imágenes se cargan mediante URL (almacenamiento externo configurable)

---

### RF-13 · Alertas de retraso en tiempo real

- El operador reporta un retraso desde el panel de turno indicando minutos y motivo
- El servidor emite el evento `tracking:delay_reported` a todos los ciudadanos de la zona activa
- Los ciudadanos reciben un toast de notificación inmediato con la información del retraso
- Se registra historial de retrasos asociado a la ejecución de la ruta

---

### RF-09 (complemento) · Gestión de vehículos

- CRUD completo de la flota: placa, tipo (COMPACTOR / OPEN\_TRUCK / MINI\_TRUCK), marca, modelo, año, capacidad
- Estados: `AVAILABLE`, `IN_ROUTE`, `MAINTENANCE`, `INACTIVE` con badges visuales de color
- Activar / desactivar vehículo sin eliminarlo del sistema
- Prerrequisito para asignar a rutas

---

### RF-12 · Seguimiento ciudadano por zona

- El ciudadano selecciona su zona en el panel de rastreo y se suscribe a la sala Socket.IO correspondiente
- Ve en el mapa todos los camiones activos en esa zona con nombre del operador, velocidad y última señal
- Panel lateral con listado de camiones activos en tiempo real

---

### RF-14 / RF-15 / RF-16 · Reportes con exportación PDF y Excel

- Panel de reportes accesible para el administrador
- Filtros por zona, rango de fechas y tipo de reporte
- **Exportación PDF** con jsPDF: portada, tablas y gráficos
- **Exportación Excel** con ExcelJS: hojas con formato, colores y anchos de columna
- Reportes disponibles:
  - Residuos recolectados por zona y categoría
  - Cumplimiento de rutas planificadas vs. ejecutadas
  - Participación ciudadana (incidencias, visitas educativas, registros)

---

### RF-10 · Consulta de horarios de recolección

- Los ciudadanos consultan los horarios organizados por zona y día de la semana
- Filtros por zona y día
- Muestra hora de inicio, duración estimada, vehículo asignado y tipos de residuos que se recolectan ese día

---

### RF-05 / RF-06 · Tipos de residuos y "Aprende a segregar"

- Catálogo de tipos de residuos con nombre, categoría (ORGANIC / RECYCLABLE / NON\_RECYCLABLE / HAZARDOUS), código de color, ejemplos e instrucciones de manejo
- El administrador crea, edita, activa y desactiva tipos desde el panel
- Módulo educativo **"Aprende a segregar"** para ciudadanos: guías visuales por categoría, color de contenedor, ejemplos cotidianos e instrucciones
- Cada visita a la sección educativa se registra en `LearnVisit` para el reporte de participación ciudadana (RF-16)

---

## Roles y acceso por módulo

| Módulo | ADMIN | OPERATOR | CITIZEN |
|---|:---:|:---:|:---:|
| Rastreo GPS (transmitir posición) | — | ✓ | — |
| Rastreo GPS (ver mapa en vivo) | ✓ | ✓ | ✓ |
| Gestión de rutas (crear/editar) | ✓ | — | — |
| Panel de turno (ruta del día) | — | ✓ | — |
| Gestión de zonas | ✓ | — | — |
| Gestión de usuarios | ✓ | — | — |
| Gestión de vehículos | ✓ | — | — |
| Incidencias (reportar) | — | — | ✓ |
| Incidencias (gestionar estado) | ✓ | — | — |
| Horarios de recolección | ✓ | ✓ | ✓ |
| Tipos de residuos (administrar) | ✓ | — | — |
| Aprende a segregar | — | — | ✓ |
| Reportes PDF / Excel | ✓ | — | — |
| Perfil editable | ✓ | ✓ | ✓ |

---

## Modelo de datos (resumen)

```
User ──── Zone ──── Route ──── Waypoint
           │          │
           │        Vehicle
           │          │
           │      RouteExecution ── GpsTrack
           │
         Incident
         LearnVisit

WasteType ──── RouteWasteType ──── Route
```

Entidades principales: `User`, `Zone`, `Route`, `Waypoint`, `Vehicle`, `RouteExecution`, `GpsTrack`, `WasteType`, `Incident`, `LearnVisit`, `RefreshToken`.

---

## Ejecución local

### Prerrequisitos

- Node.js 18+
- PostgreSQL 15+ (local o instancia en la nube)
- npm

### Backend

```bash
cd backend
cp .env.example .env        # configurar variables de entorno
npm install
npx prisma db push          # crear tablas en la base de datos
npm run dev                 # http://localhost:4000
```

### Frontend

```bash
cd frontend
cp .env.example .env.local  # configurar variables de entorno
npm install
npm run dev                 # http://localhost:3000
```

---

## Variables de entorno

### Backend — `.env`

```env
DATABASE_URL=postgresql://usuario:contraseña@host:5432/residuos_db
JWT_SECRET=tu_secreto_jwt
JWT_REFRESH_SECRET=tu_secreto_refresh
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### Frontend — `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

---

## Estructura del proyecto

```
/
├── frontend/                   # Next.js 14 (App Router)
│   └── src/
│       ├── app/
│       │   ├── (auth)/         # Login / Registro
│       │   └── dashboard/
│       │       ├── page.tsx            # Panel principal
│       │       ├── tracking/           # RF-08: Rastreo GPS
│       │       ├── routes/             # RF-09: Gestión de rutas
│       │       ├── zones/              # RF-03: Zonas
│       │       ├── users/              # Gestión de usuarios
│       │       ├── vehicles/           # Gestión de flota
│       │       ├── incidents/          # RF-11: Incidencias
│       │       ├── schedules/          # RF-10: Horarios
│       │       ├── waste-types/        # RF-05: Tipos de residuos
│       │       ├── learn/              # RF-06: Aprende a segregar
│       │       ├── reports/            # RF-14/15/16: Reportes
│       │       └── profile/            # Perfil editable
│       ├── components/
│       │   ├── LeafletTrackingMap.tsx  # Mapa de rastreo GPS
│       │   ├── LeafletWaypointEditor.tsx # Editor de rutas en mapa
│       │   └── ZoneGuard.tsx           # Guardia de zona por rol
│       ├── context/AuthContext.tsx
│       └── lib/
│           ├── api.ts                  # Cliente HTTP
│           └── socket.ts               # Cliente Socket.IO
│
└── backend/                    # Express + Prisma
    ├── prisma/
    │   └── schema.prisma
    └── src/
        ├── routes/             # Enrutadores REST por módulo
        ├── controllers/        # Lógica de controladores
        ├── services/           # Lógica de negocio
        ├── middleware/         # Auth JWT, manejo de errores
        └── socket/             # Eventos Socket.IO (tracking)
```

---

## Especificación de Requisitos Funcionales

### Resumen de RF implementados

| Código | Requisito | Módulo | Prioridad | Estado |
|--------|-----------|--------|-----------|--------|
| RF-01 | Registro de ciudadanos | Usuarios y zonas | Alta | ✓ |
| RF-02 | Autenticación JWT con roles | Usuarios y zonas | Alta | ✓ |
| RF-03 | Gestión de zonas geográficas (GeoJSON) | Usuarios y zonas | Alta | ✓ |
| RF-04 | Asignación de usuarios a zonas | Usuarios y zonas | Media | ✓ |
| RF-08 | Rastreo GPS en tiempo real (Socket.IO) | Monitoreo de rutas | Alta | ✓ |
| RF-09 | Gestión de rutas con editor en mapa | Monitoreo de rutas | Alta | ✓ |
| RF-07 | Visualización de ruta planificada en mapa | Monitoreo de rutas | Alta | ✓ |
| RF-11 | Reporte de incidencias con foto y GPS | Aplicación ciudadana | Alta | ✓ |
| RF-12 | Seguimiento de camiones por zona | Sistema de alertas | Alta | ✓ |
| RF-13 | Alerta de retraso en tiempo real | Sistema de alertas | Media | ✓ |
| RF-14 | Reportes con exportación PDF y Excel | Reportes | Alta | ✓ |
| RF-15 | Reporte de cumplimiento de rutas | Reportes | Media | ✓ |
| RF-16 | Reporte de participación ciudadana | Reportes | Media | ✓ |
| RF-10 | Consulta de horarios de recolección | Horarios | Alta | ✓ |
| RF-05 | Catálogo de tipos de residuos | Gestión de residuos | Media | ✓ |
| RF-06 | Clasificación y guías educativas | Gestión de residuos | Alta | ✓ |

---

## Metodología

Desarrollo iterativo con **SCRUM**. El product backlog se organizó en 4 sprints priorizando los módulos de mayor impacto operativo (rastreo GPS, rutas, zonas) antes que los módulos informativos y educativos.

**Indicadores de desempeño académico cubiertos:**

| Indicador | Descripción | RF asociados |
|-----------|-------------|--------------|
| AG-C01.1 | Impacto en desarrollo sostenible | RF-06, RF-11, RF-14, RF-16 |
| AG-C01.2 | Responsabilidades éticas, legales y sociales | RF-01, RF-02, RF-04, RF-11, RF-14 |
| AG-C01.3 | Comunicación eficiente de resultados | RF-12, RF-13, RF-14, RF-15, RF-16 |

---

*Proyecto desarrollado para el curso de Desarrollo de Software I — Universidad, Cusco 2025.*
