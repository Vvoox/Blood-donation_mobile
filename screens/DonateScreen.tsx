import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import BloodTypeBadge from '../components/BloodTypeBadge';
import { Colors } from '../constants/Colors';
import { GIVER_ACTIONS } from '../redux/reducers/giver-reducer';
import { RootState } from '../redux/store';
import { createGiver, updateGiver } from '../services/giver-service';
import { Giver } from '../models/giver';

const BLOOD_TYPES = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'];

export default function DonateScreen() {
  const dispatch = useDispatch();
  const { givers } = useSelector((state: RootState) => state.givers);
  const user = useSelector((state: RootState) => state.auth.user) as any;

  const userId = user?.sub || user?.id;
  const existingDonor = givers.find((g) => g.user?.id === userId);

  const [isEditing, setIsEditing] = React.useState(!existingDonor);
  const [bloodType, setBloodType] = React.useState(existingDonor?.typeBlood || '');
  const [city, setCity] = React.useState(existingDonor?.user?.city || '');
  const [isAvailable, setIsAvailable] = React.useState(true);
  const [lastDonation, setLastDonation] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (existingDonor) {
      setBloodType(existingDonor.typeBlood || '');
      setCity(existingDonor.user?.city || '');
      setIsEditing(false);
    }
  }, [existingDonor]);

  const handleSubmit = async () => {
    if (!bloodType) {
      Alert.alert('Validation Error', 'Please select your blood type.');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Validation Error', 'Please enter your city.');
      return;
    }

    setLoading(true);
    try {
      const payload: Partial<Giver> = {
        typeBlood: bloodType,
        user: {
          ...existingDonor?.user,
          city,
        },
      };

      if (existingDonor?.giverId) {
        const updated = await updateGiver(existingDonor.giverId, payload);
        dispatch({ type: GIVER_ACTIONS.UPDATE, payload: updated });
        Alert.alert('Success', 'Your donor profile has been updated!');
      } else {
        const newGiver = await createGiver(payload);
        dispatch({ type: GIVER_ACTIONS.CREATE, payload: newGiver });
        Alert.alert('Success', 'You are now registered as a blood donor! Thank you!');
      }
      setIsEditing(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save donor profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const donationHistory = [
    { date: '2024-10-15', location: 'CHU Casablanca', units: 1 },
    { date: '2024-04-02', location: 'Blood Bank Rabat', units: 1 },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.Primary} />

      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <Ionicons name="heart" size={24} color={Colors.White} />
            <Text style={styles.headerTitle}>Donate Blood</Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {existingDonor && !isEditing ? (
          <>
            {/* Donor profile view */}
            <View style={styles.profileCard}>
              <View style={styles.profileTop}>
                <BloodTypeBadge bloodType={existingDonor.typeBlood || ''} size="large" />
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {existingDonor.user?.firstName} {existingDonor.user?.lastName}
                  </Text>
                  <View style={styles.cityRow}>
                    <Ionicons name="location-outline" size={14} color={Colors.TextSecondary} />
                    <Text style={styles.profileCity}>{existingDonor.user?.city || 'Unknown'}</Text>
                  </View>
                </View>
              </View>

              {/* Availability toggle */}
              <View style={styles.availabilityRow}>
                <View style={styles.availabilityLeft}>
                  <View
                    style={[
                      styles.availabilityDot,
                      isAvailable ? styles.dotAvailable : styles.dotUnavailable,
                    ]}
                  />
                  <Text style={styles.availabilityText}>
                    {isAvailable ? 'Available to donate' : 'Currently unavailable'}
                  </Text>
                </View>
                <Switch
                  value={isAvailable}
                  onValueChange={setIsAvailable}
                  trackColor={{ false: '#E0E0E0', true: '#FFCDD2' }}
                  thumbColor={isAvailable ? Colors.Primary : Colors.TextSecondary}
                />
              </View>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
                activeOpacity={0.85}>
                <Ionicons name="pencil-outline" size={16} color={Colors.Primary} />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{donationHistory.length}</Text>
                <Text style={styles.statLabel}>Total Donations</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{donationHistory.length * 3}</Text>
                <Text style={styles.statLabel}>Lives Saved</Text>
              </View>
            </View>

            {/* Donation history */}
            <Text style={styles.sectionTitle}>Donation History</Text>
            {donationHistory.map((donation, index) => (
              <View key={index} style={styles.donationHistoryItem}>
                <View style={styles.donationHistoryDot} />
                <View style={styles.donationHistoryContent}>
                  <Text style={styles.donationHistoryDate}>{donation.date}</Text>
                  <Text style={styles.donationHistoryLocation}>{donation.location}</Text>
                </View>
                <View style={styles.donationUnitBadge}>
                  <Text style={styles.donationUnitText}>{donation.units} unit</Text>
                </View>
              </View>
            ))}
          </>
        ) : (
          <>
            {/* Register / Edit form */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {existingDonor ? 'Edit Donor Profile' : 'Register as a Donor'}
              </Text>
              <Text style={styles.formSubtitle}>
                {existingDonor
                  ? 'Update your donation information'
                  : 'Help save lives by sharing your blood type and location'}
              </Text>

              {/* Blood type */}
              <Text style={styles.fieldLabel}>Blood Type *</Text>
              <View style={styles.bloodTypeGrid}>
                {BLOOD_TYPES.map((type) => (
                  <BloodTypeBadge
                    key={type}
                    bloodType={type}
                    size="medium"
                    selected={bloodType === type}
                    onPress={() => setBloodType(type)}
                  />
                ))}
              </View>

              {/* City */}
              <Text style={styles.fieldLabel}>City *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={Colors.TextSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Your city"
                  placeholderTextColor={Colors.TextSecondary}
                  value={city}
                  onChangeText={setCity}
                  autoCapitalize="words"
                />
              </View>

              {/* Availability */}
              <View style={styles.availabilityRow}>
                <Text style={styles.fieldLabel}>Available to donate</Text>
                <Switch
                  value={isAvailable}
                  onValueChange={setIsAvailable}
                  trackColor={{ false: '#E0E0E0', true: '#FFCDD2' }}
                  thumbColor={isAvailable ? Colors.Primary : Colors.TextSecondary}
                />
              </View>

              {/* Last donation date */}
              <Text style={styles.fieldLabel}>Last Donation Date (optional)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={Colors.TextSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.TextSecondary}
                  value={lastDonation}
                  onChangeText={setLastDonation}
                />
              </View>

              {/* Action buttons */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}>
                {loading ? (
                  <ActivityIndicator color={Colors.White} size="small" />
                ) : (
                  <>
                    <Ionicons name="heart" size={20} color={Colors.White} />
                    <Text style={styles.submitButtonText}>
                      {existingDonor ? 'Save Changes' : 'Register as Donor'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {existingDonor && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsEditing(false)}
                  activeOpacity={0.85}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Info box */}
            {!existingDonor && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color={Colors.Primary} />
                <Text style={styles.infoBoxText}>
                  By registering, your blood type and city will be visible to people in need.
                  Your full contact details remain private until you accept a request.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  header: {
    backgroundColor: Colors.Primary,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.White,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileCard: {
    backgroundColor: Colors.White,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.TextPrimary,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  profileCity: {
    fontSize: 14,
    color: Colors.TextSecondary,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  availabilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availabilityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotAvailable: {
    backgroundColor: Colors.Success,
  },
  dotUnavailable: {
    backgroundColor: Colors.TextSecondary,
  },
  availabilityText: {
    fontSize: 14,
    color: Colors.TextPrimary,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.Primary,
  },
  editButtonText: {
    fontSize: 14,
    color: Colors.Primary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.White,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.Primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.TextSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.TextPrimary,
    marginBottom: 12,
  },
  donationHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.White,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  donationHistoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.Primary,
  },
  donationHistoryContent: {
    flex: 1,
  },
  donationHistoryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.TextPrimary,
  },
  donationHistoryLocation: {
    fontSize: 12,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  donationUnitBadge: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  donationUnitText: {
    fontSize: 12,
    color: Colors.Primary,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: Colors.White,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.TextPrimary,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: Colors.TextSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.TextPrimary,
    marginBottom: 8,
    marginTop: 4,
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.Background,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: 15,
    color: Colors.TextPrimary,
  },
  submitButton: {
    backgroundColor: Colors.Primary,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: Colors.Primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: Colors.White,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: Colors.TextSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 14,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: Colors.TextPrimary,
    lineHeight: 18,
  },
});
