import Foundation

struct User: Codable, Identifiable {
    var id: String
    var email: String
    var name: String
    var city: String
    var bloodType: String
    var bloodTypeVisibility: String
    var phoneNumber: String
    var phoneVisibility: String

    enum CodingKeys: String, CodingKey {
        case id = "sub"
        case email
        case name
        case city
        case bloodType = "blood_type"
        case bloodTypeVisibility = "blood_type_visibility"
        case phoneNumber = "phone_number"
        case phoneVisibility = "phone_visibility"
    }
}

struct BloodRequest: Codable, Identifiable {
    var id: String
    var requesterId: String
    var requesterName: String
    var bloodTypes: [String]
    var city: String
    var country: String?
    var contactPhone: String?
    var contactPhoneVisibility: String?
    var donorsNeeded: Int
    var donorsAccepted: Int
    var deadline: String
    var notes: String?
    var status: String
    var createdAt: String
    var acceptedByMe: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case requesterId = "creator_id"
        case requesterName = "creator_name"
        case bloodTypes = "blood_types"
        case city
        case country
        case contactPhone = "contact_phone"
        case contactPhoneVisibility = "contact_phone_visibility"
        case donorsNeeded = "people_needed"
        case donorsAccepted = "accepted_count"
        case deadline
        case notes
        case status
        case createdAt = "created_at"
        case acceptedByMe = "accepted_by_me"
    }
}

struct DonorRequestUpdate: Codable, Identifiable, Equatable {
    var id: String
    var requestId: String
    var donorId: String
    var donorName: String
    var chatId: String?
    var actionType: String
    var message: String
    var createdAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case requestId = "request_id"
        case donorId = "donor_id"
        case donorName = "donor_name"
        case chatId = "chat_id"
        case actionType = "action_type"
        case message
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

struct Message: Codable, Identifiable, Equatable {
    var id: String
    var chatId: String
    var senderId: String
    var senderName: String
    var content: String
    var createdAt: String
    var isRead: Bool
    var attachmentType: String?
    var attachmentData: String?
    var attachmentMimeType: String?
    var attachmentName: String?

    enum CodingKeys: String, CodingKey {
        case id
        case chatId = "chat_id"
        case senderId = "sender_id"
        case senderName = "sender_name"
        case content = "text"
        case createdAt = "created_at"
        case isRead = "read"
        case attachmentType = "attachment_type"
        case attachmentData = "attachment_data"
        case attachmentMimeType = "attachment_mime_type"
        case attachmentName = "attachment_name"
    }
}

struct AppNotification: Codable, Identifiable, Equatable {
    var id: String
    var type: NotificationType
    var message: String
    var isRead: Bool
    var createdAt: String
    var relatedRequestId: String?
    var relatedChatId: String?

    enum CodingKeys: String, CodingKey {
        case id
        case type
        case message
        case isRead = "is_read"
        case createdAt = "created_at"
        case relatedRequestId = "related_request_id"
        case relatedChatId = "related_chat_id"
    }
}

enum NotificationType: String, Codable {
    case newRequest = "new_request"
    case requestAccepted = "request_accepted"
    case requestUpdate = "request_update"
    case message = "message"
}
