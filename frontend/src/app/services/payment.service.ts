import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly apiUrl = 'http://localhost:3000/api/payments';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.token}` });
  }

  createPaymentIntent(bookingId: string): Observable<{ clientSecret: string }> {
    return this.http
      .post<{ success: boolean; clientSecret: string }>(
        `${this.apiUrl}/create-intent`,
        { bookingId },
        { headers: this.authHeaders() }
      )
      .pipe(map((res) => ({ clientSecret: res.clientSecret })));
  }

  confirmBookingPayment(bookingId: string): Observable<void> {
    return this.http
      .post<{ success: boolean }>(
        `${this.apiUrl}/confirm`,
        { bookingId },
        { headers: this.authHeaders() }
      )
      .pipe(map(() => void 0));
  }
}
