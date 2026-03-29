import Foundation

struct User: Codable, Identifiable {
    var id: String
    var email: String
    var name: String
    var city: String
    var bloodType: String

    enum CodingKeys: String, CodingKey {
        case id = "sub"
        case email
        case name
        case city
        case bloodType = "blood_type"
    }
}

struct BloodRequest: Codable, Identifiable {
    var id: String
    var requesterId: String
    var requesterName: String
    var bloodTypes: [String]
    var city: String
    var country: String?
    var donorsNeeded: Int
    var donorsAccepted: Int
    var deadline: String
    var notes: String?
    var status: String
    var createdAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case requesterId = "creator_id"
        case requesterName = "creator_name"
        case bloodTypes = "blood_types"
        case city
        case country
        case donorsNeeded = "people_needed"
        case donorsAccepted = "accepted_count"
        case deadline
        case notes
        case status
        case createdAt = "created_at"
    }
}

struct Chat: Codable, Identifiable {
    var id: String
    var requestId: String
    var donorId: String
    var donorName: String
    var requesterId: String
    var requesterName: String
    var bloodTypes: [String]
    var city: String
    var lastMessageText: String?
    var lastMessageAt: String?
    var unreadCount: Int
    var createdAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case requestId = "request_id"
        case donorId = "donor_id"
        case donorName = "donor_name"
        case requesterId = "requester_id"
        case requesterName = "requester_name"
        case bloodTypes = "blood_types"
        case city
        case lastMessageText = "last_message"
        case lastMessageAt = "last_message_at"
        case unreadCount = "unread_count"
        case createdAt = "created_at"
    }
}

struct Message: Codable, Identifiable {
    var id: String
    var chatId: String
    var senderId: String
    var senderName: String
    var content: String
    var createdAt: String
    var isRead: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case chatId = "chat_id"
        case senderId = "sender_id"
        case senderName = "sender_name"
        case content = "text"
        case createdAt = "created_at"
        case isRead = "read"
    }
}

struct AppNotification: Codable, Identifiable, Equatable {
    var id: String
    var type: NotificationType
    var message: String
    var isRead: Bool
    var createdAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case type
        case message
        case isRead = "is_read"
        case createdAt = "created_at"
    }
}

enum NotificationType: String, Codable {
    case newRequest = "new_request"
    case requestAccepted = "request_accepted"
    case message = "message"
}
