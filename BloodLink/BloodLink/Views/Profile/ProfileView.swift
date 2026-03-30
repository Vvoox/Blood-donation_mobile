import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var localization: LocalizationService
    @Environment(\.openURL) var openURL
    @State private var showCreateRequest = false
    @State private var selectedRequest: BloodRequest?
    @State private var selectedSection: String? = nil
    @State private var requestTab = "mine"
    @State private var myRequests: [BloodRequest] = []
    @State private var acceptedRequests: [BloodRequest] = []
    @State private var refusedRequests: [BloodRequest] = []
    @State private var isLoadingRequests = false
    @State private var currentPassword = ""
    @State private var newPassword = ""
    @State private var settingsMessage: String?
    @State private var settingsError: String?
    @State private var isSavingPassword = false
    @State private var isDeletingAccount = false
    @State private var showDeleteConfirmation = false

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
                        message: localization.text("profile.sign_in_message")
                    )
                }
                .navigationTitle(localization.text("profile.title"))
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
                            label: localization.text("profile.blood_type"),
                            value: authService.currentUser?.bloodType.isEmpty == false
                                ? authService.currentUser!.bloodType : localization.text("profile.not_set")
                        )
                        Divider()
                        ProfileRow(
                            icon: "location.fill",
                            label: localization.text("profile.city"),
                            value: authService.currentUser?.city.isEmpty == false
                                ? authService.currentUser!.city : localization.text("profile.not_set")
                        )
                        Divider()
                        HStack {
                            Image(systemName: "globe")
                                .foregroundColor(Color(red: 0.776, green: 0.157, blue: 0.157))
                                .frame(width: 24)
                            Text(localization.text("profile.language"))
                            Spacer()
                            Picker(localization.text("profile.language"), selection: $localization.language) {
                                ForEach(LocalizationService.Language.allCases) { language in
                                    Text(language.displayName).tag(language)
                                }
                            }
                            .pickerStyle(.menu)
                        }
                    }
                    .padding(18)
                    .background(Color(.systemBackground))
                    .cornerRadius(22)

                    Button {
                        showCreateRequest = true
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(localization.text("profile.need_blood_title"))
                                    .font(.headline)
                                    .foregroundColor(.white)
                                Text(localization.text("profile.need_blood_text"))
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

                    Button {
                        withAnimation {
                            selectedSection = selectedSection == "requests" ? nil : "requests"
                        }
                    } label: {
                        expandableRow(
                            title: localization.text("profile.section.requests"),
                            systemImage: "list.bullet.rectangle",
                            isExpanded: selectedSection == "requests"
                        )
                    }

                    if selectedSection == "requests" {
                        VStack(alignment: .leading, spacing: 14) {
                            Picker("", selection: $requestTab) {
                                Text(localization.text("profile.requests.mine")).tag("mine")
                                Text(localization.text("profile.requests.accepted")).tag("accepted")
                                Text(localization.text("profile.requests.refused")).tag("refused")
                            }
                            .pickerStyle(.segmented)

                            if isLoadingRequests {
                                ProgressView()
                                    .frame(maxWidth: .infinity, alignment: .center)
                                    .padding(.vertical, 12)
                            } else if activeRequests.isEmpty {
                                Text(localization.text("profile.empty_requests"))
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            } else {
                                VStack(spacing: 12) {
                                    ForEach(activeRequests) { request in
                                        Button {
                                            selectedRequest = request
                                        } label: {
                                            RequestCard(request: request)
                                        }
                                        .buttonStyle(.plain)
                                    }
                                }
                            }
                        }
                        .padding(18)
                        .background(Color(.systemBackground))
                        .cornerRadius(22)
                    }

                    Button {
                        withAnimation {
                            selectedSection = selectedSection == "settings" ? nil : "settings"
                        }
                    } label: {
                        expandableRow(
                            title: localization.text("profile.section.settings"),
                            systemImage: "gearshape.fill",
                            isExpanded: selectedSection == "settings"
                        )
                    }

                    if selectedSection == "settings" {
                        VStack(alignment: .leading, spacing: 14) {
                            VStack(spacing: 12) {
                                SecureField(localization.text("profile.password.current"), text: $currentPassword)
                                    .padding()
                                    .background(Color(.systemGray6))
                                    .cornerRadius(12)

                                SecureField(localization.text("profile.password.new"), text: $newPassword)
                                    .padding()
                                    .background(Color(.systemGray6))
                                    .cornerRadius(12)

                                Button {
                                    Task { await updatePassword() }
                                } label: {
                                    if isSavingPassword {
                                        ProgressView()
                                            .tint(.white)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 14)
                                    } else {
                                        Text(localization.text("profile.password.save"))
                                            .fontWeight(.bold)
                                            .foregroundColor(.white)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 14)
                                    }
                                }
                                .background(Color(red: 0.776, green: 0.157, blue: 0.157))
                                .cornerRadius(14)
                                .disabled(isSavingPassword || currentPassword.isEmpty || newPassword.isEmpty)
                            }

                            Divider()

                            VStack(alignment: .leading, spacing: 12) {
                                Text(localization.text("profile.delete.warning"))
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)

                                Button(role: .destructive) {
                                    showDeleteConfirmation = true
                                } label: {
                                    Text(localization.text("profile.delete.button"))
                                        .fontWeight(.bold)
                                        .frame(maxWidth: .infinity)
                                }
                                .disabled(isDeletingAccount)
                            }

                            if let settingsMessage {
                                Text(settingsMessage)
                                    .font(.caption)
                                    .foregroundColor(.green)
                            }

                            if let settingsError {
                                Text(settingsError)
                                    .font(.caption)
                                    .foregroundColor(.red)
                            }
                        }
                        .padding(18)
                        .background(Color(.systemBackground))
                        .cornerRadius(22)
                    }

                    Button {
                        if let url = URL(string: "mailto:support@bloodlink.com") {
                            openURL(url)
                        }
                    } label: {
                        expandableRow(
                            title: localization.text("profile.support"),
                            systemImage: "lifepreserver",
                            isExpanded: false,
                            showsChevron: false
                        )
                    }

                    Button(role: .destructive) {
                        authService.logout()
                    } label: {
                        Label(localization.text("profile.sign_out"), systemImage: "rectangle.portrait.and.arrow.right")
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(18)
                    .background(Color(.systemBackground))
                    .cornerRadius(22)
                }
                .padding(16)
            }
            .navigationTitle(localization.text("profile.title"))
            .sheet(isPresented: $showCreateRequest, onDismiss: {
                Task { await loadRequests() }
            }) {
                CreateRequestView()
                    .environmentObject(authService)
                    .environmentObject(localization)
            }
            .sheet(item: $selectedRequest) { request in
                RequestDetailView(request: request)
                    .environmentObject(authService)
                    .environmentObject(localization)
            }
            .task { await loadRequests() }
            .onChange(of: requestTab) { _ in
                settingsMessage = nil
                settingsError = nil
            }
            .confirmationDialog(
                localization.text("profile.delete.confirm"),
                isPresented: $showDeleteConfirmation,
                titleVisibility: .visible
            ) {
                Button(localization.text("profile.delete.button"), role: .destructive) {
                    Task { await deleteAccount() }
                }
            } message: {
                Text(localization.text("profile.delete.message"))
            }
        }
    }

    private var activeRequests: [BloodRequest] {
        switch requestTab {
        case "accepted":
            return acceptedRequests
        case "refused":
            return refusedRequests
        default:
            return myRequests
        }
    }

    private func loadRequests() async {
        guard let token = authService.accessToken else { return }
        isLoadingRequests = true
        do {
            async let mine = APIService.shared.fetchMyRequests(token: token)
            async let accepted = APIService.shared.fetchAcceptedRequests(token: token)
            async let refused = APIService.shared.fetchRefusedRequests(token: token)
            myRequests = try await mine
            acceptedRequests = try await accepted
            refusedRequests = try await refused
        } catch {
            myRequests = []
            acceptedRequests = []
            refusedRequests = []
        }
        isLoadingRequests = false
    }

    private func updatePassword() async {
        guard let token = authService.accessToken else { return }
        settingsMessage = nil
        settingsError = nil
        isSavingPassword = true
        do {
            try await APIService.shared.changePassword(
                currentPassword: currentPassword,
                newPassword: newPassword,
                token: token
            )
            currentPassword = ""
            newPassword = ""
            settingsMessage = localization.text("profile.password.success")
        } catch {
            settingsError = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
        isSavingPassword = false
    }

    private func deleteAccount() async {
        guard let token = authService.accessToken else { return }
        settingsMessage = nil
        settingsError = nil
        isDeletingAccount = true
        do {
            try await APIService.shared.deleteAccount(token: token)
            authService.logout()
        } catch {
            settingsError = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
        isDeletingAccount = false
    }

    private func expandableRow(title: String, systemImage: String, isExpanded: Bool, showsChevron: Bool = true) -> some View {
        HStack {
            Label(title, systemImage: systemImage)
                .foregroundColor(.primary)
            Spacer()
            if showsChevron {
                Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                    .foregroundColor(.secondary)
            }
        }
        .padding(18)
        .background(Color(.systemBackground))
        .cornerRadius(22)
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
