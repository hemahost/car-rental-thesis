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

export interface AdminStats {
  totalUsers: number;
  totalCars: number;
  totalBookings: number;
  totalRevenue: number;
  bookingsByStatus: Record<string, number>;
  dailyBookings: { date: string; count: number }[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  role: string;
  provider: string;
  avatarUrl: string | null;
  createdAt: string;
  _count: { bookings: number };
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  role: string;
  provider: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  bookings: {
    id: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    status: string;
    pickupLocation: string | null;
    dropoffLocation: string | null;
    car: { brand: string; model: string; imageUrl: string | null };
  }[];
}

export interface AdminUserUpdateResult {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  role: string;
  provider: string;
  twoFactorEnabled: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly apiUrl = 'http://localhost:3000/api/admin';

  constructor(private http: HttpClient) {}

  // ── Stats ──

  getAdminStats(): Observable<AdminStats> {
    return this.http
      .get<{ success: boolean } & AdminStats>(`${this.apiUrl}/stats`)
      .pipe(map((res) => ({
        totalUsers: res.totalUsers,
        totalCars: res.totalCars,
        totalBookings: res.totalBookings,
        totalRevenue: res.totalRevenue,
        bookingsByStatus: res.bookingsByStatus,
        dailyBookings: res.dailyBookings,
      })));
  }

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

  // ── Users ──

  getAdminUsers(): Observable<AdminUser[]> {
    return this.http
      .get<{ success: boolean; users: AdminUser[] }>(`${this.apiUrl}/users`)
      .pipe(map((res) => res.users));
  }

  updateUser(
    id: string,
    payload: { name: string; email: string; phone?: string | null; address?: string | null; role?: string }
  ): Observable<AdminUserUpdateResult> {
    return this.http
      .put<{ success: boolean; user: AdminUserUpdateResult }>(`${this.apiUrl}/users/${id}`, payload)
      .pipe(map((res) => res.user));
  }

  updateUserRole(id: string, role: string): Observable<{ id: string; name: string; email: string; role: string }> {
    return this.http
      .patch<{ success: boolean; user: { id: string; name: string; email: string; role: string } }>(
        `${this.apiUrl}/users/${id}/role`,
        { role }
      )
      .pipe(map((res) => res.user));
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  getUserDetail(id: string): Observable<AdminUserDetail> {
    return this.http
      .get<{ success: boolean; user: AdminUserDetail }>(`${this.apiUrl}/users/${id}`)
      .pipe(map((res) => res.user));
  }
}
