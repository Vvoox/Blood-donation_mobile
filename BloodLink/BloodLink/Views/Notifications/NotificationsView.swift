import SwiftUI

struct NotificationsView: View {
    @EnvironmentObject var authService: AuthService
    @State private var notifications: [AppNotification] = []
    @State private var isLoading = false

    var body: some View {
        NavigationView {
            Group {
                if isLoading {
                    ProgressView()
                } else if notifications.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "bell.slash")
                            .font(.system(size: 48))
                            .foregroundColor(.gray)
                        Text("No notifications yet")
                            .foregroundColor(.secondary)
                    }
                } else {
                    List(notifications) { notification in
                        NotificationRow(notification: notification)
                            .listRowSeparator(.hidden)
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Notifications")
            .navigationBarTitleDisplayMode(.large)
        }
        .task { await loadNotifications() }
    }

    func loadNotifications() async {
        guard let token = authService.accessToken else { return }
        isLoading = true
        do {
            notifications = try await APIService.shared.fetchNotifications(token: token)
        } catch {
            notifications = []
        }
        isLoading = false
    }
}

struct NotificationRow: View {
    let notification: AppNotification

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                Circle()
                    .fill(notification.isRead ? Color(.systemGray5) : Color(red: 0.776, green: 0.157, blue: 0.157).opacity(0.15))
                    .frame(width: 44, height: 44)
                Image(systemName: iconName(for: notification.type))
                    .foregroundColor(notification.isRead ? .gray : Color(red: 0.776, green: 0.157, blue: 0.157))
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(notification.message)
                    .font(.subheadline)
                    .fontWeight(notification.isRead ? .regular : .semibold)
                Text(formatDate(notification.createdAt))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            if !notification.isRead {
                Circle()
                    .fill(Color(red: 0.776, green: 0.157, blue: 0.157))
                    .frame(width: 8, height: 8)
                    .padding(.top, 4)
            }
        }
        .padding(.vertical, 4)
    }

    func iconName(for type: NotificationType) -> String {
        switch type {
        case .requestAccepted: return "checkmark.circle.fill"
        case .newRequest: return "drop.fill"
        case .message: return "message.fill"
        }
    }

    func formatDate(_ dateStr: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: dateStr) {
            let display = RelativeDateTimeFormatter()
            display.unitsStyle = .abbreviated
            return display.localizedString(for: date, relativeTo: Date())
        }
        return String(dateStr.prefix(10))
    }
}
