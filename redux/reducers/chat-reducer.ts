import { Chat, ChatMessage } from '../../models/chat';

export const CHAT_ACTIONS = {
  SET_ALL: 'CHAT_SET_ALL',
  ADD_CHAT: 'CHAT_ADD',
  ADD_MESSAGE: 'CHAT_ADD_MESSAGE',
  MARK_READ: 'CHAT_MARK_READ',
};

export interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
}

const initialState: ChatState = {
  chats: [],
  activeChat: null,
};

export default function chatReducer(state = initialState, action: any): ChatState {
  switch (action.type) {
    case CHAT_ACTIONS.SET_ALL:
      return { ...state, chats: action.payload };
    case CHAT_ACTIONS.ADD_CHAT: {
      const chat = action.payload as Chat;
      const exists = state.chats.find(c => c.id === chat.id);
      if (exists) {
        return state;
      }
      return { ...state, chats: [chat, ...state.chats] };
    }
    case CHAT_ACTIONS.ADD_MESSAGE: {
      const { chatId, message } = action.payload as { chatId: string; message: ChatMessage };
      return {
        ...state,
        chats: state.chats.map(c => {
          if (c.id === chatId) {
            return { ...c, messages: [...c.messages, message] };
          }
          return c;
        }),
        activeChat:
          state.activeChat?.id === chatId
            ? {
                ...state.activeChat,
                messages: [...state.activeChat.messages, message],
              }
            : state.activeChat,
      };
    }
    case CHAT_ACTIONS.MARK_READ: {
      const { chatId, userId } = action.payload as { chatId: string; userId: string };
      return {
        ...state,
        chats: state.chats.map(c => {
          if (c.id === chatId) {
            return {
              ...c,
              messages: c.messages.map(m =>
                m.senderId !== userId && !m.read ? { ...m, read: true } : m
              ),
            };
          }
          return c;
        }),
      };
    }
    default:
      return state;
  }
}
