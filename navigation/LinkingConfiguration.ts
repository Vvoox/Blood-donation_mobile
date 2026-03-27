import * as Linking from 'expo-linking';

export default {
  prefixes: [Linking.makeUrl('/'), 'bloodlink://'],
  config: {
    screens: {
      Auth: {
        screens: {
          Splash: 'splash',
          Login: 'login',
          Register: 'register',
        },
      },
      App: {
        screens: {
          Home: 'home',
          Search: {
            screens: {
              SearchMain: 'search',
              DonorDetail: 'donor/:id',
            },
          },
          Donate: 'donate',
          Profile: 'profile',
        },
      },
    },
  },
};
