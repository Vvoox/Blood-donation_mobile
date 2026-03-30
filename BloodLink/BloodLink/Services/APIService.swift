import Foundation

protocol APIServiceAuthDelegate: AnyObject {
    var currentAccessToken: String? { get }
    func refreshAccessTokenIfNeeded() async -> String?
    func handleAuthenticationFailure()
}

class APIService {
    static let shared = APIService()
    private let baseURL = "http://85.31.233.69:8082"
    private let defaultPageSize = 10
    weak var authDelegate: APIServiceAuthDelegate?

    private struct ChatDetailResponse: Decodable {
        struct ChatInfo: Decodable {
            let id: String
        }

        let chat: ChatInfo
        let messages: [Message]
    }

    private struct RequestDetailResponse: Decodable {
        let request: BloodRequest
        let donorUpdates: [DonorRequestUpdate]

        enum CodingKeys: String, CodingKey {
            case request
            case donorUpdates = "donor_updates"
        }
    }

    private struct EmptyResponse: Decodable {}

    struct APIError: LocalizedError {
        let message: String
        var errorDescription: String? { message }
    }

    struct RegisterPayload {
        let firstName: String
        let lastName: String
        let email: String
        let password: String
        let city: String
        let bloodType: String
        let bloodTypeVisibility: String
        let country: String
        let phoneNumber: String
        let phoneVisibility: String
    }

    struct UpdateProfilePayload {
        let city: String
        let bloodType: String
        let bloodTypeVisibility: String
        let phoneNumber: String
        let phoneVisibility: String
    }

    struct AttachmentPayload {
        let type: String
        let data: String
        let mimeType: String
        let name: String
    }

    struct RequestFilters {
        var requesterName: String = ""
        var bloodType: String = ""
        var dateFrom: String?
        var dateTo: String?
    }

    private func validateResponse(data: Data, response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse else { return }
        guard (200...299).contains(http.statusCode) else {
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
            let message =
                (json?["error"] as? String)
                ?? (json?["details"] as? String)
                ?? HTTPURLResponse.localizedString(forStatusCode: http.statusCode)
            throw APIError(message: "HTTP \(http.statusCode): \(message)")
        }
    }

    private func authorizedToken(fallback token: String?) -> String? {
        authDelegate?.currentAccessToken ?? token
    }

    private func execute(_ request: URLRequest, allowRefresh: Bool = false) async throws -> (Data, URLResponse) {
        let (data, response) = try await URLSession.shared.data(for: request)

        if allowRefresh,
           let http = response as? HTTPURLResponse,
           http.statusCode == 401 {
            guard let refreshedToken = await authDelegate?.refreshAccessTokenIfNeeded() else {
                authDelegate?.handleAuthenticationFailure()
                throw APIError(message: "HTTP 401: Unauthorized")
            }

            var retriedRequest = request
            retriedRequest.setValue("Bearer \(refreshedToken)", forHTTPHeaderField: "Authorization")
            let retryResult = try await URLSession.shared.data(for: retriedRequest)

            if let retryHTTP = retryResult.1 as? HTTPURLResponse,
               retryHTTP.statusCode == 401 {
                authDelegate?.handleAuthenticationFailure()
            }

            return retryResult
        }

        return (data, response)
    }

