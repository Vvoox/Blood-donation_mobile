import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as React from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { Colors } from '../constants/Colors';
import { AppNotification } from '../models/notification';
import { NOTIF_ACTIONS } from '../redux/reducers/notification-reducer';
import { CHAT_ACTIONS } from '../redux/reducers/chat-reducer';
import { RootState } from '../redux/store';
import { getNotificationsForUser, acceptNotification, ignoreNotification } from '../services/notification-service';
import { createChat } from '../services/chat-service';

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

export default function NotificationsScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const user = useSelector((state: RootState) => state.auth.user) as any;
  const { notifications } = useSelector((state: RootState) => state.notifications);

  const userId = user?.sub || user?.id || 'mock-current-user';
  const userName =
    `${user?.given_name || user?.firstName || ''} ${user?.family_name || user?.lastName || ''}`.trim() ||
    user?.name ||
    'Anonymous Donor';
  const userBloodType = user?.bloodType || 'O+';

  // Load notifications on mount
  React.useEffect(() => {
    const notifs = getNotificationsForUser(userId);
    dispatch({ type: NOTIF_ACTIONS.SET_ALL, payload: notifs });
  }, [dispatch, userId]);

  const userNotifications = React.useMemo(
    () => notifications.filter((n) => n.toUserId === userId),
    [notifications, userId]
  );

  const pendingCount = userNotifications.filter((n) => n.status === 'pending').length;

  const handleAccept = async (notif: AppNotification) => {
    acceptNotification(notif.id);
    dispatch({ type: NOTIF_ACTIONS.ACCEPT, payload: notif.id });

    // Create chat between current user (donor) and requester
    const chat = createChat(
      notif.requestId,
      { id: userId, name: userName, bloodType: userBloodType },
      { id: notif.creatorId, name: notif.creatorName },
      notif.bloodTypes,
      notif.city
    );
    dispatch({ type: CHAT_ACTIONS.ADD_CHAT, payload: chat });

    navigation.navigate('Chats', {
      screen: 'Chat',
      params: { chatId: chat.id },
    });
  };

  const handleIgnore = (notifId: string) => {
    ignoreNotification(notifId);
    dispatch({ type: NOTIF_ACTIONS.IGNORE, payload: notifId });
  };

  const handleOpenChat = (notif: AppNotification) => {
    // Find existing chat for this request
    navigation.navigate('Chats', { screen: 'ChatList' });
  };

  const renderNotification = ({ item }: { item: AppNotification }) => {
    const isBloodRequest = item.type === 'blood_request';
    const isAccepted = item.status === 'accepted';
    const isIgnored = item.status === 'ignored';
    const isPending = item.status === 'pending';

    return (
      <View style={[styles.notifCard, isIgnored && styles.notifCardIgnored]}>
        <View style={styles.notifIconContainer}>
          <View
            style={[
              styles.notifIcon,
              {
                backgroundColor: isIgnored
                  ? '#F5F5F5'
                  : isAccepted
                  ? '#E8F5E9'
                  : isBloodRequest
                  ? '#FFEBEE'
                  : '#E3F2FD',
              },
            ]}>
            <Ionicons
              name={
                isIgnored
                  ? 'close-circle-outline'
                  : isAccepted
                  ? 'checkmark-circle'
                  : isBloodRequest
                  ? 'water'
                  : 'heart'
              }
              size={22}
              color={
                isIgnored
                  ? Colors.TextSecondary
                  : isAccepted
                  ? Colors.Success
                  : isBloodRequest
                  ? Colors.Primary
                  : '#1565C0'
              }
            />
          </View>
        </View>

        <View style={styles.notifContent}>
          {isBloodRequest && isPending && (
            <>
              <Text style={styles.notifTitle}>
                Blood request in {item.city}
              </Text>
              <Text style={styles.notifBody}>
                {item.creatorName} needs{' '}
                {item.bloodTypes.length === 0
                  ? 'any blood type'
                  : item.bloodTypes.join(', ')}{' '}
                donors in {item.city}.
              </Text>
            </>
          )}
          {isBloodRequest && isAccepted && (
            <>
              <Text style={styles.notifTitle}>You accepted a request</Text>
              <Text style={styles.notifBody}>
                You accepted {item.creatorName}'s blood request in {item.city}.
              </Text>
            </>
          )}
          {isBloodRequest && isIgnored && (
            <>
              <Text style={[styles.notifTitle, styles.ignoredTitle]}>
                Blood request in {item.city}
              </Text>
              <Text style={[styles.notifBody, styles.ignoredBody]}>Ignored</Text>
            </>
          )}
          {item.type === 'request_accepted' && (
            <>
              <Text style={styles.notifTitle}>
                {item.fromUserName} accepted your request!
              </Text>
              <Text style={styles.notifBody}>
                A donor accepted your blood request in {item.city}.
              </Text>
            </>
          )}

          <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>

          {/* Action buttons */}
          {isBloodRequest && isPending && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleAccept(item)}
                activeOpacity={0.85}>
                <Ionicons name="heart" size={16} color={Colors.White} />
                <Text style={styles.acceptBtnText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ignoreBtn}
                onPress={() => handleIgnore(item.id)}
                activeOpacity={0.85}>
                <Text style={styles.ignoreBtnText}>Ignore</Text>
              </TouchableOpacity>
            </View>
          )}
          {(isAccepted || item.type === 'request_accepted') && !isIgnored && (
            <TouchableOpacity
              style={styles.openChatBtn}
              onPress={() => handleOpenChat(item)}
              activeOpacity={0.85}>
              <Ionicons name="chatbubbles-outline" size={16} color={Colors.Primary} />
              <Text style={styles.openChatBtnText}>Open Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-outline" size={72} color={Colors.TextSecondary} />
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptySubtitle}>
        You'll be notified when there are blood requests in your city.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.Primary} />
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <Ionicons name="notifications" size={24} color={Colors.White} />
            <Text style={styles.headerTitle}>Notifications</Text>
            {pendingCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{pendingCount} new</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>

      <FlatList
        data={userNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
      />
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
    gap: 10,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.White,
    flex: 1,
  },
  headerBadge: {
    backgroundColor: Colors.Warning,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  headerBadgeText: {
    color: Colors.White,
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  notifCard: {
    backgroundColor: Colors.White,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  notifCardIgnored: {
    opacity: 0.6,
  },
  notifIconContainer: {
    alignItems: 'center',
    paddingTop: 2,
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
    gap: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.TextPrimary,
  },
  notifBody: {
    fontSize: 13,
    color: Colors.TextSecondary,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  ignoredTitle: {
    color: Colors.TextSecondary,
  },
  ignoredBody: {
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.Primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  acceptBtnText: {
    color: Colors.White,
    fontWeight: '700',
    fontSize: 13,
  },
  ignoreBtn: {
    backgroundColor: Colors.Background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  ignoreBtnText: {
    color: Colors.TextSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  openChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  openChatBtnText: {
    color: Colors.Primary,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
    paddingHorizontal: 32,
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
    lineHeight: 20,
  },
});
