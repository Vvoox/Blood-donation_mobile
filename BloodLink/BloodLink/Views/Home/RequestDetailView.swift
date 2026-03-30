import SwiftUI

struct RequestDetailView: View {
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var localization: LocalizationService
    @Environment(\.dismiss) var dismiss

    let request: BloodRequest

    @State private var currentRequest: BloodRequest
    @State private var donorUpdates: [DonorRequestUpdate] = []
    @State private var availableChats: [Chat] = []
    @State private var selectedChat: Chat?
    @State private var isAccepting = false
    @State private var isLoadingDetail = false
    @State private var isSendingAction = false
    @State private var accepted = false
    @State private var selectedActionType: String?
    @State private var actionMessage: String?
    @State private var errorMessage: String?

    init(request: BloodRequest) {
        self.request = request
        _currentRequest = State(initialValue: request)
        _accepted = State(initialValue: request.acceptedByMe)
    }

    private struct QuickAction: Identifiable {
        let id: String
        let title: String
        let icon: String
        let color: Color
    }

    private let quickActions: [QuickAction] = [
        .init(id: "available_now", title: "I'm available now", icon: "checkmark.circle.fill", color: .green),
        .init(id: "on_my_way", title: "I'm on my way", icon: "car.fill", color: .blue),
        .init(id: "call_requester", title: "Call requester", icon: "phone.fill", color: .orange),
        .init(id: "view_location", title: "View location", icon: "location.fill", color: .purple),
        .init(id: "cancel_acceptance", title: "Cancel acceptance", icon: "xmark.circle.fill", color: .red),
    ]

    private var isOwnRequest: Bool {
        let currentUser = authService.currentUser
        let normalizedRequesterName = currentRequest.requesterName.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let normalizedUserName = currentUser?.name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() ?? ""
        let normalizedEmail = currentUser?.email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() ?? ""

        return currentRequest.requesterId == currentUser?.id
            || (!normalizedRequesterName.isEmpty && normalizedRequesterName == normalizedUserName)
            || (!normalizedRequesterName.isEmpty && normalizedRequesterName == normalizedEmail)
    }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    bloodTypeChips

