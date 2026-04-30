import { of } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const user = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'USER',
  };

  const createService = () => {
    const http = {
      post: vi.fn(),
      put: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    };
    const router = {
      navigate: vi.fn(),
    };

    const service = new AuthService(http as never, router as never);
    return { service, http, router };
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null token by default', () => {
    const { service } = createService();
    expect(service.token).toBeNull();
  });

  it('reports logged-out state when no token exists', () => {
    const { service } = createService();
    expect(service.isLoggedIn).toBe(false);
  });

  it('stores token and user after a successful login without 2FA', () => {
    const { service, http } = createService();
    http.post.mockReturnValueOnce(of({ success: true, token: 'abc', user }));

    service.login('test@example.com', 'Strong!Pass1').subscribe();

    expect(localStorage.getItem('token')).toBe('abc');
    expect(service.currentUser).toEqual(user);
  });

  it('does not store session data when login requires 2FA', () => {
    const { service, http } = createService();
    http.post.mockReturnValueOnce(of({ success: true, requires2FA: true, tempToken: 'tmp' }));

    service.login('test@example.com', 'Strong!Pass1').subscribe();

    expect(localStorage.getItem('token')).toBeNull();
    expect(service.currentUser).toBeNull();
  });

  it('updates the cached user after profile update', () => {
    const { service, http } = createService();
    localStorage.setItem('user', JSON.stringify(user));
    http.put.mockReturnValueOnce(of({ success: true, user: { ...user, name: 'Updated User' } }));

    service.updateProfile({ name: 'Updated User', email: user.email }).subscribe((result) => {
      expect(result.name).toBe('Updated User');
    });

    expect(service.currentUser?.name).toBe('Updated User');
  });

  it('updates the cached user after avatar upload', () => {
    const { service, http } = createService();
    localStorage.setItem('user', JSON.stringify(user));
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    http.post.mockReturnValueOnce(of({ success: true, user: { ...user, avatarUrl: '/uploads/a.png' } }));

    service.uploadAvatar(file).subscribe((result) => {
      expect(result.avatarUrl).toBe('/uploads/a.png');
    });

    expect(service.currentUser?.avatarUrl).toBe('/uploads/a.png');
  });

  it('updates the cached user after avatar removal', () => {
    const { service, http } = createService();
    localStorage.setItem('user', JSON.stringify({ ...user, avatarUrl: '/uploads/a.png' }));
    http.delete.mockReturnValueOnce(of({ success: true, user: { ...user, avatarUrl: '' } }));

    service.removeAvatar().subscribe((result) => {
      expect(result.avatarUrl).toBe('');
    });

    expect(service.currentUser?.avatarUrl).toBe('');
  });

  it('maps forgot-password responses to a message object', () => {
    const { service, http } = createService();
    http.post.mockReturnValueOnce(of({ success: true, message: 'sent' }));

    service.forgotPassword('test@example.com').subscribe((result) => {
      expect(result).toEqual({ message: 'sent' });
    });
  });

  it('enables 2FA and updates the cached user', () => {
    localStorage.setItem('user', JSON.stringify(user));
    const { service, http } = createService();
    http.post.mockReturnValueOnce(of({ success: true, message: 'enabled' }));

    service.enable2FA('123456').subscribe((result) => {
      expect(result).toEqual({ message: 'enabled' });
    });

    expect(service.currentUser?.twoFactorEnabled).toBe(true);
  });

  it('disables 2FA and updates the cached user', () => {
    localStorage.setItem('user', JSON.stringify({ ...user, twoFactorEnabled: true }));
    const { service, http } = createService();
    http.post.mockReturnValueOnce(of({ success: true, message: 'disabled' }));

    service.disable2FA('123456').subscribe((result) => {
      expect(result).toEqual({ message: 'disabled' });
    });

    expect(service.currentUser?.twoFactorEnabled).toBe(false);
  });

  it('stores the verified token and user after 2FA verification', () => {
    const { service, http } = createService();
    http.post.mockReturnValueOnce(of({ success: true, token: 'verified', user }));

    service.verify2FA('temp-token', '123456').subscribe();

    expect(localStorage.getItem('token')).toBe('verified');
    expect(service.currentUser).toEqual(user);
  });

  it('loginWithToken stores the token and loads the user profile', () => {
    const { service, http } = createService();
    http.get.mockReturnValueOnce(of({ success: true, user }));

    service.loginWithToken('oauth-token').subscribe((result) => {
      expect(result).toEqual(user);
    });

    expect(localStorage.getItem('token')).toBe('oauth-token');
    expect(service.currentUser).toEqual(user);
  });

  it('maps OAuth provider availability correctly', () => {
    const { service, http } = createService();
    http.get.mockReturnValueOnce(of({ success: true, google: true, github: false }));

    service.getOAuthProviders().subscribe((result) => {
      expect(result).toEqual({ google: true, github: false });
    });
  });

  it('returns a full backend avatar URL when an avatar path exists', () => {
    const { service } = createService();
    expect(service.getAvatarFullUrl('/uploads/avatar.png')).toBe('http://localhost:3000/uploads/avatar.png');
  });

  it('returns an empty avatar URL when no path exists', () => {
    const { service } = createService();
    expect(service.getAvatarFullUrl()).toBe('');
  });

  it('refreshUser does nothing when there is no token', () => {
    const { service, http } = createService();
    service.refreshUser();
    expect(http.get).not.toHaveBeenCalled();
  });

  it('refreshUser reloads and stores the latest user when a token exists', () => {
    const { service, http } = createService();
    localStorage.setItem('token', 'abc');
    http.get.mockReturnValueOnce(of({ success: true, user: { ...user, name: 'Refreshed User' } }));

    service.refreshUser();

    expect(service.currentUser?.name).toBe('Refreshed User');
  });

  it('logout clears session storage and redirects to login', () => {
    const { service, router } = createService();
    localStorage.setItem('token', 'abc');
    localStorage.setItem('user', JSON.stringify(user));

    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(service.currentUser).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
