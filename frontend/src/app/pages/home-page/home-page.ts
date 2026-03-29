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
      title: 'Pick Dates & Location',
      description: 'Set your pickup and return details to instantly check real availability.',
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

  readonly faqs = [
    {
      question: 'Can I cancel my booking?',
      answer: 'Yes, cancellation options depend on the selected rental policy and timing.',
    },
    {
      question: 'Do you require a deposit?',
      answer: 'Some vehicles may require a refundable security deposit at pickup.',
    },
    {
      question: 'Is insurance included?',
      answer: 'Basic coverage is available, with optional upgrades for broader protection.',
    },
    {
      question: 'What documents are required?',
      answer: 'A valid driver license and identification are required for confirmation.',
    },
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
