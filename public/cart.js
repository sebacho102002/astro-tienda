// 🛒 Sistema de carrito de compras mejorado con MercadoPago

// Clase para manejar el carrito
class ShoppingCart {
  constructor() {
    this.cart = this.loadCart();
    this.updateCartUI();
  }

  // Cargar carrito desde localStorage
  loadCart() {
    try {
      return JSON.parse(localStorage.getItem('cart')) || [];
    } catch (error) {
      console.error('Error cargando carrito:', error);
      return [];
    }
  }

  // Guardar carrito en localStorage
  saveCart() {
    try {
      localStorage.setItem('cart', JSON.stringify(this.cart));
      this.updateCartUI();
    } catch (error) {
      console.error('Error guardando carrito:', error);
    }
  }

  // Agregar producto al carrito
  addProduct(product) {
    console.log('🛒 Agregando producto:', product);
    const existingIndex = this.cart.findIndex(item => item.id === product.id);
    
    if (existingIndex > -1) {
      // Si ya existe, incrementar cantidad
      this.cart[existingIndex].quantity += product.quantity || 1;
      console.log('✅ Producto actualizado, nueva cantidad:', this.cart[existingIndex].quantity);
    } else {
      // Si no existe, agregar nuevo
      this.cart.push({
        ...product,
        quantity: product.quantity || 1,
        addedAt: new Date().toISOString()
      });
      console.log('✅ Producto agregado como nuevo item');
    }
    
    this.saveCart();
    this.showAddToCartMessage(product.name || product.title);
    console.log('🛒 Carrito actualizado, total items:', this.getTotalItems());
  }

  // Remover producto del carrito
  removeProduct(productId) {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.saveCart();
  }

  // Actualizar cantidad de un producto
  updateQuantity(productId, newQuantity) {
    const index = this.cart.findIndex(item => item.id === productId);
    if (index > -1) {
      if (newQuantity <= 0) {
        this.removeProduct(productId);
      } else {
        this.cart[index].quantity = newQuantity;
        this.saveCart();
      }
    }
  }

