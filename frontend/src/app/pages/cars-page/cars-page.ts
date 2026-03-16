import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CarCard } from '../../components/car-card/car-card';
import { CarService, CarFilters } from '../../services/car.service';
import { Car } from '../../models/car.model';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-cars-page',
  imports: [CommonModule, FormsModule, RouterLink, CarCard],
  templateUrl: './cars-page.html',
  styleUrl: './cars-page.scss',
})
export class CarsPage implements OnInit {
  cars: Car[] = [];
  loading = false;
  error = '';

  brands = ['Toyota', 'BMW', 'Audi', 'Tesla'];
  types = ['SUV', 'Sedan', 'Electric', 'Hatchback'];

  filters: CarFilters = {};

  constructor(public auth: AuthService, public theme: ThemeService, private carService: CarService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadCars();
  }

  loadCars(): void {
    this.loading = true;
    this.error = '';

    this.carService.getCars(this.filters).subscribe({
      next: (cars) => {
        this.cars = cars;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load cars. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  applyFilters(): void {
    this.loadCars();
  }

  clearFilters(): void {
    this.filters = {};
    this.loadCars();
  }
}
