import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authService: AuthService
    @State private var showCreateRequest = false

    var body: some View {
        if authService.isLoggedIn {
            loggedInView
        } else {
            LoginView()
        }
    }

    var loggedInView: some View {
        NavigationView {
            List {
                Section {
                    VStack(spacing: 12) {
                        ZStack {
                            Circle()
                                .fill(Color(red: 0.776, green: 0.157, blue: 0.157))
                                .frame(width: 80, height: 80)
                            Text(authService.currentUser?.name.prefix(1).uppercased() ?? "?")
                                .font(.largeTitle).bold().foregroundColor(.white)
                        }
                        Text(authService.currentUser?.name ?? "")
                            .font(.title2).bold()
                        Text(authService.currentUser?.email ?? "")
                            .font(.subheadline).foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                }

                Section("My Info") {
                    ProfileRow(
                        icon: "drop.fill",
                        label: "Blood Type",
                        value: authService.currentUser?.bloodType.isEmpty == false
                            ? authService.currentUser!.bloodType : "Not set"
                    )
                    ProfileRow(
                        icon: "location.fill",
                        label: "City",
                        value: authService.currentUser?.city.isEmpty == false
                            ? authService.currentUser!.city : "Not set"
                    )
                }

                Section {
                    Button {
                        showCreateRequest = true
                    } label: {
                        Label("Create Blood Request", systemImage: "plus.circle.fill")
                            .foregroundColor(Color(red: 0.776, green: 0.157, blue: 0.157))
                            .fontWeight(.semibold)
                    }
                }

                Section {
                    Button(role: .destructive) {
                        authService.logout()
                    } label: {
                        Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
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
