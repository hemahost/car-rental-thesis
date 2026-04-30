import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CarService } from '../../services/car.service';
import { BookingService, UnavailableBookingRange } from '../../services/booking.service';
import { PaymentService } from '../../services/payment.service';
import { FavoriteService } from '../../services/favorite.service';
import { ReviewService } from '../../services/review.service';
import { Car } from '../../models/car.model';
import { Review } from '../../models/review.model';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { CarCard } from '../../components/car-card/car-card';

@Component({
  selector: 'app-car-detail-page',
  imports: [CommonModule, RouterLink, FormsModule, CarCard],
  templateUrl: './car-detail-page.html',
  styleUrl: './car-detail-page.scss',
})
export class CarDetailPage implements OnInit, OnDestroy {
  readonly maxBookingAdvanceDays = 365;
  readonly maxRentalDays = 30;
  car: Car | null = null;
  loading = true;
  error = '';
  similarCars: Car[] = [];
  // Booking form
  startDate = '';
  endDate = '';
  pickupLocation = '';
  dropoffLocation = '';
  availabilityStatus: 'idle' | 'checking' | 'available' | 'unavailable' = 'idle';
  totalDays = 0;
  totalPrice = 0;
  bookingMessage = '';
  bookingError = '';
  bookingLoading = false;
  bookingSuccess = false;
  unavailableBookings: UnavailableBookingRange[] = [];
  availabilityConflictRanges: UnavailableBookingRange[] = [];
  unavailableBookingsLoading = false;
  private holdRefreshTimer?: ReturnType<typeof setTimeout>;

