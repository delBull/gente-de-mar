# Guía de Deploy - BookerOS

## 🚀 Deploy Rápido con Vercel

### 1. Preparar Base de Datos (Recomendado: Neon)

1. Ve a [Neon.tech](https://neon.tech) y crea una cuenta
2. Crea un nuevo proyecto llamado "bookeros" 
3. Copia la connection string que aparece así:
   ```
   postgresql://usuario:password@ep-xxx.us-east-1.aws.neon.tech/bookeros?sslmode=require
   ```

### 2. Deploy en Vercel desde GitHub

1. Ve a [vercel.com](https://vercel.com) y conecta tu GitHub
2. Haz clic en "New Project"
3. Selecciona tu repositorio `bookeros`
4. En la configuración:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: dist

### 3. Variables de Entorno en Vercel

En el dashboard de Vercel, ve a Settings > Environment Variables y añade:

```
DATABASE_URL = tu_connection_string_de_neon
SESSION_SECRET = una_clave_muy_segura_de_32_caracteres_minimo
NODE_ENV = production
```

### 4. Deploy

1. Haz clic en "Deploy"
2. Espera a que termine el build (2-3 minutos)
3. Tu app estará disponible en `https://tu-proyecto.vercel.app`

---

## 🔧 Deploy Alternativo con Railway

### 1. Preparar Railway

1. Ve a [railway.app](https://railway.app)
2. Conecta tu GitHub
3. Crea nuevo proyecto desde tu repo

### 2. Configurar Base de Datos

```bash
# Railway incluye PostgreSQL gratuito
# Automaticamente crea DATABASE_URL
```

### 3. Variables de Entorno Railway

```
SESSION_SECRET = clave_segura_aqui
NODE_ENV = production
```

---

## 💻 Setup Local Completo

### 1. Clonar Repositorio

```bash
git clone https://github.com/deBull/bookeros.git
cd bookeros
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar PostgreSQL Local

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Crear usuario y base de datos
sudo -u postgres psql
CREATE USER bookeros WITH PASSWORD 'tu_password';
CREATE DATABASE bookeros OWNER bookeros;
GRANT ALL PRIVILEGES ON DATABASE bookeros TO bookeros;
\q
```

#### macOS:
```bash
brew install postgresql
brew services start postgresql

# Crear base de datos
createdb bookeros
```

#### Windows:
1. Descargar PostgreSQL desde [postgresql.org](https://www.postgresql.org/download/windows/)
2. Instalar siguiendo el wizard
3. Usar pgAdmin para crear la base de datos `bookeros`

### 4. Variables de Entorno Local

Crear archivo `.env`:

```env
DATABASE_URL="postgresql://bookeros:tu_password@localhost:5432/bookeros"
SESSION_SECRET="clave_super_secreta_de_al_menos_32_caracteres"
NODE_ENV=development
PORT=5000
```

### 5. Configurar Base de Datos

```bash
# Aplicar migraciones
npm run db:push

# Opcional: Abrir interfaz gráfica
npm run db:studio
```

### 6. Ejecutar en Desarrollo

```bash
npm run dev
```

Abre http://localhost:5000

---

## 🔑 Credenciales de Acceso

### Dashboard Admin
- **Master**: Dario / bookeros2026
- **Business**: Business / tour2025  
- **Manager**: Manager / admin

### Portal Cliente
- Acceso libre sin registro
- Login opcional para historial

---

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run db:studio        # Interfaz gráfica de BD

# Producción
npm run build           # Construir para producción
npm start              # Ejecutar en producción

# Base de datos
npm run db:push        # Aplicar cambios al esquema
```

---

## 🐛 Troubleshooting

### Error de Conexión a BD
```bash
# Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql

# Reiniciar si es necesario
sudo systemctl restart postgresql
```

### Error de Permisos
```bash
# Dar permisos al usuario
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE bookeros TO bookeros;
```

### Error de Puerto
```bash
# Cambiar puerto en .env si 5000 está ocupado
PORT=3000
```

---

## 📱 URLs de Producción

- **Dashboard**: https://tu-proyecto.vercel.app/
- **Portal Cliente**: https://tu-proyecto.vercel.app/
- **API**: https://tu-proyecto.vercel.app/api

---

## 🔄 Actualizar Deployment

```bash
# Hacer cambios en el código
git add .
git commit -m "Nuevas características"
git push origin main

# Vercel redeploy automáticamente
# Railway redeploy automáticamente
```