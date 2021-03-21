import axios, {AxiosRequestConfig} from "axios";
// import {authState} from "./services/auth.service";
const axiosInstance = axios.create();

const interceptor = axiosInstance.interceptors.request.use(
    (config: AxiosRequestConfig) => {
        config.headers = {
            // Authorization: `Bearer ${authState.token}`
        };
        return config;
    },
    error => Promise.reject(error)
);

export default axiosInstance;
