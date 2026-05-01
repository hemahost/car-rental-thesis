import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { PaymentService } from '../../services/payment.service';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TJyrjK6jyScMevhuDb4SLCdVJE4E9IjsyDZwUPSHlxWYwVno7dKQsBjx2lMqXgi5pBoeYH7ByiL8e39pVJRfkfS00ycNcJsnP';

@Component({
  selector: 'app-payment-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-page.html',
  styleUrl: './payment-page.scss',
})
export class PaymentPage implements OnInit, AfterViewInit {
  @ViewChild('cardElement') cardElementRef!: ElementRef;

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;

  bookingId = '';
  clientSecret = '';
  totalPrice = 0;
  carName = '';

  loading = true;
  cardReady = false;
  processing = false;
  error = '';
  success = false;

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.bookingId = this.route.snapshot.paramMap.get('bookingId') || '';
    const state = history.state;
    this.clientSecret = state?.clientSecret || '';
    this.totalPrice = state?.totalPrice || 0;
    this.carName = state?.carName || '';

    if (!this.bookingId || !this.clientSecret) {
      this.error = 'Invalid payment session. Please go back and try again.';
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);

    if (!this.stripe) {
      this.error = 'Failed to load payment system. Please refresh the page.';
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.loading = false;
    this.cdr.markForCheck();

    setTimeout(() => this.mountCard(), 50);
  }

  ngAfterViewInit(): void {}

  private mountCard(): void {
    if (!this.stripe || !this.cardElementRef?.nativeElement) return;

    this.elements = this.stripe.elements();
    this.cardElement = this.elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          fontFamily: '"Inter", "Segoe UI", sans-serif',
          color: '#1a1a2e',
          '::placeholder': { color: '#aab7c4' },
        },
        invalid: { color: '#e63946' },
      },
    });

    this.cardElement.mount(this.cardElementRef.nativeElement);
    this.cardElement.on('ready', () => {
      this.cardReady = true;
      this.cdr.markForCheck();
    });
    this.cardElement.on('change', (event) => {
      this.error = event.error ? event.error.message : '';
      this.cdr.markForCheck();
    });
  }

  async confirmPayment(): Promise<void> {
    if (!this.stripe || !this.cardElement || !this.clientSecret || this.processing) return;

    this.processing = true;
    this.error = '';
    this.cdr.markForCheck();

    const result = await this.stripe.confirmCardPayment(this.clientSecret, {
      payment_method: { card: this.cardElement },
    });

    if (result.error) {
      this.error = result.error.message || 'Payment failed. Please try again.';
      this.processing = false;
      this.cdr.markForCheck();
    } else if (result.paymentIntent?.status === 'succeeded') {
      this.paymentService.confirmBookingPayment(this.bookingId).subscribe({
        next: () => {
          this.success = true;
          this.processing = false;
          this.cdr.markForCheck();
          setTimeout(() => this.router.navigate(['/profile']), 3000);
        },
        error: () => {
          this.success = true;
          this.processing = false;
          this.cdr.markForCheck();
          setTimeout(() => this.router.navigate(['/profile']), 3000);
        },
      });
    }
  }
}
