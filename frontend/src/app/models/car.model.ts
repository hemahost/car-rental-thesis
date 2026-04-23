export interface Car {
  id: string;
  brand: string;
  model: string;
  type: string;
  pricePerDay: number;
  imageUrl?: string;
  description: string;
  city?: string;
  seats?: number;
  transmission?: string;
  fuelType?: string;
  year?: number;
  horsepower?: number;
  mileageKm?: number;
  color?: string;
  avgRating?: number;
  reviewCount?: number;
}
