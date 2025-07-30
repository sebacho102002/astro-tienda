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

    // Validar que el estado es válido usando el sistema unificado
    if (!esEstadoValido(nuevoEstado)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Estado no válido: ${nuevoEstado}. Estados permitidos: pendiente, confirmado, preparando, enviado, entregado, cancelado, devuelto` 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Obtener el estado actual del pedido para validar la transición
    const { data: pedidoActual, error: errorPedido } = await supabase
      .from('pedidos')
      .select('status')
      .eq('id', pedidoId)
      .single();

    if (errorPedido || !pedidoActual) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Pedido no encontrado' 
        }), 
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const estadoActual = pedidoActual.status as EstadoPedido;

    // Validar que la transición es permitida (permitir mantener el mismo estado)
    if (estadoActual !== nuevoEstado && !puedeTransicionarA(estadoActual, nuevoEstado as EstadoPedido)) {
      const configActual = obtenerConfigEstado(estadoActual);
      const estadosPermitidos = configActual.siguientesEstados.join(', ');
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Transición no permitida de "${estadoActual}" a "${nuevoEstado}". Estados permitidos: ${estadosPermitidos}` 
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

    // Agregar entrada al historial con observaciones
    const configEstado = obtenerConfigEstado(nuevoEstado as EstadoPedido);
    const observacionesFinal = observaciones && observaciones.trim() !== '' 
      ? observaciones 
      : `Estado actualizado: ${configEstado.descripcion}`;

    await supabase
      .from('pedidos_historial')
      .insert({
        pedido_id: pedidoId,
        estado_anterior: estadoActual,
        estado_nuevo: nuevoEstado,
        observaciones: observacionesFinal,
        usuario_actualizo: 'Admin'
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        pedido: data,
        message: `Estado actualizado a: ${configEstado.cliente}`,
        configuracion: configEstado
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
