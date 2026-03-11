import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { User, AuthResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/api/auth';
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getSavedUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  get token(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
      })
    );
  }

  register(name: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { name, email, password });
  }

  updateProfile(data: { name: string; email: string; phone?: string; address?: string }): Observable<User> {
    return this.http.put<{ success: boolean; user: User }>(`${this.apiUrl}/profile`, data).pipe(
      tap((res) => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
      }),
      map((res) => res.user)
    );
  }

  uploadAvatar(file: File): Observable<User> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.post<{ success: boolean; user: User }>(`${this.apiUrl}/avatar`, formData).pipe(
      tap((res) => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
      }),
      map((res) => res.user)
    );
  }

  removeAvatar(): Observable<User> {
    return this.http.delete<{ success: boolean; user: User }>(`${this.apiUrl}/avatar`).pipe(
      tap((res) => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
      }),
      map((res) => res.user)
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/forgot-password`, { email }
    ).pipe(map((res) => ({ message: res.message })));
  }

  resetPassword(email: string, token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/reset-password`, { email, token, newPassword }
    ).pipe(map((res) => ({ message: res.message })));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.apiUrl}/change-password`, { currentPassword, newPassword }
    ).pipe(map((res) => ({ message: res.message })));
  }

  getAvatarFullUrl(avatarUrl?: string): string {
    if (!avatarUrl) return '';
    return `http://localhost:3000${avatarUrl}`;
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  private getSavedUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
