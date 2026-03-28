import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { Colors } from '../constants/Colors';
import { BloodRequest } from '../models/blood-request';
import { REQUEST_ACTIONS } from '../redux/reducers/request-reducer';
import { NOTIF_ACTIONS } from '../redux/reducers/notification-reducer';
import { CHAT_ACTIONS } from '../redux/reducers/chat-reducer';
import { RootState } from '../redux/store';
import { getRequestById, acceptRequest } from '../services/request-service';
import { addNotification } from '../services/notification-service';
import { createChat } from '../services/chat-service';
import { HomeStackParamList, ChatsStackParamList } from '../types';

type RouteType = RouteProp<HomeStackParamList, 'RequestDetail'>;
type HomeNavProp = StackNavigationProp<HomeStackParamList, 'RequestDetail'>;

function timeRemaining(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} left`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} left`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function RequestDetailScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<HomeNavProp>();
  const dispatch = useDispatch();
  const { requestId } = route.params;

  const user = useSelector((state: RootState) => state.auth.user) as any;
  const chats = useSelector((state: RootState) => state.chats.chats);

  const [request, setRequest] = React.useState<BloodRequest | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [accepting, setAccepting] = React.useState(false);

  const userId = user?.sub || user?.id || 'mock-current-user';
  const userName =
    `${user?.given_name || user?.firstName || ''} ${user?.family_name || user?.lastName || ''}`.trim() ||
    user?.name ||
    'Anonymous Donor';
  const userBloodType = user?.bloodType || 'O+';

  const existingChat = React.useMemo(
    () => chats.find((c) => c.requestId === requestId && c.donorId === userId),
    [chats, requestId, userId]
  );

  const hasAccepted = !!existingChat;

  const loadRequest = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRequestById(requestId);
      setRequest(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load request details.');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  React.useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const handleAccept = async () => {
    if (!request) return;
    setAccepting(true);
    try {
      await acceptRequest(requestId, userId, userName);

      // Update request in redux
      const updatedRequest: BloodRequest = {
        ...request,
        acceptedCount: request.acceptedCount + 1,
        status:
          request.acceptedCount + 1 >= request.peopleNeeded ? 'fulfilled' : request.status,
      };
      dispatch({ type: REQUEST_ACTIONS.UPDATE, payload: updatedRequest });
      setRequest(updatedRequest);

      // Create notification for requester
      const notifForRequester = {
        id: `notif-${Date.now()}`,
        type: 'request_accepted' as const,
        requestId,
        bloodTypes: request.bloodTypes,
        city: request.city,
        creatorId: request.creatorId,
        creatorName: request.creatorName,
        fromUserId: userId,
        fromUserName: userName,
        toUserId: request.creatorId,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };
      addNotification(notifForRequester);
      dispatch({ type: NOTIF_ACTIONS.ADD, payload: notifForRequester });

      // Create chat
      const chat = createChat(
        requestId,
        { id: userId, name: userName, bloodType: userBloodType },
        { id: request.creatorId, name: request.creatorName },
        request.bloodTypes,
        request.city
      );
      dispatch({ type: CHAT_ACTIONS.ADD_CHAT, payload: chat });

      Alert.alert(
        'Request Accepted!',
        `You have accepted ${request.creatorName}'s blood request. A chat has been opened.`,
        [
          {
            text: 'Open Chat',
            onPress: () => {
              (navigation as any).navigate('Chats', {
                screen: 'Chat',
                params: { chatId: chat.id },
              });
            },
          },
          { text: 'Stay Here', style: 'cancel' },
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to accept request. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const handleOpenChat = () => {
    if (existingChat) {
      (navigation as any).navigate('Chats', {
        screen: 'Chat',
        params: { chatId: existingChat.id },
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.Primary} />
        <ActivityIndicator size="large" color={Colors.Primary} />
        <Text style={styles.loadingText}>Loading request...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.Primary} />
        <Ionicons name="alert-circle-outline" size={64} color={Colors.Error} />
        <Text style={styles.notFoundText}>Request not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress =
    request.peopleNeeded > 0 ? request.acceptedCount / request.peopleNeeded : 0;
  const isExpired = new Date(request.deadline).getTime() < Date.now();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.Primary} />
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.White} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Request Details</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Blood types section */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>Blood Types Needed</Text>
          {request.bloodTypes.length === 0 ? (
            <View style={styles.anyBloodRow}>
              <Ionicons name="water" size={20} color={Colors.Primary} />
              <Text style={styles.anyBloodText}>Any Blood Type Accepted</Text>
            </View>
          ) : (
            <View style={styles.bloodTypesGrid}>
              {request.bloodTypes.map((bt) => (
                <BloodTypeBadge key={bt} bloodType={bt} size="large" />
              ))}
            </View>
          )}
        </View>

        {/* Progress */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>Donors Progress</Text>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressMain}>
              {request.acceptedCount} / {request.peopleNeeded} donors matched
            </Text>
            <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(progress * 100, 100)}%` as any },
              ]}
            />
          </View>
          {request.status === 'fulfilled' && (
            <View style={styles.fulfilledBanner}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.Success} />
              <Text style={styles.fulfilledText}>This request has been fulfilled!</Text>
            </View>
          )}
        </View>

        {/* Creator info */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>Requester</Text>
          <View style={styles.creatorRow}>
            <View style={styles.creatorAvatar}>
              <Text style={styles.creatorAvatarText}>
                {request.creatorName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </Text>
            </View>
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>{request.creatorName}</Text>
              <View style={styles.creatorLocationRow}>
                <Ionicons name="location-outline" size={14} color={Colors.TextSecondary} />
                <Text style={styles.creatorLocation}>
                  {request.city}, {request.country}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Time & dates */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>Timeline</Text>
          <View style={styles.timelineRow}>
            <View style={styles.timelineItem}>
              <Ionicons name="calendar-outline" size={20} color={Colors.TextSecondary} />
              <Text style={styles.timelineLabel}>Created</Text>
              <Text style={styles.timelineValue}>{formatDate(request.createdAt)}</Text>
            </View>
            <View style={styles.timelineDivider} />
            <View style={styles.timelineItem}>
              <Ionicons
                name="time-outline"
                size={20}
                color={isExpired ? Colors.Error : Colors.Warning}
              />
              <Text style={styles.timelineLabel}>Deadline</Text>
              <Text
                style={[
                  styles.timelineValue,
                  { color: isExpired ? Colors.Error : Colors.TextPrimary },
                ]}>
                {isExpired ? 'Expired' : timeRemaining(request.deadline)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {request.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardSectionLabel}>Notes</Text>
            <Text style={styles.notesText}>{request.notes}</Text>
          </View>
        ) : null}

        {/* Accept section */}
        <View style={styles.actionSection}>
          {hasAccepted ? (
            <>
              <View style={styles.acceptedBanner}>
                <Ionicons name="checkmark-circle" size={22} color={Colors.Success} />
                <Text style={styles.acceptedBannerText}>You accepted this request</Text>
              </View>
              <TouchableOpacity style={styles.openChatButton} onPress={handleOpenChat}>
                <Ionicons name="chatbubbles" size={20} color={Colors.White} />
                <Text style={styles.openChatButtonText}>Open Chat</Text>
              </TouchableOpacity>
            </>
          ) : request.status !== 'active' || isExpired ? (
            <View style={styles.inactiveBanner}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.TextSecondary} />
              <Text style={styles.inactiveBannerText}>
                {request.status === 'fulfilled'
                  ? 'This request has already been fulfilled.'
                  : 'This request is no longer active.'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.acceptButton, accepting && styles.acceptButtonDisabled]}
              onPress={handleAccept}
              disabled={accepting}
              activeOpacity={0.85}>
              {accepting ? (
                <ActivityIndicator color={Colors.White} size="small" />
              ) : (
                <>
                  <Ionicons name="heart" size={22} color={Colors.White} />
                  <Text style={styles.acceptButtonText}>Accept Request</Text>
                </>
              )}
            </TouchableOpacity>
          )}
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
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.Background,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.TextSecondary,
  },
  notFoundText: {
    fontSize: 18,
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  backBtn: {
    backgroundColor: Colors.Primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 8,
  },
  backBtnText: {
    color: Colors.White,
    fontWeight: '700',
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
  cardSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.TextSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  anyBloodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  anyBloodText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.Primary,
  },
  bloodTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressMain: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.TextPrimary,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.Primary,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.Primary,
    borderRadius: 5,
  },
  fulfilledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  fulfilledText: {
    color: Colors.Success,
    fontSize: 13,
    fontWeight: '600',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  creatorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.PrimaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorAvatarText: {
    color: Colors.White,
    fontSize: 18,
    fontWeight: 'bold',
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.TextPrimary,
    marginBottom: 4,
  },
  creatorLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  creatorLocation: {
    fontSize: 13,
    color: Colors.TextSecondary,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  timelineItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  timelineLabel: {
    fontSize: 12,
    color: Colors.TextSecondary,
  },
  timelineValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.TextPrimary,
    textAlign: 'center',
  },
  timelineDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#E0E0E0',
  },
  notesText: {
    fontSize: 14,
    color: Colors.TextPrimary,
    lineHeight: 22,
  },
  actionSection: {
    marginTop: 8,
    gap: 10,
  },
  acceptedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  acceptedBannerText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.Success,
  },
  openChatButton: {
    backgroundColor: Colors.Success,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.Success,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  openChatButtonText: {
    color: Colors.White,
    fontSize: 17,
    fontWeight: 'bold',
  },
  inactiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.Background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inactiveBannerText: {
    fontSize: 14,
    color: Colors.TextSecondary,
    flex: 1,
  },
  acceptButton: {
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
  },
  acceptButtonDisabled: {
    opacity: 0.7,
  },
  acceptButtonText: {
    color: Colors.White,
    fontSize: 17,
    fontWeight: 'bold',
  },
});
