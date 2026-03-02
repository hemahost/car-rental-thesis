import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrls: ['./login-page.scss'],
})
export class LoginPage {
  activeTab: 'login' | 'register' = 'login';

  // Login fields
  loginEmail = '';
  loginPassword = '';

  // Register fields
  registerName = '';
  registerEmail = '';
  registerPassword = '';
  registerConfirmPassword = '';

  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  switchTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onLogin(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.loginEmail || !this.loginPassword) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    this.loading = true;
    this.authService.login(this.loginEmail, this.loginPassword).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/home']);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error?.message || 'Login failed. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  onRegister(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (
      !this.registerName ||
      !this.registerEmail ||
      !this.registerPassword ||
      !this.registerConfirmPassword
    ) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    if (this.registerPassword !== this.registerConfirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (this.registerPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    this.loading = true;
    this.authService
      .register(this.registerName, this.registerEmail, this.registerPassword)
      .subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'Registration successful! You can now log in.';
          this.activeTab = 'login';
          this.loginEmail = this.registerEmail;
          this.registerName = '';
          this.registerEmail = '';
          this.registerPassword = '';
          this.registerConfirmPassword = '';
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage =
            err.error?.error?.message || 'Registration failed. Please try again.';
          this.cdr.markForCheck();
        },
      });
  }
}
