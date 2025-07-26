// 🔧 SCRIPT DE DEBUG PARA LA PÁGINA DE PEDIDOS
// Abre la consola del navegador (F12) y pega este código para hacer debug

console.log('🔍 INICIANDO DEBUG DE PEDIDOS...');

// 1. Verificar que existen los elementos
const botonNuevoPedido = document.querySelector('button[onclick="toggleNuevoPedido()"]');
const formNuevoPedido = document.getElementById('formNuevoPedido');
const formulario = document.getElementById('nuevoPedidoForm');
const selectProducto = document.querySelector('select[name="producto_id"]');

console.log('📋 ELEMENTOS ENCONTRADOS:');
console.log('- Botón Nuevo Pedido:', botonNuevoPedido ? '✅' : '❌');
console.log('- Form Nuevo Pedido:', formNuevoPedido ? '✅' : '❌');
console.log('- Formulario:', formulario ? '✅' : '❌');
console.log('- Select Producto:', selectProducto ? '✅' : '❌');

// 2. Verificar productos en el select
if (selectProducto) {
    console.log('📦 PRODUCTOS EN SELECT:');
    for (let i = 0; i < selectProducto.options.length; i++) {
        const option = selectProducto.options[i];
        console.log(`  ${i}: ${option.text} (value: ${option.value})`);
    }
} else {
    console.log('❌ No se encontró el select de productos');
}

// 3. Probar la función toggleNuevoPedido
console.log('🧪 PROBANDO FUNCIÓN toggleNuevoPedido:');
try {
    if (typeof toggleNuevoPedido === 'function') {
        console.log('✅ Función toggleNuevoPedido existe');
        // toggleNuevoPedido(); // Descomenta esta línea para probar
    } else {
        console.log('❌ Función toggleNuevoPedido NO existe');
    }
} catch (error) {
    console.log('❌ Error al probar toggleNuevoPedido:', error);
}

// 4. Verificar botones de editar estado
const botonesEstado = document.querySelectorAll('button[onclick*="actualizarEstado"]');
console.log('🔧 BOTONES DE ESTADO ENCONTRADOS:', botonesEstado.length);

// 5. Probar función actualizarEstado
console.log('🧪 PROBANDO FUNCIÓN actualizarEstado:');
try {
    if (typeof actualizarEstado === 'function') {
        console.log('✅ Función actualizarEstado existe');
    } else {
        console.log('❌ Función actualizarEstado NO existe');
    }
} catch (error) {
    console.log('❌ Error al probar actualizarEstado:', error);
}

console.log('🔍 DEBUG COMPLETADO - Revisa los resultados arriba');
