import SwiftUI

struct ChatView: View {
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) var dismiss
    let chat: Chat

    @State private var messages: [Message] = []
    @State private var newMessage = ""
    @State private var isSending = false
    @State private var isLoading = false
    private let refreshTimer = Timer.publish(every: 2.5, on: .main, in: .common).autoconnect()

    var body: some View {
        let otherUserName = chat.donorId == authService.currentUser?.id ? chat.requesterName : chat.donorName

        NavigationView {
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 8) {
                            ForEach(messages) { message in
                                MessageBubble(
                                    message: message,
                                    isOwn: message.senderId == authService.currentUser?.id
                                )
                                .id(message.id)
                            }
                        }
                        .padding()
                    }
                    .onChange(of: messages.count) { _ in
                        if let last = messages.last {
                            withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                        }
                    }
                }

                Divider()

                HStack(spacing: 12) {
                    TextField("Message...", text: $newMessage, axis: .vertical)
                        .lineLimit(1...4)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color(.systemGray6))
                        .cornerRadius(20)

                    Button {
                        Task { await sendMessage() }
                    } label: {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.system(size: 32))
                            .foregroundColor(newMessage.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                                ? Color(.systemGray4)
                                : Color(red: 0.776, green: 0.157, blue: 0.157))
                    }
                    .disabled(newMessage.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isSending)
                }
                .padding(.horizontal)
                .padding(.vertical, 8)
                .background(Color(.systemBackground))
            }
            .navigationTitle(otherUserName)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") { dismiss() }
                }
            }
        }
        .task { await loadMessages(showLoader: true) }
        .onReceive(refreshTimer) { _ in
            guard authService.isLoggedIn else { return }
            Task { await loadMessages(showLoader: false) }
        }
    }

    func loadMessages(showLoader: Bool) async {
        guard let token = authService.accessToken else { return }
        if showLoader {
            isLoading = true
        }
        do {
            messages = try await APIService.shared.fetchMessages(chatId: chat.id, token: token)
        } catch {
            if showLoader {
                messages = []
            }
        }
        if showLoader {
            isLoading = false
        }
    }

    func sendMessage() async {
        let content = newMessage.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !content.isEmpty, let token = authService.accessToken else { return }
        isSending = true
        newMessage = ""
        do {
            let sent = try await APIService.shared.sendMessage(chatId: chat.id, content: content, token: token)
            messages.append(sent)
            await loadMessages(showLoader: false)
        } catch {
            newMessage = content
        }
        isSending = false
    }
}

struct MessageBubble: View {
    let message: Message
    let isOwn: Bool

    var body: some View {
        HStack {
            if isOwn { Spacer(minLength: 60) }

            VStack(alignment: isOwn ? .trailing : .leading, spacing: 2) {
                Text(message.content)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(isOwn
                        ? Color(red: 0.776, green: 0.157, blue: 0.157)
                        : Color(.systemGray5))
                    .foregroundColor(isOwn ? .white : .primary)
                    .cornerRadius(18)

                Text(formatTime(message.createdAt))
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 4)
            }

            if !isOwn { Spacer(minLength: 60) }
        }
    }

    func formatTime(_ dateStr: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: dateStr) {
            let display = DateFormatter()
            display.dateFormat = "HH:mm"
            return display.string(from: date)
        }
        return ""
    }
}
