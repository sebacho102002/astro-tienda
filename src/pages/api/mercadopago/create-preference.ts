import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseClient';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { 
      productId, 
      title, 
      price, 
      quantity = 1,
      clienteInfo = null 
    } = body;

    // Validar datos requeridos
    if (!productId || !title || !price) {
      return new Response(JSON.stringify({
        error: 'Faltan datos requeridos: productId, title, price'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🔵 Creando preferencia MercadoPago:', { productId, title, price, quantity });

    // Calcular precio total
    const precioTotal = parseFloat(price) * quantity;
    const externalReference = `order_${Date.now()}_${productId}`;

    // 📦 Crear pedido en la base de datos (si hay info del cliente)
    if (clienteInfo) {
      try {
        const { data: pedidoData, error: pedidoError } = await supabase
          .from('pedidos')
          .insert({
            producto_id: productId,
            cliente_nombre: clienteInfo.nombre || 'Cliente MercadoPago',
            cliente_email: clienteInfo.email || 'cliente@mercadopago.com',
            cliente_telefono: clienteInfo.telefono || null,
            cantidad: quantity,
            precio_unitario: parseFloat(price),
            precio_total: precioTotal,
            metodo_pago: 'mercadopago',
            external_reference: externalReference,
            direccion_envio: clienteInfo.direccion || null,
            codigo_postal: clienteInfo.codigoPostal || null,
            ciudad: clienteInfo.ciudad || null
          })
          .select('numero_pedido')
          .single();

        if (pedidoError) {
          console.error('Error creando pedido:', pedidoError);
        } else {
          console.log('✅ Pedido creado:', pedidoData?.numero_pedido);
        }
      } catch (error) {
        console.error('Error en creación de pedido:', error);
      }
    }

    // Por ahora, simular la creación de preferencia
    // En producción, aquí iría la integración real con MercadoPago SDK
    
    const mockPreference = {
      preference_id: `TEST_PREF_${productId}_${Date.now()}`,
      init_point: null // No redirigir en modo demo
    };

    // TODO: Implementar integración real con MercadoPago
    /*
    import mercadopago from 'mercadopago';
    
    mercadopago.configure({
      access_token: process.env.MERCADOPAGO_ACCESS_TOKEN || ''
    });

    const preference = {
      items: [
        {
          id: productId,
          title: title,
          unit_price: parseFloat(price),
          quantity: quantity,
          currency_id: 'COP', // Cambiar por tu moneda
        }
      ],
      back_urls: {
        success: `${new URL(request.url).origin}/pago/success`,
        failure: `${new URL(request.url).origin}/pago/failure`,
        pending: `${new URL(request.url).origin}/pago/pending`
      },
      auto_return: 'approved',
      notification_url: `${new URL(request.url).origin}/api/mercadopago/webhook`,
      external_reference: externalReference
    };

    const response = await mercadopago.preferences.create(preference);
    return new Response(JSON.stringify({
      preference_id: response.body.id,
      init_point: response.body.init_point
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    */

    // Respuesta de prueba por ahora
    return new Response(JSON.stringify({
      message: "⚠️ Modo de demostración",
      info: "Esta es una simulación. Para pagos reales, necesitas:",
      requirements: [
        "1. Cuenta de desarrollador en MercadoPago",
        "2. ACCESS_TOKEN y PUBLIC_KEY",
        "3. Instalar SDK: npm install mercadopago",
        "4. Configurar variables de entorno",
        "5. Implementar código real (comentado arriba)"
      ],
      mock_data: mockPreference
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en MercadoPago API:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
