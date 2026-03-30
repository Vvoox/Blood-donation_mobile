import SwiftUI

struct HomeView: View {
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var localization: LocalizationService
    @State private var requests: [BloodRequest] = []
    @State private var selectedCity = ""
    @State private var isLoading = false
    @State private var isLoadingMore = false
    @State private var currentPage = 1
    @State private var hasMoreRequests = true
    @State private var selectedRequest: BloodRequest?
    @State private var showLoginSheet = false
    @State private var showCreateRequest = false
    @State private var showAllRequests = false
    private let pageSize = 10

    let cities = ["Casablanca", "Rabat", "Marrakech", "Fes", "Tangier", "Agadir"]

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                headerCard

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach([localization.text("home.all_cities")] + cities, id: \.self) { city in
                            CityChip(
                                title: city,
                                isSelected: selectedCity == city || (city == localization.text("home.all_cities") && selectedCity.isEmpty)
                            ) {
                                selectedCity = city == localization.text("home.all_cities") ? "" : city
                                Task { await loadRequests(reset: true) }
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
                        Text(localization.text("home.empty_title"))
                            .font(.headline)
                        Text(selectedCity.isEmpty
                            ? localization.text("home.empty_text_all")
                            : localization.text("home.empty_text_city", selectedCity))
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
                            .onAppear {
                                Task { await loadMoreIfNeeded(currentRequest: request) }
                            }
                            .onTapGesture {
                                if authService.isLoggedIn {
                                    selectedRequest = request
                                } else {
                                    showLoginSheet = true
                                }
                            }
                    }
                    .overlay(alignment: .bottom) {
                        if isLoadingMore {
                            ProgressView()
                                .padding(.vertical, 12)
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle(localization.text("home.title"))
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button { Task { await loadRequests(reset: true) } } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .sheet(item: $selectedRequest, onDismiss: {
                Task { await loadRequests(reset: true) }
            }) { request in
                RequestDetailView(request: request)
                    .environmentObject(authService)
                    .environmentObject(localization)
            }
            .sheet(isPresented: $showCreateRequest) {
                CreateRequestView()
                    .environmentObject(authService)
                    .environmentObject(localization)
            }
            .sheet(isPresented: $showAllRequests) {
                AllRequestsView()
                    .environmentObject(authService)
                    .environmentObject(localization)
            }
            .sheet(isPresented: $showLoginSheet) {
                LoginView()
                    .environmentObject(authService)
                    .environmentObject(localization)
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
                Task { await loadRequests(reset: true) }
            }
        }
        .task {
            if let city = authService.currentUser?.city, !city.isEmpty {
                selectedCity = city
            }
            await loadRequests(reset: true)
        }
    }

    func loadRequests(reset: Bool) async {
        if reset {
            isLoading = true
            currentPage = 1
            hasMoreRequests = true
        } else {
            guard !isLoadingMore, hasMoreRequests else { return }
            isLoadingMore = true
        }

        do {
            let fetched = try await APIService.shared.fetchRequests(
                city: selectedCity.isEmpty ? nil : selectedCity,
                page: currentPage,
                limit: pageSize,
                token: authService.accessToken
            )
            if reset {
                requests = fetched
            } else {
                requests.append(contentsOf: fetched.filter { candidate in
                    !requests.contains(where: { $0.id == candidate.id })
                })
            }
            hasMoreRequests = fetched.count == pageSize
            if hasMoreRequests {
                currentPage += 1
            }
        } catch {
            if reset {
                requests = []
            }
            hasMoreRequests = false
        }
        isLoading = false
        isLoadingMore = false
    }

    func loadMoreIfNeeded(currentRequest: BloodRequest) async {
        guard let last = requests.last, last.id == currentRequest.id else { return }
        await loadRequests(reset: false)
    }

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(authService.isLoggedIn ? localization.text("home.requests_near_you") : localization.text("home.find_fast"))
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
                    title: authService.isLoggedIn ? localization.text("home.create_request") : localization.text("prompt.sign_in"),
                    systemImage: authService.isLoggedIn ? "plus.circle.fill" : "person.crop.circle.fill"
                ) {
                    if authService.isLoggedIn {
                        showCreateRequest = true
                    } else {
                        showLoginSheet = true
                    }
                }

                Button {
                    Task { await loadRequests(reset: true) }
                } label: {
                    Label(localization.text("common.refresh"), systemImage: "arrow.clockwise")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)
                        .background(.white.opacity(0.16))
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
            }

            Button {
                showAllRequests = true
            } label: {
                HStack {
                    Text("Show All Requests")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    Spacer()
                    Image(systemName: "arrow.right.circle.fill")
                }
                .foregroundColor(.white)
                .padding(.top, 4)
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
            return localization.text("home.subtitle.logged_in", city)
        }

        if selectedCity.isEmpty {
            return localization.text("home.subtitle.all")
        }

        return localization.text("home.subtitle.city", selectedCity)
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
    @EnvironmentObject var localization: LocalizationService

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                HStack(spacing: 4) {
                    if request.bloodTypes.isEmpty {
                        Text(localization.text("home.any_type"))
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
                if request.acceptedByMe {
                    Text(localization.text("home.accepted_badge"))
                        .font(.caption2)
                        .fontWeight(.bold)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.green.opacity(0.16))
                        .foregroundColor(.green)
                        .cornerRadius(8)
                }
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
                Label(localization.text("home.donors_count", request.donorsAccepted, request.donorsNeeded), systemImage: "person.2.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Label(localization.text("home.deadline", formatDate(request.deadline)), systemImage: "calendar")
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
