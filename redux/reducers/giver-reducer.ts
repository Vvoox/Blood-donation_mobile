import {Giver} from "../../models/giver";

export interface GiverState {
    giver: Giver[],
}

const INITIAL_STATE: GiverState = {
    giver: [],
};

export interface GiverAction {
    type: string,
    payload?: any;
}

export const giverReducer = (state = INITIAL_STATE, action: GiverAction) => {
    switch (action.type) {
        case 'GET_ALL_Givers_By_Type':
            return ({...state, giver: action.payload});

        case 'GET_ALL_COMPTES':
            return ({...state, comptes: action.payload});

        case 'GiverActions.CREATE':
            return ({...state, giver: [...state.giver, action.payload] });

        case `GiverActions.UPDATE`:
            const giver = state.giver;
            return ({
                ...state, giver: giver.map(gv =>
                    gv.giverId === action.payload.giverId ? action.payload : giver
                )
            });

        // case `GiverActions.DELETE`:
        //     return ({...state, giver: state.giver.filter(gv => gv.giverId !== action.payload)});
        //
        // //
        // case `CompteActions.UPDATE`:
        //     const comptes = state.comptes;
        //     // comptes[comptes.findIndex(compte => compte.numeroCompte === action.payload.numeroCompte)] = action.payload;
        //     return ({
        //         ...state, comptes: comptes.map(compte =>
        //             compte.numeroCompte === action.payload.numeroCompte ? action.payload : compte
        //         )
        //     });
        // //
        // case `CompteActions.DELETE`:
        //     return ({...state, comptes: state.comptes.filter(compte => compte.numeroCompte !== action.payload)});
        // default:
        //     return state;
    }
}
