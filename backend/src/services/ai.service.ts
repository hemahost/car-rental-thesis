import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export type CarType = "suv" | "sedan" | "electric" | "hatchback" | "coupe";

export interface ExtractedFilters {
  isCarRentalQuery: boolean;
  carType: CarType | null;
  maxPrice: number | null;
  minPrice: number | null;
  features: string[] | null;
  durationDays: number | null;
  sortByPrice: "asc" | "desc" | null;
  location: string | null;
  brand: string | null;
  model: string | null;
  minSeats: number | null;
  transmission: string | null;
  fuelType: string | null;
  yearMin: number | null;
  yearMax: number | null;
  minHorsepower: number | null;
  maxHorsepower: number | null;
  minMileageKm: number | null;
  maxMileageKm: number | null;
  color: string | null;
}

export interface ShortlistCar {
  id: string;
  brand: string;
  model: string;
  type: string;
  pricePerDay: number;
  imageUrl: string | null;
  description: string;
  city: string | null;
  seats: number | null;
  transmission: string | null;
  fuelType: string | null;
  year: number | null;
  horsepower: number | null;
  mileageKm: number | null;
  color: string | null;
}

const ALLOWED_CAR_TYPES: CarType[] = ["suv", "sedan", "electric", "hatchback", "coupe"];
const OPENAI_DEBUG = process.env.OPENAI_DEBUG !== "0";
const OFF_TOPIC_RESPONSE =
  "Sorry, I can only help with your questions related to our cars and the process of rental!";
const EXTRACT_PREFERENCES_SYSTEM_PROMPT = [
  "Extract rental preferences for a car-rental website and return strict JSON only with these keys:",
  "isCarRentalQuery, carType, maxPrice, minPrice, features, durationDays, sortByPrice, location,",
  "brand, model, minSeats, transmission, fuelType, yearMin, yearMax, minHorsepower,",
  "maxHorsepower, minMileageKm, maxMileageKm, color.",
  "isCarRentalQuery must be true when the message is about renting, finding, comparing, booking,",
  "or asking facts/specifications about cars on this website.",
  "This includes questions like 'any car over 400 horsepower?', 'what is the horsepower of the BMW X5?',",
  "'which car has less than 20000 km?', 'do you have a red car?', 'which electric car has the longest range?',",
  "or 'what is the engine size?' even when the website database does not store that exact field.",
  "Consider conversation history; a short reply like 'yes' or 'sure' after a car-rental discussion counts as true.",
  "Set false for greetings, general chat, coding, math, history, science unrelated to cars, politics,",
  "health, legal, or anything unrelated to this car rental website.",
  "Use the real car fields: brand, model, type, pricePerDay, imageUrl, description, city, seats,",
  "transmission, fuelType, year, horsepower, mileageKm, color.",
  "carType must be one of SUV, Sedan, Electric, Hatchback, Coupe or null.",
  "If the user asks for capacity like '7 people', 'seven passengers', 'family of 5', or 'fits 4',",
  "set minSeats to that passenger count because it maps to the seats field.",
  "If the user asks for horsepower, hp, power, or performance thresholds like 'more than 400 horsepower',",
  "'over 300 hp', 'at least 250 hp', set minHorsepower to that number; for 'under 200 hp' set maxHorsepower.",
  "If the user asks for mileage or kilometers used, set maxMileageKm for phrases like",
  "'less than 20000 km', 'under 30000 km', 'low mileage', or 'not used much';",
  "set minMileageKm for phrases like 'over 50000 km' or 'more than 40000 km'.",
  "If they ask for a car color like red, white, black, blue, grey, silver, or yellow, set color to that color word.",
  "If they mention automatic/manual, set transmission. If they mention petrol, diesel, electric, or hybrid, set fuelType.",
  "If they mention a brand or model, set brand/model. If they mention newest/newer cars, use yearMin when possible",
  "and sortByPrice null unless price intent exists.",
  "sortByPrice must be 'desc' for most expensive, luxury, premium, highest-priced, best, or a luxury brand without budget;",
  "'asc' for cheapest, budget, affordable, lowest price; null otherwise.",
  "When price does not matter, minPrice/maxPrice must be null. location must be the city/location name mentioned.",
  "Use null for missing values. If isCarRentalQuery is false, all other fields must be null.",
  "Return JSON only with no extra keys and no explanation.",
].join(" ");
const RECOMMENDATION_SYSTEM_PROMPT = [
  "You are CarRental Website Assistant for this website only.",
  "Recommend only from the provided Available cars list, which contains the real website car fields:",
  "brand, model, type, pricePerDay, imageUrl, description, city, seats, transmission, fuelType, year, horsepower, mileageKm, and color.",
  "Briefly explain which fields you checked when relevant, for example seats for passenger capacity,",
  "horsepower for power/performance, mileageKm for how much the car has been used, color for requested exterior color,",
  "fuelType for electric/diesel/petrol/hybrid, transmission for automatic/manual, city for location, and pricePerDay for budget.",
  "Never invent cars or fields.",
  `If the user asks an out-of-scope question, reply exactly: "${OFF_TOPIC_RESPONSE}"`,
  "Keep the response concise in at most 3 short sentences.",
].join(" ");
const WEB_SEARCH_SYSTEM_PROMPT = [
  "You are CarRental Website Assistant for this website only.",
  "Answer only car or rental-process questions.",
  "Use web search for car facts that are not stored in the website database, such as horsepower, engine specs, range, charging,",
  "fuel economy, dimensions, cargo space, or safety ratings.",
  "Only answer about cars listed in the provided Website cars JSON.",
  `If the question is outside cars or rentals, reply exactly: "${OFF_TOPIC_RESPONSE}"`,
  "If a spec varies by year, trim, market, or engine, say that and give the closest commonly reported value for the listed year/model.",
  "Keep the answer concise and include source URLs when available.",
].join(" ");

