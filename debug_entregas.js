// 🔧 SCRIPT DE DEBUG PARA LA PÁGINA DE ENTREGAS
// Abre la consola del navegador (F12) y pega este código para hacer debug

console.log('🚛 INICIANDO DEBUG DE ENTREGAS...');

// 1. Verificar que existen los elementos principales
const tablaEntregas = document.getElementById('tabla-pedidos');
const modalEntrega = document.getElementById('modal-entrega');
const botonesFilros = document.querySelectorAll('button[onclick*="filtrarPedidos"]');
const botonesGestionar = document.querySelectorAll('button[onclick*="gestionarEntrega"]');
const botonesEnviado = document.querySelectorAll('button[onclick*="marcarEnviado"]');
const botonesEntregado = document.querySelectorAll('button[onclick*="marcarEntregado"]');

console.log('📋 ELEMENTOS ENCONTRADOS:');
console.log('- Tabla Entregas:', tablaEntregas ? '✅' : '❌');
console.log('- Modal Entrega:', modalEntrega ? '✅' : '❌');
console.log('- Botones Filtros:', botonesFilros.length);
console.log('- Botones Gestionar:', botonesGestionar.length);
console.log('- Botones Enviado:', botonesEnviado.length);
console.log('- Botones Entregado:', botonesEntregado.length);

// 2. Verificar funciones en window
console.log('🧪 VERIFICANDO FUNCIONES GLOBALES:');
const funciones = [
  'filtrarPedidos',
  'gestionarEntrega', 
  'marcarEnviado',
  'marcarEntregado',
  'cerrarModal',
  'confirmarGestionEntrega'
];

funciones.forEach(func => {
  if (typeof window[func] === 'function') {
    console.log(`✅ window.${func} existe`);
  } else {
    console.log(`❌ window.${func} NO existe`);
  }
});

// 3. Contar pedidos por estado
const filasPedidos = document.querySelectorAll('.pedido-row');
const estadisticas = {};

filasPedidos.forEach(fila => {
  const estado = fila.getAttribute('data-estado');
  estadisticas[estado] = (estadisticas[estado] || 0) + 1;
});

console.log('📊 ESTADÍSTICAS DE PEDIDOS:');
Object.entries(estadisticas).forEach(([estado, cantidad]) => {
  console.log(`  ${estado}: ${cantidad} pedidos`);
});

// 4. Verificar elementos del modal
console.log('🔧 ELEMENTOS DEL MODAL:');
const elementosModal = [
  'transportadora',
  'numero-guia', 
  'fecha-estimada',
  'direccion-entrega',
  'notas-entrega'
];

elementosModal.forEach(id => {
  const elemento = document.getElementById(id);
  console.log(`- ${id}:`, elemento ? '✅' : '❌');
});

// 5. Función de prueba para filtros
console.log('🧪 PROBANDO FILTRO "todos":');
try {
  if (typeof window.filtrarPedidos === 'function') {
    window.filtrarPedidos('todos');
    console.log('✅ Filtro "todos" ejecutado correctamente');
  }
} catch (error) {
  console.log('❌ Error al probar filtro:', error);
}

console.log('🔍 DEBUG COMPLETADO - Revisa los resultados arriba');
console.log('💡 Para probar otras funciones manualmente:');
console.log('   - window.filtrarPedidos("listos")');
console.log('   - window.filtrarPedidos("enviados")');  
console.log('   - window.filtrarPedidos("urgentes")');
