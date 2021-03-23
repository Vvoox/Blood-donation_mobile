import axiosInstance from "../request.interceptor";
import {config} from "../constants/api";
import {addGiver, getGiverByType, modifyGiver, deleteGiver} from "../redux/actions/giver-actions";
import {Giver} from "../models/giver";
import axios from "axios";

export const fetchGivers = () => (dispatch: any) =>{
    console.log('fetch');
    axiosInstance.get(`${config.API_URL}/giver/all`)
        .then(({data}) => dispatch(getGiverByType(data)));
}

export const getAllUsers = () =>{
    return axios.get(config.API_URL+'/user/all');
}
export const getAllUsersByType = (bloodType:any) =>{
    return axios.get(config.API_URL+'/user/type',{ params: { type: bloodType } });
}
export const getAllUsersByTypes = (payload: any) => {
    // console.log(payload);
    return axiosInstance.post(config.API_URL+'/user/types',payload);
}

export const createGiver = (payload: any) => (dispatch: any) =>
    axiosInstance.post(`${config.API_URL}/giver/add`, payload)
        .then(({data}) => dispatch(addGiver(data)));

export const updateGiver = (id: string, giver: Giver) => (dispatch: any) =>
    axiosInstance.put(`${config.API_URL}/clients/${id}/modify`, giver)
        .then(({data}) => {
            console.log("updated giver", data);
            dispatch(modifyGiver(data));
        });

// export const resetPassword = (client: Client) =>
//     axiosInstance.post(`${config.API_URL}/clients/reset-password`, client.account);

export const removeGiver = (id: string) => (dispatch: any) =>
    axiosInstance.delete(`${config.API_URL}/giver/${id}/delete`)
        .then(() => {
            dispatch(deleteGiver(id));
        });
