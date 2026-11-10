require("dotenv").config();

const { randomUUID } = require("node:crypto");
const express = require("express");
const bcrypt = require("bcrypt");

const app = express();
const users = new Map();
const BCRYPT_ROUNDS = 12;
const MAX_PASSWORD_BYTES = 72;

// Use a dummy hash for unknown usernames so failed logins do comparable work.
const dummyPasswordHash = bcrypt.hash("authentication-demo-dummy-password", BCRYPT_ROUNDS);

app.disable("x-powered-by");
app.use(express.json({ limit: "16kb", strict: true }));

function readCredentials(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { error: "Send a JSON object with name and password." };
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (name.length < 1 || name.length > 80) {
        return { error: "Name must contain 1 to 80 characters." };
    }
    if (password.length < 8 || Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
        return { error: "Password must be at least 8 characters and no more than 72 UTF-8 bytes." };
    }

    return { name, password, key: name.toLocaleLowerCase("en-US") };
}

app.get("/a2rp", (_req, res) => {
    res.json({
        status: true,
        message: "a2rp: an Ashish Ranjan presentation",
        detail: "node.js-user_authentication-password_login-hashed_password"
    });
});

// This demo stores accounts in memory and returns only public fields.
app.get("/users", (_req, res) => {
    const publicUsers = Array.from(users.values(), ({ id, name, createdAt }) => ({ id, name, createdAt }));
    res.json({ status: true, users: publicUsers });
});

app.post("/user/register", async (req, res, next) => {
    try {
        const credentials = readCredentials(req.body);
        if (credentials.error) {
            return res.status(400).json({ status: false, message: credentials.error });
        }

        if (users.has(credentials.key)) {
            return res.status(409).json({ status: false, message: "An account with that name already exists." });
        }

        const passwordHash = await bcrypt.hash(credentials.password, BCRYPT_ROUNDS);
        // Recheck after hashing because concurrent registration requests can overlap.
        if (users.has(credentials.key)) {
            return res.status(409).json({ status: false, message: "An account with that name already exists." });
        }

        users.set(credentials.key, {
            id: randomUUID(),
            name: credentials.name,
            passwordHash,
            createdAt: new Date().toISOString()
        });

        return res.status(201).json({ status: true, message: "User added successfully." });
    } catch (error) {
        return next(error);
    }
});

app.post("/user/login", async (req, res, next) => {
    try {
        const credentials = readCredentials(req.body);
        if (credentials.error) {
            return res.status(400).json({ status: false, message: credentials.error });
        }

        const user = users.get(credentials.key);
        const hash = user ? user.passwordHash : await dummyPasswordHash;
        const passwordMatches = await bcrypt.compare(credentials.password, hash);

        if (!user || !passwordMatches) {
            return res.status(401).json({ status: false, message: "Invalid name or password." });
        }

        return res.json({ status: true, message: "Login successful.", user: { id: user.id, name: user.name } });
    } catch (error) {
        return next(error);
    }
});

app.use((error, _req, res, _next) => {
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({ status: false, message: "Request body must contain valid JSON." });
    }
    if (error.type === "entity.too.large") {
        return res.status(413).json({ status: false, message: "Request body is too large." });
    }

    console.error("Request failed:", error.message);
    return res.status(500).json({ status: false, message: "An unexpected error occurred." });
});

const port = Number(process.env.PORT || 1198);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
}

if (require.main === module) {
    const host = process.env.HOST || "127.0.0.1";
    app.listen(port, host, () => console.log(`Authentication demo listening at http://${host}:${port}`));
}

module.exports = app;
