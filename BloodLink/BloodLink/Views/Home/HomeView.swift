import SwiftUI

struct HomeView: View {
    @EnvironmentObject var authService: AuthService
    @State private var requests: [BloodRequest] = []
    @State private var selectedCity = ""
    @State private var isLoading = false
    @State private var selectedRequest: BloodRequest?
    @State private var showLoginSheet = false
    @State private var showCreateRequest = false

    let cities = ["All", "Casablanca", "Rabat", "Marrakech", "Fes", "Tangier", "Agadir"]

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                headerCard

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(cities, id: \.self) { city in
                            CityChip(
                                title: city,
                                isSelected: selectedCity == city || (city == "All" && selectedCity.isEmpty)
                            ) {
                                selectedCity = city == "All" ? "" : city
                                Task { await loadRequests() }
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.top, 12)
                    .padding(.bottom, 10)
                }
                .background(Color(.systemBackground))

                if isLoading {
                    Spacer()
                    ProgressView()
                    Spacer()
                } else if requests.isEmpty {
                    Spacer()
                    VStack(spacing: 12) {
                        Image(systemName: "drop.circle")
                            .font(.system(size: 48))
                            .foregroundColor(.gray)
                        Text("No active requests")
                            .font(.headline)
                        Text(selectedCity.isEmpty ? "Try another city or refresh the feed." : "There are no active requests in \(selectedCity) right now.")
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.horizontal, 32)
                    Spacer()
                } else {
                    List(requests) { request in
                        RequestCard(request: request)
                            .listRowInsets(EdgeInsets(top: 6, leading: 16, bottom: 6, trailing: 16))
                            .listRowSeparator(.hidden)
                            .onTapGesture {
                                if authService.isLoggedIn {
                                    selectedRequest = request
                                } else {
                                    showLoginSheet = true
                                }
                            }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Blood Requests")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button { Task { await loadRequests() } } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .sheet(item: $selectedRequest) { request in
                RequestDetailView(request: request)
                    .environmentObject(authService)
            }
            .sheet(isPresented: $showCreateRequest) {
                CreateRequestView()
                    .environmentObject(authService)
            }
            .sheet(isPresented: $showLoginSheet) {
                LoginView()
                    .environmentObject(authService)
            }
            .onChange(of: authService.isLoggedIn) { isLoggedIn in
                if isLoggedIn {
                    showLoginSheet = false
                    if let city = authService.currentUser?.city, !city.isEmpty {
                        selectedCity = city
                    }
                }
            }
            .onChange(of: authService.currentUser?.city ?? "") { city in
                guard !city.isEmpty else { return }
                selectedCity = city
                Task { await loadRequests() }
            }
        }
        .task {
            if let city = authService.currentUser?.city, !city.isEmpty {
                selectedCity = city
            }
            await loadRequests()
        }
    }

    func loadRequests() async {
        isLoading = true
        do {
            requests = try await APIService.shared.fetchRequests(
                city: selectedCity.isEmpty ? nil : selectedCity
            )
        } catch {
            requests = []
        }
        isLoading = false
    }

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(authService.isLoggedIn ? "Requests near you" : "Find blood requests fast")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)

                    Text(headerSubtitle)
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.88))
                        .fixedSize(horizontal: false, vertical: true)
                }

                Spacer()

                Image(systemName: "drop.circle.fill")
                    .font(.system(size: 34))
                    .foregroundColor(.white.opacity(0.95))
            }

            HStack(spacing: 10) {
                actionButton(
                    title: authService.isLoggedIn ? "Create Request" : "Sign In",
                    systemImage: authService.isLoggedIn ? "plus.circle.fill" : "person.crop.circle.fill"
                ) {
                    if authService.isLoggedIn {
                        showCreateRequest = true
                    } else {
                        showLoginSheet = true
                    }
                }

                Button {
                    Task { await loadRequests() }
                } label: {
                    Label("Refresh", systemImage: "arrow.clockwise")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)
                        .background(.white.opacity(0.16))
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
            }
        }
        .padding(20)
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
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .padding(.horizontal, 16)
        .padding(.top, 12)
        .padding(.bottom, 2)
    }

    private var headerSubtitle: String {
        if authService.isLoggedIn, let city = authService.currentUser?.city, !city.isEmpty {
            return "Showing active donation requests in \(city). You can create a request or accept one in a few taps."
        }

        if selectedCity.isEmpty {
            return "Browse urgent donation requests by city. Sign in before creating a request or responding to one."
        }

        return "Browse active donation requests in \(selectedCity). Sign in before creating a request or responding to one."
    }

    private func actionButton(title: String, systemImage: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label(title, systemImage: systemImage)
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundColor(Color(red: 0.651, green: 0.09, blue: 0.09))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(.white)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
    }
}

struct CityChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline).fontWeight(isSelected ? .semibold : .regular)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color(red: 0.776, green: 0.157, blue: 0.157) : Color(.systemGray6))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(20)
        }
    }
}

struct RequestCard: View {
    let request: BloodRequest

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                HStack(spacing: 4) {
                    if request.bloodTypes.isEmpty {
                        Text("Any Type")
                            .font(.caption).bold()
                            .padding(.horizontal, 8).padding(.vertical, 4)
                            .background(Color(red: 0.776, green: 0.157, blue: 0.157))
                            .foregroundColor(.white)
                            .cornerRadius(6)
                    } else {
                        ForEach(request.bloodTypes.prefix(3), id: \.self) { bt in
                            Text(bt)
                                .font(.caption).bold()
                                .padding(.horizontal, 8).padding(.vertical, 4)
                                .background(Color(red: 0.776, green: 0.157, blue: 0.157))
                                .foregroundColor(.white)
                                .cornerRadius(6)
                        }
                    }
                }
                Spacer()
                Label(request.city, systemImage: "location.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(request.requesterName)
                .font(.headline)

            if let notes = request.notes, !notes.isEmpty {
                Text(notes)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }

            HStack {
                Label("\(request.donorsAccepted)/\(request.donorsNeeded) donors", systemImage: "person.2.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Label("Deadline: \(formatDate(request.deadline))", systemImage: "calendar")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.06), radius: 6, x: 0, y: 2)
    }

    func formatDate(_ dateStr: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        if let date = formatter.date(from: String(dateStr.prefix(10))) {
            let display = DateFormatter()
            display.dateFormat = "MMM d"
            return display.string(from: date)
        }
        return String(dateStr.prefix(10))
    }
}
