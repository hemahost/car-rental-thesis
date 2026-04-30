import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  const createComponent = () => {
    const authService = {
      getOAuthProviders: vi.fn(() => of({ google: true, github: true })),
      register: vi.fn(() => of({ success: true })),
      login: vi.fn(() => of({ success: true })),
      verify2FA: vi.fn(() => of({ success: true })),
      forgotPassword: vi.fn(() => of({ message: 'ok' })),
      resetPassword: vi.fn(() => of({ message: 'ok' })),
    };

    const router = {
      navigate: vi.fn(),
    };

    const cdr = {
      markForCheck: vi.fn(),
    };

    const component = new LoginPage(authService as never, router as never, cdr as never);
    return { component, authService, router, cdr };
  };

  it('collects all registration validation errors together', () => {
    const { component } = createComponent();

    component.registerPassword = 'weak';
    component.registerConfirmPassword = 'different';
    component.onRegister();

    expect(component.errorMessages).toEqual([
      'Full name is required.',
      'Email address is required.',
      'You must agree to the Terms & Conditions.',
      'Passwords do not match.',
      'Password must be at least 8 characters long.',
    ]);
  });

  it('calculates strong password strength correctly', () => {
    const { component } = createComponent();

    component.registerPassword = 'Strong!Pass1';

    expect(component.passwordStrength).toEqual({
      label: 'Strong',
      level: 4,
    });
  });

  it('submits registration when the form is valid', () => {
    const { component, authService } = createComponent();

    component.registerName = 'Test User';
    component.registerEmail = 'test@example.com';
    component.registerPassword = 'Strong!Pass1';
    component.registerConfirmPassword = 'Strong!Pass1';
    component.registerPhone = '+36 70 000 0000';
    component.registerAddress = 'Budapest';
    component.registerAgreeTerms = true;

    component.onRegister();

    expect(authService.register).toHaveBeenCalledWith(
      'Test User',
      'test@example.com',
      'Strong!Pass1',
      '+36 70 000 0000',
      'Budapest'
    );
    expect(component.successMessage).toBe('Registration successful! You can now log in.');
    expect(component.activeTab).toBe('login');
    expect(component.loginEmail).toBe('test@example.com');
  });

  it('shows backend registration errors cleanly', () => {
    const { component, authService } = createComponent();
    authService.register.mockReturnValueOnce(
      throwError(() => ({
        error: { error: { message: 'Email already in use' } },
      }))
    );

    component.registerName = 'Test User';
    component.registerEmail = 'existing@example.com';
    component.registerPassword = 'Strong!Pass1';
    component.registerConfirmPassword = 'Strong!Pass1';
    component.registerAgreeTerms = true;

    component.onRegister();

    expect(component.errorMessage).toBe('Email already in use');
    expect(component.errorMessages).toEqual([]);
  });

  it('switchTab clears messages and resets forgot-password mode', () => {
    const { component } = createComponent();
    component.errorMessage = 'Error';
    component.errorMessages = ['Issue'];
    component.successMessage = 'Success';
    component.forgotMode = 'code';

    component.switchTab('register');

    expect(component.activeTab).toBe('register');
    expect(component.errorMessage).toBe('');
    expect(component.errorMessages).toEqual([]);
    expect(component.successMessage).toBe('');
    expect(component.forgotMode).toBe('hidden');
  });

  it('shows a validation error when login fields are missing', () => {
    const { component } = createComponent();

    component.onLogin();

    expect(component.errorMessage).toBe('Please fill in all fields.');
  });

  it('navigates to home after successful login without 2FA', () => {
    const { component, router } = createComponent();
    component.loginEmail = 'test@example.com';
    component.loginPassword = 'Strong!Pass1';

    component.onLogin();

    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('enters two-factor mode when login requires 2FA', () => {
    const { component, authService } = createComponent();
    authService.login.mockReturnValueOnce(
      of({ success: true, requires2FA: true, tempToken: 'tmp-token' })
    );
    component.loginEmail = 'test@example.com';
    component.loginPassword = 'Strong!Pass1';

    component.onLogin();

    expect(component.twoFactorMode).toBe(true);
    expect(component.twoFactorToken).toBe('tmp-token');
  });

  it('shows backend login errors', () => {
    const { component, authService } = createComponent();
    authService.login.mockReturnValueOnce(
      throwError(() => ({ error: { error: { message: 'Invalid email or password' } } }))
    );
    component.loginEmail = 'test@example.com';
    component.loginPassword = 'wrong';

    component.onLogin();

    expect(component.errorMessage).toBe('Invalid email or password');
  });

  it('showForgotPassword opens forgot-password mode and copies login email', () => {
    const { component } = createComponent();
    component.loginEmail = 'test@example.com';

    component.showForgotPassword();

    expect(component.forgotMode).toBe('email');
    expect(component.forgotEmail).toBe('test@example.com');
  });

  it('cancelForgotPassword resets forgot-password fields', () => {
    const { component } = createComponent();
    component.forgotMode = 'code';
    component.resetCode = '123456';
    component.newPassword = 'Strong!Pass1';
    component.confirmNewPassword = 'Strong!Pass1';

    component.cancelForgotPassword();

    expect(component.forgotMode).toBe('hidden');
    expect(component.resetCode).toBe('');
    expect(component.newPassword).toBe('');
    expect(component.confirmNewPassword).toBe('');
  });

  it('shows an error when verifying 2FA without a code', () => {
    const { component } = createComponent();

    component.onVerify2FA();

    expect(component.errorMessage).toBe('Please enter the 6-digit code from your authenticator app.');
  });

  it('verifies 2FA and navigates home on success', () => {
    const { component, router } = createComponent();
    component.twoFactorToken = 'temp-token';
    component.totpCode = '123456';

    component.onVerify2FA();

    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('cancelTwoFactor resets two-factor state', () => {
    const { component } = createComponent();
    component.twoFactorMode = true;
    component.twoFactorToken = 'temp-token';
    component.totpCode = '123456';

    component.cancelTwoFactor();

    expect(component.twoFactorMode).toBe(false);
    expect(component.twoFactorToken).toBe('');
    expect(component.totpCode).toBe('');
  });

  it('shows an error when forgot-password email is missing', () => {
    const { component } = createComponent();

    component.onForgotSubmitEmail();

    expect(component.errorMessage).toBe('Please enter your email address.');
  });

  it('advances forgot-password flow after email submission', () => {
    const { component } = createComponent();
    component.forgotEmail = 'test@example.com';

    component.onForgotSubmitEmail();

    expect(component.forgotMode).toBe('code');
    expect(component.successMessage).toBe('A reset code has been sent to your email.');
  });

  it('shows an error when reset-password fields are incomplete', () => {
    const { component } = createComponent();

    component.onResetPassword();

    expect(component.errorMessage).toBe('Please fill in all fields.');
  });

  it('shows an error when reset-password confirmation does not match', () => {
    const { component } = createComponent();
    component.resetCode = '123456';
    component.newPassword = 'Strong!Pass1';
    component.confirmNewPassword = 'Different!Pass1';

    component.onResetPassword();

    expect(component.errorMessage).toBe('Passwords do not match.');
  });

  it('shows an error when the reset password breaks policy rules', () => {
    const { component } = createComponent();
    component.resetCode = '123456';
    component.newPassword = 'weak';
    component.confirmNewPassword = 'weak';

    component.onResetPassword();

    expect(component.errorMessage).toBe('Password must be at least 8 characters long.');
  });

  it('resets forgot-password state after successful password reset', () => {
    const { component } = createComponent();
    component.forgotEmail = 'test@example.com';
    component.forgotMode = 'code';
    component.resetCode = '123456';
    component.newPassword = 'Strong!Pass1';
    component.confirmNewPassword = 'Strong!Pass1';

    component.onResetPassword();

    expect(component.forgotMode).toBe('hidden');
    expect(component.successMessage).toBe('Password reset successfully! You can now log in.');
  });
});
