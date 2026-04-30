import { Express } from "express";
import swaggerUi from "swagger-ui-express";

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Car Rental Backend API",
    version: "1.0.0",
    description:
      "API documentation for the Car Rental backend service. For protected endpoints, click Authorize and paste only the JWT token value without the Bearer prefix. Swagger UI adds the Bearer prefix automatically.",
  },
  servers: [
    {
      url: "/",
      description: "Current server",
    },
  ],
  tags: [
    { name: "Health", description: "Basic service status endpoint." },
    { name: "Auth", description: "Authentication, password reset, avatar, and 2FA endpoints." },
    { name: "Cars", description: "Public car listing and single-car retrieval endpoints." },
    { name: "Bookings", description: "Booking availability, reservation creation, and booking management endpoints." },
    { name: "Favorites", description: "Favorite-car management for the logged-in user." },
    { name: "Reviews", description: "Review retrieval and authenticated review submission or deletion." },
    { name: "Payments", description: "Stripe payment intent, confirmation, and webhook endpoints." },
    { name: "Admin", description: "Administrator-only endpoints for stats, users, cars, and bookings." },
    { name: "Chatbot", description: "Public AI assistant recommendation endpoint." },
    { name: "OAuth", description: "Google/GitHub OAuth routes and configured-provider status." },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Paste only the JWT token. Swagger UI will add the Bearer prefix automatically.",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              message: { type: "string", example: "Validation failed" },
            },
          },
        },
      },
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "cmmbuser123" },
          name: { type: "string", example: "Jane Doe" },
          email: { type: "string", example: "jane@example.com" },
          role: { type: "string", example: "USER" },
          phone: { type: "string", nullable: true, example: "+36 70 123 4567" },
          address: { type: "string", nullable: true, example: "Budapest" },
          avatarUrl: { type: "string", nullable: true, example: "/uploads/avatars/file.png" },
          twoFactorEnabled: { type: "boolean", example: false },
        },
      },
      Car: {
        type: "object",
        properties: {
          id: { type: "string", example: "cmmb6ngzw0007bntrd52s8mn2" },
          brand: { type: "string", example: "BMW" },
          model: { type: "string", example: "X5" },
          type: { type: "string", example: "SUV" },
          pricePerDay: { type: "number", example: 120 },
          description: { type: "string", example: "Premium family SUV" },
          imageUrl: { type: "string", nullable: true, example: "https://example.com/car.jpg" },
          transmission: { type: "string", nullable: true, example: "Automatic" },
          fuelType: { type: "string", nullable: true, example: "Diesel" },
          seats: { type: "integer", nullable: true, example: 5 },
          horsepower: { type: "integer", nullable: true, example: 335 },
          mileageKm: { type: "integer", nullable: true, example: 25000 },
          color: { type: "string", nullable: true, example: "Black" },
          city: { type: "string", nullable: true, example: "Budapest" },
        },
      },
      Booking: {
        type: "object",
        properties: {
          id: { type: "string", example: "cmmbbooking123" },
          userId: { type: "string", example: "cmmbuser123" },
          carId: { type: "string", example: "cmmb6ngzw0007bntrd52s8mn2" },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          totalPrice: { type: "number", example: 240 },
          status: { type: "string", example: "PENDING" },
          paymentStatus: { type: "string", example: "UNPAID" },
          paymentIntentId: { type: "string", nullable: true, example: "pi_123456789" },
          pickupLocation: { type: "string", nullable: true, example: "Budapest Airport" },
          dropoffLocation: { type: "string", nullable: true, example: "Budapest Downtown" },
        },
      },
      Review: {
        type: "object",
        properties: {
          id: { type: "string", example: "cmmbreview123" },
          userId: { type: "string", example: "cmmbuser123" },
          carId: { type: "string", example: "cmmb6ngzw0007bntrd52s8mn2" },
          rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
          comment: { type: "string", example: "Excellent experience and clean car." },
        },
      },
      Favorite: {
        type: "object",
        properties: {
          id: { type: "string", example: "cmmbfav123" },
          userId: { type: "string", example: "cmmbuser123" },
          carId: { type: "string", example: "cmmb6ngzw0007bntrd52s8mn2" },
        },
      },
      ChatbotMessage: {
        type: "object",
        required: ["message"],
        properties: {
          message: { type: "string", example: "I need an SUV under 150 per day." },
          history: {
            type: "array",
            items: {
              type: "object",
              properties: {
                role: { type: "string", enum: ["user", "assistant"] },
                content: { type: "string", example: "Do you have any SUVs?" },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Service is running",
          },
        },
      },
    },

    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        description:
          "Password policy: at least 8 characters, at least one lowercase letter, at least one uppercase letter, and at least one special character.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password" },
                  phone: { type: "string" },
                  address: { type: "string" },
                },
              },
              example: {
                name: "Jane Doe",
                email: "jane@example.com",
                password: "Strong!Pass1",
                phone: "+36 70 123 4567",
                address: "Budapest",
              },
            },
          },
        },
        responses: {
          "201": { description: "User created" },
          "400": { description: "Password policy or validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "Email already in use" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login user",
        description: "Use the returned token in the Authorize dialog. Paste only the token value, not `Bearer <token>`.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password" },
                },
              },
              example: {
                email: "jane@example.com",
                password: "Strong!Pass1",
              },
            },
          },
        },
        responses: {
          "200": { description: "Login successful or 2FA required" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user profile",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Current user profile" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/auth/profile": {
      put: {
        tags: ["Auth"],
        summary: "Update current user profile",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  phone: { type: "string" },
                  address: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Profile updated" },
          "409": { description: "Email already in use" },
        },
      },
    },
    "/api/auth/avatar": {
      post: {
        tags: ["Auth"],
        summary: "Upload avatar",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["avatar"],
                properties: {
                  avatar: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Avatar uploaded" },
          "400": { description: "No file uploaded or invalid file type" },
        },
      },
      delete: {
        tags: ["Auth"],
        summary: "Remove avatar",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Avatar removed" },
        },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset code",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Reset code flow initiated" },
        },
      },
    },
    "/api/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password using a 6-digit reset code",
        description:
          "New password must follow the same policy as registration: 8+ characters, uppercase, lowercase, and special character.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "token", "newPassword"],
                properties: {
                  email: { type: "string", format: "email" },
                  token: { type: "string", example: "123456" },
                  newPassword: { type: "string", format: "password" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Password reset successful" },
          "400": { description: "Password policy or validation error" },
          "401": { description: "Invalid or expired reset code" },
        },
      },
    },
    "/api/auth/change-password": {
      put: {
        tags: ["Auth"],
        summary: "Change password",
        security: [{ bearerAuth: [] }],
        description:
          "New password must follow the same policy as registration: 8+ characters, uppercase, lowercase, and special character.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: { type: "string", format: "password" },
                  newPassword: { type: "string", format: "password" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Password changed" },
          "400": { description: "Password policy or social-login restriction" },
          "401": { description: "Current password invalid" },
        },
      },
    },
    "/api/auth/2fa/setup": {
      post: {
        tags: ["Auth"],
        summary: "Start 2FA setup and return QR code",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "2FA secret and QR code generated" },
        },
      },
    },
    "/api/auth/2fa/enable": {
      post: {
        tags: ["Auth"],
        summary: "Enable 2FA using authenticator code",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["code"],
                properties: {
                  code: { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "2FA enabled" },
          "401": { description: "Invalid verification code" },
        },
      },
    },
    "/api/auth/2fa/disable": {
      post: {
        tags: ["Auth"],
        summary: "Disable 2FA using authenticator code",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["code"],
                properties: {
                  code: { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "2FA disabled" },
          "401": { description: "Invalid verification code" },
        },
      },
    },
    "/api/auth/2fa/verify": {
      post: {
        tags: ["Auth"],
        summary: "Exchange temporary token and TOTP code for a full JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["tempToken", "code"],
                properties: {
                  tempToken: { type: "string" },
                  code: { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "2FA verification successful" },
          "401": { description: "Invalid or expired session/code" },
        },
      },
    },

    "/api/cars": {
      get: {
        tags: ["Cars"],
        summary: "List cars with optional filters",
        parameters: [
          { name: "brand", in: "query", schema: { type: "string" } },
          { name: "type", in: "query", schema: { type: "string" } },
          { name: "minPrice", in: "query", schema: { type: "number" } },
          { name: "maxPrice", in: "query", schema: { type: "number" } },
          { name: "transmission", in: "query", schema: { type: "string" } },
          { name: "fuelType", in: "query", schema: { type: "string" } },
          { name: "seats", in: "query", schema: { type: "integer" } },
          { name: "minHorsepower", in: "query", schema: { type: "integer" } },
          { name: "maxHorsepower", in: "query", schema: { type: "integer" } },
          { name: "minMileageKm", in: "query", schema: { type: "integer" } },
          { name: "maxMileageKm", in: "query", schema: { type: "integer" } },
          { name: "color", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Cars fetched" },
        },
      },
    },
    "/api/cars/{id}": {
      get: {
        tags: ["Cars"],
        summary: "Get single car by ID",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, example: "cmmb6ngzw0007bntrd52s8mn2" },
        ],
        responses: {
          "200": { description: "Car fetched" },
          "404": { description: "Car not found" },
        },
      },
    },

    "/api/bookings/me": {
      get: {
        tags: ["Bookings"],
        summary: "Get current user bookings",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Bookings fetched" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/bookings/availability": {
      get: {
        tags: ["Bookings"],
        summary: "Check whether a car is available for a date range",
        parameters: [
          { name: "carId", in: "query", required: true, schema: { type: "string" }, example: "cmmb6ngzw0007bntrd52s8mn2" },
          { name: "startDate", in: "query", required: true, schema: { type: "string", format: "date" }, example: "2099-03-20" },
          { name: "endDate", in: "query", required: true, schema: { type: "string", format: "date" }, example: "2099-03-22" },
        ],
        responses: {
          "200": { description: "Availability checked" },
          "400": { description: "Invalid request" },
        },
      },
    },
    "/api/bookings/unavailable/{carId}": {
      get: {
        tags: ["Bookings"],
        summary: "Get unavailable booking ranges for a car",
        parameters: [
          { name: "carId", in: "path", required: true, schema: { type: "string" }, example: "cmmb6ngzw0007bntrd52s8mn2" },
        ],
        responses: {
          "200": { description: "Unavailable booking ranges fetched" },
        },
      },
    },
    "/api/bookings": {
      post: {
        tags: ["Bookings"],
        summary: "Create booking",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["carId", "startDate", "endDate", "pickupLocation", "dropoffLocation"],
                properties: {
                  carId: { type: "string" },
                  startDate: { type: "string", format: "date" },
                  endDate: { type: "string", format: "date" },
                  pickupLocation: { type: "string" },
                  dropoffLocation: { type: "string" },
                },
              },
              example: {
                carId: "cmmb6ngzw0007bntrd52s8mn2",
                startDate: "2099-03-20",
                endDate: "2099-03-22",
                pickupLocation: "Budapest Airport",
                dropoffLocation: "Budapest Downtown",
              },
            },
          },
        },
        responses: {
          "201": { description: "Booking created" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
          "404": { description: "Car not found" },
          "409": { description: "Car not available" },
        },
      },
    },
    "/api/bookings/{id}": {
      delete: {
        tags: ["Bookings"],
        summary: "Cancel booking",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Booking cancelled or refunded" },
          "403": { description: "Not authorized" },
          "404": { description: "Booking not found" },
        },
      },
    },

    "/api/favorites": {
      get: {
        tags: ["Favorites"],
        summary: "Get current user favorites",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Favorites fetched" },
        },
      },
    },
    "/api/favorites/{carId}": {
      post: {
        tags: ["Favorites"],
        summary: "Add car to favorites",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "carId", in: "path", required: true, schema: { type: "string" }, example: "cmmb6ngzw0007bntrd52s8mn2" },
        ],
        responses: {
          "201": { description: "Added to favorites" },
          "404": { description: "Car not found" },
        },
      },
      delete: {
        tags: ["Favorites"],
        summary: "Remove car from favorites",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "carId", in: "path", required: true, schema: { type: "string" }, example: "cmmb6ngzw0007bntrd52s8mn2" },
        ],
        responses: {
          "200": { description: "Removed from favorites" },
          "404": { description: "Favorite not found" },
        },
      },
    },

    "/api/reviews/{id}": {
      get: {
        tags: ["Reviews"],
        summary: "Get all reviews for a car",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, example: "cmmb6ngzw0007bntrd52s8mn2" },
        ],
        responses: {
          "200": { description: "Reviews fetched" },
        },
      },
      post: {
        tags: ["Reviews"],
        summary: "Create or update current user review for a car",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, example: "cmmb6ngzw0007bntrd52s8mn2" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rating", "comment"],
                properties: {
                  rating: { type: "integer", minimum: 1, maximum: 5 },
                  comment: { type: "string", maxLength: 500 },
                },
              },
              example: {
                rating: 5,
                comment: "Excellent experience and clean car.",
              },
            },
          },
        },
        responses: {
          "201": { description: "Review submitted" },
          "400": { description: "Validation error" },
          "404": { description: "Car not found" },
        },
      },
      delete: {
        tags: ["Reviews"],
        summary: "Delete own review by review ID",
        security: [{ bearerAuth: [] }],
        description: "Pass a review ID here, not a car ID.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, example: "cmmbreview123" },
        ],
        responses: {
          "200": { description: "Review deleted" },
          "403": { description: "Not authorized" },
          "404": { description: "Review not found" },
        },
      },
    },

    "/api/payments/create-intent": {
      post: {
        tags: ["Payments"],
        summary: "Create Stripe payment intent for an existing pending booking",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["bookingId"],
                properties: {
                  bookingId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Payment intent created" },
          "400": { description: "Invalid booking or payment state" },
          "403": { description: "Not authorized" },
          "404": { description: "Booking not found" },
          "409": { description: "Booking expired" },
        },
      },
    },
    "/api/payments/confirm": {
      post: {
        tags: ["Payments"],
        summary: "Confirm successful payment and finalize booking",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["bookingId"],
                properties: {
                  bookingId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Payment confirmed and booking updated" },
          "400": { description: "Invalid booking or payment state" },
          "403": { description: "Not authorized" },
          "404": { description: "Booking not found" },
          "409": { description: "Booking expired" },
        },
      },
    },
    "/api/payments/webhook": {
      post: {
        tags: ["Payments"],
        summary: "Stripe webhook endpoint",
        description:
          "Consumes raw request body and should normally be called by Stripe, not manually from Swagger UI.",
        requestBody: {
          required: false,
        },
        responses: {
          "200": { description: "Webhook received" },
          "400": { description: "Webhook signature verification failed" },
        },
      },
    },

    "/api/admin/stats": {
      get: {
        tags: ["Admin"],
        summary: "Get admin dashboard statistics",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Stats fetched" },
          "403": { description: "Admin access required" },
        },
      },
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List all users",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Users fetched" },
          "403": { description: "Admin access required" },
        },
      },
    },
    "/api/admin/users/{id}": {
      get: {
        tags: ["Admin"],
        summary: "Get single user detail",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "User fetched" },
          "404": { description: "User not found" },
        },
      },
      put: {
        tags: ["Admin"],
        summary: "Update user profile fields",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  phone: { type: "string" },
                  address: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "User updated" },
          "404": { description: "User not found" },
          "409": { description: "Email already in use" },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete a user account",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "User deleted" },
          "400": { description: "Protected admin restriction" },
          "404": { description: "User not found" },
        },
      },
    },
    "/api/admin/users/{id}/role": {
      patch: {
        tags: ["Admin"],
        summary: "Update user role",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: {
                  role: { type: "string", enum: ["USER", "ADMIN"] },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Role updated" },
          "400": { description: "Protected admin restriction or invalid role" },
          "404": { description: "User not found" },
        },
      },
    },
    "/api/admin/cars": {
      get: {
        tags: ["Admin"],
        summary: "Admin list cars",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Cars fetched" },
          "403": { description: "Admin access required" },
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Admin create car",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["brand", "model", "type", "pricePerDay", "description"],
                properties: {
                  brand: { type: "string" },
                  model: { type: "string" },
                  type: { type: "string" },
                  pricePerDay: { type: "number" },
                  description: { type: "string" },
                  imageUrl: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Car created" },
          "403": { description: "Admin access required" },
        },
      },
    },
    "/api/admin/cars/{id}": {
      put: {
        tags: ["Admin"],
        summary: "Admin update car",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["brand", "model", "type", "pricePerDay", "description"],
                properties: {
                  brand: { type: "string" },
                  model: { type: "string" },
                  type: { type: "string" },
                  pricePerDay: { type: "number" },
                  description: { type: "string" },
                  imageUrl: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Car updated" },
          "404": { description: "Car not found" },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Admin delete car",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Car deleted" },
          "404": { description: "Car not found" },
        },
      },
    },
    "/api/admin/bookings": {
      get: {
        tags: ["Admin"],
        summary: "Admin list bookings",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"],
            },
          },
        ],
        responses: {
          "200": { description: "Bookings fetched" },
        },
      },
    },
    "/api/admin/bookings/{id}/status": {
      patch: {
        tags: ["Admin"],
        summary: "Admin update booking status",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Booking status updated" },
          "404": { description: "Booking not found" },
        },
      },
    },

    "/api/chatbot": {
      post: {
        tags: ["Chatbot"],
        summary: "Send a recommendation or car-related question to the AI assistant",
        description: "Public endpoint. Authorization header is optional and only used for conversation linkage if present.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChatbotMessage" },
            },
          },
        },
        responses: {
          "200": { description: "Chatbot response generated" },
          "400": { description: "Message is required" },
        },
      },
    },

    "/api/oauth/providers": {
      get: {
        tags: ["OAuth"],
        summary: "Get configured OAuth providers",
        responses: {
          "200": { description: "Provider availability returned" },
        },
      },
    },
    "/api/oauth/google": {
      get: {
        tags: ["OAuth"],
        summary: "Start Google OAuth login flow",
        responses: {
          "302": { description: "Redirects to Google" },
        },
      },
    },
    "/api/oauth/google/callback": {
      get: {
        tags: ["OAuth"],
        summary: "Google OAuth callback",
        description: "Browser redirect endpoint used by Google OAuth flow.",
        responses: {
          "302": { description: "Redirects to frontend with JWT token" },
        },
      },
    },
    "/api/oauth/github": {
      get: {
        tags: ["OAuth"],
        summary: "Start GitHub OAuth login flow",
        responses: {
          "302": { description: "Redirects to GitHub" },
        },
      },
    },
    "/api/oauth/github/callback": {
      get: {
        tags: ["OAuth"],
        summary: "GitHub OAuth callback",
        description: "Browser redirect endpoint used by GitHub OAuth flow.",
        responses: {
          "302": { description: "Redirects to frontend with JWT token" },
        },
      },
    },
  },
};

export function setupSwagger(app: Express) {
  app.get("/api-docs.json", (_req, res) => {
    res.json(openApiSpec);
  });

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );
}
