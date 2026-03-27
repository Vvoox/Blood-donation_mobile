import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as React from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import BloodTypeBadge from '../components/BloodTypeBadge';
import { Colors } from '../constants/Colors';
import { Giver } from '../models/giver';
import { SearchStackParamList } from '../types';

type DonorDetailNavigationProp = StackNavigationProp<SearchStackParamList, 'DonorDetail'>;
type DonorDetailRouteProp = RouteProp<SearchStackParamList, 'DonorDetail'>;

interface Props {
  navigation: DonorDetailNavigationProp;
  route: DonorDetailRouteProp;
}

const COMPATIBILITY_CAN_RECEIVE: Record<string, string[]> = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
  'AB-': ['A-', 'B-', 'O-', 'AB-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
};

const COMPATIBILITY_CAN_DONATE: Record<string, string[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

function maskPhone(phone?: string): string {
  if (!phone) return 'N/A';
  if (phone.length <= 4) return phone;
  return phone.substring(0, phone.length - 4).replace(/\d/g, '*') + phone.slice(-4);
}

export default function DonorDetailScreen({ navigation, route }: Props) {
  const { donor } = route.params as { donor: Giver };
  const bloodType = donor.typeBlood || 'N/A';
  const user = donor.user;
  const fullName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : 'Unknown Donor';

  const canDonateTo = COMPATIBILITY_CAN_DONATE[bloodType] || [];
  const canReceiveFrom = COMPATIBILITY_CAN_RECEIVE[bloodType] || [];

  const handleCallDonor = () => {
    if (!user?.phoneNumber) {
      Alert.alert('No phone number', 'This donor has not provided a phone number.');
      return;
    }
    Alert.alert(
      'Contact Donor',
      `Are you sure you want to call ${fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            const phone = `tel:${user.phoneNumber}`;
            Linking.canOpenURL(phone).then((supported) => {
              if (supported) {
                Linking.openURL(phone);
              } else {
                Alert.alert('Unable to open dialer', 'Your device does not support phone calls.');
              }
            });
          },
        },
      ]
    );
  };

  const handleSendMessage = () => {
    if (!user?.phoneNumber) {
      Alert.alert('No phone number', 'This donor has not provided a phone number.');
      return;
    }
    const sms = `sms:${user.phoneNumber}`;
    Linking.canOpenURL(sms).then((supported) => {
      if (supported) {
        Linking.openURL(sms);
      } else {
        Alert.alert('Unable to open SMS', 'Your device does not support SMS.');
      }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.Primary} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top hero */}
        <View style={styles.hero}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.White} />
          </TouchableOpacity>
          <BloodTypeBadge bloodType={bloodType} size="large" />
          <Text style={styles.heroName}>{fullName}</Text>
          <View style={styles.heroLocationRow}>
            <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.heroLocation}>{user?.city || 'Unknown city'}</Text>
            {user?.country && user?.country !== user?.city && (
              <Text style={styles.heroLocation}>, {user.country}</Text>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {/* Contact info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Contact Information</Text>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color={Colors.Primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{maskPhone(user?.phoneNumber)}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={Colors.Primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={Colors.Primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Last Donation</Text>
                <Text style={styles.infoValue}>Not specified</Text>
              </View>
            </View>
          </View>

          {/* Compatibility */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Blood Compatibility</Text>
            <Text style={styles.compatLabel}>Can donate to:</Text>
            <View style={styles.badgeRow}>
              {canDonateTo.map((t) => (
                <BloodTypeBadge key={t} bloodType={t} size="small" />
              ))}
              {canDonateTo.length === 0 && (
                <Text style={styles.compatNone}>No data</Text>
              )}
            </View>
            <Text style={[styles.compatLabel, { marginTop: 12 }]}>Can receive from:</Text>
            <View style={styles.badgeRow}>
              {canReceiveFrom.map((t) => (
                <BloodTypeBadge key={t} bloodType={t} size="small" />
              ))}
              {canReceiveFrom.length === 0 && (
                <Text style={styles.compatNone}>No data</Text>
              )}
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCallDonor}
              activeOpacity={0.85}>
              <Ionicons name="call" size={20} color={Colors.White} />
              <Text style={styles.callButtonText}>Contact Donor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.messageButton}
              onPress={handleSendMessage}
              activeOpacity={0.85}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.Primary} />
              <Text style={styles.messageButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  hero: {
    backgroundColor: Colors.Primary,
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 32,
    paddingHorizontal: 24,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  heroName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.White,
    marginTop: 12,
    textAlign: 'center',
  },
  heroLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  heroLocation: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: Colors.White,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.TextPrimary,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.TextSecondary,
  },
  infoValue: {
    fontSize: 15,
    color: Colors.TextPrimary,
    fontWeight: '500',
    marginTop: 2,
  },
  compatLabel: {
    fontSize: 13,
    color: Colors.TextSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  compatNone: {
    color: Colors.TextSecondary,
    fontSize: 13,
  },
  actionsContainer: {
    gap: 10,
    marginTop: 4,
  },
  callButton: {
    backgroundColor: Colors.Primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.Primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  callButtonText: {
    color: Colors.White,
    fontSize: 16,
    fontWeight: '700',
  },
  messageButton: {
    borderWidth: 2,
    borderColor: Colors.Primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  messageButtonText: {
    color: Colors.Primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
