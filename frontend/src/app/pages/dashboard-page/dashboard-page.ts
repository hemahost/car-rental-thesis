import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-dashboard-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage implements OnInit {
  userName = '';
  bookings: Booking[] = [];
  loading = false;
  error = '';

  constructor(
    public auth: AuthService,
    private bookingService: BookingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userName = this.auth.currentUser?.name ?? 'User';
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    this.error = '';

    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        this.bookings = bookings;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Failed to load bookings.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  get activeCount(): number {
    return this.bookings.filter((b) => b.status === 'CONFIRMED').length;
  }

  get upcomingCount(): number {
    const now = new Date();
    return this.bookings.filter((b) => new Date(b.startDate) > now && b.status === 'CONFIRMED').length;
  }

  get totalSpent(): number {
    return this.bookings.reduce((sum, b) => sum + b.totalPrice, 0);
  }

  cancelBooking(id: string): void {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    this.bookingService.cancelBooking(id).subscribe({
      next: () => {
        this.bookings = this.bookings.filter((b) => b.id !== id);
        this.cdr.markForCheck();
      },
      error: () => {
        alert('Failed to cancel booking.');
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
