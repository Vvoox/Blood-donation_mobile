import SwiftUI

struct CreateRequestView: View {
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) var dismiss

    @State private var selectedBloodTypes: Set<String> = []
    @State private var city = ""
    @State private var donorsNeeded = 1
    @State private var deadline = Date().addingTimeInterval(7 * 86400)
    @State private var notes = ""
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    let bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    let cities = ["Casablanca", "Rabat", "Marrakech", "Fes", "Tangier", "Agadir"]

    var body: some View {
        NavigationView {
            Form {
                Section("Blood Types Needed") {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 4), spacing: 10) {
                        ForEach(bloodTypes, id: \.self) { bt in
                            BloodTypeToggle(type: bt, isSelected: selectedBloodTypes.contains(bt)) {
                                if selectedBloodTypes.contains(bt) {
                                    selectedBloodTypes.remove(bt)
                                } else {
                                    selectedBloodTypes.insert(bt)
                                }
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }

                Section("Location & Details") {
                    Picker("City", selection: $city) {
                        Text("Select city").tag("")
                        ForEach(cities, id: \.self) { Text($0).tag($0) }
                    }
                    Stepper("Donors needed: \(donorsNeeded)", value: $donorsNeeded, in: 1...10)
                    DatePicker("Deadline", selection: $deadline, displayedComponents: .date)
                }

                Section("Additional Notes") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 80)
                }

                if let error = errorMessage {
                    Section {
                        Text(error).foregroundColor(.red).font(.caption)
                    }
                }
            }
            .navigationTitle("New Blood Request")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        Task { await submit() }
                    } label: {
                        if isSubmitting {
                            ProgressView()
                        } else {
                            Text("Post").bold()
                        }
                    }
                    .disabled(selectedBloodTypes.isEmpty || city.isEmpty || isSubmitting)
                }
            }
        }
    }

    func submit() async {
        guard let token = authService.accessToken else { return }
        isSubmitting = true

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        let deadlineStr = formatter.string(from: deadline)

        do {
            _ = try await APIService.shared.createRequest(
                bloodTypes: Array(selectedBloodTypes),
                city: city,
                donorsNeeded: donorsNeeded,
                deadline: deadlineStr,
                notes: notes,
                token: token
            )
            dismiss()
        } catch {
            errorMessage = "Failed to create request. Please try again."
        }
        isSubmitting = false
    }
}

struct BloodTypeToggle: View {
    let type: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(type)
                .font(.subheadline).bold()
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(isSelected ? Color(red: 0.776, green: 0.157, blue: 0.157) : Color(.systemGray5))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(8)
        }
    }
}
