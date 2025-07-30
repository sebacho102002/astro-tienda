// 🎯 SISTEMA UNIFICADO DE ESTADOS DE PEDIDOS
// Centraliza toda la lógica de estados para evitar inconsistencias

// Estados internos del sistema
export type EstadoPedido = 
  | 'pendiente'     // Pedido creado, esperando confirmación
  | 'confirmado'    // Pedido confirmado y pagado
  | 'preparando'    // Pedido en preparación
  | 'enviado'       // Pedido enviado al cliente
  | 'entregado'     // Pedido entregado exitosamente
  | 'cancelado'     // Pedido cancelado
  | 'devuelto';     // Pedido devuelto por el cliente

// Estados amigables para mostrar al cliente
export type EstadoCliente = 
  | 'Procesando tu pedido'
  | 'Confirmado - En preparación'
  | 'Preparando tu pedido'
  | 'En camino hacia ti'
  | 'Entregado'
  | 'Cancelado'
  | 'Devuelto';

// Configuración visual de cada estado
export interface ConfigEstado {
  interno: EstadoPedido;
  cliente: EstadoCliente;
  emoji: string;
  color: string;
  bgColor: string;
  descripcion: string;
  siguientesEstados: EstadoPedido[];
  requiereAccion: boolean;
}

// Configuración completa de estados
export const ESTADOS_CONFIG: Record<EstadoPedido, ConfigEstado> = {
  'pendiente': {
    interno: 'pendiente',
    cliente: 'Procesando tu pedido',
    emoji: '⏳',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
    descripcion: 'Pedido recibido, esperando confirmación',
    siguientesEstados: ['confirmado', 'cancelado'],
    requiereAccion: true
  },
  'confirmado': {
    interno: 'confirmado',
    cliente: 'Confirmado - En preparación',
    emoji: '✅',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
    descripcion: 'Pedido confirmado y pagado',
    siguientesEstados: ['preparando', 'cancelado'],
    requiereAccion: true
  },
  'preparando': {
    interno: 'preparando',
    cliente: 'Preparando tu pedido',
    emoji: '📦',
    color: 'text-orange-800',
    bgColor: 'bg-orange-100',
    descripcion: 'Pedido en proceso de preparación',
    siguientesEstados: ['enviado', 'cancelado'],
    requiereAccion: true
  },
  'enviado': {
    interno: 'enviado',
    cliente: 'En camino hacia ti',
    emoji: '🚛',
    color: 'text-indigo-800',
    bgColor: 'bg-indigo-100',
    descripcion: 'Pedido enviado, en tránsito al cliente',
    siguientesEstados: ['entregado', 'devuelto'],
    requiereAccion: false
  },
  'entregado': {
    interno: 'entregado',
    cliente: 'Entregado',
    emoji: '🎉',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    descripcion: 'Pedido entregado exitosamente',
    siguientesEstados: ['devuelto'],
    requiereAccion: false
  },
  'cancelado': {
    interno: 'cancelado',
    cliente: 'Cancelado',
    emoji: '❌',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
    descripcion: 'Pedido cancelado',
    siguientesEstados: [],
    requiereAccion: false
  },
  'devuelto': {
    interno: 'devuelto',
    cliente: 'Devuelto',
    emoji: '↩️',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100',
    descripcion: 'Pedido devuelto por el cliente',
    siguientesEstados: [],
    requiereAccion: true
  }
};

// Validación de transiciones
export function puedeTransicionarA(estadoActual: EstadoPedido, nuevoEstado: EstadoPedido): boolean {
  const config = ESTADOS_CONFIG[estadoActual];
  return config.siguientesEstados.includes(nuevoEstado);
}

// Obtener configuración de un estado
export function obtenerConfigEstado(estado: EstadoPedido): ConfigEstado {
  return ESTADOS_CONFIG[estado];
}

// Obtener estados que requieren acción del admin
export function obtenerEstadosConAccion(): EstadoPedido[] {
  return Object.values(ESTADOS_CONFIG)
    .filter(config => config.requiereAccion)
    .map(config => config.interno);
}

// Mapear estados de MercadoPago a nuestro sistema
export function mapearEstadoMercadoPago(estadoMP: string): EstadoPedido {
  switch (estadoMP) {
    case 'approved':
      return 'confirmado';
    case 'pending':
    case 'in_process':
      return 'pendiente';
    case 'rejected':
    case 'cancelled':
      return 'cancelado';
    default:
      return 'pendiente';
  }
}

// Obtener lista de todos los estados válidos
export function obtenerEstadosValidos(): EstadoPedido[] {
  return Object.keys(ESTADOS_CONFIG) as EstadoPedido[];
}

// Obtener color CSS completo para un estado
export function obtenerClaseColor(estado: EstadoPedido): string {
  const config = ESTADOS_CONFIG[estado];
  return `${config.bgColor} ${config.color}`;
}

// Obtener próximos estados posibles para un estado actual
export function obtenerSiguientesEstados(estadoActual: EstadoPedido): ConfigEstado[] {
  const config = ESTADOS_CONFIG[estadoActual];
  return config.siguientesEstados.map(estado => ESTADOS_CONFIG[estado]);
}

// Validar si un estado existe
export function esEstadoValido(estado: string): estado is EstadoPedido {
  return estado in ESTADOS_CONFIG;
}

// Obtener progreso del pedido (0-100%)
export function obtenerProgresoPedido(estado: EstadoPedido): number {
  const progreso: Record<EstadoPedido, number> = {
    'pendiente': 10,
    'confirmado': 25,
    'preparando': 50,
    'enviado': 75,
    'entregado': 100,
    'cancelado': 0,
    'devuelto': 0
  };
  return progreso[estado];
}

// Obtener tiempo estimado en cada estado (en horas)
export function obtenerTiempoEstimado(estado: EstadoPedido): number {
  const tiempos: Record<EstadoPedido, number> = {
    'pendiente': 2,     // 2 horas para confirmar
    'confirmado': 4,    // 4 horas para empezar preparación
    'preparando': 24,   // 1 día para preparar
    'enviado': 72,      // 3 días para entregar
    'entregado': 0,     // Estado final
    'cancelado': 0,     // Estado final
    'devuelto': 48      // 2 días para procesar devolución
  };
  return tiempos[estado];
}

// Obtener mensaje de timeline para el cliente
export function obtenerMensajeTimeline(estado: EstadoPedido): string {
  const mensajes: Record<EstadoPedido, string> = {
    'pendiente': 'Hemos recibido tu pedido y lo estamos verificando.',
    'confirmado': 'Tu pedido ha sido confirmado y el pago procesado exitosamente.',
    'preparando': 'Estamos preparando cuidadosamente tus productos.',
    'enviado': 'Tu pedido está en camino. ¡Pronto lo tendrás!',
    'entregado': '¡Genial! Tu pedido ha sido entregado exitosamente.',
    'cancelado': 'Tu pedido ha sido cancelado.',
    'devuelto': 'Tu pedido ha sido devuelto y estamos procesando el reembolso.'
  };
  return mensajes[estado];
}
