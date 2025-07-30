import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseClient';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Validar datos requeridos
    const { 
      productos_data, 
      cliente_nombre, 
      cliente_telefono, 
      precio_total, 
      direccion_envio 
    } = data;

    if (!productos_data || !cliente_nombre || !cliente_telefono || !precio_total || !direccion_envio) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos obligatorios' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parsear productos si viene como string
    let productos;
    try {
      productos = typeof productos_data === 'string' ? JSON.parse(productos_data) : productos_data;
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Formato de productos inválido' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(productos) || productos.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Debe incluir al menos un producto' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que todos los productos existen
    const productIds = productos.map(p => p.id);
    const { data: productosExistentes, error: productosError } = await supabase
      .from('productos')
      .select('id, price, title')
      .in('id', productIds);

    if (productosError || !productosExistentes || productosExistentes.length !== productos.length) {
      return new Response(
        JSON.stringify({ error: 'Uno o más productos no existen' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear pedidos individuales para cada producto (mantiene compatibilidad)
    const pedidosCreados = [];
    let numeroPedidoPrincipal = '';

    for (let i = 0; i < productos.length; i++) {
      const producto = productos[i];
      const productoData = productosExistentes.find(p => p.id === producto.id);
      
      if (!productoData) continue;

      const pedidoData = {
        cliente_nombre,
        cliente_telefono,
        cliente_email: data.cliente_email || `whatsapp-${Date.now()}@temp.com`,
        producto_id: producto.id,
        cantidad: parseInt(producto.cantidad),
        precio_unitario: productoData.price,
        precio_total: parseFloat(producto.subtotal),
        direccion_envio,
        metodo_pago: 'whatsapp',
        status: 'pendiente',
        estado: 'pendiente',
        // Agregar información de pedido múltiple en notas_admin
        notas_admin: productos.length > 1 ? 
          `Pedido múltiple (${i + 1}/${productos.length}): ${productos.map(p => `${p.title} x${p.cantidad}`).join(', ')} - ${data.notas_admin || ''}`.trim() : 
          data.notas_admin || null,
        created_at: new Date().toISOString()
      };

      const { data: nuevoPedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert([pedidoData])
        .select('*, numero_seguimiento')
        .single();

      if (pedidoError) {
        console.error('Error al crear pedido:', pedidoError);
        // Si ya se crearon algunos pedidos, intentar limpiar
        if (pedidosCreados.length > 0) {
          const idsCreados = pedidosCreados.map(p => p.id);
          await supabase.from('pedidos').delete().in('id', idsCreados);
        }
        
        return new Response(
          JSON.stringify({ 
            error: 'Error al crear el pedido', 
            details: pedidoError.message 
          }), 
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      pedidosCreados.push(nuevoPedido);
      
      // El primer pedido será el principal para seguimiento
      if (i === 0) {
        numeroPedidoPrincipal = nuevoPedido.numero_seguimiento;
      }
    }

    // Calcular totales reales
    const totalCalculado = pedidosCreados.reduce((sum, pedido) => sum + parseFloat(pedido.precio_total), 0);

    return new Response(
      JSON.stringify({ 
        success: true, 
        pedidos: pedidosCreados,
        numero_seguimiento_principal: numeroPedidoPrincipal,
        total_pedidos: pedidosCreados.length,
        total_calculado: totalCalculado,
        productos_resumen: productos.map(p => `${p.title} x${p.cantidad}`).join(', '),
        message: `${pedidosCreados.length} pedido(s) creado(s) exitosamente`
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
