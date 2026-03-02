import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { Booking } from '../../models/booking.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile-page.html',
  styleUrls: ['./profile-page.scss'],
})
export class ProfilePage implements OnInit {
  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;

  user: User | null = null;
  bookings: Booking[] = [];
  bookingsLoading = false;

  // Active section
  activeSection: 'overview' | 'personal' | 'bookings' | 'security' = 'overview';

  // Edit personal info
  editingPersonal = false;
  editName = '';
  editEmail = '';
  editPhone = '';
  editAddress = '';
  saving = false;

  // Change password
  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  changingPassword = false;

  // Avatar
  uploadingAvatar = false;

  // Messages
  successMessage = '';
  errorMessage = '';

  constructor(
    public auth: AuthService,
    private bookingService: BookingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser;
    this.loadBookings();
  }

  get avatarUrl(): string {
    return this.auth.getAvatarFullUrl(this.user?.avatarUrl);
  }

  get hasAvatar(): boolean {
    return !!(this.user?.avatarUrl && this.user.avatarUrl.length > 0);
  }

  get userInitials(): string {
    if (!this.user?.name) return '?';
    return this.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  get memberSince(): string {
    if (!this.user?.createdAt) return 'N/A';
    return new Date(this.user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  }

  // ── Bookings ──
  loadBookings(): void {
    this.bookingsLoading = true;
    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        this.bookings = bookings;
        this.bookingsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.bookingsLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  get totalBookings(): number {
    return this.bookings.length;
  }

  get activeBookings(): number {
    return this.bookings.filter((b) => b.status === 'CONFIRMED').length;
  }

  get cancelledBookings(): number {
    return this.bookings.filter((b) => b.status === 'CANCELLED').length;
  }

  get totalSpent(): number {
    return this.bookings.reduce((sum, b) => sum + b.totalPrice, 0);
  }

  // ── Section switching ──
  switchSection(section: 'overview' | 'personal' | 'bookings' | 'security'): void {
    this.activeSection = section;
    this.clearMessages();
  }

  // ── Avatar ──
  triggerAvatarUpload(): void {
    this.avatarInput.nativeElement.click();
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    if (file.size > 5 * 1024 * 1024) {
      this.showError('File size must be less than 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.showError('Please select an image file.');
      return;
    }

    this.uploadingAvatar = true;
    this.clearMessages();

    this.auth.uploadAvatar(file).subscribe({
      next: (user) => {
        this.user = user;
        this.uploadingAvatar = false;
        this.showSuccess('Profile picture updated!');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.uploadingAvatar = false;
        this.showError(err.error?.error?.message || 'Failed to upload picture.');
        this.cdr.markForCheck();
      },
    });

    input.value = '';
  }

  removeAvatar(): void {
    if (!confirm('Remove your profile picture?')) return;

    this.uploadingAvatar = true;
    this.auth.removeAvatar().subscribe({
      next: (user) => {
        this.user = user;
        this.uploadingAvatar = false;
        this.showSuccess('Profile picture removed.');
        this.cdr.markForCheck();
      },
      error: () => {
        this.uploadingAvatar = false;
        this.showError('Failed to remove picture.');
        this.cdr.markForCheck();
      },
    });
  }

  // ── Personal info ──
  startEditingPersonal(): void {
    this.editingPersonal = true;
    this.editName = this.user?.name ?? '';
    this.editEmail = this.user?.email ?? '';
    this.editPhone = this.user?.phone ?? '';
    this.editAddress = this.user?.address ?? '';
    this.clearMessages();
  }

  cancelEditingPersonal(): void {
    this.editingPersonal = false;
    this.clearMessages();
  }

  savePersonalInfo(): void {
    if (!this.editName.trim() || !this.editEmail.trim()) {
      this.showError('Name and email are required.');
      return;
    }

    this.saving = true;
    this.clearMessages();

    this.auth.updateProfile({
      name: this.editName.trim(),
      email: this.editEmail.trim(),
      phone: this.editPhone.trim(),
      address: this.editAddress.trim(),
    }).subscribe({
      next: (user) => {
        this.user = user;
        this.editingPersonal = false;
        this.saving = false;
        this.showSuccess('Personal information updated!');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.saving = false;
        this.showError(err.error?.error?.message || 'Failed to update profile.');
        this.cdr.markForCheck();
      },
    });
  }

  // ── Helpers ──
  showSuccess(msg: string): void {
    this.successMessage = msg;
    this.errorMessage = '';
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.markForCheck();
    }, 4000);
  }

  showError(msg: string): void {
    this.errorMessage = msg;
    this.successMessage = '';
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  cancelBooking(id: string): void {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    this.bookingService.cancelBooking(id).subscribe({
      next: () => {
        const booking = this.bookings.find((b) => b.id === id);
        if (booking) booking.status = 'CANCELLED';
        this.cdr.markForCheck();
      },
      error: () => {
        this.showError('Failed to cancel booking.');
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
