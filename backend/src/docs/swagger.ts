import { Express } from "express";
import swaggerUi from "swagger-ui-express";

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Car Rental Backend API",
    version: "1.0.0",
    description:
      "API documentation for the Car Rental backend service. For protected endpoints, click Authorize and paste only the JWT token value without the Bearer prefix. Many Try it out errors are expected when a route needs authentication, admin access, real database IDs, or future booking dates.",
  },
  servers: [
    {
      url: "/",
      description: "Current server",
    },
  ],
  tags: [
    { name: "Health", description: "Basic service status endpoint." },
    { name: "Auth", description: "Authentication and profile endpoints. Login first, then use Authorize with the returned JWT token only." },
    { name: "Cars", description: "Public car listing endpoints. Use these endpoints first to get a real car ID for favorites, reviews, and bookings." },
    { name: "Bookings", description: "User booking endpoints. Require a logged-in user for protected operations and valid future dates for booking creation." },
    { name: "Favorites", description: "Favorite management for the current logged-in user. Requires a real car ID from the Cars endpoints." },
    { name: "Reviews", description: "Review endpoints. GET and POST use a car ID. DELETE uses a review ID returned from the GET response." },
    { name: "Admin", description: "Admin-only endpoints. A regular USER token returns 403 by design." },
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
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "clx123abc" },
          name: { type: "string", example: "Jane Doe" },
          email: { type: "string", example: "jane@example.com" },
          role: { type: "string", example: "USER" },
          phone: { type: "string", nullable: true, example: "+123456789" },
          address: { type: "string", nullable: true, example: "New York" },
          avatarUrl: { type: "string", nullable: true, example: "/uploads/avatars/abc.png" },
        },
      },
      Car: {
        type: "object",
        properties: {
          id: { type: "string", example: "car_1" },
          brand: { type: "string", example: "Toyota" },
          model: { type: "string", example: "Corolla" },
          type: { type: "string", example: "Sedan" },
          pricePerDay: { type: "number", example: 59.99 },
          description: { type: "string", example: "Reliable city car" },
          imageUrl: { type: "string", nullable: true, example: "https://example.com/car.jpg" },
        },
      },
      Booking: {
        type: "object",
        properties: {
          id: { type: "string", example: "booking_1" },
          userId: { type: "string", example: "user_1" },
          carId: { type: "string", example: "car_1" },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          totalPrice: { type: "number", example: 179.97 },
          status: { type: "string", example: "PENDING" },
        },
      },
      Review: {
        type: "object",
        properties: {
          id: { type: "string", example: "review_1" },
          userId: { type: "string", example: "user_1" },
          carId: { type: "string", example: "car_1" },
          rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
          comment: { type: "string", example: "Excellent experience" },
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
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "User created" },
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
                password: "password123",
              },
            },
          },
        },
        responses: {
          "200": { description: "Login successful with JWT token" },
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
          "200": { description: "Current user", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, user: { $ref: "#/components/schemas/User" } } } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/api/auth/profile": {
      put: {
        tags: ["Auth"],
        summary: "Update profile",
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
          "200": { description: "Updated profile" },
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
                  avatar: {
                    type: "string",
                    format: "binary",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Avatar uploaded" },
          "400": { description: "No file uploaded" },
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
          "200": { description: "Reset flow initiated" },
        },
      },
    },
    "/api/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password with code",
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
          "401": { description: "Invalid or expired code" },
        },
      },
    },
    "/api/auth/change-password": {
      put: {
        tags: ["Auth"],
        summary: "Change password",
        security: [{ bearerAuth: [] }],
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
          "401": { description: "Current password invalid" },
        },
      },
    },

    "/api/cars": {
      get: {
        tags: ["Cars"],
        summary: "List cars",
        parameters: [
          { name: "brand", in: "query", schema: { type: "string" } },
          { name: "type", in: "query", schema: { type: "string" } },
          { name: "minPrice", in: "query", schema: { type: "number" } },
          { name: "maxPrice", in: "query", schema: { type: "number" } },
        ],
        responses: {
          "200": { description: "Cars fetched", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, cars: { type: "array", items: { $ref: "#/components/schemas/Car" } } } } } } },
        },
      },
    },
    "/api/cars/{id}": {
      get: {
        tags: ["Cars"],
        summary: "Get single car",
        description: "Use a real car ID from GET /api/cars. A placeholder value returns 404.",
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
        summary: "Check booking availability",
        description: "Use a real car ID from GET /api/cars and future dates in YYYY-MM-DD format.",
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
    "/api/bookings": {
      post: {
        tags: ["Bookings"],
        summary: "Create booking",
        description: "Requires a logged-in user, a real car ID from GET /api/cars, and future dates. Past dates or invalid IDs return errors by design.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["carId", "startDate", "endDate"],
                properties: {
                  carId: { type: "string" },
                  startDate: { type: "string", format: "date" },
                  endDate: { type: "string", format: "date" },
                },
              },
              example: {
                carId: "cmmb6ngzw0007bntrd52s8mn2",
                startDate: "2099-03-20",
                endDate: "2099-03-22",
              },
            },
          },
        },
        responses: {
          "201": { description: "Booking created" },
          "401": { description: "Unauthorized" },
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
          "200": { description: "Booking cancelled" },
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
        description: "Requires a logged-in user. Use a real car ID from GET /api/cars.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "carId", in: "path", required: true, schema: { type: "string" }, example: "cmmb6ngzw0007bntrd52s8mn2" },
        ],
        responses: {
          "201": { description: "Added to favorites" },
          "401": { description: "Unauthorized" },
          "404": { description: "Car not found" },
        },
      },
      delete: {
        tags: ["Favorites"],
        summary: "Remove car from favorites",
        description: "Requires a logged-in user. Use the same car ID previously added to favorites.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "carId", in: "path", required: true, schema: { type: "string" }, example: "cmmb6ngzw0007bntrd52s8mn2" },
        ],
        responses: {
          "200": { description: "Removed from favorites" },
          "401": { description: "Unauthorized" },
          "404": { description: "Favorite not found" },
        },
      },
    },

    "/api/reviews/{id}": {
      get: {
        tags: ["Reviews"],
        summary: "Get reviews for a car",
        description: "Pass a real car ID in the `id` path parameter. Use GET /api/cars first if needed.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, example: "cmmb6ngzw0007bntrd52s8mn2" },
        ],
        responses: {
          "200": { description: "Reviews fetched" },
        },
      },
      post: {
        tags: ["Reviews"],
        summary: "Create or update current user review",
        description: "Pass a real car ID in the `id` path parameter and authorize first.",
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
          "401": { description: "Unauthorized" },
          "404": { description: "Car not found" },
        },
      },
      delete: {
        tags: ["Reviews"],
        summary: "Delete own review",
        description: "Pass a review ID in the `id` path parameter, not a car ID. Get the review ID from GET /api/reviews/{carId}.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, example: "review_1" },
        ],
        responses: {
          "200": { description: "Review deleted" },
          "401": { description: "Unauthorized" },
          "403": { description: "Not authorized" },
          "404": { description: "Review not found" },
        },
      },
    },

    "/api/admin/cars": {
      get: {
        tags: ["Admin"],
        summary: "Admin list cars",
        description: "Requires an ADMIN token. A normal USER token returns 403.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Cars fetched" },
          "401": { description: "Unauthorized" },
          "403": { description: "Admin access required" },
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Admin create car",
        description: "Requires an ADMIN token. A normal USER token returns 403.",
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
                  pricePerDay: { type: "number", minimum: 0.01 },
                  description: { type: "string" },
                  imageUrl: { type: "string", nullable: true },
                },
              },
              example: {
                brand: "Toyota",
                model: "Camry",
                type: "Sedan",
                pricePerDay: 75,
                description: "Comfortable midsize sedan",
                imageUrl: "https://example.com/camry.jpg",
              },
            },
          },
        },
        responses: {
          "201": { description: "Car created" },
          "401": { description: "Unauthorized" },
          "403": { description: "Admin access required" },
        },
      },
    },
    "/api/admin/cars/{id}": {
      put: {
        tags: ["Admin"],
        summary: "Admin update car",
        description: "Requires an ADMIN token and a real car ID.",
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
                required: ["brand", "model", "type", "pricePerDay", "description"],
                properties: {
                  brand: { type: "string" },
                  model: { type: "string" },
                  type: { type: "string" },
                  pricePerDay: { type: "number", minimum: 0.01 },
                  description: { type: "string" },
                  imageUrl: { type: "string", nullable: true },
                },
              },
              example: {
                brand: "Toyota",
                model: "Camry",
                type: "Sedan",
                pricePerDay: 80,
                description: "Updated car description",
                imageUrl: "https://example.com/camry.jpg",
              },
            },
          },
        },
        responses: {
          "200": { description: "Car updated" },
          "401": { description: "Unauthorized" },
          "403": { description: "Admin access required" },
          "404": { description: "Car not found" },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Admin delete car",
        description: "Requires an ADMIN token and a real car ID.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, example: "cmmb6ngzw0007bntrd52s8mn2" },
        ],
        responses: {
          "200": { description: "Car deleted" },
          "401": { description: "Unauthorized" },
          "403": { description: "Admin access required" },
          "404": { description: "Car not found" },
        },
      },
    },
    "/api/admin/bookings": {
      get: {
        tags: ["Admin"],
        summary: "Admin list bookings",
        description: "Requires an ADMIN token. A normal USER token returns 403.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"],
            },
            example: "PENDING",
          },
        ],
        responses: {
          "200": { description: "Bookings fetched" },
          "401": { description: "Unauthorized" },
          "403": { description: "Admin access required" },
        },
      },
    },
    "/api/admin/bookings/{id}/status": {
      patch: {
        tags: ["Admin"],
        summary: "Admin update booking status",
        description: "Requires an ADMIN token and a real booking ID from the admin bookings list.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, example: "booking_1" },
        ],
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
              example: {
                status: "CONFIRMED",
              },
            },
          },
        },
        responses: {
          "200": { description: "Booking status updated" },
          "401": { description: "Unauthorized" },
          "403": { description: "Admin access required" },
          "404": { description: "Booking not found" },
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
