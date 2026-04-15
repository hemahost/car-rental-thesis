export interface Booking {
  id: string;
  userId: string;
  carId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  paymentIntentId?: string;
  paymentStatus?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  createdAt: string;
  car?: {
    id: string;
    brand: string;
    model: string;
    type: string;
    pricePerDay: number;
    imageUrl?: string;
  };
}
