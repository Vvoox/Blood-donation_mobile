#!/bin/bash
# ============================================================
# BloodLink - Keycloak Realm Setup Script
# Run this script from a machine that has network access to:
#   - keycloak.3olba.com (Keycloak admin)
#   - db.3olba.com (PostgreSQL)
#
# Usage:
#   chmod +x setup.sh
#   ./setup.sh
# ============================================================

set -e

KEYCLOAK_URL="https://keycloak.3olba.com"
KEYCLOAK_ADMIN="admin"
KEYCLOAK_ADMIN_PASSWORD="Admin_Str0ng_Passw0rd!"
REALM_NAME="blood-donation"
REALM_FILE="$(dirname "$0")/blood-donation-realm.json"

echo "============================================"
echo "  BloodLink Keycloak Setup"
echo "  Server: $KEYCLOAK_URL"
echo "============================================"

# ---- Step 1: Get admin access token ----
echo ""
echo "[1/4] Authenticating with Keycloak admin..."

TOKEN_RESPONSE=$(curl -sf -X POST \
  "${KEYCLOAK_URL}/auth/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" \
  -d "username=${KEYCLOAK_ADMIN}" \
  -d "password=${KEYCLOAK_ADMIN_PASSWORD}" 2>/dev/null || \
  curl -sf -X POST \
  "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" \
  -d "username=${KEYCLOAK_ADMIN}" \
  -d "password=${KEYCLOAK_ADMIN_PASSWORD}")

if [ -z "$TOKEN_RESPONSE" ]; then
  echo "ERROR: Could not authenticate with Keycloak. Check URL and credentials."
  exit 1
fi

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null || \
              echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "ERROR: Failed to extract access token."
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✓ Authenticated successfully"

# ---- Step 2: Check if realm already exists ----
echo ""
echo "[2/4] Checking if realm '$REALM_NAME' exists..."

REALM_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "${KEYCLOAK_URL}/auth/admin/realms/${REALM_NAME}" 2>/dev/null || \
  curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}")

# Detect API base path (Keycloak 16 vs 17+)
if curl -sf "${KEYCLOAK_URL}/auth/realms/master" > /dev/null 2>&1; then
  API_BASE="${KEYCLOAK_URL}/auth"
else
  API_BASE="${KEYCLOAK_URL}"
fi

if [ "$REALM_CHECK" = "200" ]; then
  echo "  Realm '$REALM_NAME' already exists."
  read -p "  Do you want to delete and recreate it? (y/N): " RECREATE
  if [ "$RECREATE" = "y" ] || [ "$RECREATE" = "Y" ]; then
    echo "  Deleting existing realm..."
    curl -sf -X DELETE \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      "${API_BASE}/admin/realms/${REALM_NAME}"
    echo "  ✓ Realm deleted"
  else
    echo "  Skipping realm creation."
    SKIP_REALM=true
  fi
fi

# ---- Step 3: Import realm ----
if [ "$SKIP_REALM" != "true" ]; then
  echo ""
  echo "[3/4] Importing realm from: $REALM_FILE"

  if [ ! -f "$REALM_FILE" ]; then
    echo "ERROR: Realm file not found: $REALM_FILE"
    exit 1
  fi

  IMPORT_RESPONSE=$(curl -sf -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d @"$REALM_FILE" \
    "${API_BASE}/admin/realms")

  if [ $? -eq 0 ]; then
    echo "✓ Realm '$REALM_NAME' imported successfully"
  else
    echo "ERROR: Failed to import realm. Response: $IMPORT_RESPONSE"
    exit 1
  fi
else
  echo "[3/4] Skipped realm creation"
fi

# ---- Step 4: Create test admin user ----
echo ""
echo "[4/4] Creating initial admin user in realm..."

USER_PAYLOAD='{
  "username": "bloodlink-admin",
  "email": "admin@bloodlink.app",
  "firstName": "BloodLink",
  "lastName": "Admin",
  "enabled": true,
  "emailVerified": true,
  "credentials": [{
    "type": "password",
    "value": "Admin@BloodLink123",
    "temporary": false
  }],
  "realmRoles": ["ADMIN"]
}'

curl -sf -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$USER_PAYLOAD" \
  "${API_BASE}/admin/realms/${REALM_NAME}/users" || echo "  (User may already exist)"

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "  Keycloak Realm: $REALM_NAME"
echo "  Admin Console:  ${KEYCLOAK_URL}/auth/admin (or /admin)"
echo "  Token Endpoint: ${KEYCLOAK_URL}/auth/realms/${REALM_NAME}/protocol/openid-connect/token"
echo ""
echo "  Mobile App Client: blood-donation-app (public)"
echo "  Backend Client:    blood-donation-backend (confidential)"
echo ""
echo "  Test Admin: bloodlink-admin / Admin@BloodLink123"
echo ""
echo "  IMPORTANT: Update the backend client secret after import!"
echo "  Go to: Clients > blood-donation-backend > Credentials > Regenerate"
echo ""
