import express from 'express';
import cors from 'cors'
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v1 } from './routes/v1.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/v1", v1);
app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => console.log(`Server running on localhost:${PORT}`))