import Foundation
import Combine

class AuthService: ObservableObject, APIServiceAuthDelegate {
    @Published var isLoggedIn = false
    @Published var currentUser: User?
    @Published var accessToken: String?
    @Published var rememberMe: Bool {
        didSet {
            defaults.set(rememberMe, forKey: rememberMeKey)
            if !rememberMe {
                clearPersistedSession()
            }
        }
    }
    @Published var isLoading = false
    @Published var errorMessage: String?
    private var refreshToken: String?

    private let keycloakURL = "https://keycloak.3olba.com"
    private let realm = "blood-donation"
    private let clientId = "blood-donation-app"
    private let defaults = UserDefaults.standard
    private let accessTokenKey = "auth_access_token"
    private let refreshTokenKey = "auth_refresh_token"
    private let userKey = "auth_current_user"
    private let rememberMeKey = "auth_remember_me"

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

    private struct AccessTokenClaims: Decodable {
        let sub: String
        let email: String?
        let name: String?
        let preferredUsername: String?
        let givenName: String?
        let familyName: String?
        let city: String?
        let bloodType: String?
        let bloodTypeVisibility: String?
        let phoneNumber: String?
        let phoneVisibility: String?

        enum CodingKeys: String, CodingKey {
            case sub
            case email
            case name
            case preferredUsername = "preferred_username"
            case givenName = "given_name"
            case familyName = "family_name"
            case city
            case bloodType = "blood_type"
            case bloodTypeVisibility = "blood_type_visibility"
            case phoneNumber = "phone_number"
            case phoneVisibility = "phone_visibility"
        }
    }

