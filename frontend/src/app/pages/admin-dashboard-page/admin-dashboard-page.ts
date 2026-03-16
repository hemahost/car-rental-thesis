import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService, AdminBooking } from '../../services/admin.service';
import { Car } from '../../models/car.model';
import { ThemeService } from '../../services/theme.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-dashboard-page.html',
  styleUrls: ['./admin-dashboard-page.scss'],
})
export class AdminDashboardPage implements OnInit {
  activeTab: 'cars' | 'bookings' = 'cars';

  // ── Cars ──
  cars: Car[] = [];
  carsLoading = false;
  carsError = '';

  showCarForm = false;
  editingCar: Car | null = null;
  carForm = { brand: '', model: '', type: '', pricePerDay: 0, description: '', imageUrl: '' };
  carFormLoading = false;
  carFormError = '';
  carFormSuccess = '';

  // ── Bookings ──
  bookings: AdminBooking[] = [];
  bookingsLoading = false;
  bookingsError = '';
  bookingsFilter = '';

  constructor(public auth: AuthService, public theme: ThemeService, private adminService: AdminService, private cdr: ChangeDetectorRef) {}

  get confirmedCount(): number {
    return this.bookings.filter(b => b.status === 'CONFIRMED').length;
  }

  get pendingCount(): number {
    return this.bookings.filter(b => b.status === 'PENDING').length;
  }

  ngOnInit(): void {
    this.loadCars();
    this.loadBookings();
  }

  // ── Cars ──

  loadCars(): void {
    this.carsLoading = true;
    this.carsError = '';
    this.adminService
      .getAdminCars()
      .pipe(finalize(() => { this.carsLoading = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: (cars) => { this.cars = cars; this.cdr.detectChanges(); },
        error: () => { this.carsError = 'Failed to load cars'; this.cdr.detectChanges(); },
      });
  }

  openAddCar(): void {
    this.editingCar = null;
    this.carForm = { brand: '', model: '', type: '', pricePerDay: 0, description: '', imageUrl: '' };
    this.carFormError = '';
    this.carFormSuccess = '';
    this.showCarForm = true;
  }

  openEditCar(car: Car): void {
    this.editingCar = car;
    this.carForm = {
      brand: car.brand,
      model: car.model,
      type: car.type,
      pricePerDay: car.pricePerDay,
      description: car.description,
      imageUrl: car.imageUrl || '',
    };
    this.carFormError = '';
    this.carFormSuccess = '';
    this.showCarForm = true;
  }

  cancelCarForm(): void {
    this.showCarForm = false;
    this.editingCar = null;
    this.carFormError = '';
    this.carFormSuccess = '';
  }

  submitCarForm(): void {
    this.carFormLoading = true;
    this.carFormError = '';
    this.carFormSuccess = '';

    const payload = {
      brand: this.carForm.brand,
      model: this.carForm.model,
      type: this.carForm.type,
      pricePerDay: Number(this.carForm.pricePerDay),
      description: this.carForm.description,
      imageUrl: this.carForm.imageUrl || undefined,
    };

    const obs = this.editingCar
      ? this.adminService.updateCar(this.editingCar.id, payload)
      : this.adminService.createCar(payload);

    obs.pipe(finalize(() => (this.carFormLoading = false))).subscribe({
      next: () => {
        this.carFormSuccess = this.editingCar ? 'Car updated successfully!' : 'Car created successfully!';
        this.loadCars();
        setTimeout(() => this.cancelCarForm(), 1200);
      },
      error: (err) => {
        this.carFormError = err?.error?.error?.message || 'Failed to save car';
      },
    });
  }

  deleteCar(car: Car): void {
    if (!confirm(`Delete "${car.brand} ${car.model}"? This will also remove all its bookings.`)) return;
    this.adminService.deleteCar(car.id).subscribe({
      next: () => this.loadCars(),
      error: () => (this.carsError = 'Failed to delete car'),
    });
  }

  // ── Bookings ──

  loadBookings(): void {
    this.bookingsLoading = true;
    this.bookingsError = '';
    this.adminService
      .getAdminBookings(this.bookingsFilter || undefined)
      .pipe(finalize(() => { this.bookingsLoading = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: (bookings) => { this.bookings = bookings; this.cdr.detectChanges(); },
        error: () => { this.bookingsError = 'Failed to load bookings'; this.cdr.detectChanges(); },
      });
  }

  onFilterChange(): void {
    this.loadBookings();
  }

  setBookingStatus(booking: AdminBooking, status: string): void {
    this.adminService.updateBookingStatus(booking.id, status).subscribe({
      next: (updated) => {
        const idx = this.bookings.findIndex((b) => b.id === updated.id);
        if (idx !== -1) this.bookings[idx] = updated;
      },
      error: () => (this.bookingsError = 'Failed to update booking status'),
    });
  }
}
