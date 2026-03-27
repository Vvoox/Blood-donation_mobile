import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import giverReducer from './reducers/giver-reducer';
import authReducer from './reducers/auth-reducer';

const rootReducer = combineReducers({
  givers: giverReducer,
  auth: authReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
export const store = createStore(rootReducer, applyMiddleware(thunk));
export default store;
