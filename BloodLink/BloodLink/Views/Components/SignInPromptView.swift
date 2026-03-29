import SwiftUI

struct SignInPromptView: View {
    @EnvironmentObject var authService: AuthService
    @State private var showLogin = false

    let icon: String
    let message: String

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: icon)
                .font(.system(size: 56))
                .foregroundColor(.gray)
            Text(message)
                .font(.headline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            Button("Sign In") {
                showLogin = true
            }
            .fontWeight(.semibold)
            .foregroundColor(.white)
            .padding(.horizontal, 32)
            .padding(.vertical, 12)
            .background(Color(red: 0.776, green: 0.157, blue: 0.157))
            .cornerRadius(12)
        }
        .padding(32)
        .sheet(isPresented: $showLogin) {
            LoginView()
                .environmentObject(authService)
        }
        .onChange(of: authService.isLoggedIn) { isLoggedIn in
            if isLoggedIn { showLogin = false }
        }
    }
}
