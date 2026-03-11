import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, BehaviorSubject, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { Car } from '../models/car.model';

export interface Favorite {
  id: string;
  userId: string;
  carId: string;
  createdAt: string;
  car?: Car;
}

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private readonly apiUrl = 'http://localhost:3000/api/favorites';
  private likedCarIds = new BehaviorSubject<Set<string>>(new Set());

  likedCarIds$ = this.likedCarIds.asObservable();

  constructor(private http: HttpClient, private auth: AuthService) {
    // React to auth state changes — reload or clear favorites
    this.auth.currentUser$.subscribe((user) => {
      if (user) {
        this.loadFavorites();
      } else {
        this.clearFavorites();
      }
    });
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.token}` });
  }

  /** Clear cached favorites (on logout) */
  clearFavorites(): void {
    this.likedCarIds.next(new Set());
  }

  /** Load all favorites and populate the liked set */
  loadFavorites(): void {
    if (!this.auth.isLoggedIn) return;
    this.http
      .get<{ success: boolean; favorites: Favorite[] }>(this.apiUrl, {
        headers: this.authHeaders(),
      })
      .subscribe({
        next: (res) => {
          const ids = new Set(res.favorites.map((f) => f.carId));
          this.likedCarIds.next(ids);
        },
        error: () => {},
      });
  }

  /** Get full favorite list with car details */
  getFavorites(): Observable<Favorite[]> {
    return this.http
      .get<{ success: boolean; favorites: Favorite[] }>(this.apiUrl, {
        headers: this.authHeaders(),
      })
      .pipe(map((res) => res.favorites));
  }

  /** Check if a car is liked */
  isLiked(carId: string): boolean {
    return this.likedCarIds.value.has(carId);
  }

  /** Toggle like/unlike */
  toggleFavorite(carId: string): Observable<any> {
    if (this.isLiked(carId)) {
      return this.http
        .delete(`${this.apiUrl}/${carId}`, { headers: this.authHeaders() })
        .pipe(
          tap(() => {
            const ids = new Set(this.likedCarIds.value);
            ids.delete(carId);
            this.likedCarIds.next(ids);
          })
        );
    } else {
      return this.http
        .post(`${this.apiUrl}/${carId}`, {}, { headers: this.authHeaders() })
        .pipe(
          tap(() => {
            const ids = new Set(this.likedCarIds.value);
            ids.add(carId);
            this.likedCarIds.next(ids);
          })
        );
    }
  }
}
