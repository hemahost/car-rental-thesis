import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import { getAdminCars, createCar, updateCar, deleteCar } from "../controllers/adminCars.controller";
import { getAdminBookings, updateBookingStatus } from "../controllers/adminBookings.controller";

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// Cars CRUD
router.get("/cars", getAdminCars);
router.post("/cars", createCar);
router.put("/cars/:id", updateCar);
router.delete("/cars/:id", deleteCar);

// Bookings management
router.get("/bookings", getAdminBookings);
router.patch("/bookings/:id/status", updateBookingStatus);

export default router;
