import { combineReducers } from 'redux';
import giverReducer from './giver-reducer';
import authReducer from './auth-reducer';
import requestReducer from './request-reducer';
import notificationReducer from './notification-reducer';
import chatReducer from './chat-reducer';

const rootReducer = combineReducers({
  givers: giverReducer,
  auth: authReducer,
  requests: requestReducer,
  notifications: notificationReducer,
  chats: chatReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
