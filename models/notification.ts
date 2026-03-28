export type NotificationType = 'blood_request' | 'request_accepted';

export interface AppNotification {
  id: string;
  type: NotificationType;
  requestId: string;
  bloodTypes: string[];
  city: string;
  creatorId: string;
  creatorName: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'ignored';
  createdAt: string;
}
