import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseClient';

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();
    
    if (!id) {
      console.log('❌ ID de pedido no proporcionado');
      return new Response(JSON.stringify({ error: 'ID de pedido requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🗑️ Intentando eliminar pedido con ID:', id);

    // Primero verificar que el pedido existe
    const { data: pedido, error: selectError } = await supabase
      .from('pedidos')
      .select(`
        id, 
        status,
        productos:producto_id (title)
      `)
      .eq('id', id)
      .single();

    if (selectError || !pedido) {
      console.error('❌ Pedido no encontrado:', selectError?.message || 'No existe');
      return new Response(JSON.stringify({ error: 'Pedido no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('📦 Pedido encontrado:', pedido.id, 'Estado:', pedido.status);

    // Verificar si el pedido se puede eliminar (opcional: solo permitir eliminar ciertos estados)
    if (pedido.status === 'entregado') {
      console.warn('⚠️ Intentando eliminar pedido entregado:', pedido.id);
      return new Response(JSON.stringify({ 
        error: 'No se puede eliminar un pedido que ya fue entregado',
        warning: 'Los pedidos entregados deben conservarse para el historial'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Proceder con la eliminación
    const { error: deleteError } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Error eliminando pedido:', deleteError);
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Pedido eliminado exitosamente:', pedido.id);
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Pedido #${pedido.id} eliminado correctamente`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error procesando eliminación:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
