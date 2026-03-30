import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var localization: LocalizationService

    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Label(localization.text("tab.home"), systemImage: "house.fill")
                }

            NotificationsView()
                .tabItem {
                    Label(localization.text("tab.alerts"), systemImage: "bell.badge.fill")
                }

            ChatListView()
                .tabItem {
                    Label(localization.text("tab.chats"), systemImage: "message.fill")
                }

            ProfileView()
                .tabItem {
                    Label(localization.text("tab.profile"), systemImage: "person.fill")
                }
        }
        .accentColor(Color(red: 0.776, green: 0.157, blue: 0.157))
    }
}
