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
  Search: undefined;
  Donate: undefined;
  Profile: undefined;
};

export type SearchStackParamList = {
  SearchMain: undefined;
  DonorDetail: { donor: any };
};

export type DonateStackParamList = {
  DonateMain: undefined;
};
