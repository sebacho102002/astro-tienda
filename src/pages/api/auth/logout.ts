import type { APIRoute } from 'astro';
import { logoutUser } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🚪 Procesando logout JWT...');
    
    // Extraer token de las cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const tokenMatch = cookieHeader.match(/admin-token=([^;]+)/);
    
    if (tokenMatch) {
      const token = tokenMatch[1];
      
      // Obtener IP y User Agent para auditoría
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      // Logout usando la función de auth
      await logoutUser(token, ipAddress, userAgent);
    }
    
    // Configurar headers para limpiar cookie
    const headers = new Headers();
    headers.append('Set-Cookie', `admin-token=; HttpOnly; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`);
    
    console.log('✅ Logout JWT completado');
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Sesión cerrada correctamente' 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(headers.entries())
      }
    });
  } catch (error) {
    console.error('❌ Error procesando logout JWT:', error);
    return new Response(JSON.stringify({ 
      error: 'Error cerrando sesión',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
