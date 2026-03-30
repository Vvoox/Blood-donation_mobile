import SwiftUI

struct RequestDetailView: View {
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var localization: LocalizationService
    let request: BloodRequest
    @State private var isAccepting = false
    @State private var accepted = false
    @State private var errorMessage: String?
    @Environment(\.dismiss) var dismiss

    private var isOwnRequest: Bool {
        let currentUser = authService.currentUser
        let normalizedRequesterName = request.requesterName.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let normalizedUserName = currentUser?.name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() ?? ""
        let normalizedEmail = currentUser?.email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() ?? ""

        return request.requesterId == currentUser?.id
            || (!normalizedRequesterName.isEmpty && normalizedRequesterName == normalizedUserName)
            || (!normalizedRequesterName.isEmpty && normalizedRequesterName == normalizedEmail)
    }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    HStack {
                        if request.bloodTypes.isEmpty {
                            Text(localization.text("request_detail.any_type"))
                                .font(.title3).bold()
                                .padding(.horizontal, 14).padding(.vertical, 8)
                                .background(Color(red: 0.776, green: 0.157, blue: 0.157))
                                .foregroundColor(.white)
                                .cornerRadius(8)
                        } else {
                            ForEach(request.bloodTypes, id: \.self) { bt in
                                Text(bt)
                                    .font(.title3).bold()
                                    .padding(.horizontal, 14).padding(.vertical, 8)
                                    .background(Color(red: 0.776, green: 0.157, blue: 0.157))
                                    .foregroundColor(.white)
                                    .cornerRadius(8)
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        InfoRow(icon: "person.fill", label: localization.text("request_detail.requester"), value: request.requesterName)
                        InfoRow(icon: "location.fill", label: localization.text("request_detail.city"), value: request.city)
                        InfoRow(icon: "person.2.fill", label: localization.text("request_detail.donors_needed"), value: "\(request.donorsAccepted)/\(request.donorsNeeded)")
                        InfoRow(icon: "calendar", label: localization.text("request_detail.deadline"), value: String(request.deadline.prefix(10)))
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)

                    if let notes = request.notes, !notes.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(localization.text("request_detail.notes")).font(.headline)
                            Text(notes).foregroundColor(.secondary)
                        }
                    }

                    if let error = errorMessage {
                        Text(error).foregroundColor(.red).font(.caption)
                    }

                    if accepted || request.acceptedByMe {
                        ZStack {
                            RoundedRectangle(cornerRadius: 14)
                                .fill(Color.green)
                                .frame(height: 52)
                            HStack(spacing: 8) {
                                Image(systemName: "checkmark.circle.fill")
                                Text(localization.text("request_detail.already_accepted"))
                                    .fontWeight(.bold)
                            }
                            .foregroundColor(.white)
                        }
                    } else if authService.isLoggedIn && isOwnRequest {
                        ZStack {
                            RoundedRectangle(cornerRadius: 14)
                                .fill(Color(.systemGray4))
                                .frame(height: 52)
                            HStack(spacing: 8) {
                                Image(systemName: "person.crop.circle.badge.checkmark")
                                Text(localization.text("request_detail.my_request"))
                                    .fontWeight(.bold)
                            }
                            .foregroundColor(.white)
                        }
                        .opacity(0.9)
                    } else if authService.isLoggedIn {
                        Button {
                            Task { await acceptRequest() }
                        } label: {
                            ZStack {
                                RoundedRectangle(cornerRadius: 14)
                                    .fill(Color(red: 0.776, green: 0.157, blue: 0.157))
                                    .frame(height: 52)
                                if isAccepting {
                                    ProgressView().tint(.white)
                                } else {
                                    Text(localization.text("request_detail.accept"))
                                        .fontWeight(.bold).foregroundColor(.white)
                                }
                            }
                        }
                        .disabled(isAccepting)
                    } else if !authService.isLoggedIn {
                        SignInPromptView(
                            icon: "person.crop.circle.badge.exclamationmark",
                            message: localization.text("request_detail.sign_in_message")
                        )
                    }
                }
                .padding()
            }
            .navigationTitle(localization.text("request_detail.title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(localization.text("common.close")) { dismiss() }
                }
            }
        }
        .onAppear {
            accepted = request.acceptedByMe
        }
    }

    func acceptRequest() async {
        guard let token = authService.accessToken else { return }
        isAccepting = true
        do {
            try await APIService.shared.acceptRequest(requestId: request.id, token: token)
            accepted = true
        } catch {
            errorMessage = localization.text("request_detail.error_accept")
        }
        isAccepting = false
    }
}

struct InfoRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(Color(red: 0.776, green: 0.157, blue: 0.157))
                .frame(width: 20)
            Text(label).foregroundColor(.secondary).font(.subheadline)
            Spacer()
            Text(value).font(.subheadline).fontWeight(.medium)
        }
    }
}