    func fetchRequests(
        city: String? = nil,
        page: Int = 1,
        limit: Int? = nil,
        token: String? = nil,
        filters: RequestFilters? = nil
    ) async throws -> [BloodRequest] {
        let pageSize = limit ?? defaultPageSize
        var components: URLComponents
        if let city = city, !city.isEmpty {
            let encodedCity = city.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? city
            guard let url = URL(string: "\(baseURL)/requests/city/\(encodedCity)") else { throw URLError(.badURL) }
            components = URLComponents(url: url, resolvingAgainstBaseURL: false) ?? URLComponents()
        } else {
            guard let url = URL(string: "\(baseURL)/requests") else { throw URLError(.badURL) }
            components = URLComponents(url: url, resolvingAgainstBaseURL: false) ?? URLComponents()
        }

        var queryItems = [
            URLQueryItem(name: "page", value: String(page)),
            URLQueryItem(name: "limit", value: String(pageSize)),
        ]

        if let filters {
            let trimmedName = filters.requesterName.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmedName.isEmpty {
                queryItems.append(URLQueryItem(name: "requesterName", value: trimmedName))
            }
            if !filters.bloodType.isEmpty {
                queryItems.append(URLQueryItem(name: "bloodType", value: filters.bloodType))
            }
            if let dateFrom = filters.dateFrom, !dateFrom.isEmpty {
                queryItems.append(URLQueryItem(name: "dateFrom", value: dateFrom))
            }
            if let dateTo = filters.dateTo, !dateTo.isEmpty {
                queryItems.append(URLQueryItem(name: "dateTo", value: dateTo))
            }
        }

        components.queryItems = queryItems
        guard let url = components.url else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        if let token = authorizedToken(fallback: token) {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await execute(request, allowRefresh: request.value(forHTTPHeaderField: "Authorization") != nil)
        try validateResponse(data: data, response: response)
        return try JSONDecoder().decode([BloodRequest].self, from: data)
    }

    func createRequest(
        bloodTypes: [String],
        city: String,
        donorsNeeded: Int,
        deadline: String,
        notes: String,
        contactPhone: String,
        contactPhoneVisibility: String,
        token: String
    ) async throws -> BloodRequest {
        guard let url = URL(string: "\(baseURL)/requests") else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(authorizedToken(fallback: token) ?? token)", forHTTPHeaderField: "Authorization")

        let body: [String: Any] = [
            "bloodTypes": bloodTypes,
            "city": city,
            "country": "Morocco",
            "contactPhone": contactPhone,
            "contactPhoneVisibility": contactPhoneVisibility,
            "peopleNeeded": donorsNeeded,
            "deadline": deadline,
            "notes": notes
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await execute(request, allowRefresh: true)
        try validateResponse(data: data, response: response)
        return try JSONDecoder().decode(BloodRequest.self, from: data)
    }

    func acceptRequest(requestId: String, token: String) async throws {
        guard let url = URL(string: "\(baseURL)/requests/\(requestId)/accept") else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(authorizedToken(fallback: token) ?? token)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await execute(request, allowRefresh: true)
        try validateResponse(data: data, response: response)
    }

    func fetchRequestDetail(requestId: String, token: String? = nil) async throws -> (BloodRequest, [DonorRequestUpdate]) {
        guard let url = URL(string: "\(baseURL)/requests/\(requestId)") else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        if let token = authorizedToken(fallback: token) {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let (data, response) = try await execute(request, allowRefresh: request.value(forHTTPHeaderField: "Authorization") != nil)
        try validateResponse(data: data, response: response)
        let decoded = try JSONDecoder().decode(RequestDetailResponse.self, from: data)
        return (decoded.request, decoded.donorUpdates)
    }

    func sendDonorQuickAction(requestId: String, actionType: String, token: String) async throws -> DonorRequestUpdate {
        guard let url = URL(string: "\(baseURL)/requests/\(requestId)/donor-response") else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(authorizedToken(fallback: token) ?? token)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "actionType": actionType,
        ])

        let (data, response) = try await execute(request, allowRefresh: true)
        try validateResponse(data: data, response: response)
        return try JSONDecoder().decode(DonorRequestUpdate.self, from: data)
    }

    func fetchChats(token: String) async throws -> [Chat] {
        guard let url = URL(string: "\(baseURL)/chats") else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.setValue("Bearer \(authorizedToken(fallback: token) ?? token)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await execute(request, allowRefresh: true)
        try validateResponse(data: data, response: response)
        return try JSONDecoder().decode([Chat].self, from: data)
    }

    func fetchMessages(chatId: String, token: String) async throws -> [Message] {
        guard let url = URL(string: "\(baseURL)/chats/\(chatId)") else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.setValue("Bearer \(authorizedToken(fallback: token) ?? token)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await execute(request, allowRefresh: true)
        try validateResponse(data: data, response: response)
        return try JSONDecoder().decode(ChatDetailResponse.self, from: data).messages
    }

    func fetchNotifications(token: String) async throws -> [AppNotification] {
        guard let url = URL(string: "\(baseURL)/notifications") else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.setValue("Bearer \(authorizedToken(fallback: token) ?? token)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await execute(request, allowRefresh: true)
        try validateResponse(data: data, response: response)
        return try JSONDecoder().decode([AppNotification].self, from: data)
    }

    func fetchMyRequests(token: String) async throws -> [BloodRequest] {
        guard let url = URL(string: "\(baseURL)/requests/my") else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.setValue("Bearer \(authorizedToken(fallback: token) ?? token)", forHTTPHeaderField: "Authorization")
        let (data, response) = try await execute(request, allowRefresh: true)
        try validateResponse(data: data, response: response)
        return try JSONDecoder().decode([BloodRequest].self, from: data)
    }

    func fetchAcceptedRequests(token: String) async throws -> [BloodRequest] {
        guard let url = URL(string: "\(baseURL)/requests/accepted") else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.setValue("Bearer \(authorizedToken(fallback: token) ?? token)", forHTTPHeaderField: "Authorization")
        let (data, response) = try await execute(request, allowRefresh: true)
        try validateResponse(data: data, response: response)
        return try JSONDecoder().decode([BloodRequest].self, from: data)
    }

    func fetchRefusedRequests(token: String) async throws -> [BloodRequest] {
        guard let url = URL(string: "\(baseURL)/requests/refused") else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.setValue("Bearer \(authorizedToken(fallback: token) ?? token)", forHTTPHeaderField: "Authorization")
        let (data, response) = try await execute(request, allowRefresh: true)
        try validateResponse(data: data, response: response)
        return try JSONDecoder().decode([BloodRequest].self, from: data)
    }

    func sendMessage(chatId: String, content: String, token: String) async throws -> Message {
        guard let url = URL(string: "\(baseURL)/chats/\(chatId)/messages") else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(authorizedToken(fallback: token) ?? token)", forHTTPHeaderField: "Authorization")

        let body = ["text": content]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await execute(request, allowRefresh: true)
        try validateResponse(data: data, response: response)
        return try JSONDecoder().decode(Message.self, from: data)
    }

    func sendAttachment(chatId: String, text: String = "", attachment: AttachmentPayload, token: String) async throws -> Message {
        guard let url = URL(string: "\(baseURL)/chats/\(chatId)/messages") else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(authorizedToken(fallback: token) ?? token)", forHTTPHeaderField: "Authorization")

        let body: [String: Any] = [
            "text": text,
            "attachmentType": attachment.type,
            "attachmentData": attachment.data,
            "attachmentMimeType": attachment.mimeType,
            "attachmentName": attachment.name,
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await execute(request, allowRefresh: true)
        try validateResponse(data: data, response: response)
        return try JSONDecoder().decode(Message.self, from: data)
    }

    func changePassword(currentPassword: String, newPassword: String, token: String) async throws {
        guard let url = URL(string: "\(baseURL)/users/me/password") else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(authorizedToken(fallback: token) ?? token)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "currentPassword": currentPassword,
            "newPassword": newPassword,
        ])
        let (data, response) = try await execute(request, allowRefresh: true)
        try validateResponse(data: data, response: response)
    }

    func updateProfile(_ payload: UpdateProfilePayload, token: String) async throws -> User {
        guard let url = URL(string: "\(baseURL)/users/me/profile") else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(authorizedToken(fallback: token) ?? token)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "city": payload.city,
            "bloodType": payload.bloodType,
            "bloodTypeVisibility": payload.bloodTypeVisibility,
            "phoneNumber": payload.phoneNumber,
            "phoneVisibility": payload.phoneVisibility,
        ])

        let (data, response) = try await execute(request, allowRefresh: true)
        try validateResponse(data: data, response: response)
        return try JSONDecoder().decode(User.self, from: data)
    }

    func deleteAccount(token: String) async throws {
        guard let url = URL(string: "\(baseURL)/users/me") else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.setValue("Bearer \(authorizedToken(fallback: token) ?? token)", forHTTPHeaderField: "Authorization")
        let (data, response) = try await execute(request, allowRefresh: true)
        try validateResponse(data: data, response: response)
        _ = try? JSONDecoder().decode(EmptyResponse.self, from: data)
    }

    func registerUser(_ payload: RegisterPayload) async throws {
        guard let url = URL(string: "\(baseURL)/auth/register") else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "firstName": payload.firstName,
            "lastName": payload.lastName,
            "email": payload.email,
            "password": payload.password,
            "city": payload.city,
            "bloodType": payload.bloodType,
            "bloodTypeVisibility": payload.bloodTypeVisibility,
            "country": payload.country,
            "phoneNumber": payload.phoneNumber,
            "phoneVisibility": payload.phoneVisibility,
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        try validateResponse(data: data, response: response)
    }
}
