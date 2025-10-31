const ValidationUtil = require('../utils/validation.util');
const PasswordUtil = require('../utils/password.util');
const JwtUtil = require('../utils/jwt.util');
const userRepo = require('../database/user.repository');

function toPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    accountStatus: row.account_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function register({ email, password, name }) {
  if (!email || !password) throw new Error('Email and password are required');
  if (!ValidationUtil.isValidEmail(email)) throw new Error('Invalid email address');
  const pwdCheck = PasswordUtil.validate(password);
  if (!pwdCheck.valid) throw new Error(pwdCheck.errors.join(', '));

  const existing = await userRepo.findByEmail(email);
  if (existing) throw new Error('User already exists');

  const passwordHash = await PasswordUtil.hash(password);
  const user = await userRepo.createUser({ email, passwordHash, name });

  const tokens = JwtUtil.generateTokenPair(user.id, user.email);
  return { user: toPublicUser(user), tokens };
}

async function login({ email, password }) {
  if (!email || !password) throw new Error('Email and password are required');
  const user = await userRepo.findByEmail(email);
  if (!user) throw new Error('Invalid credentials');
  if (user.account_status !== 'active') throw new Error('Account disabled');
  const ok = await PasswordUtil.compare(password, user.password_hash);
  if (!ok) throw new Error('Invalid credentials');
  const tokens = JwtUtil.generateTokenPair(user.id, user.email);
  return { user: toPublicUser(user), tokens };
}

async function refreshToken(refreshToken) {
  const payload = JwtUtil.verifyToken(refreshToken);
  const user = await userRepo.findById(payload.userId);
  if (!user) throw new Error('User not found');
  if (user.account_status !== 'active') throw new Error('Account disabled');
  return JwtUtil.generateTokenPair(user.id, user.email);
}

async function getUserById(id) {
  const user = await userRepo.findById(id);
  return toPublicUser(user);
}

module.exports = {
  register,
  login,
  refreshToken,
  getUserById,
};

