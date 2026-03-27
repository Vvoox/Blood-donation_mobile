import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import * as React from 'react';
import {
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import BloodTypeBadge from '../components/BloodTypeBadge';
import DonorCard from '../components/DonorCard';
import { Colors } from '../constants/Colors';
import { GIVER_ACTIONS } from '../redux/reducers/giver-reducer';
import { RootState } from '../redux/store';
import { getAllGivers } from '../services/giver-service';
import { Giver } from '../models/giver';

const COMPATIBILITY: Record<string, string[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { givers, loading } = useSelector((state: RootState) => state.givers);
  const user = useSelector((state: RootState) => state.auth.user) as any;

  const recentDonors = React.useMemo(() => givers.slice(0, 5), [givers]);
  const bloodTypesAvailable = React.useMemo(
    () => new Set(givers.map((g) => g.typeBlood).filter(Boolean)).size,
    [givers]
  );

  React.useEffect(() => {
    loadGivers();
  }, []);

  const loadGivers = async () => {
    dispatch({ type: GIVER_ACTIONS.FETCH_REQUEST });
    try {
      const data = await getAllGivers();
      dispatch({ type: GIVER_ACTIONS.FETCH_SUCCESS, payload: data });
    } catch (err) {
      dispatch({ type: GIVER_ACTIONS.FETCH_FAILURE, payload: 'Failed to load donors' });
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.given_name || user?.name || user?.preferred_username || 'Friend';

  const handleFindONegative = () => {
    navigation.navigate('Search', {
      screen: 'SearchMain',
      params: { prefilterType: 'O-' },
    });
  };

  const handleFindDonors = () => {
    navigation.navigate('Search');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.Primary} />

      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greetingText}>{greeting()},</Text>
              <Text style={styles.userNameText}>{userName}</Text>
            </View>
            <View style={styles.headerLogo}>
              <Ionicons name="water" size={28} color={Colors.White} />
              <Text style={styles.headerLogoText}>BloodLink</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Stats cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={28} color={Colors.Primary} />
            <Text style={styles.statCardNumber}>{loading ? '...' : givers.length}</Text>
            <Text style={styles.statCardLabel}>Total Donors</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="water" size={28} color={Colors.Primary} />
            <Text style={styles.statCardNumber}>{bloodTypesAvailable}</Text>
            <Text style={styles.statCardLabel}>Blood Types Available</Text>
          </View>
        </View>

        {/* Emergency button */}
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={handleFindONegative}
          activeOpacity={0.85}>
          <View style={styles.emergencyButtonLeft}>
            <Ionicons name="warning" size={24} color={Colors.White} />
            <View style={styles.emergencyButtonText}>
              <Text style={styles.emergencyButtonTitle}>Emergency?</Text>
              <Text style={styles.emergencyButtonSubtitle}>Find O- donors now</Text>
            </View>
          </View>
          <View style={styles.emergencyBadge}>
            <Text style={styles.emergencyBadgeText}>O-</Text>
          </View>
        </TouchableOpacity>

        {/* Quick search card */}
        <TouchableOpacity
          style={styles.quickSearchCard}
          onPress={handleFindDonors}
          activeOpacity={0.85}>
          <View style={styles.quickSearchLeft}>
            <View style={styles.quickSearchIcon}>
              <Ionicons name="search" size={22} color={Colors.Primary} />
            </View>
            <View>
              <Text style={styles.quickSearchTitle}>Find Donors</Text>
              <Text style={styles.quickSearchSubtitle}>Search by blood type or city</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.TextSecondary} />
        </TouchableOpacity>

        {/* Recent donors */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Donors</Text>
          <TouchableOpacity onPress={handleFindDonors}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading donors...</Text>
          </View>
        ) : recentDonors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={Colors.TextSecondary} />
            <Text style={styles.emptyText}>No donors found</Text>
          </View>
        ) : (
          recentDonors.map((donor) => (
            <DonorCard
              key={donor.giverId}
              donor={donor}
              onPress={() =>
                navigation.navigate('Search', {
                  screen: 'DonorDetail',
                  params: { donor },
                })
              }
            />
          ))
        )}

        {/* Blood type compatibility */}
        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>
          Blood Type Compatibility
        </Text>
        <View style={styles.compatibilityCard}>
          <Text style={styles.compatibilityInfo}>
            O- is the universal donor. AB+ is the universal recipient.
          </Text>
          <View style={styles.compatibilityRow}>
            {['O-', 'O+', 'A+', 'B+', 'AB+', 'A-', 'B-', 'AB-'].map((type) => (
              <View key={type} style={styles.compatibilityItem}>
                <BloodTypeBadge bloodType={type} size="small" />
                <Text style={styles.compatibilityCount}>
                  {COMPATIBILITY[type]?.length ?? 1} types
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomPadding} />
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  greetingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  userNameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.White,
    marginTop: 2,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerLogoText: {
    fontSize: 18,
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.White,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statCardNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.TextPrimary,
    marginTop: 8,
  },
  statCardLabel: {
    fontSize: 12,
    color: Colors.TextSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  emergencyButton: {
    backgroundColor: Colors.PrimaryDark,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    shadowColor: Colors.Primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emergencyButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  emergencyButtonText: {
    flex: 1,
  },
  emergencyButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.White,
  },
  emergencyButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  emergencyBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  emergencyBadgeText: {
    color: Colors.White,
    fontWeight: 'bold',
    fontSize: 15,
  },
  quickSearchCard: {
    backgroundColor: Colors.White,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  quickSearchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  quickSearchIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSearchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.TextPrimary,
  },
  quickSearchSubtitle: {
    fontSize: 13,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.TextPrimary,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.Primary,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.TextSecondary,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: Colors.TextSecondary,
    fontSize: 15,
  },
  compatibilityCard: {
    backgroundColor: Colors.White,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  compatibilityInfo: {
    fontSize: 13,
    color: Colors.TextSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  compatibilityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  compatibilityItem: {
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  compatibilityCount: {
    fontSize: 10,
    color: Colors.TextSecondary,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 16,
  },
});
