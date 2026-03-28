import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as React from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
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
import { Chat, ChatMessage } from '../models/chat';
import { CHAT_ACTIONS } from '../redux/reducers/chat-reducer';
import { RootState } from '../redux/store';
import { getChatById, sendMessage, markMessagesRead } from '../services/chat-service';
import { ChatsStackParamList } from '../types';

type ChatRouteType = RouteProp<ChatsStackParamList, 'Chat'>;
type ChatNavProp = StackNavigationProp<ChatsStackParamList, 'Chat'>;

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ChatScreen() {
  const route = useRoute<ChatRouteType>();
  const navigation = useNavigation<ChatNavProp>();
  const dispatch = useDispatch();
  const { chatId } = route.params;

  const user = useSelector((state: RootState) => state.auth.user) as any;
  const { chats } = useSelector((state: RootState) => state.chats);

  const userId = user?.sub || user?.id || 'mock-current-user';
  const userName =
    `${user?.given_name || user?.firstName || ''} ${user?.family_name || user?.lastName || ''}`.trim() ||
    user?.name ||
    'Anonymous Donor';

  const [chat, setChat] = React.useState<Chat | null>(null);
  const [messageText, setMessageText] = React.useState('');
  const [showContactInfo, setShowContactInfo] = React.useState(false);
  const flatListRef = React.useRef<FlatList>(null);

  // Load from redux or service
  React.useEffect(() => {
    const found = chats.find((c) => c.id === chatId) || getChatById(chatId);
    if (found) {
      setChat(found);
      // Mark messages read
      markMessagesRead(chatId, userId);
      dispatch({ type: CHAT_ACTIONS.MARK_READ, payload: { chatId, userId } });
    }
  }, [chatId, chats, userId, dispatch]);

  const currentChat = React.useMemo(
    () => chats.find((c) => c.id === chatId) || chat,
    [chats, chatId, chat]
  );

  if (!currentChat) {
    return (
      <View style={styles.notFoundContainer}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.Primary} />
        <Ionicons name="alert-circle-outline" size={64} color={Colors.Error} />
        <Text style={styles.notFoundText}>Chat not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDonor = currentChat.donorId === userId;
  const otherName = isDonor ? currentChat.requesterName : currentChat.donorName;
  const otherBloodType = isDonor ? '' : currentChat.donorBloodType;

  const handleSend = () => {
    const trimmed = messageText.trim();
    if (!trimmed) return;

    const message = sendMessage(chatId, userId, userName, trimmed);
    dispatch({
      type: CHAT_ACTIONS.ADD_MESSAGE,
      payload: { chatId, message },
    });
    setMessageText('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isOwn = item.senderId === userId;
    const isSystem = item.senderId === 'system';

    // Show date divider
    const prevMessage = currentChat.messages[index - 1];
    const showDateDivider =
      !prevMessage ||
      formatDate(item.timestamp) !== formatDate(prevMessage.timestamp);

    if (isSystem) {
      return (
        <>
          {showDateDivider && (
            <View style={styles.dateDivider}>
              <Text style={styles.dateDividerText}>{formatDate(item.timestamp)}</Text>
            </View>
          )}
          <View style={styles.systemMessage}>
            <Text style={styles.systemMessageText}>{item.text}</Text>
          </View>
        </>
      );
    }

    return (
      <>
        {showDateDivider && (
          <View style={styles.dateDivider}>
            <Text style={styles.dateDividerText}>{formatDate(item.timestamp)}</Text>
          </View>
        )}
        <View style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}>
          <View
            style={[
              styles.messageBubble,
              isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
            ]}>
            <Text style={[styles.messageText, isOwn ? styles.messageTextOwn : styles.messageTextOther]}>
              {item.text}
            </Text>
            <Text style={[styles.messageTime, isOwn ? styles.messageTimeOwn : styles.messageTimeOther]}>
              {formatTime(item.timestamp)}
              {isOwn && (
                <Ionicons
                  name={item.read ? 'checkmark-done' : 'checkmark'}
                  size={12}
                  color={isOwn ? 'rgba(255,255,255,0.7)' : Colors.TextSecondary}
                />
              )}
            </Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.Primary} />

      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.White} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <View style={styles.headerAvatar}>
                <Text style={styles.headerAvatarText}>
                  {otherName
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </Text>
              </View>
              <View style={styles.headerNameSection}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {otherName}
                </Text>
                {otherBloodType ? (
                  <Text style={styles.headerSubtitle}>{otherBloodType} donor</Text>
                ) : (
                  <Text style={styles.headerSubtitle}>{currentChat.city}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setShowContactInfo((p) => !p)}
              style={styles.infoButton}>
              <Ionicons
                name={showContactInfo ? 'close' : 'information-circle-outline'}
                size={24}
                color={Colors.White}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Contact info panel */}
      {showContactInfo && (
        <View style={styles.contactPanel}>
          <Text style={styles.contactPanelTitle}>Contact Information</Text>
          <View style={styles.contactRow}>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Donor</Text>
              <Text style={styles.contactValue}>{currentChat.donorName}</Text>
              {currentChat.donorBloodType ? (
                <BloodTypeBadge bloodType={currentChat.donorBloodType} size="small" />
              ) : null}
            </View>
            <View style={styles.contactDivider} />
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Requester</Text>
              <Text style={styles.contactValue}>{currentChat.requesterName}</Text>
              <View style={styles.locationChip}>
                <Ionicons name="location-outline" size={12} color={Colors.TextSecondary} />
                <Text style={styles.locationChipText}>{currentChat.city}</Text>
              </View>
            </View>
          </View>
          {currentChat.bloodTypes.length > 0 && (
            <View style={styles.bloodTypesNeededRow}>
              <Text style={styles.contactLabel}>Blood Types Needed:</Text>
              <View style={styles.badgesRow}>
                {currentChat.bloodTypes.map((bt) => (
                  <BloodTypeBadge key={bt} bloodType={bt} size="small" />
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={currentChat.messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              placeholderTextColor={Colors.TextSecondary}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!messageText.trim()}
            activeOpacity={0.85}>
            <Ionicons name="send" size={20} color={Colors.White} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  flex: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.Primary,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    color: Colors.White,
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerNameSection: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.White,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  infoButton: {
    padding: 4,
  },
  contactPanel: {
    backgroundColor: Colors.White,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 10,
  },
  contactPanelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.TextSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  contactItem: {
    flex: 1,
    gap: 4,
  },
  contactLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.TextSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.TextPrimary,
  },
  contactDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    alignSelf: 'stretch',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationChipText: {
    fontSize: 12,
    color: Colors.TextSecondary,
  },
  bloodTypesNeededRow: {
    gap: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  dateDivider: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateDividerText: {
    fontSize: 12,
    color: Colors.TextSecondary,
    backgroundColor: Colors.Background,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessageText: {
    fontSize: 12,
    color: Colors.TextSecondary,
    textAlign: 'center',
    backgroundColor: '#EEEEEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontStyle: 'italic',
  },
  messageRow: {
    marginBottom: 6,
  },
  messageRowOwn: {
    alignItems: 'flex-end',
  },
  messageRowOther: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  messageBubbleOwn: {
    backgroundColor: Colors.Primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: Colors.White,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: Colors.White,
  },
  messageTextOther: {
    color: Colors.TextPrimary,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  messageTimeOwn: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  messageTimeOther: {
    color: Colors.TextSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.White,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.Background,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 120,
  },
  messageInput: {
    fontSize: 15,
    color: Colors.TextPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.Primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.Primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#BDBDBD',
    shadowOpacity: 0,
    elevation: 0,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.Background,
    gap: 12,
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
});
