import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseClient';

export const GET: APIRoute = async () => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    
    // Obtener alertas del sistema
    const alertas = [];

    // 1. Stock bajo
    const { data: stockBajo } = await supabase
      .from('productos')
      .select('id, title, stock')
      .lte('stock', 5)
      .gt('stock', 0);

    if (stockBajo && stockBajo.length > 0) {
      alertas.push({
        id: 'stock-bajo',
        tipo: 'warning',
        titulo: 'Stock Bajo',
        mensaje: `${stockBajo.length} productos con stock bajo (≤ 5 unidades)`,
        icono: '⚠️',
        accion: '/admin/inventario',
        prioridad: 'alta'
      });
    }

    // 2. Productos sin stock
    const { data: sinStock } = await supabase
      .from('productos')
      .select('id, title')
      .eq('stock', 0);

    if (sinStock && sinStock.length > 0) {
      alertas.push({
        id: 'sin-stock',
        tipo: 'error',
        titulo: 'Sin Stock',
        mensaje: `${sinStock.length} productos agotados`,
        icono: '🚫',
        accion: '/admin/inventario',
        prioridad: 'critica'
      });
    }

    // 3. Pedidos pendientes
    const { data: pedidosPendientes } = await supabase
      .from('pedidos')
      .select('id')
      .eq('status', 'pendiente')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (pedidosPendientes && pedidosPendientes.length > 0) {
      alertas.push({
        id: 'pedidos-pendientes',
        tipo: 'info',
        titulo: 'Pedidos Pendientes',
        mensaje: `${pedidosPendientes.length} pedidos pendientes de las últimas 24h`,
        icono: '📋',
        accion: '/admin/pedidos',
        prioridad: 'media'
      });
    }

    // 4. Ventas del día
    const { data: ventasHoy } = await supabase
      .from('pedidos')
      .select('precio_total')
      .in('status', ['pagado', 'enviado', 'entregado'])
      .gte('created_at', hoy);

    const totalVentasHoy = ventasHoy?.reduce((sum, v) => sum + (v.precio_total || 0), 0) || 0;
    
    if (totalVentasHoy > 100000) { // Si ventas > $100k
      alertas.push({
        id: 'ventas-exitosas',
        tipo: 'success',
        titulo: '¡Excelente día de ventas!',
        mensaje: `Has vendido ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(totalVentasHoy)} hoy`,
        icono: '🎉',
        accion: '/admin/reportes',
        prioridad: 'baja'
      });
    }

    // Ordenar por prioridad
    const prioridadOrden = { critica: 1, alta: 2, media: 3, baja: 4 };
    alertas.sort((a, b) => (prioridadOrden[a.prioridad as keyof typeof prioridadOrden] || 5) - (prioridadOrden[b.prioridad as keyof typeof prioridadOrden] || 5));

    return new Response(JSON.stringify({ 
      alertas,
      total: alertas.length,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error obteniendo notificaciones:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      alertas: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
