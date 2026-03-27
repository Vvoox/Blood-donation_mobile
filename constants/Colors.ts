const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export const Colors = {
  Primary: '#C62828',
  PrimaryLight: '#EF5350',
  PrimaryDark: '#8E0000',
  Background: '#F5F5F5',
  White: '#FFFFFF',
  TextPrimary: '#212121',
  TextSecondary: '#757575',
  Success: '#2E7D32',
  Warning: '#F57F17',
  Error: '#C62828',
};

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};
