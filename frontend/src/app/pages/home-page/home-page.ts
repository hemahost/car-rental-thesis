import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarCard } from '../../components/car-card/car-card';
import { Car } from '../../models/car.model';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, CarCard],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  popularCars: Car[] = [
    {
      id: '1',
      brand: 'Toyota',
      model: 'RAV4',
      type: 'SUV',
      pricePerDay: 65,
      description: 'A reliable and spacious SUV perfect for family trips.',
    },
    {
      id: '2',
      brand: 'Tesla',
      model: 'Model 3',
      type: 'Electric',
      pricePerDay: 90,
      description: 'All-electric sedan with autopilot and impressive range.',
    },
    {
      id: '3',
      brand: 'BMW',
      model: '3 Series',
      type: 'Sedan',
      pricePerDay: 95,
      description: 'Sporty sedan with elegant design and cutting-edge tech.',
    },
  ];
}
