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

  quickSearch = {
    type: '',
    pickupDate: '',
    returnDate: '',
  };

  readonly carTypes = ['SUV', 'Sedan', 'Electric', 'Hatchback'];

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
    { title: 'Electric', description: 'Modern, clean, and cost-efficient driving.', type: 'Electric' },
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
    const type = this.quickSearch.type.trim();

    void this.router.navigate(['/cars'], {
      queryParams: {
        type: type.length > 0 ? type : undefined,
      },
    });
  }

  browseCategory(type: string): void {
    void this.router.navigate(['/cars'], {
      queryParams: { type },
    });
  }
}
