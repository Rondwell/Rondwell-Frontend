require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { loginHandler, authMiddleware } = require("./auth");
const { setupWebSocket } = require("./websocket");
const database = require("./database");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/login", loginHandler);

app.get("/api/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

const server = http.createServer(app);
setupWebSocket(server);

async function startServer() {
  try {
    await database.initializeDatabase();
    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
