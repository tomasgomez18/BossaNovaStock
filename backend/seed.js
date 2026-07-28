import 'dotenv/config';
import bcrypt from 'bcryptjs';

const email = process.env.ADMIN_EMAIL || 'admin@ejemplo.com';
const plainPassword = process.env.ADMIN_PASSWORD || 'password';

const hash = bcrypt.hashSync(plainPassword, 10);

console.log('=== CREDENCIALES (desde .env) ===');
console.log(`Email:    ${email}`);
console.log(`Password: ${plainPassword}`);
console.log();
console.log('El usuario admin se crea automáticamente al iniciar el servidor.');
console.log();
console.log('Hash generado:');
console.log(hash);
