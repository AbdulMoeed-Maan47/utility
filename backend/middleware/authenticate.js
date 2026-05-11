// Attach the decoded JWT payload to req.user
const { getCurrentUser } = require("../auth");

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    req.user = getCurrentUser(authHeader);
    next();
  } catch (err) {
    return res.status(err.status || 401).json({ detail: err.message });
  }
}

module.exports = authenticate;
