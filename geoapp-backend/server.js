import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import superadminRoutes from "./routes/superadmin.js";
import loginRoutes from "./routes/login.js";
import estadoadminRoutes from "./routes/estadoadmin.js";
import municipioladminRoutes from "./routes/municipioadmin.js";
import hospitaladmin from "./routes/hospitaladmin.js";
import groups from "./routes/groups.js";
import empleados from "./routes/empleados.js";
import mobileRoutes from "./routes/mobile.js";
import emailRoutes from "./routes/email.js";
import reportesRoutes from "./routes/reportes.js";
import dashboardsRoutes from "./routes/dashboards.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/superadmin", superadminRoutes);
app.use("/api/auth", loginRoutes);
app.use("/api/estadoadmin", estadoadminRoutes);
app.use("/api/municipioadmin", municipioladminRoutes);
app.use("/api/hospitaladmin", hospitaladmin);
app.use("/api/groups", groups);
app.use("/api/employees", empleados);
app.use("/api/mobile", mobileRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/dashboards", dashboardsRoutes);

// Usa el puerto asignado por Render
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
