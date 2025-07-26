import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseClient';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

// Extender el tipo jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Funciones para obtener datos (reutilizando la lógica del reporte)
async function getVentasPorPeriodo(dias: number) {
  const fechaInicio = new Date();
  fechaInicio.setDate(fechaInicio.getDate() - dias);
  
  const { data } = await supabase
    .from('pedidos')
    .select('created_at, precio_total, status, cliente_email, producto_id, productos(name)')
    .gte('created_at', fechaInicio.toISOString())
    .in('status', ['pagado', 'enviado', 'entregado'])
    .order('created_at', { ascending: false });
    
  return data || [];
}

async function getProductosMasVendidos(limite: number = 50) {
  const { data } = await supabase
    .from('pedidos')
    .select(`
      producto_id,
      productos(name, price, stock, image_url)
    `)
    .in('status', ['pagado', 'enviado', 'entregado'])
    .not('producto_id', 'is', null);
    
  if (!data) return [];
  
  const productosMap = new Map();
  data.forEach(pedido => {
    const producto = pedido.productos as any;
    if (producto) {
      const key = pedido.producto_id;
      if (productosMap.has(key)) {
        productosMap.get(key).ventas += 1;
        productosMap.get(key).ingresos += producto.price || 0;
      } else {
        productosMap.set(key, {
          ...producto,
          id: key,
          ventas: 1,
          ingresos: producto.price || 0
        });
      }
    }
  });
  
  return Array.from(productosMap.values())
    .sort((a, b) => b.ventas - a.ventas)
    .slice(0, limite);
}

async function getEstadisticasClientes(limite: number = 50) {
  const { data } = await supabase
    .from('pedidos')
    .select('cliente_email, precio_total, created_at, status')
    .not('cliente_email', 'is', null);
    
  if (!data) return [];
  
  const clientesMap = new Map();
  
  data.forEach(pedido => {
    const email = pedido.cliente_email;
    if (clientesMap.has(email)) {
      clientesMap.get(email).pedidos += 1;
      if (['pagado', 'enviado', 'entregado'].includes(pedido.status)) {
        clientesMap.get(email).total += parseFloat(pedido.precio_total) || 0;
      }
    } else {
      clientesMap.set(email, {
        email,
        pedidos: 1,
        total: ['pagado', 'enviado', 'entregado'].includes(pedido.status) ? 
               parseFloat(pedido.precio_total) || 0 : 0,
        ultimaCompra: pedido.created_at
      });
    }
  });
  
  return Array.from(clientesMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limite);
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP'
  }).format(price);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export const GET: APIRoute = async ({ url, request }) => {
  try {
    const searchParams = new URL(request.url).searchParams;
    const formato = searchParams.get('formato') || 'csv';
    const tipo = searchParams.get('tipo') || 'ventas';
    const periodo = parseInt(searchParams.get('periodo') || '30');

    let data: any[] = [];
    let filename = '';
    let headers: string[] = [];

    // Obtener datos según el tipo de reporte
    switch (tipo) {
      case 'ventas':
        data = await getVentasPorPeriodo(periodo);
        filename = `ventas_${periodo}dias`;
        headers = ['Fecha', 'Cliente', 'Producto', 'Total', 'Estado'];
        data = data.map(venta => ({
          fecha: formatDate(venta.created_at),
          cliente: venta.cliente_email || 'N/A',
          producto: (venta.productos as any)?.name || 'N/A',
          total: formatPrice(parseFloat(venta.precio_total) || 0),
          estado: venta.status
        }));
        break;

      case 'productos':
        data = await getProductosMasVendidos(100);
        filename = 'productos_mas_vendidos';
        headers = ['Ranking', 'Producto', 'Unidades Vendidas', 'Ingresos Totales', 'Precio Unitario'];
        data = data.map((producto, index) => ({
          ranking: index + 1,
          producto: producto.name || 'N/A',
          unidades: producto.ventas,
          ingresos: formatPrice(producto.ingresos),
          precio: formatPrice(producto.price || 0)
        }));
        break;

      case 'clientes':
        data = await getEstadisticasClientes(100);
        filename = 'clientes_top';
        headers = ['Ranking', 'Email', 'Total Pedidos', 'Total Gastado', 'Última Compra'];
        data = data.map((cliente, index) => ({
          ranking: index + 1,
          email: cliente.email,
          pedidos: cliente.pedidos,
          total: formatPrice(cliente.total),
          ultimaCompra: formatDate(cliente.ultimaCompra)
        }));
        break;

      default:
        return new Response(JSON.stringify({ error: 'Tipo de reporte no válido' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    // Generar archivo según formato
    switch (formato) {
      case 'csv':
        const csv = Papa.unparse({
          fields: headers,
          data: data.map(row => Object.values(row))
        });
        
        return new Response(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.csv"`
          }
        });

      case 'excel':
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        
        // Configurar ancho de columnas
        const colWidths = headers.map(() => ({ wch: 20 }));
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        
        return new Response(excelBuffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.xlsx"`
          }
        });

      case 'pdf':
        const doc = new jsPDF();
        
        // Título
        doc.setFontSize(18);
        doc.text(`Reporte: ${tipo.toUpperCase()}`, 14, 22);
        
        // Fecha
        doc.setFontSize(11);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 14, 32);
        doc.text(`Período: ${periodo} días`, 14, 40);
        
        // Tabla
        const tableData = data.map(row => Object.values(row));
        
        doc.autoTable({
          head: [headers],
          body: tableData,
          startY: 50,
          styles: {
            fontSize: 8,
            cellPadding: 2
          },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255
          },
          alternateRowStyles: {
            fillColor: [240, 240, 240]
          }
        });
        
        const pdfOutput = doc.output('arraybuffer');
        
        return new Response(pdfOutput, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.pdf"`
          }
        });

      default:
        return new Response(JSON.stringify({ error: 'Formato no válido' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('Error en exportación:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
