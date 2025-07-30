import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseClient';

export const GET: APIRoute = async () => {
  try {
    // Intentar obtener las columnas de la tabla pedidos
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .limit(1);

    if (error) {
      return new Response(
        JSON.stringify({ 
          error: 'Error getting table structure', 
          details: error.message 
        }), 
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Si hay datos, mostrar las columnas
    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

    return new Response(
      JSON.stringify({ 
        success: true,
        columns: columns,
        sample_record: data?.[0] || null,
        record_count: data?.length || 0
      }), 
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};
