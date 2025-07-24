// src/lib/auth.ts - Sistema de autenticación JWT
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { supabase } from './supabaseClient';

const JWT_SECRET = import.meta.env.JWT_SECRET || 'tu-super-secreto-jwt-key-cambiar-en-produccion-2025';
const JWT_EXPIRES_IN = import.meta.env.JWT_EXPIRES_IN || '24h';
const REFRESH_EXPIRES_IN = import.meta.env.REFRESH_EXPIRES_IN || '7d';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  type?: string;
  iat?: number;
  exp?: number;
}

// Generar tokens JWT
export function generateTokens(user: UserSession) {
  const accessToken = jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    } as JWTPayload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' } as JWTPayload,
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
}

// Verificar token JWT
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('Error verificando token:', error);
    return null;
  }
}

// Hash de contraseña
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verificar contraseña
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Login con base de datos
export async function loginUser(email: string, password: string, ipAddress?: string, userAgent?: string) {
  try {
    console.log('🔐 Iniciando login para:', email);
    console.log('🔐 Password recibido (longitud):', password.length);

    // Buscar usuario en la base de datos
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, email, name, password_hash, role, status, login_attempts, locked_until')
      .eq('email', email)
      .eq('status', 'active')
      .single();

    console.log('🔍 Resultado de consulta DB:', { 
      user: user ? 'encontrado' : 'no encontrado', 
      error: error ? error.message : 'ninguno' 
    });
    
    if (user) {
      console.log('👤 Usuario encontrado:', { id: user.id, email: user.email, role: user.role });
      console.log('🔒 Hash en DB (primeros 20 chars):', user.password_hash?.substring(0, 20));
      console.log('🔒 Hash en DB (longitud):', user.password_hash?.length);
    }

    if (error || !user) {
      console.log('❌ Usuario no encontrado o error en consulta');
      await logAction('unknown', 'login_failed', 'invalid_email', { email }, ipAddress, userAgent);
      throw new Error('Credenciales incorrectas');
    }

    // Verificar si la cuenta está bloqueada
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / (1000 * 60));
      await logAction(user.id, 'login_blocked', 'account_locked', { minutesLeft }, ipAddress, userAgent);
      throw new Error(`Cuenta temporalmente bloqueada. Intenta en ${minutesLeft} minutos.`);
    }

    // Verificar contraseña
    console.log('🔐 Verificando contraseña...');
    const isValid = await verifyPassword(password, user.password_hash);
    console.log('✅ Resultado verificación contraseña:', isValid);
    
    if (!isValid) {
      // Incrementar intentos fallidos
      const newAttempts = user.login_attempts + 1;
      const shouldLock = newAttempts >= 5;
      
      await supabase
        .from('admin_users')
        .update({ 
          login_attempts: newAttempts,
          locked_until: shouldLock ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null // 15 min
        })
        .eq('id', user.id);

      await logAction(user.id, 'login_failed', 'invalid_password', { 
        attempts: newAttempts, 
        locked: shouldLock 
      }, ipAddress, userAgent);

      throw new Error('Credenciales incorrectas');
    }

    // Reset de intentos exitosos
    await supabase
      .from('admin_users')
      .update({ 
        login_attempts: 0, 
        locked_until: null,
        last_login: new Date().toISOString()
      })
      .eq('id', user.id);

    // Generar tokens
    const userSession: UserSession = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const { accessToken, refreshToken } = generateTokens(userSession);

    // Limpiar sesiones anteriores del usuario (opcional)
    console.log('🧹 Limpiando sesiones anteriores...');
    const { error: deleteError } = await supabase
      .from('admin_sessions')
      .delete()
      .eq('user_id', user.id);
    
    if (deleteError) console.log('⚠️ Error limpiando sesiones:', deleteError.message);

    // Guardar nueva sesión en base de datos
    console.log('💾 Guardando nueva sesión en BD...');
    const { error: insertError } = await supabase
      .from('admin_sessions')
      .insert({
        user_id: user.id,
        token: accessToken,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
        ip_address: ipAddress === 'unknown' ? null : ipAddress, // Si es unknown, usar null
        user_agent: userAgent === 'unknown' ? null : userAgent // Si es unknown, usar null
      });

    if (insertError) {
      console.log('❌ Error guardando sesión:', insertError.message);
      // Continuar sin fallar, ya que el JWT funciona independientemente
    } else {
      console.log('✅ Sesión guardada correctamente en BD');
    }

    // Log de login exitoso
    await logAction(user.id, 'login_success', 'user_session', { role: user.role }, ipAddress, userAgent);

    console.log('✅ Login exitoso para:', user.email);
    return { user: userSession, accessToken, refreshToken };

  } catch (error) {
    console.error('❌ Error en login:', error);
    throw error;
  }
}

