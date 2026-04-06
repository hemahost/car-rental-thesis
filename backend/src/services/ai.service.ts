import OpenAI from "openai";

export type CarType = "suv" | "sedan" | "electric" | "hatchback";

export interface ExtractedFilters {
  isCarRentalQuery: boolean;
  carType: CarType | null;
  maxPrice: number | null;
  minPrice: number | null;
  features: string[] | null;
  durationDays: number | null;
}

export interface ShortlistCar {
  id: string;
  brand: string;
  model: string;
  type: string;
  pricePerDay: number;
  imageUrl: string | null;
  description: string;
}

const ALLOWED_CAR_TYPES: CarType[] = ["suv", "sedan", "electric", "hatchback"];
const OPENAI_DEBUG = process.env.OPENAI_DEBUG !== "0";

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

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 12) {
    return "***masked***";
  }

  return `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`;
}

function parseNumberOrNull(value: unknown): number | null {
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

function normalizeCarType(value: unknown): CarType | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return ALLOWED_CAR_TYPES.includes(normalized as CarType) ? (normalized as CarType) : null;
}

function normalizeFeatures(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = value
    .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
    .filter((item) => item.length > 0);

  return normalized.length > 0 ? Array.from(new Set(normalized)) : null;
}

function normalizeExtractedFilters(raw: unknown): ExtractedFilters {
  const parsed = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};

  const minPrice = parseNumberOrNull(parsed.minPrice);
  const maxPrice = parseNumberOrNull(parsed.maxPrice);
  const durationDaysValue = parseNumberOrNull(parsed.durationDays);

  const durationDays = durationDaysValue != null && durationDaysValue > 0 ? Math.round(durationDaysValue) : null;

  return {
    isCarRentalQuery: parsed.isCarRentalQuery === true,
    carType: normalizeCarType(parsed.carType),
    minPrice,
    maxPrice,
    features: normalizeFeatures(parsed.features),
    durationDays,
  };
}

function formatCarLabel(car: ShortlistCar): string {
  return `${car.brand} ${car.model}`;
}

function buildFastRecommendation(shortlist: ShortlistCar[], durationDays: number): string {
  if (shortlist.length === 0) {
    return "I couldn't find a matching car right now. Try widening your budget, changing car type, or reducing duration.";
  }

  const sortedByPrice = [...shortlist].sort((a, b) => a.pricePerDay - b.pricePerDay);
  const top = sortedByPrice[0];
  const alternatives = sortedByPrice.slice(1, 3);

  const topTotal = top.pricePerDay * durationDays;
  const altText = alternatives
    .map((car) => {
      const total = car.pricePerDay * durationDays;
      return `${formatCarLabel(car)} at $${car.pricePerDay}/day (about $${total} total)`;
    })
    .join(", ");

  if (!altText) {
    return `Best match: ${formatCarLabel(top)} at $${top.pricePerDay}/day (about $${topTotal} total for ${durationDays} day${durationDays > 1 ? "s" : ""}).`;
  }

  return `Best match: ${formatCarLabel(top)} at $${top.pricePerDay}/day (about $${topTotal} total for ${durationDays} day${durationDays > 1 ? "s" : ""}). Alternatives: ${altText}.`;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: () => T): Promise<T> {
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
          content:
            "Extract rental preferences for a car-rental website and return strict JSON only with these keys: isCarRentalQuery, carType, maxPrice, minPrice, features, durationDays. isCarRentalQuery must be true ONLY when the message is genuinely about renting or finding a car (asking for car type, budget, duration, etc). Consider the conversation history — a short reply like 'yes' or 'sure' after a car-rental discussion counts as isCarRentalQuery true. Set isCarRentalQuery to false only for greetings, general chat, or anything clearly unrelated to renting a car. carType must be one of SUV, Sedan, Electric, Hatchback or null. Use null for all missing filter values. If isCarRentalQuery is false, all other fields must be null. Return JSON only with no extra keys and no explanation.",
        },
        ...historyMessages,
        {
          role: "user",
          content: `Message: ${message}`,
        },
      ],
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
          content:
            "You are an AI assistant for a car rental website. Follow these rules strictly:\n1. GIBBERISH or UNRECOGNIZABLE INPUT (random characters, typos, nonsense): Do NOT redirect to car rentals. Simply ask the user to clarify what they mean, in a friendly way.\n2. DAILY SMALL-TALK (greetings, 'how are you', 'what's your name', simple pleasantries): Reply very briefly (one short sentence), then IMMEDIATELY redirect to car rentals. Do NOT say anything implying you are available for general chat or that the user can talk to you about anything. Example: 'Hey there! I specialize in helping you find the perfect rental car — what are you looking for?'\n3. OFF-TOPIC QUESTIONS (coding, math, history, science, medical, legal, politics, or any non-rental knowledge question): Do NOT answer. Respond only with: 'I\\'m only here to help with car rentals! Try asking me something like \"I need an SUV for 3 days under $100/day\".'\n4. CAR RENTAL topics: Help fully and enthusiastically.\nNEVER imply you can chat, talk, or help with anything outside car rentals. Always use conversation history so short replies like 'yes' or 'sure' are understood in context. Keep responses short (1-3 sentences).",
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
    return aiResponse || "I'm here to help! What kind of car are you looking for?";
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
          content:
            "You are a car rental assistant. The user wants to rent a car but hasn't given enough details. Ask them 2-3 short, friendly clarifying questions to understand: car type (SUV, Sedan, Hatchback, Electric), daily budget, and rental duration. Do not recommend any car yet. Keep it conversational and brief.",
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

  async generateRecommendation(message: string, shortlist: ShortlistCar[], durationDays = 1): Promise<string> {
    if (shortlist.length === 0) {
      debugOpenAI("generateRecommendation skipped OpenAI call (empty shortlist)");
      return buildFastRecommendation(shortlist, durationDays);
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
          content:
            'You are CarRental Website Assistant for this website only. You must only help with renting cars from the provided Available cars list. Never answer general knowledge questions (politics, history, geography, coding, health, legal, or any non-rental topic). If the user asks an out-of-scope question, do not answer it; reply exactly: "I can only help with car rentals on this website, such as choosing car type, budget, and rental duration." If in-scope, recommend only from the provided list and keep response concise in at most 2 short sentences.',
        },
        {
          role: "user",
          content: `User request: ${message}\nDuration days: ${durationDays}\n\nAvailable cars: ${JSON.stringify(shortlist)}`,
        },
      ],
    });

    const completion = await withTimeout(aiCall, 2200, () => null);

    if (!completion) {
      debugOpenAI("generateRecommendation timed out or failed; using fallback", {
        timeoutMs: 2200,
        durationMs: Date.now() - startedAt,
      });
      return buildFastRecommendation(shortlist, durationDays);
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
      return buildFastRecommendation(shortlist, durationDays);
    }

    return aiResponse;
  }
}
