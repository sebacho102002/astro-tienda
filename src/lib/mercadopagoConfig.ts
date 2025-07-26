// CONFIGURACIÓN DE DESARROLLO/PRODUCCIÓN PARA MERCADOPAGO
// Usar credenciales de SANDBOX para desarrollo local y PRODUCCIÓN para deploy

const isDevelopment = import.meta.env.NODE_ENV === 'development' || 
                     import.meta.env.DEV === true ||
                     process.env.NODE_ENV === 'development';

const getCredentials = () => {
  if (isDevelopment) {
    // CREDENCIALES DE SANDBOX PARA DESARROLLO
    return {
      accessToken: "TEST-534388899988095-072415-7a35c7be43e7a7b0c40c48a18b993db8-1915334849",
      publicKey: "TEST-7f9096d6-84e6-4f0b-9f6f-5c5b31b4a8a7",
      clientId: "534388899988095",
      clientSecret: "7QwjmqQsxLf4N8vXr8pD2sM9gH4K3kL1"
    };
  } else {
    // CREDENCIALES DE PRODUCCIÓN PARA DEPLOY
    return {
      accessToken: import.meta.env.MERCADOPAGO_ACCESS_TOKEN,
      publicKey: import.meta.env.MERCADOPAGO_PUBLIC_KEY,
      clientId: import.meta.env.MERCADOPAGO_CLIENT_ID,
      clientSecret: import.meta.env.MERCADOPAGO_CLIENT_SECRET
    };
  }
};

export { getCredentials, isDevelopment };
