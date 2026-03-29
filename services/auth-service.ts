import axios from 'axios';
import { Config } from '../constants/config';

const KEYCLOAK_TOKEN_URL = `${Config.KEYCLOAK_URL}/realms/${Config.KEYCLOAK_REALM}/protocol/openid-connect/token`;
const KEYCLOAK_USERINFO_URL = `${Config.KEYCLOAK_URL}/realms/${Config.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`;

// Module-level token storage (in-memory, no AsyncStorage)
export const authState = {
  token: '',
  refreshToken: '',
};

export const login = async (username: string, password: string): Promise<{ access_token: string; refresh_token: string }> => {
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('client_id', Config.KEYCLOAK_CLIENT_ID);
  params.append('username', username);
  params.append('password', password);

  const response = await axios.post(KEYCLOAK_TOKEN_URL, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const { access_token, refresh_token } = response.data;
  authState.token = access_token;
  authState.refreshToken = refresh_token;

  return { access_token, refresh_token };
};

export const getUserInfo = async (token: string): Promise<any> => {
  const response = await axios.get(KEYCLOAK_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const refreshToken = async (refresh_token: string): Promise<{ access_token: string; refresh_token: string }> => {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('client_id', Config.KEYCLOAK_CLIENT_ID);
  params.append('refresh_token', refresh_token);

  const response = await axios.post(KEYCLOAK_TOKEN_URL, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const { access_token, refresh_token: new_refresh_token } = response.data;
  authState.token = access_token;
  authState.refreshToken = new_refresh_token;

  return { access_token, refresh_token: new_refresh_token };
};

export const logout = (): void => {
  authState.token = '';
  authState.refreshToken = '';
};
