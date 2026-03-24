import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/auth";
import carRoutes from "./routes/cars";
import bookingRoutes from "./routes/bookings";
import favoriteRoutes from "./routes/favorites";
import adminRoutes from "./routes/admin.routes";
import reviewRoutes from "./routes/reviews";
import chatbotRoutes from "./routes/chatbot.routes";
import { setupSwagger } from "./docs/swagger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({ origin: "http://localhost:4200" }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
setupSwagger(app);

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Backend running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/chatbot", chatbotRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
