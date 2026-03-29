import Foundation

class APIService {
    static let shared = APIService()
    private let baseURL = "http://85.31.233.69:8082"

    private struct ChatDetailResponse: Decodable {
        let chat: Chat
        let messages: [Message]
    }

    func fetchRequests(city: String? = nil, token: String? = nil) async throws -> [BloodRequest] {
        let urlStr: String
        if let city = city, !city.isEmpty {
            let encodedCity = city.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? city
            urlStr = "\(baseURL)/requests/city/\(encodedCity)"
        } else {
            urlStr = "\(baseURL)/requests"
        }
        guard let url = URL(string: urlStr) else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        if let token = token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode([BloodRequest].self, from: data)
    }

    func createRequest(bloodTypes: [String], city: String, donorsNeeded: Int,
                       deadline: String, notes: String, token: String) async throws -> BloodRequest {
        guard let url = URL(string: "\(baseURL)/requests") else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let body: [String: Any] = [
            "bloodTypes": bloodTypes,
            "city": city,
            "peopleNeeded": donorsNeeded,
            "deadline": deadline,
            "notes": notes
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(BloodRequest.self, from: data)
    }

    func acceptRequest(requestId: String, token: String) async throws {
        guard let url = URL(string: "\(baseURL)/requests/\(requestId)/accept") else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        _ = try await URLSession.shared.data(for: request)
    }

    func fetchChats(token: String) async throws -> [Chat] {
        guard let url = URL(string: "\(baseURL)/chats") else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode([Chat].self, from: data)
    }

    func fetchMessages(chatId: String, token: String) async throws -> [Message] {
        guard let url = URL(string: "\(baseURL)/chats/\(chatId)") else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(ChatDetailResponse.self, from: data).messages
    }

    func fetchNotifications(token: String) async throws -> [AppNotification] {
        guard let url = URL(string: "\(baseURL)/notifications") else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode([AppNotification].self, from: data)
    }

    func sendMessage(chatId: String, content: String, token: String) async throws -> Message {
        guard let url = URL(string: "\(baseURL)/chats/\(chatId)/messages") else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let body = ["text": content]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(Message.self, from: data)
    }
}
