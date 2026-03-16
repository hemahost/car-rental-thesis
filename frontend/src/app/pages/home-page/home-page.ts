import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarCard } from '../../components/car-card/car-card';
import { Car } from '../../models/car.model';
import { AuthService } from '../../services/auth.service';
import { CarService } from '../../services/car.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, CarCard],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage implements OnInit {
  popularCars: Car[] = [];

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    private carService: CarService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carService.getCars().subscribe({
      next: (cars) => {
        this.popularCars = cars.slice(0, 3);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load popular cars:', err);
      },
    });
  }
}
