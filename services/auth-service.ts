import axios from "axios";
import {config} from "../constants/api";


const keycloakFormData = () => {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('client_id', 'ressource-server');
    return formData;
};

export const authState = {
    token: ''
};

// export const login = (username: string, password: string) => {
//     const body = keycloakFormData();
//     body.append("username", username);
//     body.append("password", password);
//     return axios.post(config.AUTH_SERVER, body)
//         .then(response => localStorage.setItem("access_token", response.data.access_token))
//         .catch(error => console.log(error.data));
// };

export const loadUserInfo = (token: string) => {
    // const {
    //     ready, // If the discovery is already fetched
    //     login, // The login function - opens the browser
    //     isLoggedIn, // Helper boolean to use e.g. in your components down the tree
    //     token, // Access token, if available
    //     logout, // Logs the user out
    // } = useKeycloak();
    // const body = keycloakFormData();
    // body.append("username", username);
    // body.append("password", password);
    return axios.get(config.API_URL + '/realms/ensapay/protocol/openid-connect/userinfo', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    // return axios.post(config.AUTH_SERVER, body)
    //     .then(response => localStorage.setItem("access_token", response.data.access_token))
    //     .catch(error => console.log(error.data));
};
