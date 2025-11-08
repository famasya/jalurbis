# Socket API Authentication - Complete Analysis

## Executive Summary

The Socket API (port 5100) uses **SECRET_KEY_PTIS** for encryption, NOT SECRET_KEY_GPS_SOCKET as initially thought. The authorization token is a JWT used **WITHOUT** the "Bearer" prefix.

## Key Findings

### 1. Encryption Key
- **Key Used**: `SECRET_KEY_PTIS = "880dc77c4e88e8d0da7b5db298efb8c9"`
- **Initial Assumption**: SECRET_KEY_GPS_SOCKET (WRONG)
- **Verification**: Confirmed by decrypting actual traffic

### 2. Authorization Header Format
- **Format**: Direct JWT token (no prefix)
- **Correct**: `Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Incorrect**: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. User Credentials
- Both `id` and `email` can be **empty strings**
- The API generates anonymous tokens when credentials are empty

## Complete Flow

### Step 1: Get Authentication Token

**Endpoint**: `POST https://gps.brtnusantara.com:5100/api/authToken`

**Request**:
```json
{
  "value": "iU94CKx7O2P6r0L6BrsrxprNL5FtLFGXx2jmR22GX2s="
}
```

**Request (decrypted)**:
```json
{
  "email" : "",
  "id" : ""
}
```

**Encryption**:
- Algorithm: AES-256-CBC
- Key: `SECRET_KEY_PTIS`
- IV: First 16 chars of key (`880dc77c4e88e8d0`)

**Response (encrypted)**:
```
l7OKmYOxJi+1iLCa0fQeaMZVFB/VBxdztmIK1A2QnjTysJHNQYiOzGuL6lHX4Dq0ztyhFnqMMYMQ1sqUy/kL8Ram8OnqFpyWeFJUXxEiWlT4Pnr/7LJgGsYRggVEk61INH/6Yc1uv1b4TZaDqLg08weXAvLB/AndaELQxsyCBDUW1un+Ij8ojE4JAwqq2VwIe21oRAxFRFkPquWu3U0MqcuEMx2K+CSzyDZqwHLLgg9zvxrs5qDmHdXAY4TfnlUBIaHBkgxe7nD6vmT362nfRbeVbFVArisO0bm95R3V/wHd9v2h9kaMwoGDeJm3rEwk/jnvatEfhjTBCi6vr1SwEsfkzYPZRYeOMecV19OJhsebviO4kMTPISv5XMYOQP8W
```

**Response (decrypted)**:
```json
{
  "status": 1,
  "message": "Success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJNIVRSNEQ0UjRUIiwiYXVkIjoiTWl0cmFEYXJhdEBNdWNoaSIsInVzZXJJZCI6IiIsInVzZXJFbWFpbCI6IiIsImlhdCI6MTc2MjU5NTY1MywiZXhwIjoxNzYyNTk4NjUzfQ.XDqitKLOh5EY6usYiG_8FycTEe5x9puLbZlOTt9gpOM"
  }
}
```

**JWT Token Decoded**:
```json
{
  "iss": "M!TR4D4R4T",
  "aud": "MitraDarat@Muchi",
  "userId": "",
  "userEmail": "",
  "iat": 1762595653,
  "exp": 1762598653
}
```

**Token Expiry**: 3600 seconds (1 hour)

### Step 2: Use Token to Find Routes

**Endpoint**: `POST https://gps.brtnusantara.com:5100/api/findRouteV3`

**Headers**:
```
Content-Type: application/json
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJNIVRSNEQ0UjRUIiwiYXVkIjoiTWl0cmFEYXJhdEBNdWNoaSIsInVzZXJJZCI6IiIsInVzZXJFbWFpbCI6IiIsImlhdCI6MTc2MjU5NTY1MywiZXhwIjoxNzYyNTk4NjUzfQ.XDqitKLOh5EY6usYiG_8FycTEe5x9puLbZlOTt9gpOM
```

**Request**:
```json
{
  "value": "PUQ3PvKWd3GNwzfhV0CvmmtY3u8ClU3/zklUsoE6ZfzmpTqTpr+HZzoTtKrFDLGYORXWWIXUbpRUrjDWbULofED5pw+8YSKLvEx8LAKaYjfTbUUsSM8mNGQWMlVfmAED9nypN5rn3ZkKviLKouo/aWzoIO2ZfJHIp1UYfZ0iTJ8="
}
```

**Request (decrypted)**:
```json
{
  "name": "Suroboyo Bus",
  "corridor": "",
  "plate_number": "",
  "pref": "3501",
  "key": "NGIxHubdat"
}
```

**Encryption**: Same as Step 1 (AES-256-CBC with SECRET_KEY_PTIS)

