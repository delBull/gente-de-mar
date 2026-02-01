# BookerOS - Tours Booking Platform

Una plataforma integral para la gestión de tours marítimos con interfaz de administración y portal de reservas para clientes.

## 🚀 Características

- **Dashboard Administrativo** - Gestión financiera y operativa para operadores de tours
- **Portal de Reservas** - Interfaz móvil para que los clientes naveguen y reserven tours
- **Sistema de Autenticación** - Tres niveles de acceso (Master Admin, Business, Manager)
- **Tickets Digitales** - Generación de QR codes y códigos alfanuméricos
- **Pagos Integrados** - Soporte para pagos tradicionales y crypto con ThirdWeb
- **Validación en Tiempo Real** - Sistema de canje de tickets con cámara

## 🛠️ Stack Tecnológico

- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Base de Datos**: PostgreSQL + Drizzle ORM
- **Autenticación**: Session-based con reservas temporales
- **Pagos**: ThirdWeb SDK 5 para múltiples métodos de pago

## 📋 Instalación Local

### Pre-requisitos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

### 1. Clonar el repositorio

```bash
git clone https://github.com/deBull/bookeros.git
cd bookeros
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Base de Datos PostgreSQL

#### Opción A: PostgreSQL Local
```bash
# Instalar PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Crear base de datos
sudo -u postgres createuser --interactive
sudo -u postgres createdb bookeros
```

#### Opción B: PostgreSQL en la nube (Recomendado para producción)
- **Neon**: https://neon.tech (gratis hasta 3GB)
- **Supabase**: https://supabase.com (gratis hasta 500MB)
- **Railway**: https://railway.app (gratis con limitaciones)

### 4. Variables de Entorno

Crear archivo `.env` en la raíz:

```env
# Base de Datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/bookeros"

# Alternativa para componentes separados
PGHOST=localhost
PGPORT=5432
PGUSER=tu_usuario
PGPASSWORD=tu_password
PGDATABASE=bookeros

# Sesiones (genera una clave secreta)
SESSION_SECRET="tu_clave_secreta_muy_segura_aqui"

# Puerto del servidor (opcional)
PORT=5000
```

### 5. Configurar Base de Datos

```bash
# Aplicar migraciones de la base de datos
npm run db:push
```

### 6. Ejecutar en desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api

## 🚀 Deploy con Vercel

### 1. Preparar para Vercel

El proyecto ya incluye la configuración necesaria para Vercel en `vercel.json`.

### 2. Configurar Base de Datos en la Nube

Para producción, recomiendo **Neon** (gratis y fácil):

1. Ve a https://neon.tech
2. Crea una cuenta nueva
3. Crea un nuevo proyecto
4. Copia la URL de conexión

### 3. Deploy con Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login a Vercel
vercel login

# Deploy
vercel

# Configurar variables de entorno en Vercel
vercel env add DATABASE_URL
vercel env add SESSION_SECRET
```

### 4. Deploy con GitHub (Recomendado)

1. Conecta tu repo a Vercel: https://vercel.com/new
2. Selecciona tu repositorio `bookeros`
3. Configura las variables de entorno:
   - `DATABASE_URL`: Tu URL de PostgreSQL
   - `SESSION_SECRET`: Clave secreta para sesiones
4. Deploy automático

## 🗄️ Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo

# Base de datos
npm run db:push      # Aplicar cambios al esquema
npm run db:studio    # Abrir Drizzle Studio (GUI)

# Producción
npm run build        # Construir para producción
npm start           # Iniciar servidor de producción
```

## 👥 Usuarios por Defecto

El sistema inicializa con estos usuarios para pruebas:

- **Master Admin**: `Dario` / `bookeros2026`
- **Business**: `Business` / `tour2025` 
- **Manager**: `Manager` / `admin`

## 🔑 Credenciales de Acceso

### Dashboard Administrativo
- URL: `/` (requiere login)
- Usuarios: Ver sección anterior

### Portal de Reservas
- URL: `/` (sin login requerido)
- Los clientes pueden reservar sin crear cuenta
- Login opcional para historial de reservas

## 📱 Funcionalidades Principales

### Dashboard Admin
- **Resumen Financiero** - Ingresos, comisiones, retenciones
- **Gestión de Tours** - Crear, editar, administrar tours
- **Reservaciones** - Ver y gestionar todas las reservas
- **Pagos** - Historial de transacciones y comisiones
- **Reportes** - Análisis y métricas de negocio
- **Validación** - Canje de tickets con QR/código alfanumérico

### Portal Cliente
- **Explorar Tours** - Navegación sin login requerido
- **Reservar** - Proceso simplificado de reserva
- **Pagos** - Múltiples métodos (tarjeta, crypto, wallet)
- **Tickets Digitales** - QR + código alfanumérico
- **Compartir** - Apple Wallet, Google Pay, descarga

## 🔧 Configuración Adicional

### ThirdWeb (Pagos Crypto)
```bash
# Variables adicionales para pagos crypto
THIRDWEB_CLIENT_ID="tu_client_id"
THIRDWEB_SECRET_KEY="tu_secret_key"
```

### Customización
- **Colores**: Editar `client/src/index.css`
- **Logo**: Reemplazar en `client/src/components/static-logo.tsx`
- **Textos**: Archivos en `client/src/pages/`

## 📧 Soporte

Para dudas o problemas:
- Crear un issue en GitHub
- Revisar la documentación en `/docs`

---

**BookerOS - Tour Management System** 🚀