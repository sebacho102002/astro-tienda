// Middleware de autenticación y autorización JWT
export const prerender = false;

import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabaseClient';

// Configuración de roles y permisos
const ROLES_PERMISSIONS = {
  super_admin: ['*'], // Acceso total
  manager: ['dashboard', 'productos', 'pedidos', 'inventario', 'reportes'],
  editor: ['dashboard', 'productos', 'inventario'],
  viewer: ['dashboard']
};

// Rutas que requieren super_admin o manager
const SUPER_ADMIN_ROUTES = ['usuarios'];
const MANAGER_ROUTES = ['usuarios']; // Managers también pueden gestionar usuarios

interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
  sessionId: string;
}

async function validateJWTSession(cookie: string): Promise<UserSession | null> {
  try {
    // Buscar la cookie admin-token
    const tokenMatch = cookie.match(/admin-token=([^;]+)/);
    if (!tokenMatch) {
      console.log('❌ No se encontró cookie admin-token');
      return null;
    }
    
    const token = tokenMatch[1];
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET no está configurado');
      return null;
    }

    // Verificar y decodificar JWT
    const payload = jwt.verify(token, jwtSecret) as any;
    console.log('🔍 JWT payload decodificado:', { 
      userId: payload.userId, 
      email: payload.email, 
      role: payload.role 
    });

    // Verificar que la sesión existe en la base de datos
    const { data: session, error } = await supabase
      .from('admin_sessions')
      .select(`
        id,
        user_id,
        admin_users(id, email, name, role, status)
      `)
      .eq('id', payload.sessionId)
      .eq('user_id', payload.userId)
      .single();

    if (error || !session || !session.admin_users) {
      console.log('❌ Sesión no encontrada en DB:', error?.message);
      return null;
    }

    const user = session.admin_users as any;
    
    // Verificar que el usuario esté activo
    if (user.status !== 'active') {
      console.log('❌ Usuario inactivo');
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sessionId: session.id
    };

  } catch (error) {
    console.error('❌ Error validando JWT en middleware:', error);
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

  console.log('🔐 Auth middleware JWT:', pathname);

  // Permitir rutas públicas y login
  if (!pathname.startsWith('/admin') || pathname === '/admin/login') {
    return new Response(null, { status: 200 });
  }

  const sessionCookie = request.headers.get('cookie') || '';
  console.log('🍪 Cookie header en middleware:', sessionCookie ? 'Presente' : 'Ausente');
  
  // Verificar JWT y sesión en DB
  const session = await validateJWTSession(sessionCookie);
  if (!session) {
    console.log('❌ JWT inválido o sesión expirada, redirigiendo a login');
    return redirect('/admin/login');
  }

  // Verificar permisos para el recurso
  const resource = getResourceFromPath(pathname);
  
  // Verificar si requiere super_admin o manager
  if (SUPER_ADMIN_ROUTES.includes(resource) && 
      session.role !== 'super_admin' && 
      session.role !== 'manager') {
    console.log(`🚫 Ruta ${resource} requiere super_admin o manager, usuario es ${session.role}`);
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

  console.log(`✅ Acceso JWT permitido: ${session.email} (${session.role}) -> ${resource}`);
  
  // Agregar información del usuario al contexto
  context.locals = {
    user: session
  };

  return new Response(null, { status: 200 });
}
