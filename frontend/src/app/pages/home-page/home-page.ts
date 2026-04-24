import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CarCard } from '../../components/car-card/car-card';
import { Car } from '../../models/car.model';
import { AuthService } from '../../services/auth.service';
import { CarService } from '../../services/car.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, CarCard, FormsModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage implements OnInit {
  popularCars: Car[] = [];
  readonly minDate = this.formatDate(new Date());

  quickSearch = {
    type: '',
    pickupDate: this.minDate,
    returnDate: this.minDate,
  };

  readonly carTypes = ['SUV', 'Sedan', 'Hatchback', 'Coupe'];

  readonly howItWorks = [
    {
      title: 'Choose Your Car',
      description: 'Browse categories and compare features to select the right vehicle for your trip.',
    },
    {
      title: 'Pick Your Dates',
      description: 'Select your pickup and return dates — the car\'s pickup location is already set for you.',
    },
    {
      title: 'Book In Minutes',
      description: 'Confirm your reservation and receive instant booking details by email.',
    },
  ];

  readonly featuredCategories = [
    { title: 'SUV', description: 'Comfort and space for family or group travel.', type: 'SUV' },
    { title: 'Sedan', description: 'Smooth city rides with excellent efficiency.', type: 'Sedan' },
    { title: 'Electric', description: 'Modern, clean, and cost-efficient driving.', fuelType: 'Electric' },
    { title: 'Hatchback', description: 'Compact and practical for daily mobility.', type: 'Hatchback' },
  ];

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    private carService: CarService,
    private router: Router,
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

  quickSearchCars(): void {
    this.clampSearchDate('pickupDate');
    this.clampSearchDate('returnDate');

    const type = this.quickSearch.type.trim();

    void this.router.navigate(['/cars'], {
      queryParams: {
        type: type.length > 0 ? type : undefined,
      },
    });
  }

  browseCategory(category: { type?: string; fuelType?: string }): void {
    void this.router.navigate(['/cars'], {
      queryParams: category,
    });
  }

  clampSearchDate(field: 'pickupDate' | 'returnDate'): void {
    if (!this.quickSearch[field] || this.quickSearch[field] < this.minDate) {
      this.quickSearch[field] = this.minDate;
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
