const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const SECRET_KEY = process.env.SECRET_KEY;
const ALGORITHM = "HS256";
const ACCESS_TOKEN_EXPIRE_MINUTES = 30;
const REFRESH_TOKEN_EXPIRE_DAYS = 7;

// --- Password helpers ---

function hashPassword(password) {
  // bcryptjs synchronous hash, 12 rounds
  return bcrypt.hashSync(password, 12);
}

function verifyPassword(plain, hashed) {
  return bcrypt.compareSync(plain, hashed);
}

// --- Token creation ---

function createAccessToken(data) {
  const payload = { ...data };
  payload.type = "access";
  return jwt.sign(payload, SECRET_KEY, {
    algorithm: ALGORITHM,
    expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m`,
  });
}

function createRefreshToken(data) {
  const payload = { ...data };
  payload.type = "refresh";
  return jwt.sign(payload, SECRET_KEY, {
    algorithm: ALGORITHM,
    expiresIn: `${REFRESH_TOKEN_EXPIRE_DAYS}d`,
  });
}

// --- Token decoding ---

function decodeToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY, { algorithms: [ALGORITHM] });
  } catch (err) {
    const error = new Error("Invalid or expired token");
    error.status = 401;
    throw error;
  }
}

function getCurrentUser(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const err = new Error("Invalid auth header");
    err.status = 401;
    throw err;
  }
  const token = authHeader.split(" ")[1];
  return decodeToken(token);
}

module.exports = {
  hashPassword,
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  decodeToken,
  getCurrentUser,
};
