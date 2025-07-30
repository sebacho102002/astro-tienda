import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabaseClient';

export const GET: APIRoute = async () => {
  try {
    // Obtener productos
    const { data: productos, error } = await supabase
      .from('productos')
      .select('id, title, price')
      .limit(10);

    if (error) {
      return new Response(
        JSON.stringify({ 
          error: 'Database error', 
          details: error.message,
          productos: []
        }), 
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        count: productos?.length || 0,
        productos: productos || []
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
        details: error instanceof Error ? error.message : 'Unknown error',
        productos: []
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};
