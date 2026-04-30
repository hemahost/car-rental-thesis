import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Booking } from '../models/booking.model';
import { AuthService } from './auth.service';

export interface UnavailableBookingRange {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  holdExpiresAt?: string | null;
}

export interface AvailabilityCheckResult {
  available: boolean;
  conflictingBookings: number;
  conflictingRanges: UnavailableBookingRange[];
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly apiUrl = 'http://localhost:3000/api/bookings';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.token}` });
  }

  getMyBookings(): Observable<Booking[]> {
    return this.http
      .get<{ success: boolean; bookings: Booking[] }>(`${this.apiUrl}/me`, {
        headers: this.authHeaders(),
      })
      .pipe(map((res) => res.bookings));
  }

  checkAvailability(
    carId: string,
    startDate: string,
    endDate: string
  ): Observable<AvailabilityCheckResult> {
    return this.http
      .get<{
        success: boolean;
        available: boolean;
        conflictingBookings: number;
        conflictingRanges?: UnavailableBookingRange[];
      }>(
        `${this.apiUrl}/availability?carId=${carId}&startDate=${startDate}&endDate=${endDate}`
      )
      .pipe(
        map((res) => ({
          available: res.available,
          conflictingBookings: res.conflictingBookings,
          conflictingRanges: res.conflictingRanges || [],
        }))
      );
  }

  getUnavailableBookings(carId: string): Observable<UnavailableBookingRange[]> {
    return this.http
      .get<{ success: boolean; unavailableBookings: UnavailableBookingRange[] }>(
        `${this.apiUrl}/unavailable/${carId}`
      )
      .pipe(map((res) => res.unavailableBookings));
  }

  createBooking(
    carId: string,
    startDate: string,
    endDate: string,
    pickupLocation?: string,
    dropoffLocation?: string
  ): Observable<Booking> {
    return this.http
      .post<{ success: boolean; booking: Booking }>(
        this.apiUrl,
        { carId, startDate, endDate, pickupLocation, dropoffLocation },
        { headers: this.authHeaders() }
      )
      .pipe(map((res) => res.booking));
  }

  cancelBooking(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.authHeaders(),
    });
  }
}
