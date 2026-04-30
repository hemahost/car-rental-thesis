import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma";
import { AIService, ExtractedFilters, ShortlistCar } from "./ai.service";

interface ChatbotInput {
  message: string;
  history?: Array<{ role: 'user' | 'bot'; text: string }>;
  authorizationHeader?: string;
}

interface ChatbotResult {
  filters: ExtractedFilters;
  recommendations: ShortlistCar[];
  aiResponse: string;
}

const VALID_CAR_TYPES = new Set(["suv", "sedan", "electric", "hatchback", "coupe"]);
const ACTIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED", "ACTIVE"];
const OFF_TOPIC_RESPONSE =
  "Sorry, I can only help with your questions related to our cars and the process of rental!";
const GREETING_RESPONSE =
  "Hello! I'm happy to help you find a rental car, compare our vehicles, or explain the booking process. What kind of car are you looking for?";
const EXTERNAL_CAR_INFO_PATTERN =
  /\b(horsepower|hp|engine|torque|acceleration|0[- ]?60|0[- ]?100|top speed|range|battery|charging|fuel economy|mpg|consumption|l\/100|dimensions|length|width|height|trunk|boot|cargo|safety rating|euro ncap|ncap|spec|specs|technical|power|performance)\b/i;

export function normalizeFilters(filters: ExtractedFilters): ExtractedFilters {
  const minPrice = filters.minPrice != null && filters.minPrice >= 0 ? filters.minPrice : null;
  const maxPrice = filters.maxPrice != null && filters.maxPrice >= 0 ? filters.maxPrice : null;

  return {
    isCarRentalQuery: filters.isCarRentalQuery,
    carType: filters.carType && VALID_CAR_TYPES.has(filters.carType) ? filters.carType : null,
    minPrice,
    maxPrice,
    features: filters.features,
    durationDays: filters.durationDays != null && filters.durationDays > 0 ? filters.durationDays : null,
    sortByPrice: filters.sortByPrice ?? null,
    location: filters.location ?? null,
    brand: filters.brand ?? null,
    model: filters.model ?? null,
    minSeats: filters.minSeats != null && filters.minSeats > 0 ? Math.ceil(filters.minSeats) : null,
    transmission: filters.transmission ?? null,
    fuelType: filters.fuelType ?? null,
    yearMin: filters.yearMin != null && filters.yearMin > 1900 ? Math.round(filters.yearMin) : null,
    yearMax: filters.yearMax != null && filters.yearMax > 1900 ? Math.round(filters.yearMax) : null,
    minHorsepower: filters.minHorsepower != null && filters.minHorsepower > 0 ? Math.round(filters.minHorsepower) : null,
    maxHorsepower: filters.maxHorsepower != null && filters.maxHorsepower > 0 ? Math.round(filters.maxHorsepower) : null,
    minMileageKm: filters.minMileageKm != null && filters.minMileageKm > 0 ? Math.round(filters.minMileageKm) : null,
    maxMileageKm: filters.maxMileageKm != null && filters.maxMileageKm > 0 ? Math.round(filters.maxMileageKm) : null,
    color: filters.color ?? null,
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

export function shouldUseExternalCarInfo(message: string): boolean {
  return EXTERNAL_CAR_INFO_PATTERN.test(message);
}

export function isLikelyCarOrRentalQuestion(message: string): boolean {
  return /\b(car|cars|vehicle|vehicles|rental|rent|booking|book|fleet|suv|sedan|hatchback|coupe|electric|toyota|bmw|audi|tesla|mercedes|volkswagen|honda|ford|porsche)\b/i.test(message);
}

export function isGreetingOrPleasantry(message: string): boolean {
  const normalized = message.trim().toLowerCase().replace(/[.!?]+$/g, "");
  return /^(hi|hello|hey|good morning|good afternoon|good evening|howdy|yo|thanks|thank you|ok|okay)$/.test(normalized);
}

export function extractHorsepowerThreshold(message: string): { minHorsepower: number | null; maxHorsepower: number | null } {
  const normalized = message.toLowerCase();
  const hpMatch = normalized.match(/(\d{2,4})\s*(?:horsepower|hp|bhp)/);
  if (!hpMatch) {
    return { minHorsepower: null, maxHorsepower: null };
  }

  const horsepower = Number(hpMatch[1]);
  if (!Number.isFinite(horsepower) || horsepower <= 0) {
    return { minHorsepower: null, maxHorsepower: null };
  }

  const matchIndex = hpMatch.index ?? 0;
  const before = normalized.slice(Math.max(0, matchIndex - 30), matchIndex);
  if (/\b(under|below|less than|lower than|maximum|max|up to)\b/.test(before)) {
    return { minHorsepower: null, maxHorsepower: horsepower };
  }

  if (/\b(over|more than|above|greater than|at least|minimum|min)\b/.test(before)) {
    return { minHorsepower: horsepower, maxHorsepower: null };
  }

  return { minHorsepower: horsepower, maxHorsepower: null };
}

export function extractMileageThreshold(message: string): { minMileageKm: number | null; maxMileageKm: number | null } {
  const normalized = message.toLowerCase().replace(/,/g, "");
  if (/\b(low mileage|not used much|less used|newer condition)\b/.test(normalized)) {
    return { minMileageKm: null, maxMileageKm: 25000 };
  }

  const kmMatch = normalized.match(/(\d{3,6})\s*(?:km|kilometer|kilometers|kms|mileage)/);
  if (!kmMatch) {
    return { minMileageKm: null, maxMileageKm: null };
  }

  const mileageKm = Number(kmMatch[1]);
  if (!Number.isFinite(mileageKm) || mileageKm <= 0) {
    return { minMileageKm: null, maxMileageKm: null };
  }

  const matchIndex = kmMatch.index ?? 0;
  const before = normalized.slice(Math.max(0, matchIndex - 30), matchIndex);
  if (/\b(under|below|less than|lower than|maximum|max|up to|not more than)\b/.test(before)) {
    return { minMileageKm: null, maxMileageKm: mileageKm };
  }

  if (/\b(over|more than|above|greater than|at least|minimum|min)\b/.test(before)) {
    return { minMileageKm: mileageKm, maxMileageKm: null };
  }

  return { minMileageKm: null, maxMileageKm: mileageKm };
}

export function extractColor(message: string): string | null {
  const normalized = message.toLowerCase();
  const colors = ["black", "blue", "grey", "gray", "red", "silver", "white", "yellow"];
  const match = colors.find((color) => new RegExp(`\\b${color}\\b`).test(normalized));
  if (!match) {
    return null;
  }

  return match === "gray" ? "Grey" : match.charAt(0).toUpperCase() + match.slice(1);
}

function toShortlistCar(car: {
  id: string;
  brand: string;
  model: string;
  type: string;
  pricePerDay: number;
  imageUrl: string | null;
  description: string | null;
  city: string | null;
  seats: number | null;
  transmission: string | null;
  fuelType: string | null;
  year: number | null;
  horsepower: number | null;
  mileageKm: number | null;
  color: string | null;
}): ShortlistCar {
  return {
    id: car.id,
    brand: car.brand,
    model: car.model,
    type: car.type,
    pricePerDay: car.pricePerDay,
    imageUrl: car.imageUrl ?? null,
    description: car.description ?? "",
    city: car.city ?? null,
    seats: car.seats ?? null,
    transmission: car.transmission ?? null,
    fuelType: car.fuelType ?? null,
    year: car.year ?? null,
    horsepower: car.horsepower ?? null,
    mileageKm: car.mileageKm ?? null,
    color: car.color ?? null,
  };
}

export function uniqueCarsByModel(cars: ShortlistCar[]): ShortlistCar[] {
  const seen = new Set<string>();
  return cars.filter((car) => {
    const key = `${car.brand.toLowerCase()}-${car.model.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export class ChatbotService {
  private readonly aiService: AIService;

  constructor(aiService?: AIService) {
    this.aiService = aiService || new AIService();
  }

  async handleChat({ message, history, authorizationHeader }: ChatbotInput): Promise<ChatbotResult> {
    const extracted = await this.aiService.extractPreferences(message, history);
    const needsExternalCarInfo = shouldUseExternalCarInfo(message);

    if (!extracted.isCarRentalQuery && isGreetingOrPleasantry(message)) {
      return {
        filters: normalizeFilters(extracted),
        recommendations: [],
        aiResponse: GREETING_RESPONSE,
      };
    }

    if (!extracted.isCarRentalQuery && !isLikelyCarOrRentalQuestion(message)) {
      console.log("[chatbot] non-rental query detected");
      const aiResponse = await this.aiService.generateConversationalResponse(message, history);
      return {
        filters: normalizeFilters(extracted),
        recommendations: [],
        aiResponse,
      };
    }

    const horsepowerThreshold = extractHorsepowerThreshold(message);
    const mileageThreshold = extractMileageThreshold(message);
    const color = extractColor(message);
    const filters = normalizeFilters(
      !extracted.isCarRentalQuery && isLikelyCarOrRentalQuestion(message)
        ? { ...extracted, isCarRentalQuery: true }
        : extracted
    );

    if (horsepowerThreshold.minHorsepower != null) {
      filters.minHorsepower = horsepowerThreshold.minHorsepower;
    }
    if (horsepowerThreshold.maxHorsepower != null) {
      filters.maxHorsepower = horsepowerThreshold.maxHorsepower;
    }
    if (mileageThreshold.minMileageKm != null) {
      filters.minMileageKm = mileageThreshold.minMileageKm;
    }
    if (mileageThreshold.maxMileageKm != null) {
      filters.maxMileageKm = mileageThreshold.maxMileageKm;
    }
    if (color) {
      filters.color = color;
    }

    console.log("[chatbot] extracted filters:", filters);

    // If the user hasn't specified any preference, ask clarifying questions
    const hasNoFilters =
      filters.carType == null &&
      filters.minPrice == null &&
      filters.maxPrice == null &&
      (filters.features == null || filters.features.length === 0) &&
      filters.durationDays == null &&
      filters.sortByPrice == null &&
      filters.location == null &&
      filters.brand == null &&
      filters.model == null &&
      filters.minSeats == null &&
      filters.transmission == null &&
      filters.fuelType == null &&
      filters.yearMin == null &&
      filters.yearMax == null &&
      filters.minHorsepower == null &&
      filters.maxHorsepower == null &&
      filters.minMileageKm == null &&
      filters.maxMileageKm == null &&
      filters.color == null;

    if (hasNoFilters && !needsExternalCarInfo) {
      const aiResponse = await this.aiService.generateClarifyingQuestion(message, history);
      return {
        filters,
        recommendations: [],
        aiResponse,
      };
    }

    const where: Prisma.CarWhereInput = {};

    if (filters.carType) {
      where.type = { equals: filters.carType, mode: "insensitive" };
    }

    if (filters.location) {
      where.city = { contains: filters.location, mode: "insensitive" };
    }

    if (filters.brand) {
      where.brand = { contains: filters.brand, mode: "insensitive" };
    }

    if (filters.model) {
      where.model = { contains: filters.model, mode: "insensitive" };
    }

    if (filters.minSeats != null) {
      where.seats = { gte: filters.minSeats };
    }

    if (filters.transmission) {
      where.transmission = { equals: filters.transmission, mode: "insensitive" };
    }

    if (filters.fuelType) {
      where.fuelType = { equals: filters.fuelType, mode: "insensitive" };
    }

    if (filters.color) {
      where.color = { contains: filters.color, mode: "insensitive" };
    }

    if (filters.yearMin != null || filters.yearMax != null) {
      where.year = {};
      if (filters.yearMin != null) {
        where.year.gte = filters.yearMin;
      }
      if (filters.yearMax != null) {
        where.year.lte = filters.yearMax;
      }
    }

    if (filters.minHorsepower != null || filters.maxHorsepower != null) {
      where.horsepower = {};
      if (filters.minHorsepower != null) {
        where.horsepower.gte = filters.minHorsepower;
      }
      if (filters.maxHorsepower != null) {
        where.horsepower.lte = filters.maxHorsepower;
      }
    }

    if (filters.minMileageKm != null || filters.maxMileageKm != null) {
      where.mileageKm = {};
      if (filters.minMileageKm != null) {
        where.mileageKm.gte = filters.minMileageKm;
      }
      if (filters.maxMileageKm != null) {
        where.mileageKm.lte = filters.maxMileageKm;
      }
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
      orderBy: { pricePerDay: filters.sortByPrice === "desc" ? "desc" : "asc" },
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

    const recommendationLimit = needsExternalCarInfo ? 12 : 3;
    const recommendations: ShortlistCar[] = uniqueCarsByModel(
      availableCars.slice(0, recommendationLimit).map(toShortlistCar)
    );

    if (needsExternalCarInfo && recommendations.some((car) => car.horsepower == null)) {
      const aiResponse = await this.aiService.answerCarQuestionWithWebSearch(message, recommendations, filters);
      const userId = getOptionalUserIdFromToken(authorizationHeader);

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

    const aiResponse = await this.aiService.generateRecommendation(message, recommendations, durationDays, filters);

    console.log("[chatbot] AI response:", aiResponse);

    const aiResponseLower = aiResponse.toLowerCase();
    const mentionedCars = recommendations.filter((car) =>
      aiResponseLower.includes(`${car.brand.toLowerCase()} ${car.model.toLowerCase()}`)
    );
    const displayedRecommendations = mentionedCars.length > 0 ? mentionedCars : recommendations.slice(0, 1);

    const userId = getOptionalUserIdFromToken(authorizationHeader);

    // Don't block API response on logging write.
    safeCreateConversationLog({
      userId,
      message,
      filters,
      recommendations: displayedRecommendations,
      aiResponse,
    });

    return {
      filters,
      recommendations: displayedRecommendations,
      aiResponse,
    };
  }
}
