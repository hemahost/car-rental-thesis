import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Car } from '../../models/car.model';
import { FavoriteService } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-car-card',
  imports: [CommonModule, RouterLink],
  templateUrl: './car-card.html',
  styleUrl: './car-card.scss',
})
export class CarCard {
  @Input({ required: true }) car!: Car;

  constructor(
    public auth: AuthService,
    public favoriteService: FavoriteService,
    private cdr: ChangeDetectorRef
  ) {}

  get isLiked(): boolean {
    return this.favoriteService.isLiked(this.car.id);
  }

  toggleLike(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.auth.isLoggedIn) return;
    this.favoriteService.toggleFavorite(this.car.id).subscribe({
      next: () => this.cdr.detectChanges(),
    });
  }
}
