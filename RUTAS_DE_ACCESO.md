# Rutas de Acceso - BookerOS

## URLs Principales del Sistema

### Dashboard Administrativo (Operadores)
- **URL Base**: `/` o `/dashboard`
- **Descripción**: Panel principal para operadores de tours
- **Acceso**: Directo desde la raíz del dominio

### Plataforma de Reservaciones (Clientes)
- **URL Base**: `/customer`
- **Descripción**: Interfaz pública para que los clientes hagan reservaciones
- **Acceso**: Enlace directo para turistas

---

## Rutas Completas del Dashboard Administrativo

### Navegación Principal
```
/                     - Dashboard principal (redirige a /dashboard)
/dashboard            - Dashboard financiero central
/tours               - Gestión de tours (CRUD)
/reservations        - Ver todas las reservaciones
/payments            - Historial y gestión de pagos
/reports             - Reportes financieros y estadísticas
/settings            - Configuración del sistema
/redeem              - Canjear tickets con QR
```

### Funcionalidades Específicas
- **Resumen Financiero**: Dashboard muestra ingresos, comisiones, retenciones
- **Configuración de Retenciones**: Ajustar porcentajes de comisión y taxes
- **Validación de Tickets**: Escanear/introducir QR codes para confirmar asistencia

---

## Rutas Completas de la Plataforma de Clientes

### Flujo de Reservación
```
/customer                    - Home page con lista de tours disponibles
/book/[id]                   - Proceso de reservación (4 pasos)
/payment/[bookingData]       - Página de pago (tarjeta/cripto)
/ticket/[id]                 - Ticket digital generado
```

### Proceso de Reservación (4 Pasos)
1. **Paso 1**: Selección de fecha y huéspedes
2. **Paso 2**: Información de contacto
3. **Paso 3**: Datos de salud y solicitudes especiales
4. **Paso 4**: Confirmación y método de pago

### Opciones de Pago
- **Tarjeta de Crédito/Débito**: Integración con Stripe
- **Criptomonedas**: ThirdWeb SDK 5 (Bitcoin, Ethereum, USDC)
- **Modo Sandbox**: Para pruebas sin cargos reales

---

## Acceso Mobile vs Desktop

### Dashboard Administrativo
- **Desktop**: Sidebar fijo a la izquierda
- **Mobile**: Slide menu activado tocando el logo "GM" (BookerOS)
- **Responsive**: Layouts adaptativos para tablets y móviles

### Plataforma de Clientes
- **Mobile-First**: Diseño optimizado para dispositivos móviles
- **Progressive**: Funciona offline una vez cargado
- **Touch-Friendly**: Botones y controles optimizados para touch

---

## Ejemplos de URLs Completas

Asumiendo el dominio `gentedelmar.com`:

### Para Operadores
```
https://gentedelmar.com/                    # Dashboard principal
https://gentedelmar.com/tours               # Gestión tours
https://gentedelmar.com/reservations        # Ver reservas
https://gentedelmar.com/redeem              # Validar tickets
```

### Para Clientes
```
https://gentedelmar.com/customer             # Ver tours disponibles
https://gentedelmar.com/book/1               # Reservar tour ID 1
https://gentedelmar.com/ticket/123           # Ver ticket confirmado
```

### Estados del Sistema
- **Sandbox Mode**: Todas las transacciones son de prueba
- **Production**: Pagos reales habilitados con claves API reales
- **Offline**: Funcionalidad limitada sin conexión

---

## Navegación Rápida

### Desde Dashboard
- Click en logo "BookerOS" → Slide menu (mobile)
- Sidebar izquierdo siempre visible (desktop)
- Avatar usuario → Configuraciones de perfil

### Desde Cliente
- Botón "Volver" → Navegación hacia atrás en el flujo
- Home → Regresa a lista de tours
- Logo → Regresa al inicio

### Shortcuts de Teclado (Desktop)
- `Ctrl + /` → Abrir búsqueda rápida
- `Ctrl + D` → Ir a Dashboard
- `Ctrl + T` → Ir a Tours
- `Ctrl + R` → Ir a Reservaciones