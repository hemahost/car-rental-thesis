import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Car } from '../models/car.model';

export interface CarFilters {
  brand?: string;
  type?: string;
  pickupDate?: string;
  returnDate?: string;
  minPrice?: number;
  maxPrice?: number;
  transmission?: string;
  fuelType?: string;
  seats?: number;
  minHorsepower?: number;
  maxHorsepower?: number;
  minMileageKm?: number;
  maxMileageKm?: number;
  color?: string;
}

interface CarsResponse {
  success: boolean;
  cars: Car[];
}

interface CarResponse {
  success: boolean;
  car: Car;
}

@Injectable({ providedIn: 'root' })
export class CarService {
  private readonly apiUrl = 'http://localhost:3000/api/cars';

  constructor(private http: HttpClient) {}

  getCars(filters?: CarFilters): Observable<Car[]> {
    let params = new HttpParams();

    if (filters?.brand) params = params.set('brand', filters.brand);
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.pickupDate) params = params.set('pickupDate', filters.pickupDate);
    if (filters?.returnDate) params = params.set('returnDate', filters.returnDate);
    if (filters?.minPrice != null) params = params.set('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice != null) params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters?.transmission) params = params.set('transmission', filters.transmission);
    if (filters?.fuelType) params = params.set('fuelType', filters.fuelType);
    if (filters?.seats != null) params = params.set('seats', filters.seats.toString());
    if (filters?.minHorsepower != null) params = params.set('minHorsepower', filters.minHorsepower.toString());
    if (filters?.maxHorsepower != null) params = params.set('maxHorsepower', filters.maxHorsepower.toString());
    if (filters?.minMileageKm != null) params = params.set('minMileageKm', filters.minMileageKm.toString());
    if (filters?.maxMileageKm != null) params = params.set('maxMileageKm', filters.maxMileageKm.toString());
    if (filters?.color) params = params.set('color', filters.color);

    return this.http.get<CarsResponse>(this.apiUrl, { params }).pipe(
      map((res) => res.cars)
    );
  }

  getCarById(id: string): Observable<Car> {
    return this.http.get<CarResponse>(`${this.apiUrl}/${id}`).pipe(
      map((res) => res.car)
    );
  }
}
