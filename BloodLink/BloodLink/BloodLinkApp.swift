import SwiftUI

@main
struct BloodLinkApp: App {
    @StateObject private var authService = AuthService()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(authService)
        }
    }
}

struct RootView: View {
    @EnvironmentObject var authService: AuthService

    var body: some View {
        if authService.isLoggedIn {
            MainTabView()
        } else {
            LoginView()
        }
    }
}
