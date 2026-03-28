import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
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

import BloodTypeBadge from '../components/BloodTypeBadge';
import { Colors } from '../constants/Colors';
import { Chat } from '../models/chat';
import { CHAT_ACTIONS } from '../redux/reducers/chat-reducer';
import { RootState } from '../redux/store';
import { getChatsForUser } from '../services/chat-service';
import { ChatsStackParamList } from '../types';

type ChatListNavProp = StackNavigationProp<ChatsStackParamList, 'ChatList'>;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface ChatRowProps {
  chat: Chat;
  userId: string;
  onPress: () => void;
}

function ChatRow({ chat, userId, onPress }: ChatRowProps) {
  const otherName = chat.donorId === userId ? chat.requesterName : chat.donorName;
  const otherBloodType = chat.donorId === userId ? '' : chat.donorBloodType;

  const lastMessage = chat.messages[chat.messages.length - 1];
  const lastMessageText = lastMessage
    ? lastMessage.senderId === 'system'
      ? 'Chat started'
      : lastMessage.text
    : 'No messages yet';
  const lastMessageTime = lastMessage ? timeAgo(lastMessage.timestamp) : '';

  const unreadCount = chat.messages.filter(
    (m) => m.senderId !== userId && !m.read
  ).length;

  return (
    <TouchableOpacity style={styles.chatRow} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(otherName)}</Text>
        </View>
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.chatTopRow}>
          <Text style={styles.otherName} numberOfLines={1}>
            {otherName}
          </Text>
          <Text style={styles.timeText}>{lastMessageTime}</Text>
        </View>
        <View style={styles.chatBottomRow}>
          <View style={styles.lastMessageRow}>
            {otherBloodType ? (
              <BloodTypeBadge bloodType={otherBloodType} size="small" />
            ) : null}
            <Text style={styles.lastMessageText} numberOfLines={1}>
              {lastMessageText}
            </Text>
          </View>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.chatMeta}>
          <Ionicons name="location-outline" size={12} color={Colors.TextSecondary} />
          <Text style={styles.chatMetaText}>{chat.city}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ChatListScreen() {
  const navigation = useNavigation<ChatListNavProp>();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user) as any;
  const { chats } = useSelector((state: RootState) => state.chats);

  const userId = user?.sub || user?.id || 'mock-current-user';

  React.useEffect(() => {
    const userChats = getChatsForUser(userId);
    dispatch({ type: CHAT_ACTIONS.SET_ALL, payload: userChats });
  }, [dispatch, userId]);

  const userChats = React.useMemo(
    () => chats.filter((c) => c.donorId === userId || c.requesterId === userId),
    [chats, userId]
  );

  const totalUnread = React.useMemo(
    () =>
      userChats.reduce(
        (sum, c) =>
          sum + c.messages.filter((m) => m.senderId !== userId && !m.read).length,
        0
      ),
    [userChats, userId]
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={72} color={Colors.TextSecondary} />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Accept a blood donation request to start a conversation.
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => (navigation as any).navigate('Home')}
        activeOpacity={0.85}>
        <Ionicons name="search" size={18} color={Colors.White} />
        <Text style={styles.browseButtonText}>Browse Requests</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.Primary} />
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <Ionicons name="chatbubbles" size={24} color={Colors.White} />
            <Text style={styles.headerTitle}>Messages</Text>
            {totalUnread > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{totalUnread} unread</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>

      <FlatList
        data={userChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatRow
            chat={item}
            userId={userId}
            onPress={() => navigation.navigate('Chat', { chatId: item.id })}
          />
        )}
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
    paddingVertical: 8,
    paddingBottom: 24,
    flexGrow: 1,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.White,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.Primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.White,
    fontWeight: 'bold',
    fontSize: 18,
  },
  chatInfo: {
    flex: 1,
    gap: 3,
  },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otherName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.TextPrimary,
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: Colors.TextSecondary,
    marginLeft: 8,
  },
  chatBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  lastMessageText: {
    fontSize: 13,
    color: Colors.TextSecondary,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: Colors.Primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: Colors.White,
    fontSize: 11,
    fontWeight: 'bold',
  },
  chatMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  chatMetaText: {
    fontSize: 11,
    color: Colors.TextSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
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
    lineHeight: 20,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.Primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  browseButtonText: {
    color: Colors.White,
    fontWeight: '700',
    fontSize: 15,
  },
});