                    VStack(alignment: .leading, spacing: 8) {
                        InfoRow(icon: "person.fill", label: localization.text("request_detail.requester"), value: currentRequest.requesterName)
                        InfoRow(icon: "location.fill", label: localization.text("request_detail.city"), value: currentRequest.city)
                        if currentRequest.contactPhoneVisibility == "public",
                           let contactPhone = currentRequest.contactPhone,
                           !contactPhone.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                            InfoRow(icon: "phone.fill", label: "Phone", value: contactPhone)
                        }
                        InfoRow(icon: "person.2.fill", label: localization.text("request_detail.donors_needed"), value: "\(currentRequest.donorsAccepted)/\(currentRequest.donorsNeeded)")
                        InfoRow(icon: "calendar", label: localization.text("request_detail.deadline"), value: String(currentRequest.deadline.prefix(10)))
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)

                    if let notes = currentRequest.notes, !notes.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(localization.text("request_detail.notes"))
                                .font(.headline)
                            Text(notes)
                                .foregroundColor(.secondary)
                        }
                    }

                    if isOwnRequest {
                        donorAnswersCard
                    }

                    if accepted || currentRequest.acceptedByMe {
                        acceptedStateView
                    } else if authService.isLoggedIn && isOwnRequest {
                        myRequestStateView
                    } else if authService.isLoggedIn {
                        acceptButton
                    } else {
                        SignInPromptView(
                            icon: "person.crop.circle.badge.exclamationmark",
                            message: localization.text("request_detail.sign_in_message")
                        )
                    }

                    if accepted || currentRequest.acceptedByMe {
                        donorActionsCard
                    }

                    if let actionMessage {
                        Text(actionMessage)
                            .foregroundColor(.green)
                            .font(.caption)
                    }

                    if let errorMessage {
                        Text(errorMessage)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
                .padding()
            }
            .overlay {
                if isLoadingDetail {
                    ProgressView()
                }
            }
            .navigationTitle(localization.text("request_detail.title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(localization.text("common.close")) { dismiss() }
                }
            }
        }
        .task {
            await loadDetail()
        }
        .sheet(item: $selectedChat) { chat in
            ChatView(chat: chat)
                .environmentObject(authService)
                .environmentObject(localization)
        }
    }

    private var bloodTypeChips: some View {
        HStack {
            if currentRequest.bloodTypes.isEmpty {
                Text(localization.text("request_detail.any_type"))
                    .font(.title3).bold()
                    .padding(.horizontal, 14).padding(.vertical, 8)
                    .background(Color(red: 0.776, green: 0.157, blue: 0.157))
                    .foregroundColor(.white)
                    .cornerRadius(8)
            } else {
                ForEach(currentRequest.bloodTypes, id: \.self) { bt in
                    Text(bt)
                        .font(.title3).bold()
                        .padding(.horizontal, 14).padding(.vertical, 8)
                        .background(Color(red: 0.776, green: 0.157, blue: 0.157))
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }
            }
        }
    }

    private var acceptedStateView: some View {
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
    }

    private var myRequestStateView: some View {
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
    }

    private var acceptButton: some View {
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
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }
            }
        }
        .disabled(isAccepting)
    }

    private var donorActionsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Quick donor actions")
                .font(.headline)

            ForEach(quickActions) { action in
                let isSelected = selectedActionType == action.id
                Button {
                    Task { await sendQuickAction(action.id) }
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: action.icon)
                            .foregroundColor(isSelected ? .white : action.color)
                            .frame(width: 24)
                        Text(action.title)
                            .foregroundColor(isSelected ? .white : .primary)
                            .fontWeight(.semibold)
                        Spacer()
                        if isSendingAction && isSelected {
                            ProgressView()
                                .tint(.white)
                        } else if isSelected {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.white)
                        }
                    }
                    .padding(14)
                    .background(isSelected ? action.color : Color(.systemGray6))
                    .cornerRadius(14)
                }
                .buttonStyle(.plain)
                .disabled(isSendingAction)
            }
        }
        .padding(18)
        .background(Color(.systemBackground))
        .cornerRadius(18)
    }

    private var donorAnswersCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("Donor answers")
                    .font(.headline)
                Spacer()
                Text("\(donorUpdates.count)")
                    .font(.caption)
                    .fontWeight(.bold)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color(red: 0.776, green: 0.157, blue: 0.157).opacity(0.12))
                    .foregroundColor(Color(red: 0.776, green: 0.157, blue: 0.157))
                    .cornerRadius(999)
            }

            if donorUpdates.isEmpty {
                Text("No donor answers yet.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            } else {
                VStack(spacing: 12) {
                    ForEach(donorUpdates) { update in
                        Button {
                            openChat(for: update)
                        } label: {
                            VStack(alignment: .leading, spacing: 6) {
                                HStack {
                                    Text(update.donorName)
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                    Spacer()
                                    Text(formatTime(update.createdAt))
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                Text(update.message)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                if update.chatId != nil {
                                    Label("Open chat", systemImage: "message.fill")
                                        .font(.caption)
                                        .foregroundColor(Color(red: 0.776, green: 0.157, blue: 0.157))
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(14)
                            .background(Color(.systemGray6))
                            .cornerRadius(14)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .padding(18)
        .background(Color(.systemBackground))
        .cornerRadius(18)
    }

    private func loadDetail() async {
        isLoadingDetail = true
        defer { isLoadingDetail = false }
        do {
            let token = authService.accessToken
            let (fetchedRequest, updates) = try await APIService.shared.fetchRequestDetail(requestId: currentRequest.id, token: token)
            currentRequest = fetchedRequest
            donorUpdates = updates
            accepted = fetchedRequest.acceptedByMe
            selectedActionType = updates.first(where: { $0.donorId == authService.currentUser?.id })?.actionType
            if let token {
                availableChats = (try? await APIService.shared.fetchChats(token: token)) ?? []
            }
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    private func acceptRequest() async {
        guard let token = authService.accessToken else { return }
        isAccepting = true
        errorMessage = nil
        do {
            try await APIService.shared.acceptRequest(requestId: currentRequest.id, token: token)
            accepted = true
            await loadDetail()
        } catch {
            errorMessage = localization.text("request_detail.error_accept")
        }
        isAccepting = false
    }

    private func sendQuickAction(_ actionType: String) async {
        guard let token = authService.accessToken else { return }
        isSendingAction = true
        errorMessage = nil
        actionMessage = nil
        do {
            let update = try await APIService.shared.sendDonorQuickAction(
                requestId: currentRequest.id,
                actionType: actionType,
                token: token
            )
            donorUpdates.removeAll { $0.donorId == update.donorId }
            donorUpdates.insert(update, at: 0)
            selectedActionType = update.actionType
            actionMessage = "Your donor status was updated."
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
        isSendingAction = false
    }

    private func formatTime(_ dateStr: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: dateStr) {
            let display = DateFormatter()
            display.dateFormat = "HH:mm"
            return display.string(from: date)
        }
        return String(dateStr.prefix(16))
    }

    private func openChat(for update: DonorRequestUpdate) {
        guard let chatId = update.chatId else { return }
        selectedChat = availableChats.first(where: { $0.id == chatId })
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
