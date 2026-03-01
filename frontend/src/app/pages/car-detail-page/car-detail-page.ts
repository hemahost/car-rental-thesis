import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CarService } from '../../services/car.service';
import { Car } from '../../models/car.model';

@Component({
  selector: 'app-car-detail-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './car-detail-page.html',
  styleUrl: './car-detail-page.scss',
})
export class CarDetailPage implements OnInit {
  car: Car | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private carService: CarService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'No car ID provided.';
      this.loading = false;
      return;
    }

    this.carService.getCarById(id).subscribe({
      next: (car) => {
        this.car = car;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Car not found.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
