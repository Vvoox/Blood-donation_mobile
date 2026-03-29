import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authService: AuthService
    @State private var showCreateRequest = false

    var body: some View {
        if authService.isLoggedIn {
            loggedInView
        } else {
            NavigationView {
                ZStack {
                    Color(.systemGroupedBackground)
                        .ignoresSafeArea()

                    SignInPromptView(
                        icon: "person.crop.circle.badge.plus",
                        message: "Sign in or register to create a blood request, receive city alerts, and chat with donors."
                    )
                }
                .navigationTitle("Profile")
            }
        }
    }

    var loggedInView: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 18) {
                    VStack(spacing: 14) {
                        ZStack {
                            Circle()
                                .fill(Color(red: 0.776, green: 0.157, blue: 0.157))
                                .frame(width: 86, height: 86)
                            Text(authService.currentUser?.name.prefix(1).uppercased() ?? "?")
                                .font(.largeTitle).bold().foregroundColor(.white)
                        }
                        Text(authService.currentUser?.name ?? "")
                            .font(.title2).bold()
                        Text(authService.currentUser?.email ?? "")
                            .font(.subheadline).foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(20)
                    .background(Color(.systemBackground))
                    .cornerRadius(22)

                    VStack(spacing: 12) {
                        ProfileRow(
                            icon: "drop.fill",
                            label: "Blood Type",
                            value: authService.currentUser?.bloodType.isEmpty == false
                                ? authService.currentUser!.bloodType : "Not set"
                        )
                        Divider()
                        ProfileRow(
                            icon: "location.fill",
                            label: "City",
                            value: authService.currentUser?.city.isEmpty == false
                                ? authService.currentUser!.city : "Not set"
                        )
                    }
                    .padding(18)
                    .background(Color(.systemBackground))
                    .cornerRadius(22)

                    Button {
                        showCreateRequest = true
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Need blood urgently?")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                Text("Create a request and notify nearby donors in your city.")
                                    .font(.subheadline)
                                    .foregroundColor(.white.opacity(0.86))
                                    .multilineTextAlignment(.leading)
                            }
                            Spacer()
                            Image(systemName: "plus.circle.fill")
                                .font(.system(size: 28))
                                .foregroundColor(.white)
                        }
                        .padding(18)
                        .background(
                            LinearGradient(
                                colors: [
                                    Color(red: 0.776, green: 0.157, blue: 0.157),
                                    Color(red: 0.651, green: 0.09, blue: 0.09)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .cornerRadius(22)
                    }

                    Button(role: .destructive) {
                        authService.logout()
                    } label: {
                        Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(18)
                    .background(Color(.systemBackground))
                    .cornerRadius(22)
                }
                .padding(16)
            }
            .navigationTitle("Profile")
            .sheet(isPresented: $showCreateRequest) {
                CreateRequestView()
                    .environmentObject(authService)
            }
        }
    }
}

struct ProfileRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(Color(red: 0.776, green: 0.157, blue: 0.157))
                .frame(width: 24)
            Text(label)
            Spacer()
            Text(value).foregroundColor(.secondary)
        }
    }
}
