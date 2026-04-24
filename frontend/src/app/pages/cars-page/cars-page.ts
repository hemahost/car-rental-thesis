import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  types = ['SUV', 'Sedan', 'Hatchback', 'Coupe'];
  transmissions = ['Manual', 'Automatic'];
  fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
  colors = ['Black', 'Blue', 'Grey', 'Red', 'Silver', 'White', 'Yellow'];
  seatOptions = [2, 4, 5, 7, 8];

  filters: CarFilters = {};
  searchTerm = '';
  sortBy: 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'rating' = 'default';
  filtersOpen = false;
  currentPage = 1;
  readonly pageSize = 12;

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    private carService: CarService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const type = params.get('type');
      const fuelType = params.get('fuelType');

      if (type && this.types.includes(type)) {
        this.filters.type = type;
      } else if (type === 'Electric') {
        this.filters.fuelType = 'Electric';
      }

      if (fuelType && this.fuelTypes.includes(fuelType)) {
        this.filters.fuelType = fuelType;
      }

      this.loadCars();
    });
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
      result = result.filter((c) => `${c.brand} ${c.model}`.toLowerCase().includes(q));
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

  get activeFilterCount(): number {
    return Object.values(this.filters).filter((value) => value !== undefined && value !== null && value !== '').length;
  }

  onSearchOrSortChange(): void {
    this.currentPage = 1;
  }

  onPriceChange(changedField: 'minPrice' | 'maxPrice'): void {
    this.normalizeNumberFilter('minPrice');
    this.normalizeNumberFilter('maxPrice');

    const minPrice = this.filters.minPrice;
    const maxPrice = this.filters.maxPrice;

    if (minPrice == null || maxPrice == null || minPrice <= maxPrice) {
      return;
    }

    if (changedField === 'minPrice') {
      this.filters.maxPrice = minPrice;
      return;
    }

    this.filters.minPrice = maxPrice;
  }

  applyFilters(): void {
    this.normalizeFilters();
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

  private normalizeFilters(): void {
    this.normalizeNumberFilter('minPrice');
    this.normalizeNumberFilter('maxPrice');
    this.normalizeNumberFilter('seats');
    this.normalizeNumberFilter('minHorsepower');
    this.normalizeNumberFilter('maxMileageKm');

    if (
      this.filters.minPrice != null &&
      this.filters.maxPrice != null &&
      this.filters.minPrice > this.filters.maxPrice
    ) {
      this.filters.maxPrice = this.filters.minPrice;
    }
  }

  private normalizeNumberFilter(field: keyof Pick<CarFilters, 'minPrice' | 'maxPrice' | 'seats' | 'minHorsepower' | 'maxMileageKm'>): void {
    const value = this.filters[field] as number | string | undefined;

    if (value == null || value === '') {
      delete this.filters[field];
      return;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      delete this.filters[field];
      return;
    }

    this.filters[field] = numericValue;
  }
}