  // Reviews
  reviews: Review[] = [];
  avgRating = 0;
  totalReviews = 0;
  reviewRating = 0;
  reviewComment = '';
  reviewError = '';
  reviewSuccess = '';
  hoverRating = 0;

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    private route: ActivatedRoute,
    private router: Router,
    private carService: CarService,
    private bookingService: BookingService,
    private paymentService: PaymentService,
    public favoriteService: FavoriteService,
    private reviewService: ReviewService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.error = 'No car ID provided.';
        this.loading = false;
        return;
      }

      // Reset state on each navigation
      this.clearHoldRefreshTimer();
      this.car = null;
      this.loading = true;
      this.error = '';
      this.similarCars = [];
      this.reviews = [];
      this.avgRating = 0;
      this.totalReviews = 0;
      this.availabilityStatus = 'idle';
      this.bookingSuccess = false;
      this.bookingError = '';
      this.bookingMessage = '';
      this.pickupLocation = '';
      this.dropoffLocation = '';
      this.unavailableBookings = [];
      this.availabilityConflictRanges = [];
      this.unavailableBookingsLoading = false;

      const today = new Date();
      this.startDate = this.formatDate(today);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.endDate = this.formatDate(tomorrow);

      // Scroll to top on navigation
      window.scrollTo({ top: 0, behavior: 'smooth' });

      this.carService.getCarById(id).subscribe({
        next: (car) => {
          this.car = car;
          this.loading = false;
          if (car.city) {
            this.pickupLocation = car.city;
            this.dropoffLocation = car.city;
          }
          this.loadUnavailableBookings(car.id);
          this.loadReviews(id);
          this.carService.getCars({ type: car.type }).subscribe({
            next: (cars) => {
              this.similarCars = cars.filter(c => c.id !== id).slice(0, 3);
              this.cdr.detectChanges();
            },
          });
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = 'Car not found.';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
    });
  }

  ngOnDestroy(): void {
    this.clearHoldRefreshTimer();
  }

  get todayStr(): string {
    return this.formatDate(new Date());
  }

  get minEndDate(): string {
    if (this.startDate) {
      const d = this.parseDateInput(this.startDate);
      d.setDate(d.getDate() + 1);
      return this.formatDate(d);
    }
    return this.todayStr;
  }

  get maxBookingDate(): string {
    const latest = new Date();
    latest.setDate(latest.getDate() + this.maxBookingAdvanceDays);
    return this.formatDate(latest);
  }

  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDateInput(value: string): Date {
    if (!value) {
      return new Date(NaN);
    }

    // Booking APIs return ISO timestamps, while date inputs use YYYY-MM-DD.
    if (value.includes('T')) {
      return new Date(value);
    }

    return new Date(`${value}T00:00:00`);
  }

  private formatDateRange(startDate: string, endDate: string): string {
    const start = this.parseDateInput(startDate);
    const end = this.parseDateInput(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Unavailable dates could not be loaded';
    }

    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }

  get hasValidDateRange(): boolean {
    return !this.getValidationError();
  }

  get canConfirmBooking(): boolean {
    return (
      this.hasValidDateRange &&
      this.availabilityStatus === 'available' &&
      !this.bookingLoading
    );
  }

  private getNormalizedLocation(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  formatUnavailableBookingLabel(booking: UnavailableBookingRange): string {
    const dateRange = this.formatDateRange(booking.startDate, booking.endDate);

    if (booking.status !== 'PENDING' || !booking.holdExpiresAt) {
      return dateRange;
    }

    const expiresAt = new Date(booking.holdExpiresAt);
    if (isNaN(expiresAt.getTime())) {
      return `${dateRange} - temporarily held`;
    }

    return `${dateRange} - held until ${expiresAt.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  private clearHoldRefreshTimer(): void {
    if (this.holdRefreshTimer) {
      clearTimeout(this.holdRefreshTimer);
      this.holdRefreshTimer = undefined;
    }
  }

  private schedulePendingHoldRefresh(): void {
    this.clearHoldRefreshTimer();

    const nextExpiry = [...this.unavailableBookings, ...this.availabilityConflictRanges]
      .filter((booking) => booking.status === 'PENDING' && booking.holdExpiresAt)
      .map((booking) => new Date(booking.holdExpiresAt as string).getTime())
      .filter((time) => !isNaN(time) && time > Date.now())
      .sort((a, b) => a - b)[0];

    if (!nextExpiry) {
      return;
    }

    this.holdRefreshTimer = setTimeout(() => {
      const carId = this.car?.id;
      if (!carId) {
        return;
      }

      this.loadUnavailableBookings(carId);
      if (this.availabilityStatus !== 'idle' && !this.getValidationError()) {
        this.checkAvailability();
      }
    }, Math.max(1000, nextExpiry - Date.now() + 1000));
  }

  private getValidationError(): string {
    if (!this.startDate || !this.endDate) {
      return 'Pick-up and return dates are required.';
    }

    const start = this.parseDateInput(this.startDate);
    const end = this.parseDateInput(this.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Please enter valid booking dates.';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return 'Pick-up date cannot be in the past.';
    }

    if (end < today) {
      return 'Return date cannot be in the past.';
    }

    if (end <= start) {
      return 'Return date must be after the pick-up date.';
    }

    const latestAllowed = this.parseDateInput(this.maxBookingDate);
    if (start > latestAllowed || end > latestAllowed) {
      return `Bookings can only be made up to ${this.maxBookingAdvanceDays} days in advance.`;
    }

    const rentalDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (rentalDays > this.maxRentalDays) {
      return `Bookings cannot be longer than ${this.maxRentalDays} days.`;
    }

    if (!this.getNormalizedLocation(this.pickupLocation)) {
      return 'Pick-up location is required.';
    }

    if (!this.getNormalizedLocation(this.dropoffLocation)) {
      return 'Drop-off location is required.';
    }

    return '';
  }

  onDateChange(): void {
    this.availabilityStatus = 'idle';
    this.bookingMessage = '';
    this.bookingError = '';
    this.bookingSuccess = false;
    this.availabilityConflictRanges = [];
    const validationError = this.getValidationError();
    if (validationError) {
      this.totalDays = 0;
      this.totalPrice = 0;
      this.bookingError = validationError;
      this.cdr.detectChanges();
      return;
    }

    const start = this.parseDateInput(this.startDate);
    const end = this.parseDateInput(this.endDate);
    this.totalDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    this.totalPrice = this.totalDays * (this.car?.pricePerDay || 0);

    if (this.car) {
      this.checkAvailability();
      return;
    }

    this.cdr.detectChanges();
  }

  checkAvailability(): void {
    if (!this.car || !this.startDate || !this.endDate) return;

    const validationError = this.getValidationError();
    if (validationError) {
      this.bookingError = validationError;
      this.availabilityStatus = 'idle';
      this.availabilityConflictRanges = [];
      this.cdr.detectChanges();
      return;
    }

    this.availabilityStatus = 'checking';
    this.bookingError = '';
    this.cdr.detectChanges();

    this.bookingService
      .checkAvailability(this.car.id, this.startDate, this.endDate)
      .subscribe({
        next: (res) => {
          this.availabilityStatus = res.available ? 'available' : 'unavailable';
          this.availabilityConflictRanges = res.conflictingRanges;
          this.schedulePendingHoldRefresh();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.bookingError = err.error?.message || 'Failed to check availability. Please try again.';
          this.availabilityConflictRanges = [];
          this.availabilityStatus = 'idle';
          this.cdr.detectChanges();
        },
      });
  }

  loadUnavailableBookings(carId: string): void {
    this.unavailableBookingsLoading = true;
    this.bookingService.getUnavailableBookings(carId).subscribe({
      next: (bookings) => {
        this.unavailableBookings = bookings;
        this.unavailableBookingsLoading = false;
        this.schedulePendingHoldRefresh();
        this.cdr.detectChanges();
      },
      error: () => {
        this.unavailableBookings = [];
        this.unavailableBookingsLoading = false;
        this.schedulePendingHoldRefresh();
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

    const validationError = this.getValidationError();
    if (validationError) {
      this.bookingError = validationError;
      this.cdr.detectChanges();
      return;
    }

    if (this.availabilityStatus !== 'available') {
      this.bookingError = 'Please choose an available date range before confirming.';
      this.cdr.detectChanges();
      return;
    }

    this.bookingLoading = true;
    this.bookingError = '';
    this.cdr.detectChanges();

    const pickupLocation = this.getNormalizedLocation(this.pickupLocation);
    const dropoffLocation = this.getNormalizedLocation(this.dropoffLocation);

    this.bookingService
      .createBooking(
        this.car.id,
        this.startDate,
        this.endDate,
        pickupLocation || undefined,
        dropoffLocation || undefined
      )
      .subscribe({
        next: (booking) => {
          this.paymentService.createPaymentIntent(booking.id).subscribe({
            next: ({ clientSecret }) => {
              this.bookingLoading = false;
              this.cdr.detectChanges();
              this.router.navigate(['/payment', booking.id], {
                state: {
                  clientSecret,
                  totalPrice: this.totalPrice,
                  carName: `${this.car!.brand} ${this.car!.model}`,
                },
              });
            },
            error: (err) => {
              this.bookingService.cancelBooking(booking.id).subscribe({
                error: () => {},
              });
              this.bookingLoading = false;
              this.bookingError = err.error?.message || 'Failed to initialize payment. Please try again.';
              this.cdr.detectChanges();
            },
          });
        },
        error: (err) => {
          this.bookingLoading = false;
          this.bookingError =
            err.error?.message || 'Failed to create booking. Please try again.';
          this.cdr.detectChanges();
        },
      });
  }

  // ── Reviews ──
  loadReviews(carId: string): void {
    this.reviewService.getReviews(carId).subscribe({
      next: (data) => {
        this.reviews = data.reviews;
        this.avgRating = data.avgRating;
        this.totalReviews = data.totalReviews;
        this.cdr.detectChanges();
      },
    });
  }

  setRating(star: number): void {
    this.reviewRating = star;
  }

  submitReview(): void {
    if (!this.car || !this.reviewRating || !this.reviewComment.trim()) return;
    this.reviewError = '';
    this.reviewSuccess = '';

    this.reviewService
      .submitReview(this.car.id, this.reviewRating, this.reviewComment)
      .subscribe({
        next: () => {
          this.reviewSuccess = 'Review submitted successfully!';
          this.reviewRating = 0;
          this.reviewComment = '';
          this.loadReviews(this.car!.id);
        },
        error: (err) => {
          this.reviewError =
            err.error?.error?.message || 'Failed to submit review.';
          this.cdr.detectChanges();
        },
      });
  }

  deleteReview(reviewId: string): void {
    this.reviewService.deleteReview(reviewId).subscribe({
      next: () => {
        this.loadReviews(this.car!.id);
      },
    });
  }

  getStars(rating: number): number[] {
    return [1, 2, 3, 4, 5].map((i) => (i <= Math.round(rating) ? 1 : 0));
  }
}
