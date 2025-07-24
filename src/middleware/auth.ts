// Middleware de autenticación y autorización
export const prerender = false;

// Configuración de roles y permisos
const ROLES_PERMISSIONS = {
  super_admin: ['*'], // Acceso total
  manager: ['dashboard', 'productos', 'pedidos', 'inventario', 'reportes'],
  editor: ['dashboard', 'productos', 'inventario'],
  viewer: ['dashboard']
};

// Rutas que requieren super_admin
const SUPER_ADMIN_ROUTES = ['usuarios'];

interface UserSession {
  email: string;
  role: string;
  loginTime: string;
}

function parseSession(cookie: string): UserSession | null {
  try {
    // Buscar la cookie admin-data con regex
    const adminDataMatch = cookie.match(/admin-data=([^;]+)/);
    if (!adminDataMatch) {
      console.log('❌ No se encontró cookie admin-data');
      return null;
    }
    
    const adminData = adminDataMatch[1];
    console.log('🔍 Admin data encontrada en middleware:', adminData);
    
    const sessionData = JSON.parse(decodeURIComponent(adminData));
    console.log('👤 Sesión parseada en middleware:', sessionData);
    
    return sessionData;
  } catch (error) {
    console.error('❌ Error parseando sesión en middleware:', error);
    return null;
  }
}

function hasPermission(userRole: string, requiredResource: string): boolean {
  const permissions = ROLES_PERMISSIONS[userRole as keyof typeof ROLES_PERMISSIONS] || [];
  return permissions.includes('*') || permissions.includes(requiredResource);
}

function getResourceFromPath(pathname: string): string {
  const segments = pathname.split('/');
  if (segments[1] === 'admin' && segments[2]) {
    return segments[2];
  }
  return 'dashboard';
}

export async function onRequest(context: any) {
  const { request, redirect } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  console.log('🔐 Auth middleware:', pathname);

  // Permitir rutas públicas y login
  if (!pathname.startsWith('/admin') || pathname === '/admin/login') {
    return new Response(null, { status: 200 });
  }

  const sessionCookie = request.headers.get('cookie') || '';
  console.log('🍪 Cookie header en middleware:', sessionCookie);
  
  // Verificar si hay sesión activa
  if (!sessionCookie.includes('admin-session=true')) {
    console.log('❌ No hay sesión activa, redirigiendo a login');
    return redirect('/admin/login');
  }

  // Parsear datos de sesión
  const session = parseSession(sessionCookie);
  if (!session) {
    console.log('❌ Sesión inválida, redirigiendo a login');
    return redirect('/admin/login');
  }

  // Verificar expiración de sesión (24 horas)
  const loginTime = new Date(session.loginTime);
  const now = new Date();
  const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff > 24) {
    console.log('⏰ Sesión expirada, redirigiendo a login');
    return redirect('/admin/login');
  }

  // Verificar permisos para el recurso
  const resource = getResourceFromPath(pathname);
  
  // Verificar si requiere super_admin
  if (SUPER_ADMIN_ROUTES.includes(resource) && session.role !== 'super_admin') {
    console.log(`🚫 Ruta ${resource} requiere super_admin, usuario es ${session.role}`);
    const dashboardUrl = new URL('/admin/dashboard', url.origin);
    dashboardUrl.searchParams.set('error', 'insufficient_permissions');
    return redirect(dashboardUrl.toString());
  }
  
  // Verificar permisos generales
  if (!hasPermission(session.role, resource)) {
    console.log(`🚫 Usuario ${session.email} (${session.role}) sin permisos para ${resource}`);
    
    // Redirigir a dashboard con mensaje de error
    const dashboardUrl = new URL('/admin/dashboard', url.origin);
    dashboardUrl.searchParams.set('error', 'insufficient_permissions');
    return redirect(dashboardUrl.toString());
  }

  console.log(`✅ Acceso permitido: ${session.email} (${session.role}) -> ${resource}`);
  
  // Agregar información del usuario al contexto
  context.locals = {
    user: session
  };

  return new Response(null, { status: 200 });
}