function debugOpenAI(message: string, meta?: Record<string, unknown>): void {
  if (!OPENAI_DEBUG) {
    return;
  }

  if (meta) {
    console.log(`[openai-debug] ${message}`, meta);
    return;
  }

  console.log(`[openai-debug] ${message}`);
}

export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 12) {
    return "***masked***";
  }

  return `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`;
}

export function parseNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

export function normalizeCarType(value: unknown): CarType | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return ALLOWED_CAR_TYPES.includes(normalized as CarType) ? (normalized as CarType) : null;
}

export function normalizeFeatures(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = value
    .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
    .filter((item) => item.length > 0);

  return normalized.length > 0 ? Array.from(new Set(normalized)) : null;
}

export function normalizeExtractedFilters(raw: unknown): ExtractedFilters {
  const parsed = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};

  const minPrice = parseNumberOrNull(parsed.minPrice);
  const maxPrice = parseNumberOrNull(parsed.maxPrice);
  const durationDaysValue = parseNumberOrNull(parsed.durationDays);
  const minSeatsValue = parseNumberOrNull(parsed.minSeats);
  const yearMinValue = parseNumberOrNull(parsed.yearMin);
  const yearMaxValue = parseNumberOrNull(parsed.yearMax);
  const minHorsepowerValue = parseNumberOrNull(parsed.minHorsepower);
  const maxHorsepowerValue = parseNumberOrNull(parsed.maxHorsepower);
  const minMileageKmValue = parseNumberOrNull(parsed.minMileageKm);
  const maxMileageKmValue = parseNumberOrNull(parsed.maxMileageKm);

  const durationDays = durationDaysValue != null && durationDaysValue > 0 ? Math.round(durationDaysValue) : null;

  function normalizeSortByPrice(value: unknown): "asc" | "desc" | null {
    if (value === "asc" || value === "desc") return value;
    return null;
  }

  function normalizeLocation(value: unknown): string | null {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
    return null;
  }

  function normalizeText(value: unknown): string | null {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
    return null;
  }

  return {
    isCarRentalQuery: parsed.isCarRentalQuery === true,
    carType: normalizeCarType(parsed.carType),
    minPrice,
    maxPrice,
    features: normalizeFeatures(parsed.features),
    durationDays,
    sortByPrice: normalizeSortByPrice(parsed.sortByPrice),
    location: normalizeLocation(parsed.location),
    brand: normalizeText(parsed.brand),
    model: normalizeText(parsed.model),
    minSeats: minSeatsValue != null && minSeatsValue > 0 ? Math.ceil(minSeatsValue) : null,
    transmission: normalizeText(parsed.transmission),
    fuelType: normalizeText(parsed.fuelType),
    yearMin: yearMinValue != null && yearMinValue > 1900 ? Math.round(yearMinValue) : null,
    yearMax: yearMaxValue != null && yearMaxValue > 1900 ? Math.round(yearMaxValue) : null,
    minHorsepower: minHorsepowerValue != null && minHorsepowerValue > 0 ? Math.round(minHorsepowerValue) : null,
    maxHorsepower: maxHorsepowerValue != null && maxHorsepowerValue > 0 ? Math.round(maxHorsepowerValue) : null,
    minMileageKm: minMileageKmValue != null && minMileageKmValue > 0 ? Math.round(minMileageKmValue) : null,
    maxMileageKm: maxMileageKmValue != null && maxMileageKmValue > 0 ? Math.round(maxMileageKmValue) : null,
    color: normalizeText(parsed.color),
  };
}

export function formatCarLabel(car: ShortlistCar): string {
  return `${car.brand} ${car.model}`;
}

