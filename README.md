# Node.js User Authentication with Hashed Passwords

A small Express API that demonstrates registering a user and checking a password with bcrypt. Accounts live in an in-memory `Map`, so this project is for learning and local demos only: restarting the server clears every account. It does not issue sessions or authentication tokens and is not a production authentication service.

## Requirements

- Node.js 22 or newer
- npm

## Run locally

```bash
npm install
npm run dev
```

The server listens on `http://127.0.0.1:1198` by default. Copy `.env.example` to `.env` to set another `PORT` or `HOST`.

## API

All request bodies must be JSON. Names are trimmed and compared without case sensitivity. Passwords must be at least 8 characters and at most 72 UTF-8 bytes, matching bcrypt's input limit. Password hashes are never returned by the API.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/a2rp` | Project information |
| `GET` | `/users` | List public user fields (no password hashes) |
| `POST` | `/user/register` | Create an in-memory user |
| `POST` | `/user/login` | Verify a user's password |

Register with:

```json
{
  "name": "user3",
  "password": "password456"
}
```

Use the same JSON shape at `/user/login`. A successful response confirms the password and returns the user's public ID and name. This demo does not maintain a login session after that response.

`res.http` contains sample requests for the VS Code REST Client extension.

## Learning notes

- bcrypt uses 12 salt rounds in this example.
- Registration stores only the bcrypt hash, and user-list responses omit it.
- Login uses a generic failure message for unknown names and incorrect passwords.
- For a real service, use persistent storage, HTTPS, session or token management, rate limiting, account recovery, and a security review. Do not expose an unauthenticated user-list endpoint.
