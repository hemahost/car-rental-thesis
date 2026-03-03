import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Car } from '../models/car.model';
import { Booking } from '../models/booking.model';

export interface AdminBooking extends Booking {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly apiUrl = 'http://localhost:3000/api/admin';

  constructor(private http: HttpClient) {}

  // ── Cars ──

  getAdminCars(): Observable<Car[]> {
    return this.http
      .get<{ success: boolean; cars: Car[] }>(`${this.apiUrl}/cars`)
      .pipe(map((res) => res.cars));
  }

  createCar(payload: Partial<Car>): Observable<Car> {
    return this.http
      .post<{ success: boolean; car: Car }>(`${this.apiUrl}/cars`, payload)
      .pipe(map((res) => res.car));
  }

  updateCar(id: string, payload: Partial<Car>): Observable<Car> {
    return this.http
      .put<{ success: boolean; car: Car }>(`${this.apiUrl}/cars/${id}`, payload)
      .pipe(map((res) => res.car));
  }

  deleteCar(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cars/${id}`);
  }

  // ── Bookings ──

  getAdminBookings(status?: string): Observable<AdminBooking[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http
      .get<{ success: boolean; bookings: AdminBooking[] }>(`${this.apiUrl}/bookings`, { params })
      .pipe(map((res) => res.bookings));
  }

  updateBookingStatus(id: string, status: string): Observable<AdminBooking> {
    return this.http
      .patch<{ success: boolean; booking: AdminBooking }>(`${this.apiUrl}/bookings/${id}/status`, { status })
      .pipe(map((res) => res.booking));
  }
}
