// 2026: ES Modules are standard
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDb } from './src/models/db.js';

// Route Imports
import businessRoutes from './src/routes/businessRoutes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Modern Express 2026 configuration
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

app.use('/api/business', businessRoutes);

// Using top-level await if Node 14.8+
await initDb();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Quantum Server on :${PORT}`));