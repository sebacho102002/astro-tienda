# 🔐 Sistema de Seguridad - E-commerce Admin

## 📋 Resumen

El sistema de seguridad implementado proporciona autenticación robusta, control de acceso basado en roles (RBAC) y auditoría completa para el panel de administración.

## 🎯 Características de Seguridad

### ✅ **Autenticación**
- Login/Logout seguro con validación de credenciales
- Sesiones con expiración automática (24 horas)
- Cookies HttpOnly para prevenir ataques XSS
- Redirección automática si no hay sesión activa

### ✅ **Autorización (RBAC)**
- **4 roles** con permisos diferenciados
- **Middleware** que valida permisos en cada request
- **Páginas protegidas** según rol del usuario
- **Navegación dinámica** basada en permisos

### ✅ **Auditoría y Monitoreo**
- Log de todas las acciones importantes
- Información de última conexión por usuario
- Registro de cambios de roles y permisos

## 👥 Roles y Permisos

### **👑 Super Admin**
```
Permisos: ACCESO TOTAL
- ✅ Dashboard
- ✅ Gestión de Productos
- ✅ Gestión de Pedidos  
- ✅ Control de Inventario
- ✅ Reportes y Analytics
- ✅ Gestión de Usuarios (EXCLUSIVO)
- ✅ Configuración del Sistema
```

### **👨‍💼 Manager** 
```
Permisos: GESTIÓN OPERATIVA
- ✅ Dashboard
- ✅ Gestión de Productos
- ✅ Gestión de Pedidos
- ✅ Control de Inventario
- ✅ Reportes y Analytics
- ❌ Gestión de Usuarios
```

### **✏️ Editor**
```
Permisos: CONTENIDO Y PRODUCTOS
- ✅ Dashboard
- ✅ Gestión de Productos
- ❌ Gestión de Pedidos
- ✅ Control de Inventario
- ❌ Reportes y Analytics
- ❌ Gestión de Usuarios
```

### **👁️ Viewer**
```
Permisos: SOLO LECTURA
- ✅ Dashboard (solo lectura)
- ❌ Gestión de Productos
- ❌ Gestión de Pedidos
- ❌ Control de Inventario
- ❌ Reportes y Analytics
- ❌ Gestión de Usuarios
```

## 🔑 Credenciales de Prueba

```bash
# Super Admin (Acceso Total)
Email: admin@tutienda.com
Password: admin123

# Manager (Gestión Operativa)
Email: manager@tutienda.com  
Password: manager123

# Editor (Productos e Inventario)
Email: editor@tutienda.com
Password: editor123

# Viewer (Solo Lectura)
Email: viewer@tutienda.com
Password: viewer123
```

## 🛡️ Flujo de Seguridad

### **1. Autenticación**
```
Usuario → /admin/login
    ↓
Validar credenciales
    ↓
Crear sesión + cookie
    ↓
Redirect → /admin/dashboard
```

### **2. Autorización (en cada request)**
```
Request → Middleware de Auth
    ↓
¿Tiene sesión válida?
    ↓ (No)
Redirect → /admin/login
    ↓ (Sí)
¿Tiene permisos para el recurso?
    ↓ (No)
Dashboard + error mensaje
    ↓ (Sí)
Permitir acceso
```

### **3. Logout**
```
Usuario clic "Logout"
    ↓
Confirmar acción
    ↓
API /api/auth/logout
    ↓
Limpiar cookies
    ↓
Redirect → /admin/login
```

## 📁 Estructura de Archivos

```
src/
├── middleware/
│   └── auth.ts                 # Middleware de autenticación/autorización
├── pages/
│   ├── admin/
│   │   ├── login.astro         # Página de login
│   │   └── usuarios.astro      # Gestión de usuarios (solo super_admin)
│   └── api/
│       └── auth/
│           └── logout.ts       # API de logout
└── layouts/
    └── DashboardLayout.astro   # Layout con info de usuario y logout
```

## 🔧 Configuración

### **Variables de Entorno (Producción)**
```env
# En producción, usar estas variables en lugar de credenciales hardcodeadas
ADMIN_SECRET_KEY=tu-clave-secreta-super-segura
JWT_SECRET=tu-jwt-secret-key
SESSION_TIMEOUT=86400  # 24 horas en segundos
```

### **Integración con Base de Datos**
```sql
-- Para producción, crear tabla de usuarios
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,  -- Usar bcrypt
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'manager', 'editor', 'viewer')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de auditoría
CREATE TABLE admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,
  resource TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## ⚡ Mejoras Futuras

### **🔐 Nivel Seguridad Avanzada**
- [ ] **2FA (Autenticación de dos factores)** con códigos SMS/Email
- [ ] **JWT tokens** en lugar de cookies simples  
- [ ] **Rate limiting** para prevenir ataques de fuerza bruta
- [ ] **Captcha** en el formulario de login tras intentos fallidos

### **📊 Nivel Auditoría**
- [ ] **Log completo** de todas las acciones (crear, editar, eliminar)
- [ ] **IP tracking** y detección de ubicaciones sospechosas
- [ ] **Reportes de seguridad** con intentos de acceso fallidos
- [ ] **Alertas automáticas** por actividad sospechosa

### **👥 Nivel Gestión de Usuarios**
- [ ] **Registro automático** de nuevos usuarios  
- [ ] **Reset de contraseñas** por email
- [ ] **Permisos granulares** por funcionalidad específica
- [ ] **Grupos de usuarios** con herencia de permisos

## 🚨 Consideraciones de Seguridad

### **🔴 IMPORTANTE: Antes de Producción**

1. **Cambiar credenciales por defecto** - No usar las credenciales de prueba
2. **Implementar hashing de contraseñas** - Usar bcrypt o similar
3. **HTTPS obligatorio** - Toda comunicación debe ser encriptada
4. **Variables de entorno** - Mover secretos a variables de entorno
5. **Base de datos real** - Reemplazar usuarios hardcodeados por BD
6. **Logs de producción** - Implementar logging robusto
7. **Backups regulares** - De usuarios y logs de auditoría

### **🟡 Recomendaciones Adicionales**

- **Revisar logs** de acceso regularmente
- **Rotar secretos** cada 90 días  
- **Capacitar usuarios** sobre seguridad
- **Pruebas de penetración** periódicas

---

## 📞 Soporte

Si encuentras problemas de seguridad o necesitas nuevas funcionalidades:

1. **Revisa los logs** en el dashboard de usuarios
2. **Verifica permisos** en la matriz de roles
3. **Confirma la sesión** esté activa y no expirada

**¡Sistema de seguridad implementado y funcionando! 🛡️✅**
