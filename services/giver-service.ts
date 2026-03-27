import axios from 'axios';
import { Config } from '../constants/config';
import { authState } from './auth-service';
import { Giver } from '../models/giver';

const MOCK_DATA: Giver[] = [
  {
    giverId: 'mock-1',
    typeBlood: 'O+',
    user: {
      id: 1,
      firstName: 'Youssef',
      lastName: 'El Mansouri',
      email: 'youssef.mansouri@email.com',
      phoneNumber: '+212661234567',
      city: 'Casablanca',
      country: 'Morocco',
    },
  },
  {
    giverId: 'mock-2',
    typeBlood: 'A+',
    user: {
      id: 2,
      firstName: 'Fatima',
      lastName: 'Zahra Benali',
      email: 'fatima.benali@email.com',
      phoneNumber: '+212662345678',
      city: 'Rabat',
      country: 'Morocco',
    },
  },
  {
    giverId: 'mock-3',
    typeBlood: 'B+',
    user: {
      id: 3,
      firstName: 'Khalid',
      lastName: 'Ouazzani',
      email: 'khalid.ouazzani@email.com',
      phoneNumber: '+212663456789',
      city: 'Marrakech',
      country: 'Morocco',
    },
  },
  {
    giverId: 'mock-4',
    typeBlood: 'AB+',
    user: {
      id: 4,
      firstName: 'Nadia',
      lastName: 'Chraibi',
      email: 'nadia.chraibi@email.com',
      phoneNumber: '+212664567890',
      city: 'Fès',
      country: 'Morocco',
    },
  },
  {
    giverId: 'mock-5',
    typeBlood: 'O-',
    user: {
      id: 5,
      firstName: 'Mohamed',
      lastName: 'Alami',
      email: 'mohamed.alami@email.com',
      phoneNumber: '+212665678901',
      city: 'Tangier',
      country: 'Morocco',
    },
  },
  {
    giverId: 'mock-6',
    typeBlood: 'A-',
    user: {
      id: 6,
      firstName: 'Amina',
      lastName: 'Tazi',
      email: 'amina.tazi@email.com',
      phoneNumber: '+33612345678',
      city: 'Paris',
      country: 'France',
    },
  },
  {
    giverId: 'mock-7',
    typeBlood: 'B-',
    user: {
      id: 7,
      firstName: 'Rachid',
      lastName: 'Benmoussa',
      email: 'rachid.benmoussa@email.com',
      phoneNumber: '+212666789012',
      city: 'Agadir',
      country: 'Morocco',
    },
  },
  {
    giverId: 'mock-8',
    typeBlood: 'AB-',
    user: {
      id: 8,
      firstName: 'Salma',
      lastName: 'El Idrissi',
      email: 'salma.elidrissi@email.com',
      phoneNumber: '+33623456789',
      city: 'Lyon',
      country: 'France',
    },
  },
  {
    giverId: 'mock-9',
    typeBlood: 'O+',
    user: {
      id: 9,
      firstName: 'Hassan',
      lastName: 'Berrada',
      email: 'hassan.berrada@email.com',
      phoneNumber: '+212667890123',
      city: 'Meknès',
      country: 'Morocco',
    },
  },
  {
    giverId: 'mock-10',
    typeBlood: 'A+',
    user: {
      id: 10,
      firstName: 'Zineb',
      lastName: 'Lahlou',
      email: 'zineb.lahlou@email.com',
      phoneNumber: '+212668901234',
      city: 'Oujda',
      country: 'Morocco',
    },
  },
  {
    giverId: 'mock-11',
    typeBlood: 'B+',
    user: {
      id: 11,
      firstName: 'Karim',
      lastName: 'Fassi',
      email: 'karim.fassi@email.com',
      phoneNumber: '+33634567890',
      city: 'Marseille',
      country: 'France',
    },
  },
];

const getAuthHeader = () => ({
  Authorization: `Bearer ${authState.token}`,
});

export const getAllGivers = async (): Promise<Giver[]> => {
  try {
    const response = await axios.get(`${Config.API_URL}/giver/all`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.warn('getAllGivers: API unavailable, using mock data', error);
    return MOCK_DATA;
  }
};

export const getGiversByBloodType = async (type: string): Promise<Giver[]> => {
  try {
    const response = await axios.get(`${Config.API_URL}/giver/type`, {
      headers: getAuthHeader(),
      params: { type },
    });
    return response.data;
  } catch (error) {
    console.warn('getGiversByBloodType: API unavailable, using mock data', error);
    return MOCK_DATA.filter(g => g.typeBlood === type);
  }
};

export const getGiversByBloodTypes = async (types: string[]): Promise<Giver[]> => {
  try {
    const response = await axios.post(`${Config.API_URL}/giver/types`, types, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.warn('getGiversByBloodTypes: API unavailable, using mock data', error);
    return MOCK_DATA.filter(g => types.includes(g.typeBlood || ''));
  }
};

export const createGiver = async (payload: Partial<Giver>): Promise<Giver> => {
  try {
    const response = await axios.post(`${Config.API_URL}/giver/add`, payload, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.warn('createGiver: API unavailable, returning mock response', error);
    const newGiver: Giver = {
      giverId: `mock-${Date.now()}`,
      ...payload,
    };
    return newGiver;
  }
};

export const updateGiver = async (id: string, payload: Partial<Giver>): Promise<Giver> => {
  try {
    const response = await axios.put(`${Config.API_URL}/giver/${id}/modify`, payload, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.warn('updateGiver: API unavailable, returning mock response', error);
    const existing = MOCK_DATA.find(g => g.giverId === id);
    return { ...existing, ...payload, giverId: id };
  }
};

export const deleteGiver = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${Config.API_URL}/giver/${id}/delete`, {
      headers: getAuthHeader(),
    });
  } catch (error) {
    console.warn('deleteGiver: API unavailable', error);
  }
};
