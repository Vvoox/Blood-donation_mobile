import { Chat, ChatMessage } from '../models/chat';

let chatsStore: Chat[] = [];

export const getChatsForUser = (userId: string): Chat[] => {
  return chatsStore.filter(
    c => c.donorId === userId || c.requesterId === userId
  );
};

export const getChatById = (id: string): Chat | null => {
  return chatsStore.find(c => c.id === id) || null;
};

export const createChat = (
  requestId: string,
  donor: { id: string; name: string; bloodType: string },
  requester: { id: string; name: string },
  bloodTypes: string[],
  city: string
): Chat => {
  // Avoid duplicate chats for same request + donor pair
  const existing = chatsStore.find(
    c => c.requestId === requestId && c.donorId === donor.id
  );
  if (existing) {
    return existing;
  }

  const newChat: Chat = {
    id: `chat-${Date.now()}`,
    requestId,
    donorId: donor.id,
    donorName: donor.name,
    donorBloodType: donor.bloodType,
    requesterId: requester.id,
    requesterName: requester.name,
    bloodTypes,
    city,
    messages: [
      {
        id: `msg-${Date.now()}-sys`,
        senderId: 'system',
        senderName: 'BloodLink',
        text: `Chat started. ${donor.name} accepted ${requester.name}'s blood request in ${city}.`,
        timestamp: new Date().toISOString(),
        read: true,
      },
    ],
    createdAt: new Date().toISOString(),
  };

  chatsStore = [newChat, ...chatsStore];
  return newChat;
};

export const sendMessage = (
  chatId: string,
  senderId: string,
  senderName: string,
  text: string
): ChatMessage => {
  const message: ChatMessage = {
    id: `msg-${Date.now()}`,
    senderId,
    senderName,
    text,
    timestamp: new Date().toISOString(),
    read: false,
  };

  chatsStore = chatsStore.map(c => {
    if (c.id === chatId) {
      return { ...c, messages: [...c.messages, message] };
    }
    return c;
  });

  return message;
};

export const markMessagesRead = (chatId: string, userId: string): void => {
  chatsStore = chatsStore.map(c => {
    if (c.id === chatId) {
      return {
        ...c,
        messages: c.messages.map(m => {
          if (m.senderId !== userId && !m.read) {
            return { ...m, read: true };
          }
          return m;
        }),
      };
    }
    return c;
  });
};