export function formatCarDetails(car: ShortlistCar): string {
  const details = [
    car.seats != null ? `${car.seats} seats` : null,
    car.transmission,
    car.fuelType,
    car.horsepower != null ? `${car.horsepower} hp` : null,
    car.mileageKm != null ? `${car.mileageKm.toLocaleString()} km` : null,
    car.color,
    car.city,
    car.year != null ? String(car.year) : null,
  ].filter(Boolean);

  return details.length > 0 ? ` (${details.join(", ")})` : "";
}

export function buildFastRecommendation(shortlist: ShortlistCar[], durationDays: number, filters?: ExtractedFilters): string {
  if (shortlist.length === 0) {
    return "I couldn't find a matching car right now. Try widening your budget, changing car type, or reducing duration.";
  }


  const top = shortlist[0];
  const alternatives = shortlist.slice(1, 3);

  const topTotal = top.pricePerDay * durationDays;
  const altText = alternatives
    .map((car) => {
      const total = car.pricePerDay * durationDays;
      return `${formatCarLabel(car)}${formatCarDetails(car)} at $${car.pricePerDay}/day (about $${total} total)`;
    })
    .join(", ");

  const checkedFields = [
    filters?.minSeats != null ? "seats" : null,
    filters?.fuelType ? "fuel type" : null,
    filters?.minHorsepower != null || filters?.maxHorsepower != null ? "horsepower" : null,
    filters?.minMileageKm != null || filters?.maxMileageKm != null ? "mileage" : null,
    filters?.color ? "color" : null,
    filters?.transmission ? "transmission" : null,
    filters?.location ? "city" : null,
    filters?.maxPrice != null || filters?.minPrice != null ? "price per day" : null,
  ].filter(Boolean);
  const checkedText = checkedFields.length > 0 ? ` I checked ${checkedFields.join(", ")} against the car data.` : "";

  if (!altText) {
    return `Best match: ${formatCarLabel(top)}${formatCarDetails(top)} at $${top.pricePerDay}/day (about $${topTotal} total for ${durationDays} day${durationDays > 1 ? "s" : ""}).${checkedText}`;
  }

  return `Best match: ${formatCarLabel(top)}${formatCarDetails(top)} at $${top.pricePerDay}/day (about $${topTotal} total for ${durationDays} day${durationDays > 1 ? "s" : ""}).${checkedText} Alternatives: ${altText}.`;
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: () => T): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(fallback());
    }, timeoutMs);

    promise
      .then((value) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve(fallback());
      });
  });
}

export class AIService {
  private readonly client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    this.client = new OpenAI({ apiKey });

