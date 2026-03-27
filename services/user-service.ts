import axios from 'axios';
import { Config } from '../constants/config';
import { authState } from './auth-service';
import { User } from '../models/user';

const getAuthHeader = () => ({
  Authorization: `Bearer ${authState.token}`,
});

export const getUser = async (id: number): Promise<User> => {
  const response = await axios.get(`${Config.API_URL}/user/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const updateUser = async (id: number, payload: Partial<User>): Promise<User> => {
  const response = await axios.put(`${Config.API_URL}/user/${id}/update`, payload, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getUserByKeycloakId = async (keycloakId: string): Promise<User> => {
  const response = await axios.get(`${Config.API_URL}/user/keycloak/${keycloakId}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};
