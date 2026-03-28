import { AppNotification } from '../../models/notification';

export const NOTIF_ACTIONS = {
  SET_ALL: 'NOTIF_SET_ALL',
  ADD: 'NOTIF_ADD',
  ACCEPT: 'NOTIF_ACCEPT',
  IGNORE: 'NOTIF_IGNORE',
};

export interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
}

function countUnread(notifications: AppNotification[]): number {
  return notifications.filter(n => n.status === 'pending').length;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

export default function notificationReducer(
  state = initialState,
  action: any
): NotificationState {
  switch (action.type) {
    case NOTIF_ACTIONS.SET_ALL: {
      const notifications: AppNotification[] = action.payload;
      return {
        ...state,
        notifications,
        unreadCount: countUnread(notifications),
      };
    }
    case NOTIF_ACTIONS.ADD: {
      const notifications = [action.payload as AppNotification, ...state.notifications];
      return {
        ...state,
        notifications,
        unreadCount: countUnread(notifications),
      };
    }
    case NOTIF_ACTIONS.ACCEPT: {
      const notifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, status: 'accepted' as const } : n
      );
      return {
        ...state,
        notifications,
        unreadCount: countUnread(notifications),
      };
    }
    case NOTIF_ACTIONS.IGNORE: {
      const notifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, status: 'ignored' as const } : n
      );
      return {
        ...state,
        notifications,
        unreadCount: countUnread(notifications),
      };
    }
    default:
      return state;
  }
}
