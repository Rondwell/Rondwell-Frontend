const tokenKey = "rondwell_token";

async function login(email, password) {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    throw new Error("Login failed");
  }

  return res.json();
}

async function loadMe(token) {
  const res = await fetch("/api/me", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error("Unable to load profile");
  }

  return res.json();
}

function initLoginPage() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("login-message");

    try {
      const data = await login(email, password);
      localStorage.setItem(tokenKey, data.token);
      window.location.href = "/dashboard.html";
    } catch (error) {
      message.textContent = "Invalid email or password.";
    }
  });
}

function initDashboardPage() {
  const userData = document.getElementById("user-data");
  if (!userData) return;

  const token = localStorage.getItem(tokenKey);
  if (!token) {
    window.location.href = "/index.html";
    return;
  }

  loadMe(token)
    .then((data) => {
      userData.textContent = `Logged in as ${data.user.email} (${data.user.role})`;
    })
    .catch(() => {
      userData.textContent = "Session expired. Please login again.";
      localStorage.removeItem(tokenKey);
    });

  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${wsProtocol}//${window.location.host}`);
  const list = document.getElementById("ws-messages");
  const sendButton = document.getElementById("send-ws");

  ws.addEventListener("message", (event) => {
    const item = document.createElement("li");
    item.textContent = event.data;
    list.appendChild(item);
  });

  sendButton?.addEventListener("click", () => {
    ws.send(`Hello from dashboard at ${new Date().toISOString()}`);
  });
}

initLoginPage();
initDashboardPage();