    init() {
        rememberMe = defaults.bool(forKey: rememberMeKey)
        refreshToken = defaults.string(forKey: refreshTokenKey)

        if rememberMe {
            if let storedUser = loadPersistedUser() {
                currentUser = storedUser
            }
            isLoggedIn = defaults.string(forKey: accessTokenKey) != nil
                || defaults.string(forKey: refreshTokenKey) != nil
            Task { await restoreSessionIfNeeded() }
        }

        APIService.shared.authDelegate = self
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
                    self?.completeSession(
                        with: tokenResponse,
                        fallbackEmail: email,
                        persistSession: self?.rememberMe ?? false
                    )
                } else {
                    let apiError = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["error_description"] as? String
                    let statusCode = (response as? HTTPURLResponse)?.statusCode
                    self?.errorMessage = apiError ?? (statusCode == 401 || statusCode == 400
                        ? LocalizationService().text("login.error.invalid_credentials")
                        : LocalizationService().text("login.error.unavailable"))
                }
            }
        }.resume()
    }

    private func decodeUserFromAccessToken(_ token: String) -> User? {
        let segments = token.split(separator: ".")
        guard segments.count > 1 else { return nil }

        var payload = String(segments[1])
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")

        let remainder = payload.count % 4
        if remainder > 0 {
            payload += String(repeating: "=", count: 4 - remainder)
        }

        guard let payloadData = Data(base64Encoded: payload),
              let claims = try? JSONDecoder().decode(AccessTokenClaims.self, from: payloadData) else {
            return nil
        }

        let fullName =
            claims.name
            ?? [claims.givenName, claims.familyName]
                .compactMap { $0 }
                .filter { !$0.isEmpty }
                .joined(separator: " ")
            ?? claims.preferredUsername
            ?? claims.email
            ?? ""

        return User(
            id: claims.sub,
            email: claims.email ?? "",
            name: fullName,
            city: claims.city ?? "",
            bloodType: claims.bloodType ?? "",
            bloodTypeVisibility: claims.bloodTypeVisibility ?? "private",
            phoneNumber: claims.phoneNumber ?? "",
            phoneVisibility: claims.phoneVisibility ?? "private"
        )
    }

    private func completeSession(with tokenResponse: TokenResponse, fallbackEmail: String, persistSession: Bool) {
        accessToken = tokenResponse.accessToken
        refreshToken = tokenResponse.refreshToken ?? refreshToken
        currentUser = decodeUserFromAccessToken(tokenResponse.accessToken) ?? User(
            id: fallbackEmail,
            email: fallbackEmail,
            name: fallbackEmail,
            city: "",
            bloodType: "",
            bloodTypeVisibility: "private",
            phoneNumber: "",
            phoneVisibility: "private"
        )
        isLoggedIn = true
        WebSocketService.shared.connect(token: tokenResponse.accessToken)

        if persistSession {
            persistSessionData(
                accessToken: tokenResponse.accessToken,
                refreshToken: refreshToken,
                user: currentUser
            )
        }

        fetchUserInfo(token: tokenResponse.accessToken)
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
                    bloodType: firstString(json["blood_type"]) == "" ? firstString(json["bloodType"]) == "" ? firstString(attributes?["bloodType"]) : firstString(json["bloodType"]) : firstString(json["blood_type"]),
                    bloodTypeVisibility: firstString(json["blood_type_visibility"]) == "" ? firstString(json["bloodTypeVisibility"]) == "" ? firstString(attributes?["bloodTypeVisibility"]) : firstString(json["bloodTypeVisibility"]) : firstString(json["blood_type_visibility"]),
                    phoneNumber: firstString(json["phone_number"]) == "" ? firstString(json["phoneNumber"]) == "" ? firstString(attributes?["phoneNumber"]) : firstString(json["phoneNumber"]) : firstString(json["phone_number"]),
                    phoneVisibility: firstString(json["phone_visibility"]) == "" ? firstString(json["phoneVisibility"]) == "" ? firstString(attributes?["phoneVisibility"]) : firstString(json["phoneVisibility"]) : firstString(json["phone_visibility"])
                )
                self?.currentUser = user
                self?.isLoggedIn = true
                WebSocketService.shared.connect(token: token)
                if self?.rememberMe == true {
                    self?.persistSessionData(
                        accessToken: token,
                        refreshToken: self?.refreshToken,
                        user: user
                    )
                }
            }
        }.resume()
    }

    private func restoreSessionIfNeeded() async {
        if let refreshToken, !refreshToken.isEmpty {
            await refreshSession(using: refreshToken)
            return
        }

        if let storedAccessToken = defaults.string(forKey: accessTokenKey), !storedAccessToken.isEmpty {
            await MainActor.run {
                accessToken = storedAccessToken
                isLoggedIn = true
                if let storedUser = loadPersistedUser() {
                    currentUser = storedUser
                }
                WebSocketService.shared.connect(token: storedAccessToken)
                fetchUserInfo(token: storedAccessToken)
            }
        }
    }

    private func refreshSession(using refreshToken: String) async {
        guard let url = URL(string: "\(keycloakURL)/realms/\(realm)/protocol/openid-connect/token") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")

        var components = URLComponents()
        components.queryItems = [
            URLQueryItem(name: "grant_type", value: "refresh_token"),
            URLQueryItem(name: "client_id", value: clientId),
            URLQueryItem(name: "refresh_token", value: refreshToken)
        ]
        request.httpBody = components.percentEncodedQuery?.data(using: .utf8)

        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            let tokenResponse = try JSONDecoder().decode(TokenResponse.self, from: data)
            await MainActor.run {
                completeSession(
                    with: tokenResponse,
                    fallbackEmail: loadPersistedUser()?.email ?? "",
                    persistSession: true
                )
            }
        } catch {
            await MainActor.run {
                clearPersistedSession()
                isLoggedIn = false
                currentUser = nil
                accessToken = nil
            }
        }
    }

    private func persistSessionData(accessToken: String, refreshToken: String?, user: User?) {
        defaults.set(accessToken, forKey: accessTokenKey)
        if let refreshToken, !refreshToken.isEmpty {
            defaults.set(refreshToken, forKey: refreshTokenKey)
        }
        if let user,
           let encoded = try? JSONEncoder().encode(user) {
            defaults.set(encoded, forKey: userKey)
        }
    }

    private func loadPersistedUser() -> User? {
        guard let data = defaults.data(forKey: userKey) else { return nil }
        return try? JSONDecoder().decode(User.self, from: data)
    }

    private func clearPersistedSession() {
        defaults.removeObject(forKey: accessTokenKey)
        defaults.removeObject(forKey: refreshTokenKey)
        defaults.removeObject(forKey: userKey)
    }

    var currentAccessToken: String? {
        accessToken
    }

    func refreshAccessTokenIfNeeded() async -> String? {
        let candidateRefreshToken = refreshToken ?? defaults.string(forKey: refreshTokenKey)
        guard let candidateRefreshToken, !candidateRefreshToken.isEmpty else {
            return nil
        }

        await refreshSession(using: candidateRefreshToken)
        return accessToken
    }

    func handleAuthenticationFailure() {
        DispatchQueue.main.async {
            self.logout()
        }
    }

    func logout() {
        WebSocketService.shared.disconnect()
        isLoggedIn = false
        currentUser = nil
        accessToken = nil
        refreshToken = nil
        clearPersistedSession()
    }
}
