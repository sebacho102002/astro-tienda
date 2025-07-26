import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseClient';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { pedidoId, nuevoEstado, observaciones } = await request.json();

    if (!pedidoId || !nuevoEstado) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'ID del pedido y nuevo estado son requeridos' 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validar estados permitidos
    const estadosValidos = ['pendiente', 'pagado', 'confirmado', 'preparando', 'enviado', 'en_transito', 'entregado', 'cancelado', 'devuelto'];
    if (!estadosValidos.includes(nuevoEstado)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Estado no válido' 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Actualizar el estado en la base de datos
    const { data, error } = await supabase
      .from('pedidos')
      .update({ 
        status: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', pedidoId)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando pedido:', error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Error actualizando el pedido en la base de datos' 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Agregar entrada al historial con observaciones si se proporcionaron
    if (observaciones && observaciones.trim() !== '') {
      await supabase
        .from('pedidos_historial')
        .insert({
          pedido_id: pedidoId,
          estado_nuevo: nuevoEstado,
          observaciones: observaciones,
          usuario_actualizo: 'Admin'
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        pedido: data,
        message: `Estado actualizado a: ${nuevoEstado}` 
      }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error en API update-status:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Error interno del servidor' 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
