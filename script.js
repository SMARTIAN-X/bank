// Load users and logged-in user
let users = JSON.parse(localStorage.getItem("smarxx_users")) || [];
const currentUserName = localStorage.getItem("smarxx_loggedIn");
const user = users.find(u => u.name === currentUserName);

// Redirect if not logged in
if (!user) {
  alert("You must login first!");
  window.location.href = "landing.html";
}

// === INIT ACCOUNT IF FIRST TIME ===
if (!user.accountNumber) {
  user.accountNumber = 'SMX' + Math.floor(100000 + Math.random() * 900000);
  user.balance = user.name.toLowerCase() === "admin" ? 999999999999 : 50000;
  user.history = [];
  user.cardNumber = generateCardNumber();
  localStorage.setItem("smarxx_users", JSON.stringify(users));
}


// Display user info
document.getElementById("userNameDisplay").textContent = user.name;
document.getElementById("accountNumberDisplay").textContent = user.accountNumber;
document.getElementById("balanceDisplay").textContent = user.balance.toLocaleString();
document.getElementById("cardHolder").textContent = user.name;
document.getElementById("cardNumber").textContent = user.cardNumber;

// Sidebar toggle
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("open");
}

// Save new name
function saveNewName() {
  const newName = document.getElementById("newName").value.trim();
  if (!newName) return showMessage("profileMsg", "⚠️ Name cannot be empty");

  user.name = newName;
  document.getElementById("userNameDisplay").textContent = newName;
  document.getElementById("cardHolder").textContent = newName;
  localStorage.setItem("smarxx_users", JSON.stringify(users));
  localStorage.setItem("smarxx_loggedIn", newName);
  showMessage("profileMsg", "✅ Name updated!");
}

// Send money
function sendMoney() {
  const accNo = document.getElementById("receiverAccNo").value.trim();
  const amount = parseFloat(document.getElementById("sendAmount").value);

  if (!accNo || isNaN(amount) || amount <= 0) {
    return showMessage("sendMsg", "⚠️ Invalid input.");
  }

  if (user.balance < amount) {
    return showMessage("sendMsg", "❌ Insufficient balance.");
  }

  const recipient = users.find(u => u.accountNumber === accNo);
  if (!recipient) return showMessage("sendMsg", "❌ Account not found.");

  user.balance -= amount;
  recipient.balance += amount;

  const now = new Date().toLocaleString();
  user.history.push({ type: "Sent", to: accNo, amount, date: now });
  recipient.history = recipient.history || [];
  recipient.history.push({ type: "Received", from: user.accountNumber, amount, date: now });

  localStorage.setItem("smarxx_users", JSON.stringify(users));
  document.getElementById("balanceDisplay").textContent = user.balance.toLocaleString();
  showMessage("sendMsg", `✅ ₦${amount.toLocaleString()} sent!`);
}

// Request loan
function requestLoan() {
  const amount = parseFloat(document.getElementById("loanAmount").value);
  if (isNaN(amount) || amount <= 0) return showMessage("loanMsg", "⚠️ Invalid amount.");

  user.balance += amount;
  const now = new Date().toLocaleString();
  user.history.push({ type: "Loan", amount, date: now });

  localStorage.setItem("smarxx_users", JSON.stringify(users));
  document.getElementById("balanceDisplay").textContent = user.balance.toLocaleString();
  showMessage("loanMsg", `✅ Loan of ₦${amount.toLocaleString()} approved!`);
}

// Load transaction history
function loadHistory() {
  const historyDiv = document.getElementById("historyList");
  historyDiv.innerHTML = "";

  if (!user.history || user.history.length === 0) {
    historyDiv.innerHTML = "<p>No transactions yet.</p>";
    return;
  }

  user.history.slice().reverse().forEach(tx => {
    const p = document.createElement("p");
    p.textContent = `${tx.date} – ${tx.type} ₦${tx.amount.toLocaleString()} ${tx.to ? "to " + tx.to : tx.from ? "from " + tx.from : ""}`;
    historyDiv.appendChild(p);
  });
}

// Load admin panel
function loadAdminPanel() {
  const adminDiv = document.getElementById("adminList");
  adminDiv.innerHTML = "";

  users.forEach(u => {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${u.name}</strong> – ${u.accountNumber} – ₦${u.balance.toLocaleString()}`;
    adminDiv.appendChild(p);
  });
}

// Virtual card number generator
function generateCardNumber() {
  return "5364 " + Math.floor(1000 + Math.random() * 9000) + " " +
         Math.floor(1000 + Math.random() * 9000) + " " +
         Math.floor(1000 + Math.random() * 9000);
}

// Logout
function logoutUser() {
  localStorage.removeItem("smarxx_loggedIn");
  window.location.href = "landing.html";
}

// Show timed message
function showMessage(id, text, duration = 3000) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.style.opacity = 1;
  setTimeout(() => el.style.opacity = 0, duration);
}

// Hide admin if not "admin"
if (currentUserName.toLowerCase() !== "admin") {
  document.getElementById("adminPanelBtn").style.display = "none";
}

// Scroll-based triggers for history/admin
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      if (entry.target.id === "history") loadHistory();
      if (entry.target.id === "admin" && currentUserName.toLowerCase() === "admin") {
        loadAdminPanel();
      }
    }
  });
}, { threshold: 0.3 });

observer.observe(document.getElementById("history"));
observer.observe(document.getElementById("admin"));
// === ADMIN BADGE ===
const badge = document.getElementById("adminBadge");
if (user.name.toLowerCase() === "admin") {
  badge.innerHTML = "👑 <span class='super-badge'>Super Admin</span>";
}