// Logout
export async function logoutUser(token: string, ipAddress?: string, userAgent?: string) {
  try {
    console.log('🚪 Procesando logout...');
    
    // Obtener información del usuario antes de eliminar
    const { data: session } = await supabase
      .from('admin_sessions')
      .select(`
        user_id,
        admin_users (email, role)
      `)
      .eq('token', token)
      .single();

    // Eliminar sesión
    await supabase
      .from('admin_sessions')
      .delete()
      .eq('token', token);

    // Log de logout
    if (session) {
      await logAction(
        session.user_id, 
        'logout', 
        'user_session', 
        { 
          email: (session.admin_users as any)?.email,
          role: (session.admin_users as any)?.role
        }, 
        ipAddress, 
        userAgent
      );
    }

    console.log('✅ Logout completado');
  } catch (error) {
    console.error('❌ Error en logout:', error);
  }
}

// Middleware de autenticación
export async function getSessionFromToken(token: string): Promise<UserSession | null> {
  try {
    // Verificar token JWT
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      console.log('❌ Token JWT inválido');
      return null;
    }

    // Verificar sesión en base de datos
    const { data: session, error } = await supabase
      .from('admin_sessions')
      .select(`
        id, 
        expires_at,
        admin_users!inner (
          id, email, name, role, status
        )
      `)
      .eq('token', token)
      .single();

    if (error || !session) {
      console.log('❌ Sesión no encontrada en BD');
      return null;
    }

    // Verificar expiración
    if (new Date(session.expires_at) < new Date()) {
      console.log('⏰ Sesión expirada, eliminando...');
      await supabase.from('admin_sessions').delete().eq('token', token);
      return null;
    }

    const user = session.admin_users as any;
    if (user.status !== 'active') {
      console.log('🚫 Usuario inactivo');
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

  } catch (error) {
    console.error('❌ Error verificando sesión:', error);
    return null;
  }
}

// Logs de auditoría
export async function logAction(
  userId: string, 
  action: string, 
  resource?: string, 
  details?: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await supabase
      .from('admin_audit_log')
      .insert({
        user_id: userId,
        action,
        resource,
        details,
        ip_address: ipAddress === 'unknown' ? null : ipAddress,
        user_agent: userAgent === 'unknown' ? null : userAgent
      });
  } catch (error) {
    console.error('❌ Error guardando log de auditoría:', error);
  }
}

// Generar hash de contraseña para nuevos usuarios
export async function createUser(email: string, name: string, password: string, role: string) {
  try {
    const password_hash = await hashPassword(password);
    
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        email,
        name,
        password_hash,
        role
      })
      .select()
      .single();

    if (error) throw error;
    
    await logAction('system', 'user_created', `user:${data.id}`, { email, role });
    
    return data;
  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    throw error;
  }
}

// Limpiar sesiones expiradas
export async function cleanupExpiredSessions() {
  try {
    const { error } = await supabase
      .from('admin_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) throw error;
    
    console.log('🧹 Sesiones expiradas limpiadas');
  } catch (error) {
    console.error('❌ Error limpiando sesiones:', error);
  }
}
