import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import passport from "passport";
import authRoutes from "./routes/auth";
import carRoutes from "./routes/cars";
import bookingRoutes from "./routes/bookings";
import favoriteRoutes from "./routes/favorites";
import adminRoutes from "./routes/admin.routes";
import reviewRoutes from "./routes/reviews";
import chatbotRoutes from "./routes/chatbot.routes";
import oauthRoutes from "./routes/oauth.routes";
import paymentRoutes from "./routes/payments";
import { setupSwagger } from "./docs/swagger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(cors({
  origin: ["http://localhost:4200"],
  credentials: true,
}));
app.use(passport.initialize());

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
app.use("/api/oauth", oauthRoutes);
app.use("/api/payments", paymentRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
