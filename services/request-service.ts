import { BloodRequest } from '../models/blood-request';

const now = new Date();

function daysFromNow(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const MOCK_REQUESTS: BloodRequest[] = [
  {
    id: 'req-1',
    creatorId: 'user-101',
    creatorName: 'Youssef El Mansouri',
    bloodTypes: ['O+', 'O-'],
    city: 'Casablanca',
    country: 'Morocco',
    peopleNeeded: 3,
    acceptedCount: 1,
    deadline: daysFromNow(3),
    notes: 'Urgent surgery scheduled at Ibn Rochd hospital. Please contact as soon as possible.',
    status: 'active',
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-2',
    creatorId: 'user-102',
    creatorName: 'Fatima Zahra Benslimane',
    bloodTypes: ['A+'],
    city: 'Casablanca',
    country: 'Morocco',
    peopleNeeded: 2,
    acceptedCount: 0,
    deadline: daysFromNow(1),
    notes: 'Patient undergoing chemotherapy at CHU. Any A+ donors welcome.',
    status: 'active',
    createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-3',
    creatorId: 'user-103',
    creatorName: 'Khalid Ouazzani',
    bloodTypes: [],
    city: 'Casablanca',
    country: 'Morocco',
    peopleNeeded: 4,
    acceptedCount: 2,
    deadline: daysFromNow(7),
    notes: 'Emergency blood bank replenishment. All blood types needed.',
    status: 'active',
    createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-4',
    creatorId: 'user-104',
    creatorName: 'Nadia Chraibi',
    bloodTypes: ['AB+', 'AB-'],
    city: 'Casablanca',
    country: 'Morocco',
    peopleNeeded: 1,
    acceptedCount: 0,
    deadline: daysFromNow(2),
    notes: 'Rare blood type needed urgently. Cardiac surgery tomorrow morning.',
    status: 'active',
    createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-5',
    creatorId: 'user-105',
    creatorName: 'Hassan Berrada',
    bloodTypes: ['B+', 'B-'],
    city: 'Rabat',
    country: 'Morocco',
    peopleNeeded: 2,
    acceptedCount: 1,
    deadline: daysFromNow(3),
    notes: 'Post-accident transfusion needed. Patient at CHU Rabat.',
    status: 'active',
    createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-6',
    creatorId: 'user-106',
    creatorName: 'Zineb Lahlou',
    bloodTypes: ['A-', 'O-'],
    city: 'Rabat',
    country: 'Morocco',
    peopleNeeded: 3,
    acceptedCount: 0,
    deadline: daysFromNow(5),
    notes: 'Thalassemia patient requires regular transfusions. Any matching donors appreciated.',
    status: 'active',
    createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-7',
    creatorId: 'user-107',
    creatorName: 'Rachid Benmoussa',
    bloodTypes: ['O+'],
    city: 'Marrakech',
    country: 'Morocco',
    peopleNeeded: 2,
    acceptedCount: 0,
    deadline: daysFromNow(1),
    notes: 'Road accident victim needs immediate O+ donors. Please respond ASAP.',
    status: 'active',
    createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-8',
    creatorId: 'user-108',
    creatorName: 'Amina Tazi',
    bloodTypes: ['A+', 'A-', 'AB+'],
    city: 'Marrakech',
    country: 'Morocco',
    peopleNeeded: 3,
    acceptedCount: 1,
    deadline: daysFromNow(4),
    notes: 'Scheduled open-heart surgery. Need donors available by end of week.',
    status: 'active',
    createdAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
  },
];

let requestsStore: BloodRequest[] = [...MOCK_REQUESTS];

export const getAllRequests = async (): Promise<BloodRequest[]> => {
  try {
    // In a real app, fetch from API here
    return requestsStore;
  } catch (error) {
    console.warn('getAllRequests: API unavailable, using mock data');
    return requestsStore;
  }
};

export const getRequestsByCity = async (city: string): Promise<BloodRequest[]> => {
  try {
    return requestsStore.filter(
      r => r.city.toLowerCase() === city.toLowerCase() && r.status === 'active'
    );
  } catch (error) {
    console.warn('getRequestsByCity: error', error);
    return [];
  }
};

export const getRequestById = async (id: string): Promise<BloodRequest | null> => {
  try {
    return requestsStore.find(r => r.id === id) || null;
  } catch (error) {
    console.warn('getRequestById: error', error);
    return null;
  }
};

export const createRequest = async (payload: {
  creatorId: string;
  creatorName: string;
  bloodTypes: string[];
  city: string;
  country: string;
  peopleNeeded: number;
  deadline: string;
  notes?: string;
}): Promise<BloodRequest> => {
  const newRequest: BloodRequest = {
    id: `req-${Date.now()}`,
    ...payload,
    acceptedCount: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  requestsStore = [newRequest, ...requestsStore];
  return newRequest;
};

export const acceptRequest = async (
  requestId: string,
  _userId: string,
  _userName: string
): Promise<void> => {
  requestsStore = requestsStore.map(r => {
    if (r.id === requestId) {
      const newCount = r.acceptedCount + 1;
      return {
        ...r,
        acceptedCount: newCount,
        status: newCount >= r.peopleNeeded ? 'fulfilled' : r.status,
      };
    }
    return r;
  });
};
