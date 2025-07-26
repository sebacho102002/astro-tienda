import type { APIRoute } from 'astro';

export const POST: APIRoute = async () => {
  try {
    console.log('🔍 Verificando configuración de MercadoPago...');
    
    const accessToken = import.meta.env.MERCADOPAGO_ACCESS_TOKEN;
    const publicKey = import.meta.env.MERCADOPAGO_PUBLIC_KEY;
    const clientId = import.meta.env.MERCADOPAGO_CLIENT_ID;
    const clientSecret = import.meta.env.MERCADOPAGO_CLIENT_SECRET;

    // Verificar que las credenciales estén configuradas
    if (!accessToken || !publicKey || !clientId || !clientSecret) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Credenciales de MercadoPago no configuradas',
        missing: {
          accessToken: !accessToken,
          publicKey: !publicKey,
          clientId: !clientId,
          clientSecret: !clientSecret
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Access Token:', accessToken?.substring(0, 20) + '...');
    console.log('✅ Public Key:', publicKey?.substring(0, 20) + '...');
    console.log('✅ Client ID:', clientId);
    console.log('✅ Client Secret:', clientSecret?.substring(0, 10) + '...');

    // Determinar el entorno
    const isSandbox = accessToken.startsWith('TEST-');
    const environment = isSandbox ? 'SANDBOX' : 'PRODUCCIÓN';

    return new Response(JSON.stringify({
      success: true,
      message: 'Configuración de MercadoPago verificada',
      environment: environment,
      sandbox: isSandbox,
      credentials: {
        accessToken: accessToken?.substring(0, 20) + '...' + accessToken?.substring(accessToken.length - 10),
        publicKey: publicKey?.substring(0, 20) + '...' + publicKey?.substring(publicKey.length - 10),
        clientId: clientId,
        clientSecret: clientSecret?.substring(0, 5) + '...' + clientSecret?.substring(clientSecret.length - 5)
      },
      status: isSandbox ? 
        '✅ Configurado para DESARROLLO (SANDBOX)' : 
        '⚠️ Configurado para PRODUCCIÓN - No usar en localhost'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error verificando configuración:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno al verificar configuración',
      details: error.message || 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
