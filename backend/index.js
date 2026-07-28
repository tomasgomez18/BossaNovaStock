import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import { errorHandler } from './middlewares/ErrorMiddleware.js';
import AuthRoutes from './modules/Auth/AuthRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'ALLOWED_ORIGINS', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
for (const env of requiredEnv) {
  if (!process.env[env]) {
    console.error(`FATAL: Missing required environment variable ${env}`);
    process.exit(1);
  }
}
import SupplierRoutes from './modules/Supplier/SupplierRoutes.js';
import ProductRoutes from './modules/Product/ProductRoutes.js';
import ReturnRoutes from './modules/Return/ReturnRoutes.js';
import SaleRoutes from './modules/Sale/SaleRoutes.js';
import SalesAuthRoutes from './modules/SalesAuth/SalesAuthRoutes.js';
import User from './modules/Auth/AuthModel.js';

const app = express();
const isDev = process.env.NODE_ENV !== 'production';
app.set('env', process.env.NODE_ENV || 'development');
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({ origin: allowedOrigins }));
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Demasiados intentos. Intente de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authLimiter, AuthRoutes);
app.use('/api/suppliers', SupplierRoutes);
app.use('/api/products', ProductRoutes);
app.use('/api/returns', ReturnRoutes);
app.use('/api/sales-auth', authLimiter, SalesAuthRoutes);
app.use('/api/sales', SaleRoutes);

app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

if (!isDev) {
  const frontendDist = path.resolve(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(errorHandler);

const seedAdmin = async () => {
  try {
    const existing = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (!existing) {
        await User.create({
          nombre: 'Admin',
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
          rol: 'admin',
        });
        if (isDev) console.log('Usuario admin creado automáticamente');
      } else {
        if (isDev) console.log('El usuario admin ya existe');
      }
  } catch (error) {
    console.error('Error al crear usuario admin:', error.message);
  }
};

connectDB().then(async () => {
  await seedAdmin();
  app.listen(PORT, () => {
    if (isDev) console.log(`Servidor corriendo en puerto ${PORT}`);
  });
});
