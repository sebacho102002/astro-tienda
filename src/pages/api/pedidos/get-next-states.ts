import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseClient';
import { 
  obtenerSiguientesEstados,
  esEstadoValido,
  type EstadoPedido 
} from '../../../lib/estadosPedidos';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { pedidoId } = await request.json();

    if (!pedidoId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'ID del pedido es requerido' 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener el estado actual del pedido
    const { data: pedido, error } = await supabase
      .from('pedidos')
      .select('status')
      .eq('id', pedidoId)
      .single();

    if (error || !pedido) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Pedido no encontrado' 
        }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const estadoActual = pedido.status;

    // Validar que el estado actual es válido
    if (!esEstadoValido(estadoActual)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Estado actual no válido: ${estadoActual}` 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener los siguientes estados permitidos
    const siguientesEstados = obtenerSiguientesEstados(estadoActual as EstadoPedido);

    return new Response(
      JSON.stringify({ 
        success: true,
        estadoActual: estadoActual,
        siguientesEstados: siguientesEstados.map(config => config.interno),
        configuraciones: siguientesEstados
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en get-next-states:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Error interno del servidor' 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
