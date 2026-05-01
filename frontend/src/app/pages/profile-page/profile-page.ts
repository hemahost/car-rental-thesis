import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { FavoriteService, Favorite } from '../../services/favorite.service';
import { Booking } from '../../models/booking.model';
import { User } from '../../models/user.model';
import { ThemeService } from '../../services/theme.service';

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

  activeSection: 'overview' | 'personal' | 'bookings' | 'favorites' | 'security' = 'overview';

  editingPersonal = false;
  editName = '';
  editEmail = '';
  editPhone = '';
  editAddress = '';
  saving = false;

  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  changingPassword = false;

  twoFASetupMode = false;
  twoFAQrCode = '';
  twoFASecret = '';
  twoFAEnableCode = '';
  twoFADisableCode = '';
  twoFADisableMode = false;
  twoFALoading = false;

  uploadingAvatar = false;

  successMessage = '';
  errorMessage = '';

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    private bookingService: BookingService,
    private favoriteService: FavoriteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.auth.refreshUser();
    this.auth.currentUser$.subscribe(u => {
      if (u) { this.user = u; this.cdr.markForCheck(); }
    });
    this.loadBookings();
    this.loadFavorites();
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

  switchSection(section: 'overview' | 'personal' | 'bookings' | 'favorites' | 'security'): void {
    this.activeSection = section;
    this.clearMessages();
  }

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

  favorites: Favorite[] = [];
  favoritesLoading = false;

  loadFavorites(): void {
    this.favoritesLoading = true;
    this.favoriteService.getFavorites().subscribe({
      next: (favorites) => {
        this.favorites = favorites;
        this.favoritesLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.favoritesLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  removeFavorite(carId: string): void {
    this.favoriteService.toggleFavorite(carId).subscribe({
      next: () => {
        this.favorites = this.favorites.filter((f) => f.carId !== carId);
        this.cdr.detectChanges();
      },
    });
  }

  get favoritesCount(): number {
    return this.favorites.length;
  }

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

  onChangePassword(): void {
    this.clearMessages();

    if (!this.currentPassword || !this.newPassword || !this.confirmNewPassword) {
      this.showError('Please fill in all password fields.');
      return;
    }

    if (this.newPassword.length < 6) {
      this.showError('New password must be at least 6 characters.');
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.showError('New passwords do not match.');
      return;
    }

    this.changingPassword = true;
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.changingPassword = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmNewPassword = '';
        this.showSuccess('Password changed successfully!');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.changingPassword = false;
        this.showError(err.error?.error?.message || 'Failed to change password.');
        this.cdr.markForCheck();
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }

  get is2FAEnabled(): boolean {
    return !!(this.user?.twoFactorEnabled);
  }

  start2FASetup(): void {
    this.twoFALoading = true;
    this.clearMessages();
    this.auth.setup2FA().subscribe({
      next: (res) => {
        this.twoFAQrCode = res.qrCode;
        this.twoFASecret = res.secret;
        this.twoFASetupMode = true;
        this.twoFALoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.twoFALoading = false;
        this.showError(err.error?.error?.message || 'Failed to start 2FA setup.');
        this.cdr.markForCheck();
      },
    });
  }

  confirmEnable2FA(): void {
    if (!this.twoFAEnableCode) {
      this.showError('Please enter the 6-digit code from your authenticator app.');
      return;
    }
    this.twoFALoading = true;
    this.clearMessages();
    this.auth.enable2FA(this.twoFAEnableCode).subscribe({
      next: () => {
        this.twoFALoading = false;
        this.twoFASetupMode = false;
        this.twoFAQrCode = '';
        this.twoFASecret = '';
        this.twoFAEnableCode = '';
        if (this.user) this.user = { ...this.user, twoFactorEnabled: true };
        this.showSuccess('Two-factor authentication enabled!');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.twoFALoading = false;
        this.showError(err.error?.error?.message || 'Invalid code. Please try again.');
        this.cdr.markForCheck();
      },
    });
  }

  cancelSetup2FA(): void {
    this.twoFASetupMode = false;
    this.twoFAQrCode = '';
    this.twoFASecret = '';
    this.twoFAEnableCode = '';
    this.clearMessages();
  }

  confirmDisable2FA(): void {
    if (!this.twoFADisableCode) {
      this.showError('Please enter the 6-digit code to confirm disabling 2FA.');
      return;
    }
    this.twoFALoading = true;
    this.clearMessages();
    this.auth.disable2FA(this.twoFADisableCode).subscribe({
      next: () => {
        this.twoFALoading = false;
        this.twoFADisableMode = false;
        this.twoFADisableCode = '';
        if (this.user) this.user = { ...this.user, twoFactorEnabled: false };
        this.showSuccess('Two-factor authentication disabled.');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.twoFALoading = false;
        this.showError(err.error?.error?.message || 'Invalid code. Please try again.');
        this.cdr.markForCheck();
      },
    });
  }
}