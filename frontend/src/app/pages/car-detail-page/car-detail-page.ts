import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CarService } from '../../services/car.service';
import { BookingService } from '../../services/booking.service';
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
export class CarDetailPage implements OnInit {
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
      .createBooking(this.car.id, this.startDate, this.endDate, this.pickupLocation || undefined, this.dropoffLocation || undefined)
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
