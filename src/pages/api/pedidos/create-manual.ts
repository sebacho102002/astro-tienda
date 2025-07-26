import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseClient';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Validar datos requeridos
    const { 
      producto_id, 
      cliente_nombre, 
      cliente_telefono, 
      cantidad, 
      precio_total, 
      direccion_envio 
    } = data;

    if (!producto_id || !cliente_nombre || !cliente_telefono || !cantidad || !precio_total || !direccion_envio) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos obligatorios' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el producto existe y obtener su precio
    const { data: producto, error: productoError } = await supabase
      .from('productos')
      .select('id, price, title')
      .eq('id', producto_id)
      .single();

    if (productoError || !producto) {
      return new Response(
        JSON.stringify({ error: 'Producto no encontrado' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear el pedido
    const pedidoData = {
      producto_id,
      cliente_nombre,
      cliente_telefono,
      cliente_email: data.cliente_email || null,
      cantidad: parseInt(cantidad),
      precio_unitario: producto.price,
      precio_total: parseFloat(precio_total),
      direccion_envio,
      metodo_pago: 'whatsapp',
      status: 'pendiente',
      notas_admin: data.notas_admin || null,
      created_at: new Date().toISOString()
    };

    const { data: nuevoPedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([pedidoData])
      .select('*, numero_seguimiento')
      .single();

    if (pedidoError) {
      console.error('Error al crear pedido:', pedidoError);
      return new Response(
        JSON.stringify({ 
          error: 'Error al crear el pedido', 
          details: pedidoError.message 
        }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        pedido: nuevoPedido,
        numero_seguimiento: nuevoPedido.numero_seguimiento,
        message: 'Pedido creado exitosamente'
      }), 
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en create-manual:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
