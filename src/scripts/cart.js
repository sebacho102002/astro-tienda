// Agrega un producto al carrito en localStorage
export function addToCart(product) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push(product);
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Devuelve todos los productos del carrito
export function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

// Limpia el carrito
export function clearCart() {
  localStorage.removeItem("cart");
}
