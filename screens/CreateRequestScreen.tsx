import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { Colors } from '../constants/Colors';
import { REQUEST_ACTIONS } from '../redux/reducers/request-reducer';
import { NOTIF_ACTIONS } from '../redux/reducers/notification-reducer';
import { RootState } from '../redux/store';
import { createRequest } from '../services/request-service';
import { createRequestNotifications, addNotification } from '../services/notification-service';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const DEADLINES = [
  { label: '24 hours', value: 1 },
  { label: '3 days', value: 3 },
  { label: '1 week', value: 7 },
];

// Simulated users in same city for notification demo
const MOCK_USERS_IN_CITY = [
  { id: 'mock-current-user', name: 'Current User', city: 'Casablanca' },
  { id: 'user-demo-1', name: 'Rachid Alaoui', city: 'Casablanca' },
  { id: 'user-demo-2', name: 'Sara Bennani', city: 'Casablanca' },
  { id: 'user-demo-3', name: 'Omar Tahiri', city: 'Rabat' },
  { id: 'user-demo-4', name: 'Leila Sebti', city: 'Marrakech' },
];

export default function CreateRequestScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user) as any;

  const userId = user?.sub || user?.id || 'mock-current-user';
  const userName =
    `${user?.given_name || user?.firstName || ''} ${user?.family_name || user?.lastName || ''}`.trim() ||
    user?.name ||
    'Anonymous';
  const userCity = user?.city || '';

  const [selectedBloodTypes, setSelectedBloodTypes] = React.useState<string[]>([]);
  const [anyBloodType, setAnyBloodType] = React.useState(false);
  const [city, setCity] = React.useState(userCity);
  const [peopleNeeded, setPeopleNeeded] = React.useState(1);
  const [deadlineDays, setDeadlineDays] = React.useState(3);
  const [notes, setNotes] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const toggleBloodType = (bt: string) => {
    if (anyBloodType) return;
    setSelectedBloodTypes((prev) =>
      prev.includes(bt) ? prev.filter((t) => t !== bt) : [...prev, bt]
    );
  };

  const toggleAnyBloodType = () => {
    setAnyBloodType((prev) => {
      if (!prev) setSelectedBloodTypes([]);
      return !prev;
    });
  };

  const incrementPeople = () => {
    if (peopleNeeded < 10) setPeopleNeeded((p) => p + 1);
  };

  const decrementPeople = () => {
    if (peopleNeeded > 1) setPeopleNeeded((p) => p - 1);
  };

  const handleSubmit = async () => {
    if (!city.trim()) {
      Alert.alert('Validation Error', 'Please enter a city.');
      return;
    }
    if (!anyBloodType && selectedBloodTypes.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one blood type or choose "Any".');
      return;
    }

    setSubmitting(true);
    try {
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + deadlineDays);

      const newRequest = await createRequest({
        creatorId: userId,
        creatorName: userName,
        bloodTypes: anyBloodType ? [] : selectedBloodTypes,
        city: city.trim(),
        country: 'Morocco',
        peopleNeeded,
        deadline: deadlineDate.toISOString(),
        notes: notes.trim() || undefined,
      });

      dispatch({ type: REQUEST_ACTIONS.CREATE, payload: newRequest });

      // Create notifications for users in same city
      const usersInCity = MOCK_USERS_IN_CITY.filter(
        (u) => u.city.toLowerCase() === city.trim().toLowerCase() && u.id !== userId
      );

      createRequestNotifications(newRequest, usersInCity);

      // Also dispatch notifications for current user's redux store (for demo)
      usersInCity.forEach((u) => {
        if (u.id === 'mock-current-user') {
          const notif = {
            id: `notif-${Date.now()}-${u.id}`,
            type: 'blood_request' as const,
            requestId: newRequest.id,
            bloodTypes: newRequest.bloodTypes,
            city: newRequest.city,
            creatorId: newRequest.creatorId,
            creatorName: newRequest.creatorName,
            fromUserId: newRequest.creatorId,
            fromUserName: newRequest.creatorName,
            toUserId: u.id,
            status: 'pending' as const,
            createdAt: new Date().toISOString(),
          };
          dispatch({ type: NOTIF_ACTIONS.ADD, payload: notif });
        }
      });

      Alert.alert(
        'Request Created!',
        'Your blood donation request has been posted. Donors in your city will be notified.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to create request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.Primary} />
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.White} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Blood Request</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Blood type selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Blood Types Needed</Text>

          <TouchableOpacity
            style={[styles.anyToggle, anyBloodType && styles.anyToggleActive]}
            onPress={toggleAnyBloodType}
            activeOpacity={0.8}>
            <Ionicons
              name={anyBloodType ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={anyBloodType ? Colors.White : Colors.Primary}
            />
            <Text style={[styles.anyToggleText, anyBloodType && styles.anyToggleTextActive]}>
              Any Blood Type
            </Text>
          </TouchableOpacity>

          {!anyBloodType && (
            <View style={styles.bloodTypeGrid}>
              {BLOOD_TYPES.map((bt) => {
                const isSelected = selectedBloodTypes.includes(bt);
                return (
                  <TouchableOpacity
                    key={bt}
                    style={[styles.btBadge, isSelected && styles.btBadgeSelected]}
                    onPress={() => toggleBloodType(bt)}
                    activeOpacity={0.75}>
                    <Text style={[styles.btBadgeText, isSelected && styles.btBadgeTextSelected]}>
                      {bt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* City */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>City</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="location-outline" size={20} color={Colors.TextSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter city"
              placeholderTextColor={Colors.TextSecondary}
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* People needed */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Donors Needed</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={[styles.stepperButton, peopleNeeded <= 1 && styles.stepperButtonDisabled]}
              onPress={decrementPeople}
              disabled={peopleNeeded <= 1}>
              <Ionicons name="remove" size={22} color={peopleNeeded <= 1 ? Colors.TextSecondary : Colors.Primary} />
            </TouchableOpacity>
            <View style={styles.stepperValueContainer}>
              <Text style={styles.stepperValue}>{peopleNeeded}</Text>
              <Text style={styles.stepperUnit}>donor{peopleNeeded !== 1 ? 's' : ''}</Text>
            </View>
            <TouchableOpacity
              style={[styles.stepperButton, peopleNeeded >= 10 && styles.stepperButtonDisabled]}
              onPress={incrementPeople}
              disabled={peopleNeeded >= 10}>
              <Ionicons name="add" size={22} color={peopleNeeded >= 10 ? Colors.TextSecondary : Colors.Primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Deadline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Deadline</Text>
          <View style={styles.deadlineRow}>
            {DEADLINES.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={[styles.deadlineOption, deadlineDays === d.value && styles.deadlineOptionActive]}
                onPress={() => setDeadlineDays(d.value)}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.deadlineOptionText,
                    deadlineDays === d.value && styles.deadlineOptionTextActive,
                  ]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any details about the request, hospital, urgency, etc."
            placeholderTextColor={Colors.TextSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}>
          {submitting ? (
            <ActivityIndicator color={Colors.White} size="small" />
          ) : (
            <>
              <Ionicons name="heart" size={22} color={Colors.White} />
              <Text style={styles.submitButtonText}>Create Request</Text>
            </>
          )}
        </TouchableOpacity>
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
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.White,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.White,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.TextPrimary,
    marginBottom: 12,
  },
  anyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: Colors.Primary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: Colors.White,
  },
  anyToggleActive: {
    backgroundColor: Colors.Primary,
  },
  anyToggleText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.Primary,
  },
  anyToggleTextActive: {
    color: Colors.White,
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  btBadge: {
    width: 64,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.Primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.White,
  },
  btBadgeSelected: {
    backgroundColor: Colors.Primary,
  },
  btBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.Primary,
  },
  btBadgeTextSelected: {
    color: Colors.White,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.Background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: Colors.TextPrimary,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  stepperButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: Colors.Primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.White,
  },
  stepperButtonDisabled: {
    borderColor: '#E0E0E0',
    backgroundColor: Colors.Background,
  },
  stepperValueContainer: {
    alignItems: 'center',
    minWidth: 60,
  },
  stepperValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.TextPrimary,
  },
  stepperUnit: {
    fontSize: 12,
    color: Colors.TextSecondary,
  },
  deadlineRow: {
    flexDirection: 'row',
    gap: 10,
  },
  deadlineOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.Primary,
    alignItems: 'center',
    backgroundColor: Colors.White,
  },
  deadlineOptionActive: {
    backgroundColor: Colors.Primary,
  },
  deadlineOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.Primary,
  },
  deadlineOptionTextActive: {
    color: Colors.White,
  },
  notesInput: {
    backgroundColor: Colors.Background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    padding: 12,
    fontSize: 14,
    color: Colors.TextPrimary,
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: Colors.Primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.Primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 6,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: Colors.White,
    fontSize: 17,
    fontWeight: 'bold',
  },
});
