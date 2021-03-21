import { combineReducers } from 'redux';
import {giverReducer} from "./giver-reducer";

// export type ReduxAction<T> = (payload?: any) => CompteAction<T>;

const rootReducer = combineReducers({
    // comptes: comptesReducer,
    giver: giverReducer
});

export default rootReducer;
