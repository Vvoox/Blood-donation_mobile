import SwiftUI

@main
struct BloodLinkApp: App {
    @StateObject private var authService = AuthService()

    var body: some Scene {
        WindowGroup {
            MainTabView()
                .environmentObject(authService)
                .preferredColorScheme(.light)
        }
    }
}
