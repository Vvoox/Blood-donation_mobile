import SwiftUI

@main
struct BloodLinkApp: App {
    @StateObject private var authService = AuthService()
    @StateObject private var localization = LocalizationService()

    var body: some Scene {
        WindowGroup {
            MainTabView()
                .environmentObject(authService)
                .environmentObject(localization)
                .environment(\.layoutDirection, localization.layoutDirection)
                .environment(\.locale, localization.locale)
                .preferredColorScheme(.light)
        }
    }
}
