import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import BloodTypeBadge from '../components/BloodTypeBadge';
import { Colors } from '../constants/Colors';
import { BloodRequest } from '../models/blood-request';
import { REQUEST_ACTIONS } from '../redux/reducers/request-reducer';
import { RootState } from '../redux/store';
import { getAllRequests, getRequestsByCity } from '../services/request-service';
import { HomeStackParamList } from '../types';

type HomeNavProp = StackNavigationProp<HomeStackParamList, 'HomeMain'>;

function timeRemaining(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} left`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface RequestCardProps {
  request: BloodRequest;
  onPress: () => void;
}

function RequestCard({ request, onPress }: RequestCardProps) {
  const progress = request.peopleNeeded > 0 ? request.acceptedCount / request.peopleNeeded : 0;
  const isUrgent = new Date(request.deadline).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <TouchableOpacity style={styles.requestCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardTopRow}>
        <View style={styles.bloodTypesRow}>
          {request.bloodTypes.length === 0 ? (
            <View style={styles.anyBloodBadge}>
              <Ionicons name="water" size={13} color={Colors.Primary} />
              <Text style={styles.anyBloodText}>Any Blood Type</Text>
            </View>
          ) : (
            request.bloodTypes.slice(0, 4).map((bt) => (
              <BloodTypeBadge key={bt} bloodType={bt} size="small" />
            ))
          )}
          {request.bloodTypes.length > 4 && (
            <Text style={styles.moreBadges}>+{request.bloodTypes.length - 4}</Text>
          )}
        </View>
        <View style={[styles.urgentBadge, isUrgent ? styles.urgentBadgeRed : styles.urgentBadgeGray]}>
          <Ionicons
            name="time-outline"
            size={11}
            color={isUrgent ? Colors.Primary : Colors.TextSecondary}
          />
          <Text style={[styles.urgentText, isUrgent ? styles.urgentTextRed : styles.urgentTextGray]}>
            {timeRemaining(request.deadline)}
          </Text>
        </View>
      </View>

      <Text style={styles.creatorName}>{request.creatorName}</Text>

      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={13} color={Colors.TextSecondary} />
        <Text style={styles.locationText}>
          {request.city}, {request.country}
        </Text>
        <Text style={styles.dotSep}>·</Text>
        <Text style={styles.timeAgoText}>{timeAgo(request.createdAt)}</Text>
      </View>

      {request.notes ? (
        <Text style={styles.notesPreview} numberOfLines={2}>
          {request.notes}
        </Text>
      ) : null}

      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>
            {request.acceptedCount} of {request.peopleNeeded} donors found
          </Text>
          <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${Math.min(progress * 100, 100)}%` as any }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user) as any;
  const { requests, loading, error } = useSelector((state: RootState) => state.requests);
  const unreadCount = useSelector((state: RootState) => state.notifications.unreadCount);

  const userCity: string = user?.city || '';
  const isLoggedIn = !!user;

  const displayRequests = React.useMemo(() => {
    if (!isLoggedIn || !userCity) return requests;
    const cityLower = userCity.toLowerCase();
    const cityRequests = requests.filter(
      (r) => r.city.toLowerCase() === cityLower && r.status === 'active'
    );
    return cityRequests.length > 0 ? cityRequests : requests;
  }, [requests, isLoggedIn, userCity]);

  const loadRequests = React.useCallback(async () => {
    dispatch({ type: REQUEST_ACTIONS.FETCH_REQUEST });
    try {
      let data: BloodRequest[];
      if (isLoggedIn && userCity) {
        data = await getRequestsByCity(userCity);
        if (data.length === 0) {
          data = await getAllRequests();
        }
      } else {
        data = await getAllRequests();
      }
      dispatch({ type: REQUEST_ACTIONS.FETCH_SUCCESS, payload: data });
    } catch (err) {
      dispatch({ type: REQUEST_ACTIONS.FETCH_FAILURE, payload: 'Failed to load requests' });
    }
  }, [dispatch, isLoggedIn, userCity]);

  React.useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleCardPress = (request: BloodRequest) => {
    if (!isLoggedIn) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to view request details and respond to blood donation requests.',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.navigate('RequestDetail', { requestId: request.id });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="water-outline" size={64} color={Colors.TextSecondary} />
      <Text style={styles.emptyTitle}>No requests in your city yet</Text>
      <Text style={styles.emptySubtitle}>
        There are currently no active blood donation requests
        {userCity ? ` in ${userCity}` : ' in your area'}.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.Primary} />

      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Ionicons name="water" size={26} color={Colors.White} />
              <Text style={styles.headerTitle}>BloodLink</Text>
            </View>
            <View style={styles.headerRight}>
              {isLoggedIn && userCity ? (
                <View style={styles.cityIndicator}>
                  <Ionicons name="location" size={13} color={Colors.White} />
                  <Text style={styles.cityIndicatorText}>{userCity}</Text>
                </View>
              ) : null}
              {isLoggedIn && (
                <TouchableOpacity style={styles.notifButton}>
                  <Ionicons name="notifications-outline" size={24} color={Colors.White} />
                  {unreadCount > 0 && (
                    <View style={styles.notifBadge}>
                      <Text style={styles.notifBadgeText}>
                        {unreadCount > 9 ? '9+' : String(unreadCount)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>

      {!isLoggedIn && (
        <View style={styles.guestBanner}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.Warning} />
          <Text style={styles.guestBannerText}>
            Sign in to see requests in your city and respond to them
          </Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {isLoggedIn && userCity ? `Requests in ${userCity}` : 'All Blood Requests'}
        </Text>
        <TouchableOpacity onPress={loadRequests}>
          <Ionicons name="refresh-outline" size={20} color={Colors.Primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.Primary} />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.Error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadRequests}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RequestCard request={item} onPress={() => handleCardPress(item)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.White,
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cityIndicatorText: {
    color: Colors.White,
    fontSize: 12,
    fontWeight: '600',
  },
  notifButton: {
    position: 'relative',
    padding: 2,
  },
  notifBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: Colors.Warning,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: Colors.White,
    fontSize: 9,
    fontWeight: 'bold',
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE082',
  },
  guestBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#795548',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.TextPrimary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.TextSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: Colors.Error,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.Primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 8,
  },
  retryButtonText: {
    color: Colors.White,
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.TextPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.TextSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  requestCard: {
    backgroundColor: Colors.White,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bloodTypesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  anyBloodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  anyBloodText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.Primary,
  },
  moreBadges: {
    fontSize: 12,
    color: Colors.TextSecondary,
    fontWeight: '600',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  urgentBadgeRed: {
    backgroundColor: '#FFEBEE',
  },
  urgentBadgeGray: {
    backgroundColor: Colors.Background,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  urgentTextRed: {
    color: Colors.Primary,
  },
  urgentTextGray: {
    color: Colors.TextSecondary,
  },
  creatorName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.TextPrimary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: Colors.TextSecondary,
  },
  dotSep: {
    fontSize: 12,
    color: Colors.TextSecondary,
  },
  timeAgoText: {
    fontSize: 12,
    color: Colors.TextSecondary,
  },
  notesPreview: {
    fontSize: 13,
    color: Colors.TextSecondary,
    lineHeight: 18,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  progressSection: {
    marginTop: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.TextSecondary,
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 12,
    color: Colors.Primary,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#FFEBEE',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.Primary,
    borderRadius: 3,
  },
});
