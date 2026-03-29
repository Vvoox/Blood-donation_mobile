import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authService: AuthService

    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "drop.fill")
                }

            NotificationsView()
                .tabItem {
                    Label("Notifications", systemImage: "bell.fill")
                }

            ChatListView()
                .tabItem {
                    Label("Messages", systemImage: "message.fill")
                }

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
        }
        .accentColor(Color(red: 0.776, green: 0.157, blue: 0.157))
    }
}
