import express from 'express';
import cors from 'cors'
import { v1 } from './routes/v1.js';

const PORT = 3000;
const app = express();
app.use(cors());
app.use(express.json());

let lastCrawl = null;

app.use("/api/v1", v1);

app.listen(PORT, () => console.log(`Server running on localhost:${PORT}`))