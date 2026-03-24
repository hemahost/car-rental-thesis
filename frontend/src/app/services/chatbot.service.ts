import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatbotFilters {
  carType: string | null;
  maxPrice: number | null;
  minPrice: number | null;
  features: string[] | null;
  durationDays: number | null;
}

export interface ChatbotRecommendation {
  id: string;
  brand: string;
  model: string;
  type: string;
  pricePerDay: number;
}

interface ChatbotApiResponse {
  success: boolean;
  data: {
    filters: ChatbotFilters;
    recommendations: ChatbotRecommendation[];
    aiResponse: string;
  };
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly apiUrl = 'http://localhost:3000/api/chatbot';

  constructor(private http: HttpClient) {}

  sendMessage(message: string): Observable<ChatbotApiResponse> {
    return this.http.post<ChatbotApiResponse>(this.apiUrl, { message });
  }
}
