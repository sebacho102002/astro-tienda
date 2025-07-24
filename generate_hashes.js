// Script para generar hashes de contraseñas
// Ejecutar con: node generate_hashes.js

import bcrypt from 'bcrypt';

const passwords = [
  { email: 'admin@tutienda.com', password: 'admin123', role: 'super_admin' },
  { email: 'manager@tutienda.com', password: 'manager123', role: 'manager' },
  { email: 'editor@tutienda.com', password: 'editor123', role: 'editor' },
  { email: 'viewer@tutienda.com', password: 'viewer123', role: 'viewer' }
];

async function generateHashes() {
  console.log('-- Hashes para usuarios de prueba --');
  
  for (const user of passwords) {
    const hash = await bcrypt.hash(user.password, 12);
    console.log(`INSERT INTO admin_users (email, name, password_hash, role) VALUES (
  '${user.email}',
  '${user.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}',
  '${hash}',
  '${user.role}'
);`);
  }
}

generateHashes().catch(console.error);
