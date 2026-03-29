import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-oauth-callback-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="oauth-callback">
      <div class="oauth-callback__card">
        <div class="oauth-callback__spinner"></div>
        <p *ngIf="!error">Signing you in...</p>
        <p *ngIf="error" class="oauth-callback__error">{{ error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .oauth-callback {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fe;
    }
    .oauth-callback__card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      background: #fff;
      border-radius: 16px;
      padding: 40px 48px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .oauth-callback__spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e5e7eb;
      border-top-color: #4361ee;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { color: #555; font-size: 1rem; margin: 0; }
    .oauth-callback__error { color: #ef4444; }
  `],
})
export class OAuthCallbackPage implements OnInit {
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const err = this.route.snapshot.queryParamMap.get('error');

    if (err || !token) {
      this.error = 'OAuth sign-in failed. Please try again.';
      setTimeout(() => this.router.navigate(['/login']), 2500);
      return;
    }

    this.auth.loginWithToken(token).subscribe({
      next: () => this.router.navigate(['/home']),
      error: () => {
        this.error = 'Failed to complete sign-in. Please try again.';
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
    });
  }
}
