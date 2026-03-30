import SwiftUI

@main
struct BloodLinkApp: App {
    @StateObject private var authService = AuthService()
    @StateObject private var localization = LocalizationService()
    @AppStorage("selected_color_scheme") private var selectedColorScheme = "system"

    var body: some Scene {
        WindowGroup {
            RootAppView()
                .environmentObject(authService)
                .environmentObject(localization)
                .environment(\.layoutDirection, localization.layoutDirection)
                .environment(\.locale, localization.locale)
                .preferredColorScheme(preferredColorScheme)
        }
    }

    private var preferredColorScheme: ColorScheme? {
        switch selectedColorScheme {
        case "light":
            return .light
        case "dark":
            return .dark
        default:
            return nil
        }
    }
}

private struct RootAppView: View {
    @State private var showLaunch = true

    var body: some View {
        ZStack {
            MainTabView()

            if showLaunch {
                LaunchView()
                    .transition(.opacity)
                    .zIndex(1)
            }
        }
        .task {
            try? await Task.sleep(nanoseconds: 1_500_000_000)
            withAnimation(.easeInOut(duration: 0.45)) {
                showLaunch = false
            }
        }
    }
}

private struct LaunchView: View {
    @State private var logoOpacity = 0.0
    @State private var logoScale = 0.86
    @State private var textOpacity = 0.0

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.995, green: 0.985, blue: 0.985),
                    Color(red: 0.99, green: 0.94, blue: 0.94)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 20) {
                ZStack {
                    Circle()
                        .stroke(Color(red: 0.776, green: 0.157, blue: 0.157).opacity(0.10), lineWidth: 8)
                        .frame(width: 180, height: 180)

                    Circle()
                        .fill(Color.white.opacity(0.92))
                        .frame(width: 150, height: 150)
                        .shadow(color: Color(red: 0.62, green: 0.09, blue: 0.10).opacity(0.08), radius: 20, x: 0, y: 10)

                    Image(systemName: "drop.fill")
                        .font(.system(size: 64, weight: .bold))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [
                                    Color(red: 0.776, green: 0.157, blue: 0.157),
                                    Color(red: 0.62, green: 0.09, blue: 0.10)
                                ],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                }
                .opacity(logoOpacity)
                .scaleEffect(logoScale)

                VStack(spacing: 8) {
                    Text("BloodLink")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(Color(red: 0.62, green: 0.09, blue: 0.10))

                    Text("Connect donors. Save lives.")
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(Color(red: 0.776, green: 0.157, blue: 0.157))
                }
                .opacity(textOpacity)
            }
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.75)) {
                logoOpacity = 1
                logoScale = 1
            }

            withAnimation(.easeOut(duration: 0.55).delay(0.28)) {
                textOpacity = 1
            }
        }
    }
}
