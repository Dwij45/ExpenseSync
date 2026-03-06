const { z } = require('zod');
const { UserModel } = require('../models/UserModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const config = {
    jwtSecret: process.env.usersecretkey || process.env.JWT_SECRET || 'dev-secret',
    saltRounds: parseInt(process.env.SALT_ROUNDS || '8', 10)
};

const signupSchema = z.object({
    email: z.string().min(3).max(100).email(),
    password: z.string().min(6).regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[+$@#%&!]).+$/, "Password must contain uppercase, lowercase, number, and special symbol"),
    name: z.string().min(3).max(50)
});

async function createUser({ email, password, name }) {

    const existing = await UserModel.findOne({ email }).lean();
    if (existing) {
        const err = new Error('Email already registered');
        err.status = 409;
        throw err;
    }
    const parsed = signupSchema.safeParse({ email, password, name });
    if (!parsed.success) {
        const err = new Error('Invalid input');
        err.status = 400;
        err.details = parsed.error.issues;
        throw err;
    }

    const hashed = await bcrypt.hash(password, config.saltRounds);
    const created = await UserModel.create({
        email,
        password: hashed,
        name
    });

}

async function authenticate(email, password) {
    if (!email || !password) {
        const err = new Error('Missing credentials');
        err.status = 400;
        throw err;
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
        const err = new Error('Invalid credentials');
        err.status = 401;
        throw err;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        const err = new Error('Invalid credentials');
        err.status = 401;
        throw err;
    }

    const token = jwt.sign({ id: user._id.toString() }, config.jwtSecret);
    return { token, userId: user._id.toString() };
}

module.exports = { createUser, authenticate };