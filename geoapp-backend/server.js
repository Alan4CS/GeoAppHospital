import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import superadminRoutes from "./routes/superadmin.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/superadmin", superadminRoutes);


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