**Response**: Encrypted JSON with bus route data (decrypted with SECRET_KEY_PTIS)

## Code Implementation

### Python Example

```python
import base64
import json
import requests
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

SECRET_KEY_PTIS = "880dc77c4e88e8d0da7b5db298efb8c9"

def encrypt_data(data: str, secret_key: str) -> str:
    key = secret_key.encode('utf-8')
    iv = secret_key[:16].encode('utf-8')
    cipher = AES.new(key, AES.MODE_CBC, iv)
    padded_data = pad(data.encode('utf-8'), AES.block_size)
    encrypted = cipher.encrypt(padded_data)
    return base64.b64encode(encrypted).decode('utf-8')

def decrypt_data(encrypted_data: str, secret_key: str) -> str:
    encrypted_bytes = base64.b64decode(encrypted_data)
    key = secret_key.encode('utf-8')
    iv = secret_key[:16].encode('utf-8')
    cipher = AES.new(key, AES.MODE_CBC, iv)
    decrypted = unpad(cipher.decrypt(encrypted_bytes), AES.block_size)
    return decrypted.decode('utf-8')

# Step 1: Get auth token
request_json = '{\n  "email" : "",\n  "id" : ""\n}'
encrypted_request = encrypt_data(request_json, SECRET_KEY_PTIS)

response = requests.post(
    "https://gps.brtnusantara.com:5100/api/authToken",
    json={"value": encrypted_request},
    verify=False
)

decrypted_response = decrypt_data(response.text.strip('"'), SECRET_KEY_PTIS)
token_data = json.loads(decrypted_response)
auth_token = token_data["data"]["token"]

# Step 2: Find route
route_json = json.dumps({
    "name": "Suroboyo Bus",
    "corridor": "",
    "plate_number": "",
    "pref": "3501",
    "key": "NGIxHubdat"
}, separators=(',', ' : '), indent=2)

encrypted_route = encrypt_data(route_json, SECRET_KEY_PTIS)

response = requests.post(
    "https://gps.brtnusantara.com:5100/api/findRouteV3",
    json={"value": encrypted_route},
    headers={"Authorization": auth_token},  # NO "Bearer" prefix!
    verify=False
)

route_data = json.loads(decrypt_data(response.text.strip('"'), SECRET_KEY_PTIS))
```

## Comparison: GPS API vs Socket API

| Feature | GPS API (Dev Server) | Socket API (Port 5100) |
|---------|---------------------|------------------------|
| **Base URL** | `http://gps.brtnusantara.com/dev/trans_hubdat/api_v3` | `https://gps.brtnusantara.com:5100` |
| **Auth Endpoint** | `/getToken` (GET) | `/api/authToken` (POST) |
| **Request Format** | No body | Encrypted JSON with id/email |
| **Response Encryption Key** | SECRET_KEY_PTIS | SECRET_KEY_PTIS |
| **Request Encryption Key** | SECRET_KEY_GPS_SOCKET | SECRET_KEY_PTIS |
| **Authorization Header** | `Bearer {token}` | `{token}` (no prefix) |
| **Token Type** | Bearer token | JWT token |
| **Credentials Required** | No | No (can be empty) |

## Security Analysis

### Vulnerabilities Identified

1. **Fixed IV Vulnerability**
   - IV derived from secret key (not random)
   - Same plaintext always produces same ciphertext
   - Violates AES-CBC security requirements

2. **Hardcoded Keys**
   - All encryption keys hardcoded in native library
   - Extractable via `strings` command
   - No key rotation mechanism

3. **Anonymous Access**
   - Empty credentials accepted
   - Anyone can generate valid tokens
   - No user authentication required

4. **Missing SSL Verification**
   - Some clients may disable SSL verification
   - Susceptible to MITM attacks

### OWASP Top 10 Mapping

- **A02:2021 – Cryptographic Failures**: Fixed IV, hardcoded keys
- **A07:2021 – Identification and Authentication Failures**: Anonymous access
- **A08:2021 – Software and Data Integrity Failures**: No signature verification

## Files Created

1. **socket_api_final_workflow.py** - Complete working implementation
2. **investigate_with_all_keys.py** - Traffic analysis script
3. **SOCKET_API_FINDINGS.md** - This document

## References

### Analyzed Smali Files
- `SocketApi.smali` - API interface
- `SocketInterceptor.smali:310-438` - Token refresh logic
- `UserRequest.smali` - Request structure
- `ValueRequest.smali` - Wrapper structure
- `TokenResponse.smali` - Response structure
- `GetToken.smali` - Token DTO

### Native Library
- `libnusantara.so` - Contains hardcoded secret keys
