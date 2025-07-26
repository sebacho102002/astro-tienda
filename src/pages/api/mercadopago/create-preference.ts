import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseClient';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Configurar MercadoPago con credenciales reales para localhost
const client = new MercadoPagoConfig({
  accessToken: import.meta.env.MERCADOPAGO_ACCESS_TOKEN,
  options: { timeout: 5000 }
});

const preferenceApi = new Preference(client);

// Función especial para desarrollo localhost
async function createLocalhostPreference(cartItems: any[], clienteInfo: any, request: Request) {
  try {
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const externalReference = `dev_cart_${Date.now()}`;

    // Configuración especial para localhost - MercadoPago más permisivo
    const preferenceData = {
      items: cartItems.map(item => ({
        id: item.id,
        title: item.title || item.name,
        description: item.description || 'Producto desde localhost',
        quantity: item.quantity,
        unit_price: item.price,
        currency_id: 'COP'
      })),
      payer: {
        name: clienteInfo?.nombre || 'Cliente Desarrollo',
        email: clienteInfo?.email || 'dev@localhost.com',
        phone: {
          number: clienteInfo?.telefono || '3001234567'
        },
        address: {
          street_name: clienteInfo?.direccion || 'Desarrollo Local',
          zip_code: clienteInfo?.codigoPostal || '00000'
        }
      },
      // Para localhost: URLs más simples, sin auto_return
      back_urls: {
        success: `http://localhost:4321/pago/success`,
        failure: `http://localhost:4321/pago/failure`,
        pending: `http://localhost:4321/pago/pending`
      },
      external_reference: externalReference,
      // Sin notification_url para evitar problemas con localhost
      statement_descriptor: 'DESARROLLO',
      expires: false, // Sin expiración para desarrollo
      metadata: {
        environment: 'development',
        localhost: true,
        items_count: cartItems.length,
        total_amount: totalAmount
      }
    };

    console.log('🔵 Creando preferencia localhost:', { 
      items: cartItems.length, 
      total: totalAmount,
      environment: 'development'
    });
    
    console.log('🔵 Datos de preferencia localhost:', JSON.stringify(preferenceData, null, 2));

    const response = await preferenceApi.create({ body: preferenceData });

    return new Response(JSON.stringify({
      success: true,
      preference_id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
      external_reference: externalReference,
      environment: 'development-localhost'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error creando preferencia localhost:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Error creando preferencia de desarrollo',
      details: error.message || 'Error desconocido',
      environment: 'development-localhost'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Función para producto único en localhost
async function createSingleProductLocalhostPreference(productId: string, title: string, price: number, quantity: number, clienteInfo: any, request: Request) {
  try {
    const precioTotal = price * quantity;
    const externalReference = `dev_product_${Date.now()}_${productId}`;

    const preferenceData = {
      items: [{
        id: productId,
        title: title,
        description: 'Producto individual desde localhost',
        quantity: quantity,
        unit_price: price,
        currency_id: 'COP'
      }],
      payer: {
        name: clienteInfo?.nombre || 'Cliente Desarrollo',
        email: clienteInfo?.email || 'dev@localhost.com',
        phone: {
          number: clienteInfo?.telefono || '3001234567'
        },
        address: {
          street_name: clienteInfo?.direccion || 'Desarrollo Local',
          zip_code: clienteInfo?.codigoPostal || '00000'
        }
      },
      back_urls: {
        success: `http://localhost:4321/pago/success`, 
        failure: `http://localhost:4321/pago/failure`,
        pending: `http://localhost:4321/pago/pending`
      },
      external_reference: externalReference,
      statement_descriptor: 'DESARROLLO',
      expires: false,
      metadata: {
        environment: 'development',
        localhost: true,
        producto_id: productId,
        total_amount: precioTotal
      }
    };

    console.log('🔵 Datos de preferencia producto localhost:', JSON.stringify(preferenceData, null, 2));

    const response = await preferenceApi.create({ body: preferenceData });

    return new Response(JSON.stringify({
      success: true,
      preference_id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
      external_reference: externalReference,
      environment: 'development-localhost'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en MercadoPago API (localhost):', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Error creando preferencia de desarrollo',
      details: error.message || 'Error desconocido',
      environment: 'development-localhost'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    console.log('🔵 Creando preferencia MercadoPago (DESARROLLO):', body);

    const { productId, title, price, quantity = 1, cartItems, clienteInfo } = body;

    // Manejar carrito (múltiples productos)
    if (cartItems && cartItems.length > 0) {
      return await createLocalhostPreference(cartItems, clienteInfo, request);
    }

    // Manejar producto único
    if (productId && title && price) {
      return await createSingleProductLocalhostPreference(productId, title, parseFloat(price), quantity, clienteInfo, request);
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Faltan datos requeridos: cartItems o (productId, title, price)'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error general en create-preference (localhost):', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor',
      details: error.message || 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
