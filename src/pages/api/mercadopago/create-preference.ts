import type { APIRoute } from 'astro';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { getIsProduction, getMercadoPagoCredentials } from '../../../lib/mercadopagoConfig';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { cartItems, clienteInfo, productId, title, description, price, quantity } = body;

    // Determinar si es una compra de carrito o producto individual
    let items;
    let total;

    if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      // Compra desde carrito
      items = cartItems.map(item => ({
        id: item.id,
        title: item.title || item.name,
        description: item.description || 'Producto',
        quantity: item.quantity || 1,
        unit_price: Number(item.price) || 0,
        currency_id: 'COP'
      }));
      total = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
      console.log('🔵 Creando preferencia MercadoPago (DESARROLLO):', { cartItems, clienteInfo });
    } else if (productId && title) {
      // Compra de producto individual
      const finalQuantity = quantity || 1;
      items = [{
        id: productId,
        title: title,
        description: description || 'Producto',
        quantity: finalQuantity,
        unit_price: Number(price) || 0,
        currency_id: 'COP'
      }];
      total = (Number(price) || 0) * finalQuantity;
      console.log('🔵 Creando preferencia MercadoPago (DESARROLLO):', { 
        productId, title, description, price, quantity: finalQuantity, clienteInfo 
      });
    } else {
      console.log('❌ Datos inválidos recibidos:', body);
      return new Response(JSON.stringify({ 
        error: 'Datos de producto inválidos' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener credenciales y configurar MercadoPago
    const credentials = getMercadoPagoCredentials();
    const isProduction = getIsProduction();
    
    console.log(`🔵 Creando preferencia ${isProduction ? 'PRODUCCIÓN' : 'localhost'}:`, { 
      items: items.length, 
      total, 
      environment: isProduction ? 'production' : 'development' 
    });

    if (!credentials.accessToken) {
      console.log('❌ Error: Access token de MercadoPago no configurado');
      return new Response(JSON.stringify({ 
        error: 'Configuración de MercadoPago incompleta',
        details: 'Access token no disponible'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Configurar cliente MercadoPago con producción
    const client = new MercadoPagoConfig({ 
      accessToken: credentials.accessToken,
      options: { timeout: 5000 }
    });

    const preference = new Preference(client);

    // Determinar URLs base según el entorno
    const baseUrl = isProduction 
      ? process.env.SITE_URL || 'https://tutienda.com'
      : 'http://localhost:4321';

    // Preparar datos de la preferencia 
    const preferenceData = {
      items: items,
      payer: {
        name: clienteInfo?.nombre || 'Cliente',
        email: clienteInfo?.email || 'cliente@ejemplo.com',
        phone: clienteInfo?.telefono ? {
          number: clienteInfo.telefono
        } : undefined,
        address: clienteInfo?.direccion ? {
          street_name: clienteInfo.direccion,
          zip_code: "00000"
        } : undefined
      },
      back_urls: {
        success: `${baseUrl}/pago/success`,
        failure: `${baseUrl}/pago/failure`,
        pending: `${baseUrl}/pago/pending`
      },
      external_reference: `${isProduction ? 'prod' : 'dev'}_${cartItems ? 'cart' : 'product'}_${Date.now()}`,
      statement_descriptor: isProduction ? "TIENDA" : "DESARROLLO",
      expires: false,
      metadata: {
        environment: isProduction ? "production" : "development",
        localhost: !isProduction,
        items_count: items.length,
        total_amount: total
      }
    };

    console.log(`🔵 Datos de preferencia ${isProduction ? 'PRODUCCIÓN' : 'localhost'}:`, JSON.stringify(preferenceData, null, 2));

    // Crear la preferencia
    const result = await preference.create({ body: preferenceData });
    
    console.log('✅ Preferencia creada exitosamente:', {
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point
    });

    return new Response(JSON.stringify({
      success: true,
      preferenceId: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.log('Error detallado:', error);
    
    // Manejar errores específicos de MercadoPago
    if (error?.cause?.code === 'unauthorized' || error?.code === 'unauthorized') {
      console.log('❌ Error de autorización - Credenciales inválidas');
      return new Response(JSON.stringify({ 
        error: 'Credenciales de MercadoPago inválidas',
        details: 'Las credenciales de producción no están configuradas correctamente. Por favor, contacta al administrador.',
        code: 'INVALID_CREDENTIALS'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (error?.message?.includes('access_token')) {
      console.log('❌ Error de access token');
      return new Response(JSON.stringify({ 
        error: 'Token de acceso inválido',
        details: 'El token de acceso de MercadoPago no es válido para producción',
        code: 'INVALID_ACCESS_TOKEN'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('❌ Error inesperado:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error?.message || 'Error desconocido al crear la preferencia'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};