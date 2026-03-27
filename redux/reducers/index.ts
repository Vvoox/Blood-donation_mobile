import { combineReducers } from 'redux';
import giverReducer from './giver-reducer';
import authReducer from './auth-reducer';

const rootReducer = combineReducers({
  givers: giverReducer,
  auth: authReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
