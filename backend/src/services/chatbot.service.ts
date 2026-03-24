import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma";
import { AIService, ExtractedFilters, ShortlistCar } from "./ai.service";

interface ChatbotInput {
  message: string;
  authorizationHeader?: string;
}

interface ChatbotResult {
  filters: ExtractedFilters;
  recommendations: ShortlistCar[];
  aiResponse: string;
}

const VALID_CAR_TYPES = new Set(["suv", "sedan", "electric", "hatchback"]);
const ACTIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED", "ACTIVE"];

function normalizeFilters(filters: ExtractedFilters): ExtractedFilters {
  const minPrice = filters.minPrice != null && filters.minPrice >= 0 ? filters.minPrice : null;
  const maxPrice = filters.maxPrice != null && filters.maxPrice >= 0 ? filters.maxPrice : null;

  return {
    carType: filters.carType && VALID_CAR_TYPES.has(filters.carType) ? filters.carType : null,
    minPrice,
    maxPrice,
    features: filters.features,
    durationDays: filters.durationDays != null && filters.durationDays > 0 ? filters.durationDays : null,
  };
}

function getOptionalUserIdFromToken(authorizationHeader?: string): string | null {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET || "fallback-secret";

  try {
    const decoded = jwt.verify(token, secret) as { userId?: string };
    return decoded.userId || null;
  } catch {
    return null;
  }
}

function safeCreateConversationLog(data: {
  userId: string | null;
  message: string;
  filters: ExtractedFilters;
  recommendations: ShortlistCar[];
  aiResponse: string;
}): void {
  const writeByRawSql = () =>
    prisma.$executeRaw`
      INSERT INTO "ChatConversation" (
        "id",
        "userId",
        "message",
        "extractedFilters",
        "recommendations",
        "aiResponse",
        "createdAt"
      )
      VALUES (
        ${randomUUID()},
        ${data.userId},
        ${data.message},
        ${data.filters as unknown as Prisma.InputJsonValue},
        ${data.recommendations as unknown as Prisma.InputJsonValue},
        ${data.aiResponse},
        ${new Date()}
      )
    `;

  const prismaWithConversation = prisma as typeof prisma & {
    chatConversation?: {
      create: (args: {
        data: {
          userId: string | null;
          message: string;
          extractedFilters: Prisma.InputJsonValue;
          recommendations: Prisma.InputJsonValue;
          aiResponse: string;
        };
      }) => Promise<unknown>;
    };
  };

  if (!prismaWithConversation.chatConversation) {
    console.warn("[chatbot] chatConversation model unavailable in Prisma client, using raw SQL fallback");
    writeByRawSql().catch((error: unknown) => {
      console.error("[chatbot] failed to save conversation via raw SQL:", error);
    });
    return;
  }

  prismaWithConversation.chatConversation
    .create({
      data: {
        userId: data.userId,
        message: data.message,
        extractedFilters: data.filters as unknown as Prisma.InputJsonValue,
        recommendations: data.recommendations as unknown as Prisma.InputJsonValue,
        aiResponse: data.aiResponse,
      },
    })
    .catch((error: unknown) => {
      console.error("[chatbot] failed to save conversation via Prisma model, trying raw SQL:", error);
      writeByRawSql().catch((fallbackError: unknown) => {
        console.error("[chatbot] failed to save conversation via raw SQL fallback:", fallbackError);
      });
    });
}

export class ChatbotService {
  private readonly aiService: AIService;

  constructor(aiService?: AIService) {
    this.aiService = aiService || new AIService();
  }

  async handleChat({ message, authorizationHeader }: ChatbotInput): Promise<ChatbotResult> {
    const extracted = await this.aiService.extractPreferences(message);
    const filters = normalizeFilters(extracted);

    console.log("[chatbot] extracted filters:", filters);

    const where: Prisma.CarWhereInput = {};

    if (filters.carType) {
      where.type = { equals: filters.carType, mode: "insensitive" };
    }

    if (filters.minPrice != null || filters.maxPrice != null) {
      where.pricePerDay = {};
      if (filters.minPrice != null) {
        where.pricePerDay.gte = filters.minPrice;
      }
      if (filters.maxPrice != null) {
        where.pricePerDay.lte = filters.maxPrice;
      }
    }

    const requestedStart = new Date();
    requestedStart.setHours(0, 0, 0, 0);

    const requestedEnd = new Date(requestedStart);
    const durationDays = filters.durationDays || 1;
    requestedEnd.setDate(requestedEnd.getDate() + durationDays);
    requestedEnd.setHours(23, 59, 59, 999);

    const cars = await prisma.car.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        bookings: {
          where: {
            status: { in: ACTIVE_BOOKING_STATUSES },
            startDate: { lte: requestedEnd },
            endDate: { gte: requestedStart },
          },
          select: {
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    const availableCars = cars.filter((car) => car.bookings.length === 0);

    console.log("[chatbot] DB results count:", availableCars.length);

    const recommendations: ShortlistCar[] = availableCars.slice(0, 5).map((car) => ({
      id: car.id,
      brand: car.brand,
      model: car.model,
      type: car.type,
      pricePerDay: car.pricePerDay,
    }));

    const aiResponse = await this.aiService.generateRecommendation(message, recommendations, durationDays);

    console.log("[chatbot] AI response:", aiResponse);

    const userId = getOptionalUserIdFromToken(authorizationHeader);

    // Don't block API response on logging write.
    safeCreateConversationLog({
      userId,
      message,
      filters,
      recommendations,
      aiResponse,
    });

    return {
      filters,
      recommendations,
      aiResponse,
    };
  }
}
