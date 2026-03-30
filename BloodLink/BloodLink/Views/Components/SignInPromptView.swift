import SwiftUI

struct SignInPromptView: View {
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var localization: LocalizationService
    @State private var showLogin = false

    let icon: String
    let message: String

    var body: some View {
        VStack(spacing: 18) {
            ZStack {
                Circle()
                    .fill(Color(red: 0.776, green: 0.157, blue: 0.157).opacity(0.12))
                    .frame(width: 88, height: 88)
                Image(systemName: icon)
                    .font(.system(size: 34, weight: .semibold))
                    .foregroundColor(Color(red: 0.776, green: 0.157, blue: 0.157))
            }

            VStack(spacing: 8) {
                Text(localization.text("prompt.sign_in_title"))
                    .font(.title3)
                    .fontWeight(.bold)

                Text(message)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }

            Button(localization.text("prompt.sign_in")) {
                showLogin = true
            }
            .fontWeight(.semibold)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(Color(red: 0.776, green: 0.157, blue: 0.157))
            .cornerRadius(14)
        }
        .padding(24)
        .background(Color(.systemBackground))
        .cornerRadius(20)
        .padding(24)
        .sheet(isPresented: $showLogin) {
            LoginView()
                .environmentObject(authService)
                .environmentObject(localization)
        }
        .onChange(of: authService.isLoggedIn) { isLoggedIn in
            if isLoggedIn { showLogin = false }
        }
    }
}
