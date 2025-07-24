import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseClient';

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();
    
    if (!id) {
      console.log('❌ ID de producto no proporcionado');
      return new Response(JSON.stringify({ error: 'ID de producto requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🗑️ Intentando eliminar producto con ID:', id);

    // Primero verificar que el producto existe
    const { data: producto, error: selectError } = await supabase
      .from('productos')
      .select('id, title')
      .eq('id', id)
      .single();

    if (selectError || !producto) {
      console.error('❌ Producto no encontrado:', selectError?.message || 'No existe');
      return new Response(JSON.stringify({ error: 'Producto no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('📦 Producto encontrado:', producto.title);

    // Verificar si el producto tiene pedidos asociados
    const { data: pedidosAsociados, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id')
      .eq('producto_id', id);

    if (pedidosError) {
      console.error('❌ Error verificando pedidos:', pedidosError);
      return new Response(JSON.stringify({ 
        error: 'Error verificando dependencias del producto' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (pedidosAsociados && pedidosAsociados.length > 0) {
      console.log('⚠️ Producto tiene pedidos asociados:', pedidosAsociados.length);
      return new Response(JSON.stringify({ 
        error: `No se puede eliminar "${producto.title}" porque tiene ${pedidosAsociados.length} pedido(s) asociado(s). Primero debe eliminar o modificar los pedidos relacionados.`,
        pedidosCount: pedidosAsociados.length
      }), {
        status: 409, // Conflict
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Producto sin dependencias, procediendo con eliminación');

    // Proceder con la eliminación
    const { error: deleteError } = await supabase
      .from('productos')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Error eliminando producto:', deleteError);
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Producto eliminado exitosamente:', producto.title);
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Producto "${producto.title}" eliminado correctamente` 
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
