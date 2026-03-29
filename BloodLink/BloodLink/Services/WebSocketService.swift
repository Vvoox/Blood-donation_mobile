import Foundation

class WebSocketService: ObservableObject {
    static let shared = WebSocketService()

    @Published var newNotification: AppNotification?

    private var webSocketTask: URLSessionWebSocketTask?
    private var pingTimer: Timer?
    private let baseWS = "ws://85.31.233.69:8082"

    func connect(token: String) {
        disconnect()
        guard let url = URL(string: "\(baseWS)/ws") else { return }

        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        webSocketTask = URLSession.shared.webSocketTask(with: request)
        webSocketTask?.resume()

        schedulePing()
        receive()
    }

    func disconnect() {
        pingTimer?.invalidate()
        pingTimer = nil
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
    }

    private func schedulePing() {
        pingTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            self?.webSocketTask?.sendPing { _ in }
        }
    }

    private func receive() {
        webSocketTask?.receive { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let message):
                let text: String?
                switch message {
                case .string(let s): text = s
                case .data(let d): text = String(data: d, encoding: .utf8)
                @unknown default: text = nil
                }
                if let text = text { self.handle(text: text) }
                self.receive()
            case .failure:
                break
            }
        }
    }

    private func handle(text: String) {
        guard let data = text.data(using: .utf8),
              let notification = try? JSONDecoder().decode(AppNotification.self, from: data)
        else { return }
        DispatchQueue.main.async {
            self.newNotification = notification
        }
    }
}
