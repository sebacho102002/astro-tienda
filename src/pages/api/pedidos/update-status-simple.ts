import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseClient';
import { 
  esEstadoValido, 
  puedeTransicionarA, 
  obtenerConfigEstado,
  type EstadoPedido 
} from '../../../lib/estadosPedidos';

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

    // Validar que el estado es válido usando el sistema unificado
    if (!esEstadoValido(status)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Estado no válido: ${status}. Estados permitidos: pendiente, confirmado, preparando, enviado, entregado, cancelado, devuelto` 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener el estado actual del pedido para validar la transición
    const { data: pedidoActual, error: errorPedido } = await supabase
      .from('pedidos')
      .select('status')
      .eq('id', id)
      .single();

    if (errorPedido || !pedidoActual) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Pedido no encontrado' 
        }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const estadoActual = pedidoActual.status as EstadoPedido;

    // Validar que la transición es permitida
    if (estadoActual !== status && !puedeTransicionarA(estadoActual, status as EstadoPedido)) {
      const configActual = obtenerConfigEstado(estadoActual);
      const estadosPermitidos = configActual.siguientesEstados.join(', ');
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Transición no permitida de "${estadoActual}" a "${status}". Estados permitidos: ${estadosPermitidos}` 
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

    // Agregar entrada al historial de cambios
    const configEstado = obtenerConfigEstado(status as EstadoPedido);
    await supabase
      .from('pedidos_historial')
      .insert({
        pedido_id: id,
        estado_anterior: estadoActual,
        estado_nuevo: status,
        observaciones: `Estado actualizado automáticamente: ${configEstado.descripcion}`,
        usuario_actualizo: 'Sistema'
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Estado actualizado a: ${configEstado.cliente}`,
        pedido: data,
        configuracion: configEstado
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
