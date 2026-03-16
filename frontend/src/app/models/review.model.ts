export interface Review {
  id: string;
  userId: string;
  carId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}
