import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authService: AuthService
    @State private var email = ""
    @State private var password = ""
    @State private var showRegister = false

    var body: some View {
        ZStack {
            Color(red: 0.776, green: 0.157, blue: 0.157)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                VStack(spacing: 8) {
                    Image(systemName: "drop.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.white)
                    Text("BloodLink")
                        .font(.largeTitle).bold()
                        .foregroundColor(.white)
                    Text("Connect. Donate. Save Lives.")
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.8))
                }
                .padding(.bottom, 48)

                VStack(spacing: 16) {
                    TextField("Email", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .padding()
                        .background(Color.white)
                        .cornerRadius(12)

                    SecureField("Password", text: $password)
                        .padding()
                        .background(Color.white)
                        .cornerRadius(12)

                    if let error = authService.errorMessage {
                        Text(error)
                            .foregroundColor(.white)
                            .font(.caption)
                            .multilineTextAlignment(.center)
                    }

                    Button {
                        authService.login(email: email, password: password)
                    } label: {
                        ZStack {
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.white)
                            if authService.isLoading {
                                ProgressView().tint(Color(red: 0.776, green: 0.157, blue: 0.157))
                            } else {
                                Text("Sign In")
                                    .fontWeight(.bold)
                                    .foregroundColor(Color(red: 0.776, green: 0.157, blue: 0.157))
                            }
                        }
                        .frame(height: 52)
                    }
                    .disabled(authService.isLoading || email.isEmpty || password.isEmpty)

                    Button {
                        showRegister = true
                    } label: {
                        Text("Create a new account")
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.white.opacity(0.8), lineWidth: 1)
                            )
                    }
                }
                .padding(.horizontal, 32)

                Spacer()

                Text("BloodLink — Save lives together")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.6))
                    .padding(.bottom, 24)
            }
        }
        .sheet(isPresented: $showRegister) {
            RegisterView()
                .environmentObject(authService)
        }
    }
}
