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
    var donorsNeeded: Int
    var donorsAccepted: Int
    var deadline: String
    var notes: String?
    var status: String
    var createdAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case requesterId = "requester_id"
        case requesterName = "requester_name"
        case bloodTypes = "blood_types"
        case city
        case donorsNeeded = "donors_needed"
        case donorsAccepted = "donors_accepted"
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
    var requesterId: String
    var otherUserName: String
    var lastMessage: ChatPreview?
    var unreadCount: Int
    var updatedAt: String

    struct ChatPreview: Codable {
        var content: String
        var createdAt: String

        enum CodingKeys: String, CodingKey {
            case content
            case createdAt = "created_at"
        }
    }

    enum CodingKeys: String, CodingKey {
        case id
        case requestId = "request_id"
        case donorId = "donor_id"
        case requesterId = "requester_id"
        case otherUserName = "other_user_name"
        case lastMessage = "last_message"
        case unreadCount = "unread_count"
        case updatedAt = "updated_at"
    }
}

struct Message: Codable, Identifiable {
    var id: String
    var chatId: String
    var senderId: String
    var content: String
    var createdAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case chatId = "chat_id"
        case senderId = "sender_id"
        case content
        case createdAt = "created_at"
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
