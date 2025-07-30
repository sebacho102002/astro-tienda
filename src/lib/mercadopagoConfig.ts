// CONFIGURACIÓN DE MERCADOPAGO PARA CHECKOUT PRO
// ✅ CREDENCIALES DE PRODUCCIÓN (necesarias para Checkout Pro)
// Las credenciales de prueba no funcionan con Checkout Pro

const isDevelopment = import.meta.env.NODE_ENV === 'development' || 
                     import.meta.env.DEV === true ||
                     process.env.NODE_ENV === 'development';

const getCredentials = () => {
  // ✅ CREDENCIALES DE PRODUCCIÓN - CHECKOUT PRO
  // Estas credenciales funcionan tanto en desarrollo como en producción
  return {
    accessToken: "APP_USR-5343888999883095-072214-a1348df4251a3efd08efeb3d1d8b5ce3-2563365067",
    publicKey: "APP_USR-7f9096d6-84ea-4e1c-900c-bd38c3393f82",
    clientId: "5343888999883095",
    clientSecret: "7QwjmqQsxL1EPdvmvkUgWPs3fk6UOhyT",
    userId: "2563365067"
  };
};

// Funciones auxiliares para el API
export const getMercadoPagoCredentials = () => getCredentials();
export const getIsProduction = () => !isDevelopment;

export { getCredentials, isDevelopment };
