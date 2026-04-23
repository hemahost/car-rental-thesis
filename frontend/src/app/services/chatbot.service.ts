import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatbotFilters {
  carType: string | null;
  maxPrice: number | null;
  minPrice: number | null;
  features: string[] | null;
  durationDays: number | null;
  sortByPrice: 'asc' | 'desc' | null;
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

export interface ChatbotRecommendation {
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

interface ChatbotApiResponse {
  success: boolean;
  data: {
    filters: ChatbotFilters;
    recommendations: ChatbotRecommendation[];
    aiResponse: string;
  };
}

export interface ChatHistoryItem {
  role: 'user' | 'bot';
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly apiUrl = 'http://localhost:3000/api/chatbot';

  constructor(private http: HttpClient) {}

  sendMessage(message: string, history: ChatHistoryItem[] = []): Observable<ChatbotApiResponse> {
    return this.http.post<ChatbotApiResponse>(this.apiUrl, { message, history });
  }
}
