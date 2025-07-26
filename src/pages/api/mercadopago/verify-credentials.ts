import type { APIRoute } from 'astro';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Verificar que las variables de entorno estén configuradas
    const accessToken = import.meta.env.MERCADOPAGO_ACCESS_TOKEN;
    const publicKey = import.meta.env.MERCADOPAGO_PUBLIC_KEY;
    const clientId = import.meta.env.MERCADOPAGO_CLIENT_ID;
    const clientSecret = import.meta.env.MERCADOPAGO_CLIENT_SECRET;

    console.log('🔍 Verificando credenciales de MercadoPago...');
    console.log('✅ Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : '❌ NO CONFIGURADO');
    console.log('✅ Public Key:', publicKey ? `${publicKey.substring(0, 20)}...` : '❌ NO CONFIGURADO');
    console.log('✅ Client ID:', clientId || '❌ NO CONFIGURADO');
    console.log('✅ Client Secret:', clientSecret ? `${clientSecret.substring(0, 10)}...` : '❌ NO CONFIGURADO');

    if (!accessToken || !publicKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Credenciales de MercadoPago no configuradas',
        details: {
          hasAccessToken: !!accessToken,
          hasPublicKey: !!publicKey,
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Inicializar cliente de MercadoPago
    const client = new MercadoPagoConfig({
      accessToken: accessToken,
      options: { timeout: 5000 }
    });

    // Crear una preferencia de prueba simple
    const preferenceApi = new Preference(client);
    
    const testPreferenceData = {
      items: [{
        id: 'test-item',
        title: '🧪 Producto de Prueba - Verificación de Credenciales',
        description: 'Este es un producto de prueba para verificar las credenciales de MercadoPago',
        quantity: 1,
        unit_price: 1000,
        currency_id: 'COP'
      }],
      back_urls: {
        success: "https://tutienda.com/pago/success",
        failure: "https://tutienda.com/pago/failure", 
        pending: "https://tutienda.com/pago/pending"
      },
      // Removemos auto_return para desarrollo local
      // auto_return: 'approved',
      external_reference: `test_${Date.now()}`,
      notification_url: `${new URL(request.url).origin}/api/mercadopago/webhook`,
      payer: {
        name: 'Usuario',
        surname: 'de Prueba',
        email: 'test@mercadopago.com'
      },
      payment_methods: {
        excluded_payment_types: [],
        excluded_payment_methods: [],
        installments: 12
      }
    };

    console.log('🔧 Creando preferencia de prueba...');
    const preference = await preferenceApi.create({ body: testPreferenceData });

    console.log('✅ Preferencia creada exitosamente:', preference.id);
    
    return new Response(JSON.stringify({
      success: true,
      message: '¡Credenciales de MercadoPago válidas!',
      details: {
        credentialsConfigured: true,
        preferenceCreated: true,
        preferenceId: preference.id,
        checkoutUrl: preference.init_point,
        environment: accessToken.startsWith('APP_USR') ? 'PRODUCCIÓN' : 'SANDBOX',
        publicKey: publicKey.substring(0, 20) + '...',
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error verificando credenciales de MercadoPago:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al verificar credenciales de MercadoPago',
      details: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
