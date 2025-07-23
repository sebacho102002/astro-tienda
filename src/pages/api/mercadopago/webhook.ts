import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseClient';

// 🔔 Webhook de MercadoPago para recibir notificaciones de pago
// Este endpoint recibe las notificaciones cuando cambia el estado de un pago

export const POST: APIRoute = async ({ request }) => {
  console.log('🔔 Webhook MercadoPago recibido');

  try {
    const body = await request.json();
    console.log('Webhook body:', body);

    // Verificar que es una notificación de pago
    if (body.type === 'payment') {
      const paymentId = body.data.id;
      
      // 🚨 EN PRODUCCIÓN: Aquí debes consultar la API de MercadoPago
      // para obtener la información completa del pago
      
      // Ejemplo de lo que harías con la API real de MercadoPago:
      /*
      const mercadopago = require('mercadopago');
      mercadopago.configurations.setAccessToken(process.env.MERCADOPAGO_ACCESS_TOKEN);
      
      const payment = await mercadopago.payment.get(paymentId);
      
      if (payment.status === 'approved') {
        // Actualizar el pedido en tu base de datos
        const { data, error } = await supabase
          .from('pedidos')
          .update({ 
            estado: 'pagado',
            payment_id: paymentId,
            payment_status: payment.status,
            updated_at: new Date()
          })
          .eq('external_reference', payment.external_reference);
      }
      */

      // 📝 MODO DEMO: Solo loggeamos la información
      console.log(`💰 Pago ID: ${paymentId}`);
      console.log('🔵 NOTA: En modo demostración. Configura las credenciales reales de MercadoPago.');
      
      // Respuesta de éxito para MercadoPago
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
      // Tipo de notificación no manejada
      console.log('Tipo de notificación no manejada:', body.type);
      return new Response(JSON.stringify({ status: 'ignored' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error procesando webhook MercadoPago:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// 🔍 GET para verificar que el endpoint funciona
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    message: 'Webhook MercadoPago activo',
    endpoint: '/api/mercadopago/webhook',
    methods: ['POST'],
    info: 'Este endpoint recibe notificaciones de MercadoPago cuando cambia el estado de un pago'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
