import Foundation
import Combine

class AuthService: ObservableObject {
    @Published var isLoggedIn = false
    @Published var currentUser: User?
    @Published var accessToken: String?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let keycloakURL = "https://keycloak.3olba.com"
    private let realm = "blood-donation"
    private let clientId = "blood-donation-app"

    func login(email: String, password: String) {
        isLoading = true
        errorMessage = nil

        let tokenURL = "\(keycloakURL)/realms/\(realm)/protocol/openid-connect/token"
        guard let url = URL(string: tokenURL) else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")

        let body = "grant_type=password&client_id=\(clientId)&username=\(email)&password=\(password)"
        request.httpBody = body.data(using: .utf8)

        URLSession.shared.dataTask(with: request) { [weak self] data, _, error in
            DispatchQueue.main.async {
                self?.isLoading = false
                if let error = error {
                    self?.errorMessage = error.localizedDescription
                    return
                }
                guard let data = data else { return }

                if let json = try? JSONDecoder().decode([String: String].self, from: data),
                   let token = json["access_token"] {
                    self?.accessToken = token
                    self?.fetchUserInfo(token: token)
                } else {
                    self?.errorMessage = "Invalid credentials. Please try again."
                }
            }
        }.resume()
    }

    private func fetchUserInfo(token: String) {
        let userinfoURL = "\(keycloakURL)/realms/\(realm)/protocol/openid-connect/userinfo"
        guard let url = URL(string: userinfoURL) else { return }

        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        URLSession.shared.dataTask(with: request) { [weak self] data, _, _ in
            DispatchQueue.main.async {
                guard let data = data,
                      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return }

                let user = User(
                    id: json["sub"] as? String ?? "",
                    email: json["email"] as? String ?? "",
                    name: json["name"] as? String ?? json["preferred_username"] as? String ?? "",
                    city: json["city"] as? String ?? "",
                    bloodType: json["blood_type"] as? String ?? ""
                )
                self?.currentUser = user
                self?.isLoggedIn = true
                WebSocketService.shared.connect(token: token)
            }
        }.resume()
    }

    func logout() {
        WebSocketService.shared.disconnect()
        isLoggedIn = false
        currentUser = nil
        accessToken = nil
    }
}
