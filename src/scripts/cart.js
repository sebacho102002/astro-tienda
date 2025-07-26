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
    const existingIndex = this.cart.findIndex(item => item.id === product.id);
    
    if (existingIndex > -1) {
      // Si ya existe, incrementar cantidad
      this.cart[existingIndex].quantity += product.quantity || 1;
    } else {
      // Si no existe, agregar nuevo
      this.cart.push({
        ...product,
        quantity: product.quantity || 1,
        addedAt: new Date().toISOString()
      });
    }
    
    this.saveCart();
    this.showAddToCartMessage(product.name);
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
    const cartContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const checkoutButton = document.getElementById('checkout-button');
    const emptyCartMessage = document.getElementById('empty-cart');
    
    if (!cartContainer) return;

    if (this.cart.length === 0) {
      cartContainer.innerHTML = '';
      if (emptyCartMessage) emptyCartMessage.classList.remove('hidden');
      if (checkoutButton) checkoutButton.disabled = true;
      if (cartTotal) cartTotal.textContent = formatPrice(0);
      return;
    }

    if (emptyCartMessage) emptyCartMessage.classList.add('hidden');
    if (checkoutButton) checkoutButton.disabled = false;

    cartContainer.innerHTML = this.cart.map(item => `
      <div class="bg-white rounded-lg shadow-md p-6 cart-item" data-id="${item.id}">
        <div class="flex items-center space-x-4">
          <img src="${item.image_url || '/placeholder.jpg'}" alt="${item.name}" 
               class="w-20 h-20 object-cover rounded-lg">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-800">${item.name}</h3>
            <p class="text-gray-600">${formatPrice(item.price)}</p>
            <div class="flex items-center space-x-2 mt-2">
              <button onclick="cartManager.updateQuantity('${item.id}', ${item.quantity - 1})" 
                      class="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">-</button>
              <span class="mx-2 font-medium">${item.quantity}</span>
              <button onclick="cartManager.updateQuantity('${item.id}', ${item.quantity + 1})" 
                      class="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">+</button>
            </div>
          </div>
          <div class="text-right">
            <p class="text-lg font-bold text-purple-600">${formatPrice(item.price * item.quantity)}</p>
            <button onclick="cartManager.removeProduct('${item.id}')" 
                    class="text-red-500 hover:text-red-700 mt-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    if (cartTotal) {
      cartTotal.textContent = formatPrice(this.getTotal());
    }
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
        alert('Error procesando el pago. Por favor intenta nuevamente.');
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
