export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Notifications: undefined;
  Chats: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  RequestDetail: { requestId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  CreateRequest: undefined;
};

export type ChatsStackParamList = {
  ChatList: undefined;
  Chat: { chatId: string };
};

export type SearchStackParamList = {
  SearchMain: undefined;
  DonorDetail: { donor: any };
};

export type DonateStackParamList = {
  DonateMain: undefined;
};
