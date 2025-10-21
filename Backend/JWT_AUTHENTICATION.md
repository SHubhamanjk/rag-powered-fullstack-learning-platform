# JWT Authentication Guide

## Overview

All endpoints in the Medha.ai Backend API now require JWT (JSON Web Token) authentication, except for user registration and login endpoints which generate the JWT tokens.

## How It Works

### 1. **User Registration/Login**
When a user registers or logs in, the API returns a JWT token along with user details:

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJleHAiOjE3MDkwNDAwMDB9.abc123..."
}
```

### 2. **Using the Token**
Include the JWT token in the `Authorization` header with the `Bearer` scheme for all subsequent API requests:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. **Token Expiration**
Tokens expire after **7 days** by default. After expiration, users need to log in again to get a new token.

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
JWT_SECRET_KEY=your-secret-key-change-this-in-production-use-long-random-string
```

**IMPORTANT:** Change the default secret key in production! Use a long, random, secure string.

You can generate a secure key using:
```python
import secrets
print(secrets.token_urlsafe(32))
```

### Token Settings

Configured in `utils/jwt_auth.py`:
- **Algorithm**: HS256
- **Expiration**: 7 days (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- **Claim**: `email` (user's email address)

## API Usage Examples

### 1. Register a New User

**No authentication required**

```bash
curl -X 'POST' \
  'http://localhost:8000/user/create' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepass123",
    "age": 25,
    "gender": "Male"
  }'
```

**Response:**
```json
{
  "email": "john@example.com",
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login

**No authentication required**

```bash
curl -X 'POST' \
  'http://localhost:8000/user/login' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

**Response:**
```json
{
  "email": "john@example.com",
  "name": "John Doe",
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Protected Endpoint (Example: Create Chat)

**Requires JWT authentication**

```bash
curl -X 'POST' \
  'http://localhost:8000/chat/create' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

**Response:**
```json
{
  "chat_id": "chat_abc123",
  "message": "Chat created successfully"
}
```

## Authentication Flow Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. POST /user/login
       │    { email, password }
       ▼
┌─────────────────┐
│   API Server    │
└────────┬────────┘
         │
         │ 2. Validate credentials
         │ 3. Generate JWT token
         ▼
┌─────────────────┐
│ JWT Token       │
│ + User Details  │
└────────┬────────┘
         │
         │ 4. Return to client
         ▼
┌─────────────┐
│   Client    │ (stores token)
└──────┬──────┘
       │
       │ 5. API Request with
       │    Authorization: Bearer <token>
       ▼
┌─────────────────┐
│   API Server    │
└────────┬────────┘
         │
         │ 6. Verify token
         │ 7. Extract email
         │ 8. Process request
         ▼
┌─────────────────┐
│   Response      │
└─────────────────┘
```

## Protected Endpoints

All endpoints require JWT authentication **except**:
- `POST /user/create` - User registration
- `POST /user/login` - User login
- `POST /user/forgot-password` - Initiate password reset
- `POST /user/verify-otp` - Verify OTP for password reset
- `GET /` - Health check

## Error Handling

### Invalid/Missing Token

**Status Code:** 401 Unauthorized

```json
{
  "detail": "Invalid authentication credentials: Signature has expired"
}
```

### Token Expired

**Status Code:** 401 Unauthorized

```json
{
  "detail": "Invalid authentication credentials: Signature has expired"
}
```

### Malformed Token

**Status Code:** 401 Unauthorized

```json
{
  "detail": "Invalid authentication credentials: Invalid token format"
}
```

## Best Practices

### For Frontend Developers

1. **Store the token securely**
   - Use `httpOnly` cookies for web apps
   - Use secure storage (e.g., Keychain on iOS, KeyStore on Android) for mobile apps
   - **Never** store tokens in localStorage if dealing with sensitive data

2. **Include token in all requests**
   ```javascript
   // Example with fetch
   fetch('http://localhost:8000/chat/create', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     }
   })
   ```

3. **Handle token expiration**
   - Implement automatic logout on 401 errors
   - Redirect to login page
   - Optionally implement token refresh mechanism

4. **Clear token on logout**
   ```javascript
   // Remove token from storage
   localStorage.removeItem('jwt_token');
   // Redirect to login
   window.location.href = '/login';
   ```

### For Backend Developers

1. **Use strong secret keys**
   - Minimum 32 characters
   - Use environment variables
   - Never commit secrets to version control

2. **Implement token refresh** (future enhancement)
   - Short-lived access tokens (15 min)
   - Long-lived refresh tokens (7 days)
   - Refresh endpoint to get new access token

3. **Monitor for suspicious activity**
   - Log failed authentication attempts
   - Implement rate limiting
   - Track unusual access patterns

## Security Considerations

1. **HTTPS Only**
   - Always use HTTPS in production
   - JWT tokens can be intercepted over HTTP

2. **Token Storage**
   - Frontend should store tokens securely
   - Backend should never store raw tokens

3. **Token Rotation**
   - Users should re-authenticate periodically
   - Implement logout on password change

4. **CORS Configuration**
   - Restrict allowed origins in production
   - Current configuration allows all origins (development only)

## Troubleshooting

### Common Issues

**Problem:** "Could not validate credentials"
- **Solution:** Check if token is included in Authorization header
- **Solution:** Verify token format: `Bearer <token>`

**Problem:** "Signature has expired"
- **Solution:** Token has expired, user needs to log in again

**Problem:** "Invalid token format"
- **Solution:** Ensure token is properly formatted JWT
- **Solution:** Check for extra spaces or missing "Bearer" prefix

## Testing with cURL

### Create User and Save Token
```bash
# Create user and extract token
TOKEN=$(curl -X 'POST' \
  'http://localhost:8000/user/create' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123"
  }' | jq -r '.token')

echo "Token: $TOKEN"
```

### Use Token in Subsequent Requests
```bash
# Use the token
curl -X 'POST' \
  'http://localhost:8000/chat/create' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json'
```

## Testing with Postman

1. **Create Environment Variable**
   - Add variable: `jwt_token`

2. **Login Request**
   - Method: POST
   - URL: `http://localhost:8000/user/login`
   - Body: `{ "email": "...", "password": "..." }`
   - Tests tab:
     ```javascript
     var jsonData = pm.response.json();
     pm.environment.set("jwt_token", jsonData.token);
     ```

3. **Protected Requests**
   - Add header: `Authorization: Bearer {{jwt_token}}`

## Migration Guide

If you're upgrading from a version without JWT:

1. **Update client applications** to:
   - Capture token from login/register response
   - Store token securely
   - Include token in all API requests

2. **Test all endpoints** with authentication

3. **Update documentation** for API consumers

4. **Inform users** about the security upgrade

## Future Enhancements

Planned improvements:
- [ ] Token refresh mechanism
- [ ] Role-based access control (RBAC)
- [ ] Token blacklisting for logout
- [ ] Two-factor authentication (2FA)
- [ ] OAuth2 integration
- [ ] Rate limiting per user

