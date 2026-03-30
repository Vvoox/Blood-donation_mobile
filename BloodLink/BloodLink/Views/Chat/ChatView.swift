import SwiftUI
import PhotosUI
import AVFoundation

struct ChatView: View {
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var localization: LocalizationService
    @Environment(\.dismiss) var dismiss
    @ObservedObject private var wsService = WebSocketService.shared
    let chat: Chat

    @State private var messages: [Message] = []
    @State private var newMessage = ""
    @State private var isSending = false
    @State private var isLoading = false
    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var pendingImageAttachment: APIService.AttachmentPayload?
    @StateObject private var audioRecorder = AudioRecorderViewModel()
    private let refreshTimer = Timer.publish(every: 2.5, on: .main, in: .common).autoconnect()

    var body: some View {
        let otherUserName = chat.donorId == authService.currentUser?.id ? chat.requesterName : chat.donorName

        NavigationView {
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 8) {
                            ForEach(messages) { message in
                                MessageBubble(
                                    message: message,
                                    isOwn: message.senderId == authService.currentUser?.id
                                )
                                .id(message.id)
                            }
                        }
                        .padding()
                    }
                    .overlay {
                        if isLoading && messages.isEmpty {
                            ProgressView()
                        }
                    }
                    .onChange(of: messages.count) { _ in
                        if let last = messages.last {
                            withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                        }
                    }
                }

                Divider()

                VStack(spacing: 8) {
                    if let pendingImageAttachment,
                       let image = UIImage.fromDataURL(pendingImageAttachment.data) {
                        HStack {
                            Image(uiImage: image)
                                .resizable()
                                .scaledToFill()
                                .frame(width: 84, height: 84)
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                                .overlay(alignment: .topTrailing) {
                                    Button {
                                        self.pendingImageAttachment = nil
                                        self.selectedPhotoItem = nil
                                    } label: {
                                        Image(systemName: "xmark.circle.fill")
                                            .foregroundColor(.white)
                                            .background(Color.black.opacity(0.45))
                                            .clipShape(Circle())
                                    }
                                    .offset(x: 8, y: -8)
                                }
                            Spacer()
                        }
                    }

                    if let pendingAudio = audioRecorder.pendingAttachment {
                        HStack {
                            Label(pendingAudio.name, systemImage: "waveform")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Spacer()
                            Button {
                                audioRecorder.clearPendingAttachment()
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.secondary)
                            }
                        }
                    }

                    HStack(spacing: 12) {
                        PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                            Image(systemName: "photo.circle.fill")
                                .font(.system(size: 30))
                                .foregroundColor(Color(red: 0.776, green: 0.157, blue: 0.157))
                        }

                        Button {
                            toggleRecording()
                        } label: {
                            Image(systemName: audioRecorder.isRecording ? "stop.circle.fill" : "mic.circle.fill")
                                .font(.system(size: 30))
                                .foregroundColor(audioRecorder.isRecording ? .red : Color(red: 0.776, green: 0.157, blue: 0.157))
                        }

                        TextField(localization.text("chat.placeholder"), text: $newMessage, axis: .vertical)
                            .lineLimit(1...4)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color(.systemGray6))
                            .cornerRadius(20)

                        Button {
                            Task { await sendCurrentPayload() }
                        } label: {
                            Image(systemName: "arrow.up.circle.fill")
                                .font(.system(size: 32))
                                .foregroundColor(canSend
                                    ? Color(red: 0.776, green: 0.157, blue: 0.157)
                                    : Color(.systemGray4))
                        }
                        .disabled(!canSend || isSending)
                    }

                    if audioRecorder.isRecording {
                        HStack {
                            Label(audioRecorder.recordingLabel, systemImage: "waveform")
                                .font(.caption)
                                .foregroundColor(.red)
                            Spacer()
                        }
                    }
                }
                .padding(.horizontal)
                .padding(.vertical, 8)
                .background(Color(.systemBackground))
            }
            .navigationTitle(otherUserName)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(localization.text("common.close")) { dismiss() }
                }
            }
        }
        .task { await loadMessages(showLoader: true) }
        .onReceive(refreshTimer) { _ in
            guard authService.isLoggedIn else { return }
            Task { await loadMessages(showLoader: false) }
        }
        .onChange(of: wsService.latestMessage) { message in
            guard let message, message.chatId == chat.id else { return }
            if !messages.contains(where: { $0.id == message.id }) {
                messages.append(message)
            }
        }
        .onChange(of: selectedPhotoItem) { item in
            guard let item else { return }
            Task { await loadSelectedPhoto(item) }
        }
    }

    private var canSend: Bool {
        !newMessage.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            || pendingImageAttachment != nil
            || audioRecorder.pendingAttachment != nil
    }

    func loadMessages(showLoader: Bool) async {
        guard let token = authService.accessToken else { return }
        if showLoader {
            isLoading = true
        }
        do {
            messages = try await APIService.shared.fetchMessages(chatId: chat.id, token: token)
        } catch {
            if showLoader {
                messages = []
            }
        }
        if showLoader {
            isLoading = false
        }
    }

    func sendCurrentPayload() async {
        let content = newMessage.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let token = authService.accessToken else { return }
        isSending = true
        newMessage = ""
        do {
            let sent: Message
            if let attachment = pendingImageAttachment ?? audioRecorder.pendingAttachment {
                sent = try await APIService.shared.sendAttachment(
                    chatId: chat.id,
                    text: content,
                    attachment: attachment,
                    token: token
                )
            } else {
                sent = try await APIService.shared.sendMessage(chatId: chat.id, content: content, token: token)
            }
            messages.append(sent)
            pendingImageAttachment = nil
            selectedPhotoItem = nil
            audioRecorder.clearPendingAttachment()
            await loadMessages(showLoader: false)
        } catch {
            newMessage = content
        }
        isSending = false
    }

    func loadSelectedPhoto(_ item: PhotosPickerItem) async {
        do {
            guard let data = try await item.loadTransferable(type: Data.self) else { return }
            pendingImageAttachment = .init(
                type: "image",
                data: "data:image/jpeg;base64,\(data.base64EncodedString())",
                mimeType: "image/jpeg",
                name: "photo.jpg"
            )
        } catch {
            pendingImageAttachment = nil
        }
    }

    func toggleRecording() {
        if audioRecorder.isRecording {
            audioRecorder.stopRecording()
        } else {
            audioRecorder.startRecording()
        }
    }
}

