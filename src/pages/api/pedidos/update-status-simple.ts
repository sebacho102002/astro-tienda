import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseClient';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'ID del pedido y estado son requeridos' 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar estados permitidos
    const estadosValidos = ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(status)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Estado no válido' 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Actualizar el estado en la base de datos
    const { data, error } = await supabase
      .from('pedidos')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando pedido:', error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Error al actualizar el pedido',
          details: error.message
        }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Estado actualizado a: ${status}`,
        pedido: data
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en update-status:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
