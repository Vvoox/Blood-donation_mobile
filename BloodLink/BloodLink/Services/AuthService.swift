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
    private let redirectURI = "bloodlink://auth"

    private struct TokenResponse: Decodable {
        let accessToken: String
        let refreshToken: String?
        let expiresIn: Int?
        let refreshExpiresIn: Int?
        let tokenType: String?

        enum CodingKeys: String, CodingKey {
            case accessToken = "access_token"
            case refreshToken = "refresh_token"
            case expiresIn = "expires_in"
            case refreshExpiresIn = "refresh_expires_in"
            case tokenType = "token_type"
        }
    }

    var registrationURL: URL? {
        var components = URLComponents(string: "\(keycloakURL)/realms/\(realm)/protocol/openid-connect/registrations")
        components?.queryItems = [
            URLQueryItem(name: "client_id", value: clientId),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: "openid profile email"),
            URLQueryItem(name: "redirect_uri", value: redirectURI)
        ]
        return components?.url
    }

    func login(email: String, password: String) {
        isLoading = true
        errorMessage = nil

        let tokenURL = "\(keycloakURL)/realms/\(realm)/protocol/openid-connect/token"
        guard let url = URL(string: tokenURL) else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")

        var components = URLComponents()
        components.queryItems = [
            URLQueryItem(name: "grant_type", value: "password"),
            URLQueryItem(name: "client_id", value: clientId),
            URLQueryItem(name: "username", value: email),
            URLQueryItem(name: "password", value: password)
        ]
        request.httpBody = components.percentEncodedQuery?.data(using: .utf8)

        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                self?.isLoading = false
                if let error = error {
                    self?.errorMessage = error.localizedDescription
                    return
                }
                guard let data = data else { return }

                if let tokenResponse = try? JSONDecoder().decode(TokenResponse.self, from: data) {
                    self?.accessToken = tokenResponse.accessToken
                    self?.currentUser = User(
                        id: UUID().uuidString,
                        email: email,
                        name: email,
                        city: "",
                        bloodType: ""
                    )
                    self?.isLoggedIn = true
                    self?.fetchUserInfo(token: tokenResponse.accessToken)
                } else {
                    let apiError = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["error_description"] as? String
                    let statusCode = (response as? HTTPURLResponse)?.statusCode
                    self?.errorMessage = apiError ?? (statusCode == 401 || statusCode == 400
                        ? "Invalid credentials. Please check your email and password."
                        : "Unable to sign in right now. Please try again.")
                }
            }
        }.resume()
    }

    private func fetchUserInfo(token: String) {
        let userinfoURL = "\(keycloakURL)/realms/\(realm)/protocol/openid-connect/userinfo"
        guard let url = URL(string: userinfoURL) else { return }

        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        URLSession.shared.dataTask(with: request) { [weak self] data, _, error in
            DispatchQueue.main.async {
                if error != nil {
                    return
                }

                guard let data = data,
                      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return }

                let attributes = json["attributes"] as? [String: Any]

                func firstString(_ value: Any?) -> String {
                    if let string = value as? String {
                        return string
                    }
                    if let array = value as? [String] {
                        return array.first ?? ""
                    }
                    return ""
                }

                let user = User(
                    id: json["sub"] as? String ?? "",
                    email: json["email"] as? String ?? "",
                    name: json["name"] as? String
                        ?? [json["given_name"] as? String, json["family_name"] as? String]
                            .compactMap { $0 }
                            .filter { !$0.isEmpty }
                            .joined(separator: " ")
                        ?? json["preferred_username"] as? String
                        ?? "",
                    city: firstString(json["city"]) == "" ? firstString(attributes?["city"]) : firstString(json["city"]),
                    bloodType: firstString(json["blood_type"]) == "" ? firstString(json["bloodType"]) == "" ? firstString(attributes?["bloodType"]) : firstString(json["bloodType"]) : firstString(json["blood_type"])
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
