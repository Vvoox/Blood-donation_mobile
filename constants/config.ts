// Replace YOUR_VPS_IP with your server's public IP address
const VPS_IP = 'YOUR_VPS_IP';

export const Config = {
  KEYCLOAK_URL: `http://${VPS_IP}:8080`,
  KEYCLOAK_REALM: 'blood-donation',
  KEYCLOAK_CLIENT_ID: 'blood-donation-app',
  API_URL: `http://${VPS_IP}:8082`,
};