  // Obtener total del carrito
  getTotal() {
    return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Obtener cantidad total de items
  getTotalItems() {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  // Limpiar carrito
  clear() {
    this.cart = [];
    this.saveCart();
  }

  // Actualizar UI del carrito
  updateCartUI() {
    const totalItems = this.getTotalItems();
    const cartBadge = document.getElementById('cart-badge');
    const cartCount = document.getElementById('cart-count');
    
    if (cartBadge) {
      if (totalItems > 0) {
        cartBadge.textContent = totalItems;
        cartBadge.classList.remove('hidden');
      } else {
        cartBadge.classList.add('hidden');
      }
    }
    
    if (cartCount) {
      cartCount.textContent = totalItems;
    }

    // Actualizar página del carrito si estamos en ella
    if (window.location.pathname === '/carrito') {
      this.renderCartPage();
    }
  }

  // Mostrar mensaje de producto agregado
  showAddToCartMessage(productName) {
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>¡${productName} agregado al carrito!</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Mostrar animación
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remover después de 3 segundos
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // Renderizar página del carrito
  renderCartPage() {
    console.log('🛒 Renderizando carrito, items:', this.cart.length);
    
    const cartContainer = document.getElementById('cart-items');
    const emptyCartDiv = document.getElementById('empty-cart');
    const cartContentDiv = document.getElementById('cart-content');
    const subtotalElement = document.getElementById('subtotal');
    const totalElement = document.getElementById('total');
    
    if (!cartContainer) {
      console.error('❌ No se encontró el contenedor del carrito');
      return;
    }

    if (this.cart.length === 0) {
      console.log('🛒 Carrito vacío');
      if (emptyCartDiv) emptyCartDiv.classList.remove('hidden');
      if (cartContentDiv) cartContentDiv.classList.add('hidden');
      return;
    }

    console.log('🛒 Mostrando carrito con productos');
    if (emptyCartDiv) emptyCartDiv.classList.add('hidden');
    if (cartContentDiv) cartContentDiv.classList.remove('hidden');

    cartContainer.innerHTML = this.cart.map(item => `
      <div class="bg-gray-50 rounded-lg p-4 mb-4">
        <div class="flex items-center space-x-4">
          <img src="${item.image_url || '/placeholder.jpg'}" alt="${item.name || item.title}" 
               class="w-16 h-16 object-cover rounded">
          <div class="flex-1">
            <h3 class="font-semibold">${item.name || item.title}</h3>
            <p class="text-gray-600">${formatPrice(item.price)}</p>
            <div class="flex items-center space-x-2 mt-2">
              <button onclick="window.cartManager.updateQuantity('${item.id}', ${item.quantity - 1})" 
                      class="bg-gray-200 px-2 py-1 rounded text-sm">-</button>
              <span class="px-3">${item.quantity}</span>
              <button onclick="window.cartManager.updateQuantity('${item.id}', ${item.quantity + 1})" 
                      class="bg-gray-200 px-2 py-1 rounded text-sm">+</button>
            </div>
          </div>
          <div class="text-right">
            <p class="font-bold">${formatPrice(item.price * item.quantity)}</p>
            <button onclick="window.cartManager.removeProduct('${item.id}')" 
                    class="text-red-500 text-sm mt-1">Eliminar</button>
          </div>
        </div>
      </div>
    `).join('');

    const total = this.getTotal();
    if (subtotalElement) subtotalElement.textContent = formatPrice(total);
    if (totalElement) totalElement.textContent = formatPrice(total);
    
    console.log('✅ Carrito renderizado, total:', formatPrice(total));
  }

  // Proceder al checkout con MercadoPago
  async proceedToCheckout(clientInfo) {
    try {
      if (this.cart.length === 0) {
        alert('El carrito está vacío');
        return;
      }

      // Mostrar loading
      const checkoutButton = document.getElementById('checkout-button');
      if (checkoutButton) {
        checkoutButton.disabled = true;
        checkoutButton.innerHTML = `
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Procesando...
        `;
      }

      // Crear preferencia de pago
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: this.cart,
          clienteInfo: clientInfo
        })
      });

      const result = await response.json();

      if (result.success && result.init_point) {
        // Redirigir a MercadoPago
        window.location.href = result.init_point;
      } else {
        console.error('Error creando preferencia:', result);
        
        // Manejo especial para credenciales inválidas
        if (result.code === 'INVALID_CREDENTIALS') {
          alert(`🔑 ${result.error}\n\n${result.details}`);
        } else if (result.code === 'INVALID_ACCESS_TOKEN') {
          alert(`🔑 ${result.error}\n\n${result.details}`);
        } else {
          alert(`Error procesando el pago: ${result.error || 'Error desconocido'}\n\n${result.details || 'Por favor intenta nuevamente.'}`);
        }
      }

    } catch (error) {
      console.error('Error en checkout:', error);
      alert('Error de conexión. Por favor intenta nuevamente.');
    } finally {
      // Restaurar botón
      const checkoutButton = document.getElementById('checkout-button');
      if (checkoutButton) {
        checkoutButton.disabled = false;
        checkoutButton.innerHTML = 'Pagar con MercadoPago';
      }
    }
  }
}

// Función para formatear precios
function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP'
  }).format(price);
}

// Instancia global del carrito
const cartManager = new ShoppingCart();

