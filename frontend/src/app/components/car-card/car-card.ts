import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Car } from '../../models/car.model';

@Component({
  selector: 'app-car-card',
  imports: [RouterLink],
  templateUrl: './car-card.html',
  styleUrl: './car-card.scss',
})
export class CarCard {
  @Input({ required: true }) car!: Car;
}
