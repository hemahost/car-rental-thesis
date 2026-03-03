import { Routes } from '@angular/router';
import { LandingPage } from './pages/landing-page/landing-page';
import { HomePage } from './pages/home-page/home-page';
import { CarsPage } from './pages/cars-page/cars-page';
import { AboutPage } from './pages/about-page/about-page';
import { CarDetailPage } from './pages/car-detail-page/car-detail-page';
import { LoginPage } from './pages/login-page/login-page';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { ProfilePage } from './pages/profile-page/profile-page';
import { AdminDashboardPage } from './pages/admin-dashboard-page/admin-dashboard-page';

export const routes: Routes = [
  { path: '', component: LandingPage },
  { path: 'home', component: HomePage },
  { path: 'login', component: LoginPage },
  { path: 'cars', component: CarsPage },
  { path: 'cars/:id', component: CarDetailPage },
  { path: 'about', component: AboutPage },
  { path: 'profile', component: ProfilePage, canActivate: [authGuard] },
  { path: 'dashboard', redirectTo: 'profile', pathMatch: 'full' },
  { path: 'admin', component: AdminDashboardPage, canActivate: [authGuard, adminGuard] },
];
