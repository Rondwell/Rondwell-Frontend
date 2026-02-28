const jwt = require("jsonwebtoken");
const database = require("./database");

const JWT_SECRET = process.env.JWT_SECRET || "replace-this-in-production";

async function loginHandler(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await database.findUserByEmail(email);

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Authentication failed" });
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = {
  authMiddleware,
  loginHandler
};
