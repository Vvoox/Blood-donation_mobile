import {Giver} from "../../models/giver"
import {User} from "../../models/user";
// import {ClientsAction} from "../reducers/clients-reducer";

export const getGiverByType = (payload: Giver[]) => ({
    type: 'GET_ALL_Givers_By_Type',
    payload
});


export const addGiver = (payload: any) => {
    return ({
        type: 'GiverActions.CREATE',
        payload
    })
};


export const modifyGiver= (payload: Giver) => {

    return ({
        type: `GiverActions.UPDATE`,
        payload
    })
};

export const deleteGiver = (payload: String) => {
    return ({
        type: `GiverActions.DELETE`,
        payload
    })
};

