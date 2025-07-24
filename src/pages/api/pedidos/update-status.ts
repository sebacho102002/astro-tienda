import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseClient';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { pedidoId, nuevoEstado } = await request.json();

    if (!pedidoId || !nuevoEstado) {
      return new Response(
        JSON.stringify({ 
          error: 'ID del pedido y nuevo estado son requeridos' 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validar estados permitidos
    const estadosValidos = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(nuevoEstado)) {
      return new Response(
        JSON.stringify({ 
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
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', pedidoId)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando pedido:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Error actualizando el pedido en la base de datos' 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
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
        error: 'Error interno del servidor' 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