// 📱 FUNCIONALIDAD COMPLETA DE WHATSAPP
const WhatsAppManager = {
  // Configuración de WhatsApp
  config: {
    phoneNumber: '3053947290', // Cambia por tu número real
    businessName: 'Tu Tienda Online',
    welcomeMessage: '¡Hola! Me interesa hacer un pedido:'
  },

  // Generar mensaje completo del pedido
  generateOrderMessage(cart, clientInfo) {
    let message = `${this.config.welcomeMessage}\n\n`;
    
    // Información del cliente
    if (clientInfo) {
      message += `👤 *DATOS DEL CLIENTE:*\n`;
      message += `• Nombre: ${clientInfo.nombre}\n`;
      message += `• Email: ${clientInfo.email}\n`;
      message += `• Teléfono: ${clientInfo.telefono}\n`;
      message += `• Dirección: ${clientInfo.direccion}\n`;
      if (clientInfo.codigoPostal) message += `• Código Postal: ${clientInfo.codigoPostal}\n`;
      message += `\n`;
    }

    // Productos del pedido
    message += `🛒 *MI PEDIDO:*\n`;
    let total = 0;
    
    cart.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      
      message += `${index + 1}. *${item.title || item.name}*\n`;
      message += `   • Cantidad: ${item.quantity}\n`;
      message += `   • Precio unitario: ${this.formatPrice(item.price)}\n`;
      message += `   • Subtotal: ${this.formatPrice(itemTotal)}\n\n`;
    });

    // Total
    message += `💰 *TOTAL: ${this.formatPrice(total)}*\n\n`;
    
    // Instrucciones adicionales
    message += `📝 *SIGUIENTE PASO:*\n`;
    message += `Por favor, indica algunas especificaciones de tu pedido, método de pago y entrega.\n\n`;
    message += `¡Gracias por elegir ${this.config.businessName}! 🛍️`;

    return message;
  },

  // Formatear precio
  formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(price);
  },

  // Enviar pedido por WhatsApp
  sendOrder(cart, clientInfo) {
    const message = this.generateOrderMessage(cart, clientInfo);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${this.config.phoneNumber}?text=${encodedMessage}`;
    
    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank');
    
    return true;
  },

  // Validar información del cliente
  validateClientInfo(clientInfo) {
    const errors = [];
    
    if (!clientInfo.nombre || clientInfo.nombre.trim().length < 2) {
      errors.push('El nombre es obligatorio (mínimo 2 caracteres)');
    }
    
    if (!clientInfo.email || !this.isValidEmail(clientInfo.email)) {
      errors.push('El email es obligatorio y debe ser válido');
    }
    
    if (!clientInfo.telefono || clientInfo.telefono.trim().length < 7) {
      errors.push('El teléfono es obligatorio (mínimo 7 dígitos)');
    }
    
    if (!clientInfo.direccion || clientInfo.direccion.trim().length < 5) {
      errors.push('La dirección es obligatoria (mínimo 5 caracteres)');
    }
    
    return errors;
  },

  // Validar email
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
};

// 🚀 FUNCIÓN PRINCIPAL PARA PEDIDO POR WHATSAPP
async function handleWhatsAppOrder() {
  try {
    console.log('📱 Iniciando pedido por WhatsApp...');
    
    // Verificar que hay productos en el carrito
    const cart = cartManager.cart;
    if (!cart || cart.length === 0) {
      alert('❌ Tu carrito está vacío. Agrega productos antes de hacer el pedido.');
      return;
    }

    // Obtener información del cliente del formulario
    const clientInfo = {
      nombre: document.getElementById('nombre')?.value?.trim() || '',
      email: document.getElementById('email')?.value?.trim() || '',
      telefono: document.getElementById('telefono')?.value?.trim() || '',
      direccion: document.getElementById('direccion')?.value?.trim() || '',
      codigoPostal: document.getElementById('codigoPostal')?.value?.trim() || ''
    };

    console.log('👤 Información del cliente:', clientInfo);

    // Validar información del cliente
    const validationErrors = WhatsAppManager.validateClientInfo(clientInfo);
    if (validationErrors.length > 0) {
      alert('❌ Por favor completa la información:\n\n' + validationErrors.join('\n'));
      return;
    }

    // Confirmar antes de enviar
    const confirmMessage = `¿Confirmas tu pedido por WhatsApp?\n\n` +
                          `📱 Se abrirá WhatsApp con tu pedido completo:\n` +
                          `• ${cart.length} producto(s)\n` +
                          `• Total: ${formatPrice(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0))}\n\n` +
                          `Podrás revisar y modificar el mensaje antes de enviarlo.`;

    if (!confirm(confirmMessage)) {
      console.log('❌ Usuario canceló el pedido por WhatsApp');
      return;
    }

    // Enviar pedido por WhatsApp
    const success = WhatsAppManager.sendOrder(cart, clientInfo);
    
    if (success) {
      console.log('✅ Pedido enviado por WhatsApp exitosamente');
      
      // Mostrar mensaje de éxito
      alert('✅ ¡Perfecto!\n\nSe abrió WhatsApp con tu pedido completo.\nPuedes revisar y modificar el mensaje antes de enviarlo.\n\n¡Gracias por tu pedido! 🛍️');
      
      // Opcional: Limpiar carrito después de enviar por WhatsApp
      // cartManager.clear();
    }

  } catch (error) {
    console.error('❌ Error enviando pedido por WhatsApp:', error);
    alert('❌ Hubo un error enviando tu pedido por WhatsApp. Por favor intenta nuevamente.');
  }
}

// Funciones de compatibilidad con el código existente
export function addToCart(product) {
  cartManager.addProduct(product);
}

export function getCart() {
  return cartManager.cart;
}

export function clearCart() {
  cartManager.clear();
}

// Hacer disponible globalmente
window.cartManager = cartManager;
window.addToCart = addToCart;
window.getCart = getCart;
window.clearCart = clearCart;
window.handleWhatsAppOrder = handleWhatsAppOrder;
window.WhatsAppManager = WhatsAppManager;
