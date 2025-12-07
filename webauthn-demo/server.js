const express = require('express');
const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server');
const { LocalStorage } = require('node-localstorage');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');

const app = express();
const port = 3000;
const rpName = 'WebAuthn Demo';
const rpID = 'localhost';
const expectedOrigin = `http://${rpID}:${port}`;

// In-memory storage (replace with a database in production)
const localStorage = new LocalStorage('./db');
let users = JSON.parse(localStorage.getItem('users') || '{}');
let userSessions = {};

// Middleware
app.use(cors({ origin: expectedOrigin, credentials: true }));
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(session({
    secret: 'super-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Routes
app.get('/register-options', (req, res) => {
    const userId = `user_${Date.now()}`;
    const username = `user${Object.keys(users).length + 1}@example.com`;
    
    const options = generateRegistrationOptions({
        rpName,
        rpID,
        userID: userId,
        userName: username,
        timeout: 60000,
        attestationType: 'none',
        authenticatorSelection: {
            userVerification: 'preferred',
            requireResidentKey: false,
        },
    });

    req.session.challenge = options.challenge;
    req.session.userId = userId;
    req.session.username = username;

    res.json(options);
});

app.post('/verify-registration', async (req, res) => {
    const { body } = req;
    const expectedChallenge = req.session.challenge;

    try {
        const verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin,
            expectedRPID: rpID,
            requireUserVerification: true,
        });

        if (verification.verified) {
            const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
            
            users[req.session.userId] = {
                id: req.session.userId,
                username: req.session.username,
                devices: [{
                    credentialID: Buffer.from(credentialID).toString('base64'),
                    credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64'),
                    counter,
                    transports: body.response.transports || [],
                }]
            };

            localStorage.setItem('users', JSON.stringify(users));
            res.json({ verified: true, userId: req.session.userId });
        } else {
            res.status(400).json({ error: 'Verification failed' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/login-options', (req, res) => {
    const options = generateAuthenticationOptions({
        rpID,
        userVerification: 'preferred',
    });

    req.session.challenge = options.challenge;
    res.json(options);
});

app.post('/verify-login', async (req, res) => {
    const { body } = req;
    const expectedChallenge = req.session.challenge;

    // Find user by credential ID
    let user;
    for (const userId in users) {
        const userDevices = users[userId].devices || [];
        const device = userDevices.find(d => 
            Buffer.from(d.credentialID, 'base64').equals(Buffer.from(body.id, 'base64'))
        );
        if (device) {
            user = users[userId];
            break;
        }
    }

    if (!user) {
        return res.status(400).json({ error: 'User not found' });
    }

    try {
        const verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin,
            expectedRPID: rpID,
            authenticator: {
                credentialID: Buffer.from(user.devices[0].credentialID, 'base64'),
                credentialPublicKey: Buffer.from(user.devices[0].credentialPublicKey, 'base64'),
                counter: user.devices[0].counter,
                transports: user.devices[0].transports,
            },
            requireUserVerification: true,
        });

        if (verification.verified) {
            // Update counter
            user.devices[0].counter = verification.authenticationInfo.newCounter;
            localStorage.setItem('users', JSON.stringify(users));
            
            // Create session
            const sessionId = `sess_${Date.now()}`;
            userSessions[sessionId] = { userId: user.id };
            
            res.json({ 
                verified: true, 
                user: { id: user.id, username: user.username },
                sessionId 
            });
        } else {
            res.status(400).json({ error: 'Authentication failed' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`WebAuthn demo server running at http://localhost:${port}`);
    console.log('Press Ctrl+C to stop the server');
});
