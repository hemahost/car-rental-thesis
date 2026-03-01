import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Booking } from '../models/booking.model';
import { AuthService } from './auth.service';

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

  cancelBooking(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.authHeaders(),
    });
  }
}
