import SwiftUI

struct ChatListView: View {
    @EnvironmentObject var authService: AuthService
    @State private var chats: [Chat] = []
    @State private var isLoading = false
    @State private var selectedChat: Chat?

    var body: some View {
        NavigationView {
            Group {
                if !authService.isLoggedIn {
                    SignInPromptView(
                        icon: "bubble.left.and.bubble.right",
                        message: "Sign in to view your messages"
                    )
                } else if isLoading {
                    ProgressView()
                } else if chats.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "bubble.left.and.bubble.right")
                            .font(.system(size: 48))
                            .foregroundColor(.gray)
                        Text("No conversations yet")
                            .foregroundColor(.secondary)
                        Text("Accept a blood request to start chatting")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding()
                } else {
                    List(chats) { chat in
                        ChatRow(chat: chat)
                            .listRowSeparator(.hidden)
                            .contentShape(Rectangle())
                            .onTapGesture { selectedChat = chat }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Messages")
            .navigationBarTitleDisplayMode(.large)
            .sheet(item: $selectedChat) { chat in
                ChatView(chat: chat)
                    .environmentObject(authService)
            }
        }
        .task {
            if authService.isLoggedIn { await loadChats() }
        }
        .onChange(of: authService.isLoggedIn) { isLoggedIn in
            if isLoggedIn { Task { await loadChats() } }
        }
    }

    func loadChats() async {
        guard let token = authService.accessToken else { return }
        isLoading = true
        do {
            chats = try await APIService.shared.fetchChats(token: token)
        } catch {
            chats = []
        }
        isLoading = false
    }
}

struct ChatRow: View {
    let chat: Chat

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color(red: 0.776, green: 0.157, blue: 0.157))
                    .frame(width: 50, height: 50)
                Text(chat.otherUserName.prefix(1).uppercased())
                    .font(.title3).bold()
                    .foregroundColor(.white)
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(chat.otherUserName)
                        .font(.headline)
                    Spacer()
                    if let lastMsg = chat.lastMessage {
                        Text(formatDate(lastMsg.createdAt))
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                HStack {
                    Text(chat.lastMessage?.content ?? "No messages yet")
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
