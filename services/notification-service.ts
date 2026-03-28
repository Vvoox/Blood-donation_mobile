import { AppNotification } from '../models/notification';
import { BloodRequest } from '../models/blood-request';

const MOCK_CURRENT_USER_ID = 'mock-current-user';

// Pre-populated mock notifications for demo
let notificationsStore: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'blood_request',
    requestId: 'req-1',
    bloodTypes: ['O+', 'O-'],
    city: 'Casablanca',
    creatorId: 'user-101',
    creatorName: 'Youssef El Mansouri',
    fromUserId: 'user-101',
    fromUserName: 'Youssef El Mansouri',
    toUserId: MOCK_CURRENT_USER_ID,
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    type: 'blood_request',
    requestId: 'req-2',
    bloodTypes: ['A+'],
    city: 'Casablanca',
    creatorId: 'user-102',
    creatorName: 'Fatima Zahra Benslimane',
    fromUserId: 'user-102',
    fromUserName: 'Fatima Zahra Benslimane',
    toUserId: MOCK_CURRENT_USER_ID,
    status: 'pending',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    type: 'request_accepted',
    requestId: 'req-5',
    bloodTypes: ['B+', 'B-'],
    city: 'Rabat',
    creatorId: MOCK_CURRENT_USER_ID,
    creatorName: 'Current User',
    fromUserId: 'user-105',
    fromUserName: 'Hassan Berrada',
    toUserId: MOCK_CURRENT_USER_ID,
    status: 'pending',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-4',
    type: 'blood_request',
    requestId: 'req-3',
    bloodTypes: [],
    city: 'Casablanca',
    creatorId: 'user-103',
    creatorName: 'Khalid Ouazzani',
    fromUserId: 'user-103',
    fromUserName: 'Khalid Ouazzani',
    toUserId: MOCK_CURRENT_USER_ID,
    status: 'ignored',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const getNotificationsForUser = (userId: string): AppNotification[] => {
  return notificationsStore.filter(n => n.toUserId === userId);
};

export const addNotification = (notification: AppNotification): void => {
  notificationsStore = [notification, ...notificationsStore];
};

export const acceptNotification = (notifId: string): void => {
  notificationsStore = notificationsStore.map(n =>
    n.id === notifId ? { ...n, status: 'accepted' } : n
  );
};

export const ignoreNotification = (notifId: string): void => {
  notificationsStore = notificationsStore.map(n =>
    n.id === notifId ? { ...n, status: 'ignored' } : n
  );
};

export const createRequestNotifications = (
  request: BloodRequest,
  allUsers: any[]
): void => {
  const usersInCity = allUsers.filter(
    u =>
      u.city?.toLowerCase() === request.city.toLowerCase() &&
      u.id !== request.creatorId &&
      u.sub !== request.creatorId
  );

  usersInCity.forEach(u => {
    const userId = u.sub || u.id || u.userId;
    if (!userId) return;
    const notification: AppNotification = {
      id: `notif-${Date.now()}-${userId}`,
      type: 'blood_request',
      requestId: request.id,
      bloodTypes: request.bloodTypes,
      city: request.city,
      creatorId: request.creatorId,
      creatorName: request.creatorName,
      fromUserId: request.creatorId,
      fromUserName: request.creatorName,
      toUserId: String(userId),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    notificationsStore = [notification, ...notificationsStore];
  });
};
