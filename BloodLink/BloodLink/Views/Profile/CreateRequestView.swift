import SwiftUI

struct CreateRequestView: View {
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var localization: LocalizationService
    @Environment(\.dismiss) var dismiss

    @State private var selectedBloodTypes: Set<String> = []
    @State private var acceptAnyBloodType = false
    @State private var city = ""
    @State private var donorsNeeded = 1
    @State private var deadline = Date().addingTimeInterval(7 * 86400)
    @State private var notes = ""
    @State private var contactMode = "profile"
    @State private var customPhoneNumber = ""
    @State private var phoneVisibility = "private"
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    let bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    let cities = ["Casablanca", "Rabat", "Marrakech", "Fes", "Tangier", "Agadir"]

    var body: some View {
        NavigationView {
            Form {
                Section(localization.text("create_request.section_blood")) {
                    Toggle(localization.text("create_request.accept_any"), isOn: $acceptAnyBloodType)
                        .tint(Color(red: 0.776, green: 0.157, blue: 0.157))

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
                    .opacity(acceptAnyBloodType ? 0.4 : 1)
                    .disabled(acceptAnyBloodType)
                }

                Section(localization.text("create_request.section_location")) {
                    Picker(localization.text("create_request.city"), selection: $city) {
                        Text(localization.text("create_request.select_city")).tag("")
                        ForEach(cities, id: \.self) { Text($0).tag($0) }
                    }
                    Stepper(localization.text("create_request.donors_needed", donorsNeeded), value: $donorsNeeded, in: 1...10)
                    DatePicker(localization.text("create_request.deadline"), selection: $deadline, displayedComponents: .date)
                }

                Section(localization.text("create_request.section_notes")) {
                    TextEditor(text: $notes)
                        .frame(minHeight: 80)
                }

                Section("Contact number") {
                    if let profilePhone = authService.currentUser?.phoneNumber,
                       !profilePhone.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        Picker("Number to use", selection: $contactMode) {
                            Text("My number").tag("profile")
                            Text("Another number").tag("custom")
                        }
                        .pickerStyle(.segmented)

                        if contactMode == "profile" {
                            LabeledContent("Selected", value: profilePhone)
                        } else {
                            TextField("Another phone number", text: $customPhoneNumber)
                                .keyboardType(.phonePad)
                        }
                    } else {
                        TextField("Phone number", text: $customPhoneNumber)
                            .keyboardType(.phonePad)
                    }

                    Picker("Visibility", selection: $phoneVisibility) {
                        Text("Private").tag("private")
                        Text("Public").tag("public")
                    }
                    .pickerStyle(.segmented)
                }

                if let error = errorMessage {
                    Section {
                        Text(error).foregroundColor(.red).font(.caption)
                    }
                }
            }
            .navigationTitle(localization.text("create_request.title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(localization.text("common.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        Task { await submit() }
                    } label: {
                        if isSubmitting {
                            ProgressView()
                        } else {
                            Text(localization.text("common.post")).bold()
                        }
                    }
                    .disabled((selectedBloodTypes.isEmpty && !acceptAnyBloodType) || city.isEmpty || isSubmitting || resolvedContactPhone.isEmpty)
                }
            }
            .onAppear {
                if city.isEmpty {
                    city = authService.currentUser?.city ?? ""
                }
                if phoneVisibility.isEmpty {
                    phoneVisibility = authService.currentUser?.phoneVisibility ?? "private"
                } else {
                    phoneVisibility = authService.currentUser?.phoneVisibility ?? phoneVisibility
                }
            }
        }
    }

    func submit() async {
        guard let token = authService.accessToken else { return }
        errorMessage = nil
        if resolvedContactPhone.isEmpty {
            errorMessage = "Please choose a contact phone number."
            return
        }
        isSubmitting = true

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        let deadlineStr = formatter.string(from: deadline)

        do {
            let resolvedPhone = resolvedContactPhone
            _ = try await APIService.shared.createRequest(
                bloodTypes: acceptAnyBloodType ? [] : Array(selectedBloodTypes),
                city: city,
                donorsNeeded: donorsNeeded,
                deadline: deadlineStr,
                notes: notes,
                contactPhone: resolvedPhone,
                contactPhoneVisibility: phoneVisibility,
                token: token
            )
            dismiss()
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
        isSubmitting = false
    }

    private var resolvedContactPhone: String {
        if contactMode == "profile",
           let profilePhone = authService.currentUser?.phoneNumber,
           !profilePhone.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return profilePhone.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        return customPhoneNumber.trimmingCharacters(in: .whitespacesAndNewlines)
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
        .buttonStyle(.plain)
        .contentShape(Rectangle())
    }
}
