import OpenAI from "openai";

export type CarType = "suv" | "sedan" | "electric" | "hatchback";

export interface ExtractedFilters {
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

  async extractPreferences(message: string): Promise<ExtractedFilters> {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const startedAt = Date.now();

    debugOpenAI("extractPreferences request started", {
      model,
      messageLength: message.length,
    });

    const completion = await this.client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "Extract rental preferences for a car-rental website and return strict JSON only with keys: carType, maxPrice, minPrice, features, durationDays. carType must be one of SUV, Sedan, Electric, Hatchback. Use null for missing values. If the message is out of scope (general knowledge, politics, history, geography, coding, health, legal, etc.), return all fields as null. Return JSON only with no extra keys and no explanation.",
        },
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
