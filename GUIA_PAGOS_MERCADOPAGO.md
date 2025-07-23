# 💳 Sistema de Pagos Online - Guía Completa

## 🎯 Cómo Funciona el Sistema de Pagos

### **Flujo General:**
1. **Usuario ve producto** → Precio y botón "Comprar"
2. **Click en Comprar** → Se verifica configuración de pagos del producto
3. **Redirige a pasarela** → MercadoPago, Stripe, o PayPal
4. **Usuario paga** → En la plataforma externa
5. **Confirmación** → El sistema recibe notificación del pago
6. **Actualiza estado** → Pedido confirmado, reduce stock, etc.

---

## 🔵 **MercadoPago - Integración Completa**

### **Paso 1: Configuración en MercadoPago**

#### **1.1 Crear Cuenta de Desarrollador**
```
1. Ve a: https://www.mercadopago.com.ar/developers
2. Crea cuenta o inicia sesión
3. Ve a "Mis aplicaciones" → "Crear aplicación"
4. Selecciona "Pagos online" → "Checkout Pro"
```

#### **1.2 Obtener Credenciales**
```
Necesitas estas keys:
✅ ACCESS_TOKEN (para crear preferencias)
✅ PUBLIC_KEY (para frontend)
✅ CLIENT_ID y CLIENT_SECRET (para webhooks)
```

### **Paso 2: Configuración en tu Proyecto**

#### **2.1 Variables de Entorno (.env)**
```env
# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890-abcdef-ghijklmnop
MERCADOPAGO_PUBLIC_KEY=APP_USR-abcd1234-efgh-5678-ijkl-mnopqrstuvwx
MERCADOPAGO_WEBHOOK_SECRET=tu_webhook_secret
```

#### **2.2 Instalar SDK**
```bash
npm install mercadopago
```

### **Paso 3: Crear API para Generar Preferencias**

#### **3.1 API Route: `/api/mercadopago/create-preference.ts`**
```typescript
import type { APIRoute } from 'astro';
import mercadopago from 'mercadopago';

// Configurar MercadoPago
mercadopago.configure({
  access_token: import.meta.env.MERCADOPAGO_ACCESS_TOKEN || ''
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const { productId, title, price, quantity = 1 } = await request.json();

    const preference = {
      items: [
        {
          id: productId,
          title: title,
          unit_price: parseFloat(price),
          quantity: quantity,
          currency_id: 'ARS', // o 'USD', 'MXN', etc.
        }
      ],
      back_urls: {
        success: `${new URL(request.url).origin}/pago/success`,
        failure: `${new URL(request.url).origin}/pago/failure`,
        pending: `${new URL(request.url).origin}/pago/pending`
      },
      auto_return: 'approved',
      notification_url: `${new URL(request.url).origin}/api/mercadopago/webhook`,
      external_reference: `producto_${productId}_${Date.now()}`,
      payer: {
        name: "Cliente",
        email: "cliente@example.com"
      }
    };

    const response = await mercadopago.preferences.create(preference);
    
    return new Response(JSON.stringify({
      preference_id: response.body.id,
      init_point: response.body.init_point // URL para redirigir al usuario
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### **Paso 4: Frontend - Botón de Comprar**

#### **4.1 En la página del producto** (`/src/pages/producto/[id].astro`)
```javascript
async function buyWithMercadoPago(productId, title, price) {
  try {
    const response = await fetch('/api/mercadopago/create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, title, price })
    });

    const data = await response.json();
    
    if (data.init_point) {
      // Redirigir a MercadoPago
      window.location.href = data.init_point;
    } else {
      alert('Error al crear preferencia de pago');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al procesar pago');
  }
}
```

#### **4.2 HTML del botón**
```html
<button 
  onclick="buyWithMercadoPago('123', 'Producto Ejemplo', 1500)"
  class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
>
  💳 Comprar con MercadoPago
</button>
```

### **Paso 5: Webhook para Confirmaciones**

#### **5.1 API Route: `/api/mercadopago/webhook.ts`**
```typescript
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabaseClient';
import mercadopago from 'mercadopago';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Verificar que es una notificación de pago
    if (body.type === 'payment') {
      const paymentId = body.data.id;
      
      // Obtener detalles del pago desde MercadoPago
      const payment = await mercadopago.payment.findById(paymentId);
      
      if (payment.body.status === 'approved') {
        // Pago aprobado - actualizar base de datos
        const externalReference = payment.body.external_reference;
        const productId = externalReference.split('_')[1];
        
        // Crear pedido en la base de datos
        await supabase.from('pedidos').insert({
          product_id: productId,
          payment_id: paymentId,
          status: 'paid',
          amount: payment.body.transaction_amount,
          payment_method: 'mercadopago',
          customer_email: payment.body.payer.email,
          created_at: new Date().toISOString()
        });
        
        // Reducir stock del producto
        await supabase.rpc('reduce_stock', {
          product_id: productId,
          quantity: 1
        });
        
        console.log('✅ Pago confirmado:', paymentId);
      }
    }
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('❌ Error en webhook:', error);
    return new Response('Error', { status: 500 });
  }
};
```

### **Paso 6: Páginas de Resultado**

#### **6.1 Éxito: `/src/pages/pago/success.astro`**
```astro
---
const { payment_id, status, external_reference } = Astro.url.searchParams;
---

<html>
<head>
  <title>Pago Exitoso</title>
</head>
<body>
  <div class="container mx-auto p-8 text-center">
    <h1 class="text-3xl text-green-600 mb-4">🎉 ¡Pago Exitoso!</h1>
    <p class="mb-4">Tu pago ha sido procesado correctamente.</p>
    <p class="text-sm text-gray-600">ID de Pago: {payment_id}</p>
    <a href="/" class="bg-blue-600 text-white px-6 py-2 rounded mt-4 inline-block">
      Volver al Inicio
    </a>
  </div>
</body>
</html>
```

---

## 🔧 **Configuración en el Admin Panel**

### **Cómo Configurar MercadoPago para un Producto:**

1. **Ve al admin** → `/admin/nuevo-producto` o editar producto
2. **Habilita pagos online** ✅
3. **Selecciona MercadoPago** ✅
4. **En "MercadoPago Preference ID"** → Deja vacío (se genera automáticamente)
5. **Guarda el producto**

### **Lo que hace internamente:**
- Cuando el producto tiene `payment_config.mercadopago.enabled = true`
- El botón "Comprar" aparece en la página del producto
- Al hacer click, llama a la API que crea la preferencia
- Redirige al usuario a MercadoPago para pagar

---

## 💰 **Precios y Comisiones MercadoPago**

### **Comisiones Típicas (Argentina):**
- **Tarjeta de crédito**: ~2.9% + $2 ARS
- **Tarjeta de débito**: ~1.8% + $1 ARS
- **Dinero en cuenta**: Gratis
- **Efectivo (Rapipago, etc.)**: ~2.2% + $5 ARS

---

## 🚀 **Próximos Pasos para Implementar:**

1. **Crear cuenta MercadoPago Developer**
2. **Obtener credenciales (ACCESS_TOKEN, PUBLIC_KEY)**
3. **Instalar SDK**: `npm install mercadopago`
4. **Agregar variables de entorno**
5. **Crear APIs de preferencia y webhook**
6. **Probar con cuenta de prueba**
7. **Ir a producción**

### **🧪 Modo de Prueba:**
MercadoPago tiene credenciales de prueba para que puedas probar todo sin dinero real.

---

**¿Quieres que implementemos alguna parte específica de esta integración?** 🎯
