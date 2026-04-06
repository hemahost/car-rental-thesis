import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
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
export class LoginPage implements OnInit {
  activeTab: 'login' | 'register' = 'login';

  // OAuth providers availability
  oauthGoogle = false;
  oauthGithub = false;

  // Login fields
  loginEmail = '';
  loginPassword = '';

  // Register fields
  registerName = '';
  registerEmail = '';
  registerPassword = '';
  registerConfirmPassword = '';
  registerPhone = '';
  registerAddress = '';
  registerAgreeTerms = false;
  showRegisterPassword = false;
  showRegisterConfirmPassword = false;

  // Forgot password fields
  forgotMode: 'hidden' | 'email' | 'code' = 'hidden';
  forgotEmail = '';
  resetCode = '';
  newPassword = '';
  confirmNewPassword = '';

  // 2FA fields
  twoFactorMode = false;
  twoFactorToken = '';
  totpCode = '';

  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.getOAuthProviders().subscribe({
      next: (p) => {
        this.oauthGoogle = p.google;
        this.oauthGithub = p.github;
        this.cdr.markForCheck();
      },
    });
  }

  switchTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
    this.forgotMode = 'hidden';
  }

  loginWithOAuth(provider: 'google' | 'github'): void {
    window.location.href = `http://localhost:3000/api/oauth/${provider}`;
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
      next: (res) => {
        this.loading = false;
        if (res.requires2FA && res.tempToken) {
          this.twoFactorToken = res.tempToken;
          this.twoFactorMode = true;
          this.cdr.markForCheck();
        } else {
          this.router.navigate(['/home']);
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error?.message || 'Login failed. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  get passwordStrength(): { label: string; level: number } {
    const p = this.registerPassword;
    if (!p) return { label: '', level: 0 };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { label: 'Weak', level: 1 };
    if (score === 2) return { label: 'Fair', level: 2 };
    if (score === 3) return { label: 'Good', level: 3 };
    return { label: 'Strong', level: 4 };
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
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    if (!this.registerAgreeTerms) {
      this.errorMessage = 'You must agree to the Terms & Conditions.';
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
      .register(this.registerName, this.registerEmail, this.registerPassword, this.registerPhone || undefined, this.registerAddress || undefined)
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
          this.registerPhone = '';
          this.registerAddress = '';
          this.registerAgreeTerms = false;
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

  // ── Forgot Password ──
  showForgotPassword(): void {
    this.forgotMode = 'email';
    this.errorMessage = '';
    this.successMessage = '';
    this.forgotEmail = this.loginEmail;
  }

  cancelForgotPassword(): void {
    this.forgotMode = 'hidden';
    this.errorMessage = '';
    this.successMessage = '';
    this.resetCode = '';
    this.newPassword = '';
    this.confirmNewPassword = '';
  }

  // ── 2FA ──
  onVerify2FA(): void {
    this.errorMessage = '';
    if (!this.totpCode) {
      this.errorMessage = 'Please enter the 6-digit code from your authenticator app.';
      return;
    }
    this.loading = true;
    this.authService.verify2FA(this.twoFactorToken, this.totpCode).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/home']);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error?.message || 'Invalid code. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  cancelTwoFactor(): void {
    this.twoFactorMode = false;
    this.twoFactorToken = '';
    this.totpCode = '';
    this.errorMessage = '';
  }

  onForgotSubmitEmail(): void {
    this.errorMessage = '';
    if (!this.forgotEmail) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }

    this.loading = true;
    this.authService.forgotPassword(this.forgotEmail).subscribe({
      next: () => {
        this.loading = false;
        this.forgotMode = 'code';
        this.successMessage = 'A reset code has been sent to your email.';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error?.message || 'Failed to send reset code.';
        this.cdr.markForCheck();
      },
    });
  }

  onResetPassword(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.resetCode || !this.newPassword || !this.confirmNewPassword) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    this.loading = true;
    this.authService.resetPassword(this.forgotEmail, this.resetCode, this.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Password reset successfully! You can now log in.';
        this.cancelForgotPassword();
        this.successMessage = 'Password reset successfully! You can now log in.';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error?.message || 'Failed to reset password.';
        this.cdr.markForCheck();
      },
    });
  }
}
