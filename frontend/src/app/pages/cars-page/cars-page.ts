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

  brands = ['Toyota', 'BMW', 'Audi', 'Tesla', 'Mercedes', 'Volkswagen', 'Honda', 'Ford', 'Porsche'];
  types = ['SUV', 'Sedan', 'Hatchback', 'Coupe', 'Electric'];

  filters: CarFilters = {};
  searchTerm = '';
  sortBy: 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'rating' = 'default';
  filtersOpen = false;
  currentPage = 1;
  readonly pageSize = 12;

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
        this.currentPage = 1;
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

  get filteredCars(): Car[] {
    let result = this.cars;
    const q = this.searchTerm.toLowerCase().trim();
    if (q) {
      result = result.filter(c =>
        c.brand.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.city?.toLowerCase().includes(q) ?? false)
      );
    }
    switch (this.sortBy) {
      case 'price-asc':  return [...result].sort((a, b) => a.pricePerDay - b.pricePerDay);
      case 'price-desc': return [...result].sort((a, b) => b.pricePerDay - a.pricePerDay);
      case 'name-asc':   return [...result].sort((a, b) => (a.brand + a.model).localeCompare(b.brand + b.model));
      case 'rating':     return [...result].sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
      default:           return result;
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCars.length / this.pageSize);
  }

  get paginatedCars(): Car[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCars.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  onSearchOrSortChange(): void {
    this.currentPage = 1;
  }

  applyFilters(): void {
    this.filtersOpen = false;
    this.loadCars();
  }

  clearFilters(): void {
    this.filters = {};
    this.searchTerm = '';
    this.sortBy = 'default';
    this.currentPage = 1;
    this.loadCars();
  }
}
