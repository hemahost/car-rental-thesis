import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CarService } from '../../services/car.service';
import { BookingService } from '../../services/booking.service';
import { FavoriteService } from '../../services/favorite.service';
import { Car } from '../../models/car.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-car-detail-page',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './car-detail-page.html',
  styleUrl: './car-detail-page.scss',
})
export class CarDetailPage implements OnInit {
  car: Car | null = null;
  loading = true;
  error = '';

  // Booking form
  startDate = '';
  endDate = '';
  availabilityStatus: 'idle' | 'checking' | 'available' | 'unavailable' = 'idle';
  totalDays = 0;
  totalPrice = 0;
  bookingMessage = '';
  bookingError = '';
  bookingLoading = false;
  bookingSuccess = false;

  constructor(
    public auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private carService: CarService,
    private bookingService: BookingService,
    public favoriteService: FavoriteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'No car ID provided.';
      this.loading = false;
      return;
    }

    this.carService.getCarById(id).subscribe({
      next: (car) => {
        this.car = car;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Car not found.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });

    // Set default start date to today
    const today = new Date();
    this.startDate = this.formatDate(today);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.endDate = this.formatDate(tomorrow);
  }

  get todayStr(): string {
    return this.formatDate(new Date());
  }

  get minEndDate(): string {
    if (this.startDate) {
      const d = new Date(this.startDate);
      d.setDate(d.getDate() + 1);
      return this.formatDate(d);
    }
    return this.todayStr;
  }

  private formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  onDateChange(): void {
    this.availabilityStatus = 'idle';
    this.bookingMessage = '';
    this.bookingError = '';
    this.bookingSuccess = false;

    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      if (end > start) {
        this.totalDays = Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
        this.totalPrice = this.totalDays * (this.car?.pricePerDay || 0);
      } else {
        this.totalDays = 0;
        this.totalPrice = 0;
      }
    }
    this.cdr.detectChanges();
  }

  checkAvailability(): void {
    if (!this.car || !this.startDate || !this.endDate) return;

    this.availabilityStatus = 'checking';
    this.bookingError = '';
    this.cdr.detectChanges();

    this.bookingService
      .checkAvailability(this.car.id, this.startDate, this.endDate)
      .subscribe({
        next: (res) => {
          this.availabilityStatus = res.available ? 'available' : 'unavailable';
          this.cdr.detectChanges();
        },
        error: () => {
          this.bookingError = 'Failed to check availability. Please try again.';
          this.availabilityStatus = 'idle';
          this.cdr.detectChanges();
        },
      });
  }

  get isLiked(): boolean {
    return this.car ? this.favoriteService.isLiked(this.car.id) : false;
  }

  toggleLike(): void {
    if (!this.car || !this.auth.isLoggedIn) return;
    this.favoriteService.toggleFavorite(this.car.id).subscribe({
      next: () => this.cdr.detectChanges(),
    });
  }

  scrollToBooking(): void {
    document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  confirmBooking(): void {
    if (!this.car || !this.startDate || !this.endDate) return;

    this.bookingLoading = true;
    this.bookingError = '';
    this.cdr.detectChanges();

    this.bookingService
      .createBooking(this.car.id, this.startDate, this.endDate)
      .subscribe({
        next: () => {
          this.bookingLoading = false;
          this.bookingSuccess = true;
          this.bookingMessage = 'Booking confirmed! Redirecting to dashboard...';
          this.cdr.detectChanges();
          setTimeout(() => this.router.navigate(['/profile']), 2500);
        },
        error: (err) => {
          this.bookingLoading = false;
          this.bookingError =
            err.error?.message || 'Failed to create booking. Please try again.';
          this.cdr.detectChanges();
        },
      });
  }
}
