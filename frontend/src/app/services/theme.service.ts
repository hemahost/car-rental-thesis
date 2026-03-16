import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly THEME_KEY = 'theme';
  private darkMode = new BehaviorSubject<boolean>(this.getSavedTheme());
  isDarkMode$ = this.darkMode.asObservable();

  constructor() {
    this.applyTheme(this.darkMode.value);
  }

  get isDarkMode(): boolean {
    return this.darkMode.value;
  }

  toggleTheme(): void {
    const newValue = !this.darkMode.value;
    this.darkMode.next(newValue);
    localStorage.setItem(this.THEME_KEY, newValue ? 'dark' : 'light');
    this.applyTheme(newValue);
  }

  private applyTheme(dark: boolean): void {
    document.body.classList.toggle('dark-theme', dark);
  }

  private getSavedTheme(): boolean {
    const saved = localStorage.getItem(this.THEME_KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