    debugOpenAI("client initialized", {
      keyMask: maskApiKey(apiKey),
      defaultModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
    });
  }

  async extractPreferences(
    message: string,
    history?: Array<{ role: 'user' | 'bot'; text: string }>
  ): Promise<ExtractedFilters> {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const startedAt = Date.now();

    debugOpenAI("extractPreferences request started", {
      model,
      messageLength: message.length,
    });

    const historyMessages: Array<{ role: 'user' | 'assistant'; content: string }> =
      (history ?? []).slice(-6).map((h) => ({
        role: h.role === 'bot' ? 'assistant' : 'user',
        content: h.text,
      }));

    const completion = await this.client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      temperature: 0,
      messages: [
        {
          role: "system",
          content: EXTRACT_PREFERENCES_SYSTEM_PROMPT,
        },
        ...historyMessages,
        {
          role: "user",
          content: `Message: ${message}`,
        },
      ] as ChatCompletionMessageParam[],
    });

    debugOpenAI("extractPreferences response received", {
      requestId: completion.id,
      durationMs: Date.now() - startedAt,
      finishReason: completion.choices[0]?.finish_reason,
      usage: completion.usage,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("AI did not return extracted preferences");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("AI returned invalid JSON for extracted preferences");
    }

    return normalizeExtractedFilters(parsed);
  }

  async generateConversationalResponse(
    message: string,
    history?: Array<{ role: 'user' | 'bot'; text: string }>
  ): Promise<string> {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const historyMessages: Array<{ role: 'user' | 'assistant'; content: string }> =
      (history ?? []).slice(-6).map((h) => ({
        role: h.role === 'bot' ? 'assistant' : 'user',
        content: h.text,
      }));

    const aiCall = this.client.chat.completions.create({
      model,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: [
            "You are the AI assistant for a car rental website.",
            "The current user message is outside your allowed scope unless it is about the website cars or rental process.",
            "Do not answer unrelated requests.",
            "Instead, write a natural, kind redirection that briefly acknowledges the user's topic or intent in your own words,",
            "says you are here to help with car rentals and cannot handle that request, and invites them to ask a rental question.",
            "Give 1-2 concrete examples such as finding an SUV, comparing horsepower, checking low mileage, budget, seats, or booking dates.",
            "Do not use a fixed template. Keep it to 2 short sentences.",
          ].join(" "),
        },
        ...historyMessages,
        {
          role: "user",
          content: message,
        },
      ],
    });

    const completion = await withTimeout(aiCall, 3000, () => null);

    const aiResponse = completion?.choices[0]?.message?.content?.trim();
    return aiResponse || OFF_TOPIC_RESPONSE;
  }

  async generateClarifyingQuestion(
    message: string,
    history?: Array<{ role: 'user' | 'bot'; text: string }>
  ): Promise<string> {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const historyMessages: Array<{ role: 'user' | 'assistant'; content: string }> =
      (history ?? []).slice(-6).map((h) => ({
        role: h.role === 'bot' ? 'assistant' : 'user',
        content: h.text,
      }));

    const aiCall = this.client.chat.completions.create({
      model,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: [
            "You are a car rental assistant.",
            "The user wants to rent a car but hasn't given enough details.",
            "Ask them 2-3 short, friendly clarifying questions to understand:",
            "car type (SUV, Sedan, Hatchback, Electric), daily budget, and rental duration.",
            "Do not recommend any car yet. Keep it conversational and brief.",
          ].join(" "),
        },
        ...historyMessages,
        {
          role: "user",
          content: message,
        },
      ],
    });

    const completion = await withTimeout(aiCall, 3000, () => null);
    const aiResponse = completion?.choices[0]?.message?.content?.trim();
    return aiResponse || "What type of car are you looking for?";
  }

  async generateRecommendation(
    message: string,
    shortlist: ShortlistCar[],
    durationDays = 1,
    filters?: ExtractedFilters
  ): Promise<string> {
    if (shortlist.length === 0) {
      debugOpenAI("generateRecommendation skipped OpenAI call (empty shortlist)");
      return buildFastRecommendation(shortlist, durationDays, filters);
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const startedAt = Date.now();

    debugOpenAI("generateRecommendation request started", {
      model,
      messageLength: message.length,
      shortlistCount: shortlist.length,
      durationDays,
    });

    const aiCall = this.client.chat.completions.create({
      model,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: RECOMMENDATION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `User request: ${message}\nDuration days: ${durationDays}\nExtracted filters: ${JSON.stringify(filters ?? null)}\n\nAvailable cars: ${JSON.stringify(shortlist)}`,
        },
      ],
    });

    const completion = await withTimeout(aiCall, 2200, () => null);

    if (!completion) {
      debugOpenAI("generateRecommendation timed out or failed; using fallback", {
        timeoutMs: 2200,
        durationMs: Date.now() - startedAt,
      });
      return buildFastRecommendation(shortlist, durationDays, filters);
    }

    debugOpenAI("generateRecommendation response received", {
      requestId: completion.id,
      durationMs: Date.now() - startedAt,
      finishReason: completion.choices[0]?.finish_reason,
      usage: completion.usage,
    });

    const aiResponse = completion.choices[0]?.message?.content?.trim();
    if (!aiResponse) {
      debugOpenAI("generateRecommendation empty response; using fallback", {
        requestId: completion.id,
      });
      return buildFastRecommendation(shortlist, durationDays, filters);
    }

    return aiResponse;
  }

  async answerCarQuestionWithWebSearch(
    message: string,
    cars: ShortlistCar[],
    filters?: ExtractedFilters
  ): Promise<string> {
    if (cars.length === 0) {
      return "I couldn't find that car in our current fleet. Please ask about one of the cars listed on our website.";
    }

    const model = process.env.OPENAI_WEB_SEARCH_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
    const startedAt = Date.now();

    debugOpenAI("answerCarQuestionWithWebSearch request started", {
      model,
      messageLength: message.length,
      carCount: cars.length,
    });

    const aiCall = this.client.responses.create({
      model,
      instructions: WEB_SEARCH_SYSTEM_PROMPT,
      input: `User question: ${message}\nExtracted filters: ${JSON.stringify(filters ?? null)}\n\nWebsite cars: ${JSON.stringify(cars)}`,
      tools: [{ type: "web_search_preview", search_context_size: "low" }],
      max_output_tokens: 500,
    });

    const response = await withTimeout(aiCall, 8000, () => null);

    if (!response) {
      debugOpenAI("answerCarQuestionWithWebSearch timed out or failed", {
        timeoutMs: 8000,
        durationMs: Date.now() - startedAt,
      });
      return "I found the matching car in our fleet, but I couldn't look up the extra specification right now. Please try again in a moment.";
    }

    debugOpenAI("answerCarQuestionWithWebSearch response received", {
      requestId: response.id,
      durationMs: Date.now() - startedAt,
      usage: response.usage,
    });

    return response.output_text?.trim() || "I couldn't find a reliable external specification for that car right now.";
  }
}
