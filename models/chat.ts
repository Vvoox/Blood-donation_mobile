export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Chat {
  id: string;
  requestId: string;
  donorId: string;
  donorName: string;
  donorBloodType: string;
  requesterId: string;
  requesterName: string;
  bloodTypes: string[];
  city: string;
  messages: ChatMessage[];
  createdAt: string;
}
