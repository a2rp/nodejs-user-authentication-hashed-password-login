require("dotenv").config();

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');

app.use(express.json());

const users = []

app.get("/a2rp", (req, res) => {
    res.json({
        status: true,
        message: "a2rp: an Ashish Ranjan presentation",
        detail: "node.js-user_authentication-password_login-hashed_password"
    });
});

app.get('/users', (req, res) => {
    res.json({ status: true, users });
})

app.post('/user/register', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        const user = { name: req.body.name, password: hashedPassword };
        users.push(user);
        res.status(201).json({
            status: true,
            message: 'User added successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: true,
            message: error.message
        });
    }
});

app.post('/user/login', async (req, res) => {
    const user = users.find(user => user.name === req.body.name)
    if (user == null) {
        return res.status(400).json({
            status: false,
            message: 'User not found'
        });
    }
    try {
        const verifyPassword = await bcrypt.compare(req.body.password, user.password);
        if (verifyPassword) {
            res.json({ status: true, message: 'Login successful' });
        } else {
            res.json({ status: false, message: 'Incorrect password' });
        }
    } catch {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
})

const PORT = process.env.PORT || 1198;
app.listen(PORT, console.log(`running on port ${PORT}`));

