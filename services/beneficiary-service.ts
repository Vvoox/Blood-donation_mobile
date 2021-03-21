import axiosInstance from "../request.interceptor";
import {config} from "../constants/api";
import {addGiver, getGiverByType, modifyGiver, deleteGiver} from "../redux/actions/giver-actions";

export const fetchGiver = () => (dispatch: any) =>
    axiosInstance.get(`${config.API_URL}/giver/all`)
        .then(({data}) => dispatch(getGiverByType(data)));

export const createGiver = (payload: any) => (dispatch: any) =>
    axiosInstance.post(`${config.API_URL}/giver/add`, payload)
        .then(({data}) => dispatch(addGiver(data)));

export const updateGiver = (id: string, client: Client) => (dispatch: any) =>
    axiosInstance.put(`${config.API_URL}/clients/${id}/modify`, client)
        .then(({data}) => {
            console.log("updated client", data);
            dispatch(modifyGiver(data));
        });

// export const resetPassword = (client: Client) =>
//     axiosInstance.post(`${config.API_URL}/clients/reset-password`, client.account);

export const removeGiver = (id: string) => (dispatch: any) =>
    axiosInstance.delete(`${config.API_URL}/giver/${id}/delete`)
        .then(() => {
            dispatch(deleteGiver(id));
        });
