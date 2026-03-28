export interface BloodRequest {
  id: string;
  creatorId: string;
  creatorName: string;
  bloodTypes: string[]; // empty = any blood type
  city: string;
  country: string;
  peopleNeeded: number;
  acceptedCount: number;
  deadline: string; // ISO string
  notes?: string;
  status: 'active' | 'fulfilled' | 'expired';
  createdAt: string;
}
