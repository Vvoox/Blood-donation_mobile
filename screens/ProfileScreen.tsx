import { Ionicons } from '@expo/vector-icons';
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

import BloodTypeBadge from '../components/BloodTypeBadge';
import { Colors } from '../constants/Colors';
import { logout } from '../redux/actions/auth-actions';
import { RootState } from '../redux/store';

const APP_VERSION = '1.0.0';

function AvatarCircle({ name, size = 72 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((n) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  const colors = ['#C62828', '#1565C0', '#2E7D32', '#6A1B9A', '#E65100', '#00695C'];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <View
      style={[
        styles.avatarCircle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor },
      ]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>{initials || '?'}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user) as any;
  const { givers } = useSelector((state: RootState) => state.givers);

  const userId = user?.sub || user?.id;
  const donorProfile = givers.find((g) => g.user?.id === userId);

  const fullName =
    user
      ? `${user.given_name || user.firstName || ''} ${user.family_name || user.lastName || ''}`.trim()
      : 'Unknown User';
  const email = user?.email || 'No email';
  const bloodType = user?.bloodType || donorProfile?.typeBlood || '';
  const city = user?.city || donorProfile?.user?.city || '';

  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(fullName);
  const [editCity, setEditCity] = React.useState(city);
  const [editPhone, setEditPhone] = React.useState(user?.phoneNumber || '');
  const [isSaving, setIsSaving] = React.useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const donationsCount = 2;
  const livesSaved = donationsCount * 3;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.Primary} />

      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <Ionicons name="person" size={24} color={Colors.White} />
            <Text style={styles.headerTitle}>My Profile</Text>
            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              style={styles.editHeaderButton}>
              <Ionicons
                name={isEditing ? 'close-outline' : 'pencil-outline'}
                size={22}
                color={Colors.White}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Avatar + name section */}
        <View style={styles.profileHero}>
          <AvatarCircle name={fullName} size={88} />
          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
          <View style={styles.profileBadgesRow}>
            {bloodType ? <BloodTypeBadge bloodType={bloodType} size="small" /> : null}
            {city ? (
              <View style={styles.cityPill}>
                <Ionicons name="location-outline" size={13} color={Colors.TextSecondary} />
                <Text style={styles.cityPillText}>{city}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{donationsCount}</Text>
            <Text style={styles.statLabel}>Donations</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{livesSaved}</Text>
            <Text style={styles.statLabel}>Lives Saved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{donorProfile ? '1' : '0'}</Text>
            <Text style={styles.statLabel}>Active Listing</Text>
          </View>
        </View>

        {/* Edit form */}
        {isEditing && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Edit Profile</Text>

            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={Colors.TextSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your full name"
                placeholderTextColor={Colors.TextSecondary}
              />
            </View>

            <Text style={styles.fieldLabel}>City</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={18} color={Colors.TextSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={editCity}
                onChangeText={setEditCity}
                placeholder="Your city"
                placeholderTextColor={Colors.TextSecondary}
              />
            </View>

            <Text style={styles.fieldLabel}>Phone</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={18} color={Colors.TextSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Your phone number"
                placeholderTextColor={Colors.TextSecondary}
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={isSaving}
              activeOpacity={0.85}>
              {isSaving ? (
                <ActivityIndicator color={Colors.White} size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Donor profile section */}
        {donorProfile && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>My Donor Profile</Text>
            <View style={styles.donorInfoRow}>
              <BloodTypeBadge bloodType={donorProfile.typeBlood || ''} size="medium" />
              <View style={styles.donorInfoText}>
                <Text style={styles.donorInfoLabel}>Blood Type</Text>
                <Text style={styles.donorInfoValue}>{donorProfile.typeBlood}</Text>
              </View>
            </View>
            <View style={styles.donorCityRow}>
              <Ionicons name="location-outline" size={16} color={Colors.Primary} />
              <Text style={styles.donorCityText}>{donorProfile.user?.city || 'Unknown'}</Text>
            </View>
          </View>
        )}

        {/* Account section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.TextSecondary} />
            <Text style={styles.menuItemText}>Privacy & Security</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.TextSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={20} color={Colors.TextSecondary} />
            <Text style={styles.menuItemText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.TextSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <Ionicons name="help-circle-outline" size={20} color={Colors.TextSecondary} />
            <Text style={styles.menuItemText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.TextSecondary} />
          </TouchableOpacity>
        </View>

        {/* Logout button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={Colors.Error} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        {/* App version */}
        <Text style={styles.versionText}>BloodLink v{APP_VERSION}</Text>
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
    flex: 1,
  },
  editHeaderButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHero: {
    backgroundColor: Colors.White,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: Colors.White,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.TextPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.TextSecondary,
    marginBottom: 10,
  },
  profileBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.Background,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cityPillText: {
    fontSize: 13,
    color: Colors.TextSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.White,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.Primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.TextSecondary,
    marginTop: 4,
    textAlign: 'center',
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.TextSecondary,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.Background,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 10,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: Colors.TextPrimary,
  },
  saveButton: {
    backgroundColor: Colors.Primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: Colors.White,
    fontSize: 16,
    fontWeight: '700',
  },
  donorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  donorInfoText: {
    flex: 1,
  },
  donorInfoLabel: {
    fontSize: 12,
    color: Colors.TextSecondary,
  },
  donorInfoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.TextPrimary,
    marginTop: 2,
  },
  donorCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  donorCityText: {
    fontSize: 14,
    color: Colors.TextPrimary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    color: Colors.TextPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
  },
  logoutButtonText: {
    color: Colors.Error,
    fontSize: 16,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.TextSecondary,
    marginBottom: 8,
  },
});
