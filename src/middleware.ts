import { defineMiddleware } from 'astro:middleware';
import { getSessionFromToken } from './lib/auth';

// Configuración de roles y permisos
const ROLES_PERMISSIONS = {
  super_admin: ['*'], // Acceso total
  manager: ['dashboard', 'productos', 'pedidos', 'inventario', 'reportes'],
  editor: ['dashboard', 'productos', 'inventario'],
  viewer: ['dashboard']
};

// Rutas que requieren super_admin
const SUPER_ADMIN_ROUTES = ['usuarios'];

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

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, redirect } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  console.log('🔐 Auth middleware JWT ejecutado para:', pathname);

  // Permitir rutas públicas y login
  if (!pathname.startsWith('/admin') || pathname === '/admin/login' || pathname === '/admin/debug-session') {
    console.log('✅ Ruta pública, permitiendo acceso');
    return next();
  }

  // Extraer token JWT de las cookies
  const cookieHeader = request.headers.get('cookie') || '';
  const tokenMatch = cookieHeader.match(/admin-token=([^;]+)/);
  
  if (!tokenMatch) {
    console.log('❌ No se encontró token JWT, redirigiendo a login');
    return redirect('/admin/login');
  }

  const token = tokenMatch[1];
  console.log('🔍 Token encontrado, verificando sesión...');

  // Verificar sesión con JWT y base de datos
  const session = await getSessionFromToken(token);
  if (!session) {
    console.log('❌ Sesión inválida o expirada, redirigiendo a login');
    return redirect('/admin/login');
  }

  console.log('👤 Sesión válida:', { email: session.email, role: session.role });

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
  (context.locals as any).user = session;

  return next();
});
