import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import BloodTypeBadge from './BloodTypeBadge';
import { Colors } from '../constants/Colors';
import { Giver } from '../models/giver';

interface DonorCardProps {
  donor: Giver;
  onPress: () => void;
}

export default function DonorCard({ donor, onPress }: DonorCardProps) {
  const name = `${donor.user?.firstName || ''} ${donor.user?.lastName || ''}`.trim() || 'Anonymous';
  const city = donor.city || donor.user?.city || 'Unknown city';
  const bloodType = donor.typeBlood || '?';
  const isAvailable = donor.isAvailable !== false;

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={[styles.availabilityDot, { backgroundColor: isAvailable ? Colors.Success : Colors.TextSecondary }]} />
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={Colors.TextSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {city}
          </Text>
        </View>
        {donor.lastDonationDate ? (
          <View style={styles.locationRow}>
            <Ionicons name="calendar-outline" size={13} color={Colors.TextSecondary} />
            <Text style={styles.locationText}>Last donated: {donor.lastDonationDate}</Text>
          </View>
        ) : null}
      </View>

      {/* Blood type + arrow */}
      <View style={styles.rightSection}>
        <BloodTypeBadge bloodType={bloodType} size="small" />
        <Ionicons name="chevron-forward" size={18} color={Colors.TextSecondary} style={styles.arrow} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.White,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.PrimaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: Colors.White,
    fontWeight: 'bold',
    fontSize: 16,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.TextPrimary,
    flex: 1,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: Colors.TextSecondary,
  },
  rightSection: {
    alignItems: 'center',
    gap: 4,
  },
  arrow: {
    marginTop: 4,
  },
});
