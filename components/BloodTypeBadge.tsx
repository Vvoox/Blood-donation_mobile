import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  bloodType: string;
  size?: 'small' | 'medium' | 'large';
  selected?: boolean;
  onPress?: () => void;
}

const BLOOD_TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'A+':  { bg: '#E3F2FD', border: '#1565C0', text: '#1565C0' },
  'A-':  { bg: '#E3F2FD', border: '#1565C0', text: '#1565C0' },
  'B+':  { bg: '#E8F5E9', border: '#2E7D32', text: '#2E7D32' },
  'B-':  { bg: '#E8F5E9', border: '#2E7D32', text: '#2E7D32' },
  'AB+': { bg: '#F3E5F5', border: '#6A1B9A', text: '#6A1B9A' },
  'AB-': { bg: '#F3E5F5', border: '#6A1B9A', text: '#6A1B9A' },
  'O+':  { bg: '#FFEBEE', border: '#C62828', text: '#C62828' },
  'O-':  { bg: '#FFEBEE', border: '#C62828', text: '#C62828' },
};

const SIZES = {
  small:  { container: 32, font: 10 },
  medium: { container: 48, font: 14 },
  large:  { container: 64, font: 18 },
};

export default function BloodTypeBadge({ bloodType, size = 'medium', selected = false, onPress }: Props) {
  const colors = BLOOD_TYPE_COLORS[bloodType] || { bg: '#F5F5F5', border: '#9E9E9E', text: '#9E9E9E' };
  const dimensions = SIZES[size];

  const badgeStyle = [
    styles.badge,
    {
      width: dimensions.container,
      height: dimensions.container,
      borderRadius: dimensions.container / 2,
      borderColor: colors.border,
      backgroundColor: selected ? colors.border : colors.bg,
    },
  ];

  const textStyle = [
    styles.badgeText,
    {
      fontSize: dimensions.font,
      color: selected ? '#FFFFFF' : colors.text,
      fontWeight: selected ? ('bold' as const) : ('700' as const),
    },
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={badgeStyle} onPress={onPress} activeOpacity={0.7}>
        <Text style={textStyle}>{bloodType}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{bloodType}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    letterSpacing: -0.3,
  },
});
