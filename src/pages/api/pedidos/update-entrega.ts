// 🚛 API para actualizar información de entrega de un pedido
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseClient';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { 
      pedidoId, 
      transportadora, 
      numeroGuia, 
      fechaEstimada, 
      direccionEntrega, 
      notasEntrega 
    } = await request.json();

    if (!pedidoId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID del pedido es requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Preparar datos de actualización
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (transportadora) updateData.transportadora = transportadora;
    if (numeroGuia) updateData.numero_guia = numeroGuia;
    if (fechaEstimada) updateData.fecha_estimada_entrega = fechaEstimada;
    if (direccionEntrega) updateData.direccion_entrega = direccionEntrega;
    if (notasEntrega) updateData.notas_entrega = notasEntrega;

    // Actualizar información de entrega
    const { data, error } = await supabase
      .from('pedidos')
      .update(updateData)
      .eq('id', pedidoId)
      .select('*')
      .single();

    if (error) {
      console.error('Error actualizando entrega:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error actualizando información de entrega'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Agregar entrada al historial
    let observaciones = 'Información de entrega actualizada:';
    if (transportadora) observaciones += ` Transportadora: ${transportadora}.`;
    if (numeroGuia) observaciones += ` Guía: ${numeroGuia}.`;
    if (fechaEstimada) observaciones += ` Fecha estimada: ${fechaEstimada}.`;

    await supabase
      .from('pedidos_historial')
      .insert({
        pedido_id: pedidoId,
        estado_nuevo: data.status,
        observaciones: observaciones,
        usuario_actualizo: 'Admin'
      });

    return new Response(JSON.stringify({
      success: true,
      message: 'Información de entrega actualizada correctamente',
      pedido: data
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en la API de entrega:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
