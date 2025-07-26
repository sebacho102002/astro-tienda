import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseClient';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Configurar MercadoPago
const client = new MercadoPagoConfig({
  accessToken: import.meta.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-2877637727906945-072322-f2b2d11af9e11d0e1ad9c15ed5c4cdc6-1906405534',
});

const payment = new Payment(client);

// 🔔 Webhook de MercadoPago para recibir notificaciones de pago
export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🔔 Webhook MercadoPago recibido');
    
    const body = await request.json();
    console.log('📦 Datos del webhook:', JSON.stringify(body, null, 2));

    // Obtener información del pago
    const { type, data } = body;

    if (type === 'payment') {
      const paymentId = data.id;
      console.log('💳 Procesando pago ID:', paymentId);

      try {
        // Consultar información del pago en MercadoPago
        const paymentResponse = await payment.get({ id: paymentId });
        const paymentInfo = paymentResponse;
        
        console.log('💰 Información del pago:', JSON.stringify(paymentInfo, null, 2));

        // Actualizar el pedido en la base de datos
        const externalReference = paymentInfo.external_reference;
        const status = mapMercadoPagoStatus(paymentInfo.status || '');
        
        if (externalReference) {
          const { data: updateResult, error: updateError } = await supabase
            .from('pedidos')
            .update({
              status: status,
              payment_id: paymentId.toString(),
              payment_status: paymentInfo.status,
              payment_method: paymentInfo.payment_method_id,
              payment_type: paymentInfo.payment_type_id,
              transaction_amount: paymentInfo.transaction_amount,
              fecha_pago: paymentInfo.date_approved || new Date().toISOString(),
              payment_data: JSON.stringify(paymentInfo)
            })
            .eq('external_reference', externalReference)
            .select();

          if (updateError) {
            console.error('❌ Error actualizando pedido:', updateError);
          } else {
            console.log('✅ Pedido actualizado:', updateResult);
            
            // Si el pago fue aprobado, actualizar el stock del producto
            if (status === 'pagado' && updateResult.length > 0) {
              const pedido = updateResult[0];
              if (pedido.producto_id && pedido.cantidad) {
                await updateProductStock(pedido.producto_id, pedido.cantidad);
              }
            }
          }
        }

      } catch (paymentError) {
        console.error('❌ Error consultando pago en MercadoPago:', paymentError);
        
        // Fallback: actualizar con información básica
        if (body.data?.id) {
          await supabase
            .from('pedidos')
            .update({
              payment_id: body.data.id.toString(),
              status: 'procesando',
              payment_data: JSON.stringify(body)
            })
            .eq('external_reference', body.external_reference || '');
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Webhook procesado correctamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Error procesando webhook',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Función para mapear status de MercadoPago a nuestro sistema
function mapMercadoPagoStatus(mpStatus: string): string {
  switch (mpStatus) {
    case 'approved':
      return 'pagado';
    case 'pending':
      return 'pendiente';
    case 'in_process':
      return 'procesando';
    case 'rejected':
    case 'cancelled':
      return 'cancelado';
    default:
      return 'pendiente';
  }
}

// Función para actualizar stock del producto
async function updateProductStock(productId: string, quantity: number) {
  try {
    console.log(`📦 Actualizando stock del producto ${productId}, cantidad: ${quantity}`);
    
    // Obtener stock actual
    const { data: product, error: productError } = await supabase
      .from('productos')
      .select('stock')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('❌ Error obteniendo producto:', productError);
      return;
    }

    if (product) {
      const newStock = Math.max(0, product.stock - quantity);
      
      const { error: updateError } = await supabase
        .from('productos')
        .update({ stock: newStock })
        .eq('id', productId);

      if (updateError) {
        console.error('❌ Error actualizando stock:', updateError);
      } else {
        console.log(`✅ Stock actualizado: ${product.stock} -> ${newStock}`);
      }
    }
  } catch (error) {
    console.error('❌ Error en updateProductStock:', error);
  }
}

// También manejar GET para verificación de MercadoPago
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ 
    message: 'Webhook MercadoPago activo',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
