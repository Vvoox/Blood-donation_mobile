import SwiftUI

struct ChatListView: View {
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var localization: LocalizationService
    @ObservedObject private var wsService = WebSocketService.shared
    @State private var chats: [Chat] = []
    @State private var isLoading = false
    @State private var selectedChat: Chat?
    private let refreshTimer = Timer.publish(every: 5, on: .main, in: .common).autoconnect()

    var body: some View {
        NavigationView {
            Group {
                if !authService.isLoggedIn {
                    SignInPromptView(
                        icon: "bubble.left.and.bubble.right",
                        message: localization.text("chats.sign_in_message")
                    )
                } else if isLoading {
                    ProgressView()
                } else if chats.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "bubble.left.and.bubble.right")
                            .font(.system(size: 48))
                            .foregroundColor(.gray)
                        Text(localization.text("chats.empty_title"))
                            .foregroundColor(.secondary)
                        Text(localization.text("chats.empty_text"))
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding()
                } else {
                    List(chats) { chat in
                        ChatRow(chat: chat, currentUserId: authService.currentUser?.id ?? "")
                            .listRowSeparator(.hidden)
                            .contentShape(Rectangle())
                            .onTapGesture { selectedChat = chat }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle(localization.text("chats.title"))
            .navigationBarTitleDisplayMode(.large)
            .sheet(item: $selectedChat) { chat in
                ChatView(chat: chat)
                    .environmentObject(authService)
                    .environmentObject(localization)
            }
        }
        .task {
            if authService.isLoggedIn { await loadChats(showLoader: true) }
        }
        .onChange(of: authService.isLoggedIn) { isLoggedIn in
            if isLoggedIn { Task { await loadChats(showLoader: true) } }
        }
        .onReceive(refreshTimer) { _ in
            guard authService.isLoggedIn else { return }
            Task { await loadChats(showLoader: false) }
        }
        .onChange(of: wsService.latestMessage) { _ in
            guard authService.isLoggedIn else { return }
            Task { await loadChats(showLoader: false) }
        }
    }

    func loadChats(showLoader: Bool) async {
        guard let token = authService.accessToken else { return }
        if showLoader {
            isLoading = true
        }
        do {
            chats = try await APIService.shared.fetchChats(token: token)
        } catch {
            if showLoader {
                chats = []
            }
        }
        if showLoader {
            isLoading = false
        }
    }
}

struct ChatRow: View {
    let chat: Chat
    let currentUserId: String
    @EnvironmentObject var localization: LocalizationService

    var body: some View {
        let otherUserName = chat.donorId == currentUserId ? chat.requesterName : chat.donorName

        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color(red: 0.776, green: 0.157, blue: 0.157))
                    .frame(width: 50, height: 50)
                Text(otherUserName.prefix(1).uppercased())
                    .font(.title3).bold()
                    .foregroundColor(.white)
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(otherUserName)
                        .font(.headline)
                    Spacer()
                    if let lastMessageAt = chat.lastMessageAt {
                        Text(formatDate(lastMessageAt))
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                HStack {
                    Text(chat.lastMessageText ?? localization.text("chats.no_messages"))
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                    Spacer()
                    if chat.unreadCount > 0 {
                        Text("\(chat.unreadCount)")
                            .font(.caption2).bold()
                            .foregroundColor(.white)
                            .padding(.horizontal, 6).padding(.vertical, 2)
                            .background(Color(red: 0.776, green: 0.157, blue: 0.157))
                            .clipShape(Capsule())
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }

    func formatDate(_ dateStr: String) -> String {
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = iso.date(from: dateStr) {
            let cal = Calendar.current
            if cal.isDateInToday(date) {
                let display = DateFormatter()
                display.dateFormat = "HH:mm"
                return display.string(from: date)
            } else {
                let display = DateFormatter()
                display.dateFormat = "MMM d"
                return display.string(from: date)
            }
        }
        return ""
    }
}
