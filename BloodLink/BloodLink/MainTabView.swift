import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authService: AuthService

    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }

            NotificationsView()
                .tabItem {
                    Label("Alerts", systemImage: "bell.badge.fill")
                }

            ChatListView()
                .tabItem {
                    Label("Chats", systemImage: "message.fill")
                }

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
        }
        .accentColor(Color(red: 0.776, green: 0.157, blue: 0.157))
    }
}
