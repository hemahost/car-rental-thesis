import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService, AdminBooking, AdminStats, AdminUser, AdminUserDetail } from '../../services/admin.service';
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
  activeTab: 'stats' | 'cars' | 'bookings' | 'users' = 'stats';

  // ── Cars ──
  cars: Car[] = [];
  carsLoading = false;
  carsError = '';

  showCarForm = false;
  editingCar: Car | null = null;
  carForm: {
    brand: string; model: string; type: string; pricePerDay: number;
    description: string; imageUrl: string; city: string; color: string;
    seats: number | null; transmission: string; fuelType: string; year: number | null; horsepower: number | null; mileageKm: number | null;
  } = { brand: '', model: '', type: '', pricePerDay: 0, description: '', imageUrl: '', city: '', color: '', seats: null, transmission: '', fuelType: '', year: null, horsepower: null, mileageKm: null };
  carFormLoading = false;
  carFormError = '';
  carFormSuccess = '';

  // ── Bookings ──
  bookings: AdminBooking[] = [];
  bookingsLoading = false;
  bookingsError = '';
  bookingsFilter = '';

  // ── Stats ──
  stats: AdminStats | null = null;
  statsLoading = false;
  statsError = '';

  // ── Users ──
  users: AdminUser[] = [];
  usersLoading = false;
  usersError = '';

  // ── User Detail Modal ──
  selectedUser: AdminUserDetail | null = null;
  userDetailLoading = false;
  userDetailError = '';
  showUserDetail = false;

  readonly statusOrder = ['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
  readonly statusColors: Record<string, string> = {
    PENDING: '#f59e0b',
    CONFIRMED: '#3b82f6',
    ACTIVE: '#8b5cf6',
    COMPLETED: '#10b981',
    CANCELLED: '#ef4444',
  };

  constructor(public auth: AuthService, public theme: ThemeService, private adminService: AdminService, private cdr: ChangeDetectorRef) {}

  get confirmedCount(): number {
    return this.bookings.filter(b => b.status === 'CONFIRMED').length;
  }

  get pendingCount(): number {
    return this.bookings.filter(b => b.status === 'PENDING').length;
  }

  get completedCount(): number {
    return this.bookings.filter(b => b.status === 'COMPLETED').length;
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadCars();
    this.loadBookings();
    this.loadUsers();
  }

  // ── Stats ──

  loadStats(): void {
    this.statsLoading = true;
    this.statsError = '';
    this.adminService.getAdminStats()
      .pipe(finalize(() => { this.statsLoading = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: (stats) => { this.stats = stats; this.cdr.detectChanges(); },
        error: () => { this.statsError = 'Failed to load stats'; this.cdr.detectChanges(); },
      });
  }

  getBarHeight(count: number): number {
    if (!this.stats) return 0;
    const max = Math.max(...this.stats.dailyBookings.map((d) => d.count), 1);
    return Math.round((count / max) * 100);
  }

  // ── Users ──

  loadUsers(): void {
    this.usersLoading = true;
    this.usersError = '';
    this.adminService.getAdminUsers()
      .pipe(finalize(() => { this.usersLoading = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: (users) => { this.users = users; this.cdr.detectChanges(); },
        error: () => { this.usersError = 'Failed to load users'; this.cdr.detectChanges(); },
      });
  }

  viewUser(user: AdminUser): void {
    this.showUserDetail = true;
    this.selectedUser = null;
    this.userDetailLoading = true;
    this.userDetailError = '';
    this.adminService.getUserDetail(user.id).subscribe({
      next: (detail) => { this.selectedUser = detail; this.userDetailLoading = false; this.cdr.detectChanges(); },
      error: () => { this.userDetailError = 'Failed to load user details'; this.userDetailLoading = false; this.cdr.detectChanges(); },
    });
  }

  closeUserDetail(): void {
    this.showUserDetail = false;
    this.selectedUser = null;
    this.userDetailError = '';
  }

  promoteUser(user: AdminUser): void {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const label = newRole === 'ADMIN' ? 'promote to Admin' : 'demote to User';
    if (!confirm(`Are you sure you want to ${label} "${user.name}"?`)) return;

    this.adminService.updateUserRole(user.id, newRole).subscribe({
      next: (updated) => {
        const idx = this.users.findIndex((u) => u.id === updated.id);
        if (idx !== -1) this.users[idx] = { ...this.users[idx], role: updated.role };
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.usersError = err?.error?.error?.message || 'Failed to update role';
        this.cdr.detectChanges();
      },
    });
  }

  deleteUser(user: AdminUser): void {
    if (!confirm(`Delete account "${user.name}" (${user.email})? This cannot be undone.`)) return;

    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u.id !== user.id);
        this.cdr.detectChanges();
      },
      error: () => { this.usersError = 'Failed to delete user'; this.cdr.detectChanges(); },
    });
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
    this.carForm = { brand: '', model: '', type: '', pricePerDay: 0, description: '', imageUrl: '', city: '', color: '', seats: null, transmission: '', fuelType: '', year: null, horsepower: null, mileageKm: null };
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
      city: car.city || '',
      color: car.color || '',
      seats: car.seats || null,
      transmission: car.transmission || '',
      fuelType: car.fuelType || '',
      year: car.year || null,
      horsepower: car.horsepower || null,
      mileageKm: car.mileageKm || null,
    };
    this.carFormError = '';
    this.carFormSuccess = '';
    this.showCarForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      city: this.carForm.city || undefined,
      color: this.carForm.color || undefined,
      seats: this.carForm.seats || undefined,
      transmission: this.carForm.transmission || undefined,
      fuelType: this.carForm.fuelType || undefined,
      year: this.carForm.year || undefined,
      horsepower: this.carForm.horsepower || undefined,
      mileageKm: this.carForm.mileageKm || undefined,
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
