import SwiftUI

struct RequestDetailView: View {
    @EnvironmentObject var authService: AuthService
    let request: BloodRequest
    @State private var isAccepting = false
    @State private var accepted = false
    @State private var errorMessage: String?
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    HStack {
                        ForEach(request.bloodTypes, id: \.self) { bt in
                            Text(bt)
                                .font(.title3).bold()
                                .padding(.horizontal, 14).padding(.vertical, 8)
                                .background(Color(red: 0.776, green: 0.157, blue: 0.157))
                                .foregroundColor(.white)
                                .cornerRadius(8)
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        InfoRow(icon: "person.fill", label: "Requester", value: request.requesterName)
                        InfoRow(icon: "location.fill", label: "City", value: request.city)
                        InfoRow(icon: "person.2.fill", label: "Donors needed", value: "\(request.donorsAccepted)/\(request.donorsNeeded)")
                        InfoRow(icon: "calendar", label: "Deadline", value: String(request.deadline.prefix(10)))
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)

                    if let notes = request.notes, !notes.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Notes").font(.headline)
                            Text(notes).foregroundColor(.secondary)
                        }
                    }

                    if let error = errorMessage {
                        Text(error).foregroundColor(.red).font(.caption)
                    }

                    if accepted {
                        Label("You accepted this request!", systemImage: "checkmark.circle.fill")
                            .foregroundColor(.green)
                            .font(.headline)
                    } else if authService.isLoggedIn && request.requesterId != authService.currentUser?.id {
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
                                    Text("Accept & Donate")
                                        .fontWeight(.bold).foregroundColor(.white)
                                }
                            }
                        }
                        .disabled(isAccepting)
                    }
                }
                .padding()
            }
            .navigationTitle("Request Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }

    func acceptRequest() async {
        guard let token = authService.accessToken else { return }
        isAccepting = true
        do {
            try await APIService.shared.acceptRequest(requestId: request.id, token: token)
            accepted = true
        } catch {
            errorMessage = "Failed to accept. Please try again."
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
