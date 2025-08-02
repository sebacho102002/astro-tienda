#!/usr/bin/env node

// 🚀 Script de inicio para producción
// Configura el entorno y ejecuta el servidor de Astro

import { spawn } from 'child_process';

// Configurar variables de entorno
process.env.NODE_ENV = 'production';
process.env.HOST = '0.0.0.0';
process.env.PORT = process.env.PORT || '10000';

console.log('🚀 Iniciando servidor Astro...');
console.log(`📍 Entorno: ${process.env.NODE_ENV}`);
console.log(`🌐 Host: ${process.env.HOST}`);
console.log(`🔌 Puerto: ${process.env.PORT}`);

// Ejecutar el servidor de Astro
const server = spawn('node', ['./dist/server/entry.mjs'], {
  stdio: 'inherit',
  env: process.env
});

server.on('error', (error) => {
  console.error('❌ Error iniciando servidor:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`📝 Servidor terminado con código: ${code}`);
  process.exit(code);
});
