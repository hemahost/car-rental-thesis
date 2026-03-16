import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Review } from '../models/review.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly apiUrl = 'http://localhost:3000/api/reviews';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.token}` });
  }

  getReviews(carId: string): Observable<{ reviews: Review[]; avgRating: number; totalReviews: number }> {
    return this.http
      .get<{ success: boolean; reviews: Review[]; avgRating: number; totalReviews: number }>(
        `${this.apiUrl}/${carId}`
      )
      .pipe(map((res) => ({ reviews: res.reviews, avgRating: res.avgRating, totalReviews: res.totalReviews })));
  }

  submitReview(carId: string, rating: number, comment: string): Observable<Review> {
    return this.http
      .post<{ success: boolean; review: Review }>(
        `${this.apiUrl}/${carId}`,
        { rating, comment },
        { headers: this.authHeaders() }
      )
      .pipe(map((res) => res.review));
  }

  deleteReview(reviewId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${reviewId}`, {
      headers: this.authHeaders(),
    });
  }
}