struct MessageBubble: View {
    let message: Message
    let isOwn: Bool

    var body: some View {
        HStack {
            if isOwn { Spacer(minLength: 60) }

            VStack(alignment: isOwn ? .trailing : .leading, spacing: 2) {
                VStack(alignment: isOwn ? .trailing : .leading, spacing: 8) {
                    if message.attachmentType == "image",
                       let dataURL = message.attachmentData,
                       let image = UIImage.fromDataURL(dataURL) {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFit()
                            .frame(maxWidth: 220)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                    }

                    if message.attachmentType == "audio",
                       let dataURL = message.attachmentData {
                        AudioMessageView(
                            dataURL: dataURL,
                            fileName: message.attachmentName ?? "audio.m4a",
                            isOwn: isOwn
                        )
                    }

                    if !message.content.isEmpty && message.content != "[image]" && message.content != "[audio]" {
                        Text(message.content)
                    }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(isOwn
                    ? Color(red: 0.776, green: 0.157, blue: 0.157)
                    : Color(.systemGray5))
                .foregroundColor(isOwn ? .white : .primary)
                .cornerRadius(18)

                Text(formatTime(message.createdAt))
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 4)
            }

            if !isOwn { Spacer(minLength: 60) }
        }
    }

    func formatTime(_ dateStr: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: dateStr) {
            let display = DateFormatter()
            display.dateFormat = "HH:mm"
            return display.string(from: date)
        }
        return ""
    }
}

struct AudioMessageView: View {
    let dataURL: String
    let fileName: String
    let isOwn: Bool
    @StateObject private var player = AudioMessagePlayer()

    var body: some View {
        Button {
            player.togglePlayback(dataURL: dataURL)
        } label: {
            HStack(spacing: 8) {
                Image(systemName: player.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                Text(fileName)
                    .lineLimit(1)
            }
            .foregroundColor(isOwn ? .white : .primary)
        }
    }
}

final class AudioMessagePlayer: ObservableObject {
    @Published var isPlaying = false
    private var player: AVAudioPlayer?

    func togglePlayback(dataURL: String) {
        if isPlaying {
            player?.stop()
            isPlaying = false
            return
        }

        guard let data = Data.fromDataURL(dataURL) else { return }
        do {
            player = try AVAudioPlayer(data: data)
            player?.prepareToPlay()
            player?.play()
            isPlaying = true
        } catch {
            isPlaying = false
        }
    }
}

final class AudioRecorderViewModel: NSObject, ObservableObject, AVAudioRecorderDelegate {
    @Published var isRecording = false
    @Published var recordingLabel = "Recording..."
    @Published var pendingAttachment: APIService.AttachmentPayload?

    private var recorder: AVAudioRecorder?
    private var timer: Timer?
    private var startedAt: Date?

    func startRecording() {
        AVAudioSession.sharedInstance().requestRecordPermission { [weak self] granted in
            guard let self, granted else { return }
            DispatchQueue.main.async {
                do {
                    let session = AVAudioSession.sharedInstance()
                    try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
                    try session.setActive(true)

                    let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".m4a")
                    let settings: [String: Any] = [
                        AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
                        AVSampleRateKey: 12000,
                        AVNumberOfChannelsKey: 1,
                        AVEncoderAudioQualityKey: AVAudioQuality.medium.rawValue
                    ]

                    self.recorder = try AVAudioRecorder(url: url, settings: settings)
                    self.recorder?.delegate = self
                    self.recorder?.record()
                    self.startedAt = Date()
                    self.isRecording = true
                    self.startTimer()
                } catch {
                    self.isRecording = false
                }
            }
        }
    }

    func stopRecording() {
        recorder?.stop()
        timer?.invalidate()
        timer = nil
        isRecording = false
        guard let url = recorder?.url,
              let data = try? Data(contentsOf: url) else { return }
        pendingAttachment = .init(
            type: "audio",
            data: "data:audio/m4a;base64,\(data.base64EncodedString())",
            mimeType: "audio/m4a",
            name: url.lastPathComponent
        )
        recordingLabel = "Voice note ready"
    }

    func clearPendingAttachment() {
        pendingAttachment = nil
        recordingLabel = "Recording..."
    }

    private func startTimer() {
        recordingLabel = "Recording..."
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            guard let self, let startedAt else { return }
            let elapsed = Int(Date().timeIntervalSince(startedAt))
            self.recordingLabel = String(format: "Recording %02d:%02d", elapsed / 60, elapsed % 60)
        }
    }
}

private extension Data {
    static func fromDataURL(_ dataURL: String) -> Data? {
        guard let commaIndex = dataURL.firstIndex(of: ",") else { return Data(base64Encoded: dataURL) }
        let base64 = String(dataURL[dataURL.index(after: commaIndex)...])
        return Data(base64Encoded: base64)
    }
}

private extension UIImage {
    static func fromDataURL(_ dataURL: String) -> UIImage? {
        guard let data = Data.fromDataURL(dataURL) else { return nil }
        return UIImage(data: data)
    }
}
