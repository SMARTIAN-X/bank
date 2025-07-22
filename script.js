// === GLOBAL ===
let users = JSON.parse(localStorage.getItem("smarxx_users")) || [];
const currentUserName = localStorage.getItem("smarxx_loggedIn");
const user = users.find(u => u.name === currentUserName);

// === SECURITY CHECK ===
if (!user) {
  alert("You must login first!");
  window.location.href = "landing.html";
}

// === INIT LOAN BALANCE IF NOT PRESENT ===
if (user.loanBalance === undefined) {
  user.loanBalance = 0;
}

// === SET ADMIN BALANCE IF MISSING/WRONG ===
if (user.name.toLowerCase() === "admin" && user.balance !== 999999999999) {
  user.balance = 999999999999;
  localStorage.setItem("smarxx_users", JSON.stringify(users));
}

// === INIT ACCOUNT IF FIRST TIME ===
if (!user.accountNumber) {
  user.accountNumber = 'SMX' + Math.floor(100000 + Math.random() * 900000);
  user.balance = user.name.toLowerCase() === "admin" ? 999999999999 : 50000;
  user.history = [];
  user.cardNumber = generateCardNumber();
  localStorage.setItem("smarxx_users", JSON.stringify(users));
}

// === UI UPDATES ===
document.getElementById("userNameDisplay").textContent = user.name;
document.getElementById("accountNumberDisplay").textContent = user.accountNumber;
document.getElementById("balanceDisplay").textContent = user.balance.toLocaleString();
document.getElementById("loanBalance").textContent = user.loanBalance.toLocaleString();
document.getElementById("cardHolder").textContent = user.name;
document.getElementById("cardNumber").textContent = user.cardNumber || generateCardNumber();

// === SIDEBAR TOGGLE ===
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

// === SECTION SWITCH ===
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.add("hidden"));
  const section = document.getElementById(id);
  if (section) section.classList.remove("hidden");

  if (id === "admin" && currentUserName.toLowerCase() === "admin") {
    loadAdminPanel();
  }
  if (id === "bills") {
  loadBillHistory();
}
  if (id === "history") {
    loadHistory();
  }
}

// === PROFILE NAME UPDATE ===
function saveNewName() {
  const newName = document.getElementById("newName").value.trim();
  if (!newName) return showMessage("profileMsg", "⚠️ Name cannot be empty");

  user.name = newName;
  localStorage.setItem("smarxx_users", JSON.stringify(users));
  localStorage.setItem("smarxx_loggedIn", newName);
  document.getElementById("userNameDisplay").textContent = newName;
  document.getElementById("cardHolder").textContent = newName;
  showMessage("profileMsg", "✅ Name updated!");
}

// === PASSWORD CHANGE FEATURE ===
function changePassword() {
  const current = document.getElementById("currentPassword").value.trim();
  const newPass = document.getElementById("newPassword").value.trim();
  const confirm = document.getElementById("confirmPassword").value.trim();

  if (!current || !newPass || !confirm) {
    return showMessage("passwordMsg", "⚠️ All fields are required.");
  }

  if (current !== user.password) {
    return showMessage("passwordMsg", "❌ Current password is incorrect.");
  }

  if (newPass !== confirm) {
    return showMessage("passwordMsg", "❌ Passwords do not match.");
  }

  if (newPass.length < 4) {
    return showMessage("passwordMsg", "⚠️ Password must be at least 4 characters.");
  }

  user.password = newPass;
  localStorage.setItem("smarxx_users", JSON.stringify(users));
  showMessage("passwordMsg", "✅ Password updated successfully.");
}
const profileInput = document.getElementById("profileInput");
const profileImage = document.getElementById("profileImage");

// Load stored profile picture if exists
const storedPic = localStorage.getItem(`smarxx_profile_pic_${user.name}`);
if (storedPic) profileImage.src = storedPic;

// On file upload
profileInput.addEventListener("change", () => {
  const file = profileInput.files[0];
  if (!file || !file.type.startsWith("image/")) {
    alert("❌ Please select a valid image file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const imgData = e.target.result;
    profileImage.src = imgData;
    localStorage.setItem(`smarxx_profile_pic_${user.name}`, imgData);
  };
  reader.readAsDataURL(file);
});


// === SEND MONEY ===
function sendMoney() {
  const accNo = document.getElementById("receiverAccNo").value.trim();
  const amount = parseFloat(document.getElementById("sendAmount").value);

  if (!accNo || isNaN(amount) || amount <= 0) {
    return showMessage("sendMsg", "⚠️ Invalid details.");
  }

  if (user.balance < amount) {
    return showMessage("sendMsg", "❌ Insufficient funds.");
  }

  const recipient = users.find(u => u.accountNumber === accNo);
  if (!recipient) return showMessage("sendMsg", "❌ Account not found.");

  user.balance -= amount;
  recipient.balance += amount;

  user.history = user.history || [];
  recipient.history = recipient.history || [];

  user.history.push({ type: "Sent", to: accNo, amount, date: new Date().toLocaleString() });
  recipient.history.push({ type: "Received", from: user.accountNumber, amount, date: new Date().toLocaleString() });

  localStorage.setItem("smarxx_users", JSON.stringify(users));
  document.getElementById("balanceDisplay").textContent = user.balance.toLocaleString();
  showMessage("sendMsg", `✅ ₦${amount.toLocaleString()} sent to ${recipient.name}`);
}

// === REQUEST LOAN ===
function requestLoan() {
  const amount = parseFloat(document.getElementById("loanAmount").value);

  if (isNaN(amount) || amount <= 0) {
    return showMessage("loanMsg", "⚠️ Invalid loan amount.");
  }

  user.balance += amount;
  user.loanBalance += amount;

  user.history = user.history || [];
  user.history.push({ type: "Loan", amount, date: new Date().toLocaleString() });

  localStorage.setItem("smarxx_users", JSON.stringify(users));
  document.getElementById("balanceDisplay").textContent = user.balance.toLocaleString();
  document.getElementById("loanBalance").textContent = user.loanBalance.toLocaleString();
  showMessage("loanMsg", `✅ ₦${amount.toLocaleString()} loan received.`);
}

// === REPAY LOAN ===
function repayLoan() {
  const amount = parseFloat(document.getElementById("repayAmount").value);

  if (isNaN(amount) || amount <= 0) {
    return showMessage("repayMsg", "⚠️ Enter a valid repayment amount.");
  }

  if (amount > user.balance) {
    return showMessage("repayMsg", "❌ Insufficient funds to repay.");
  }

  if (amount > user.loanBalance) {
    return showMessage("repayMsg", "⚠️ You're trying to repay more than you owe.");
  }

  user.balance -= amount;
  user.loanBalance -= amount;

  user.history = user.history || [];
  user.history.push({ type: "Loan Repayment", amount, date: new Date().toLocaleString() });

  localStorage.setItem("smarxx_users", JSON.stringify(users));
  document.getElementById("balanceDisplay").textContent = user.balance.toLocaleString();
  document.getElementById("loanBalance").textContent = user.loanBalance.toLocaleString();
  showMessage("repayMsg", `✅ You repaid ₦${amount.toLocaleString()}.`);
}

// === HISTORY ===
function loadHistory() {
  const historyDiv = document.getElementById("historyList");
  historyDiv.innerHTML = "";

  if (!user.history || user.history.length === 0) {
    historyDiv.innerHTML = "<p>No transactions yet.</p>";
    return;
  }

  user.history.slice().reverse().forEach(tx => {
    const p = document.createElement("p");
    p.textContent = `${tx.date} - ${tx.type} ₦${tx.amount.toLocaleString()} ${tx.to ? "to " + tx.to : tx.from ? "from " + tx.from : ""}`;
    historyDiv.appendChild(p);
  });
}

// === VIRTUAL CARD ===
function generateCardNumber() {
  return "5364 " + Math.floor(1000 + Math.random() * 9000) + " " +
         Math.floor(1000 + Math.random() * 9000) + " " +
         Math.floor(1000 + Math.random() * 9000);
}

// === ADMIN PANEL ===
function loadAdminPanel() {
  const adminDiv = document.getElementById("adminList");
  adminDiv.innerHTML = "";

  users.forEach(u => {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${u.name}</strong> – ${u.accountNumber} – ₦${u.balance.toLocaleString()}`;
    adminDiv.appendChild(p);
  });
}

// === LOGOUT ===
function logoutUser() {
  localStorage.removeItem("smarxx_loggedIn");
  window.location.href = "landing.html";
}

// === MESSAGE UTILITY ===
function showMessage(id, text, duration = 3000) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.style.opacity = 1;
  setTimeout(() => el.style.opacity = 0, duration);
}

// === SUPER ADMIN BADGE + PANEL LOGIC ===
const badge = document.getElementById("adminBadge");
const adminBtn = document.getElementById("adminPanelBtn");
const adminSection = document.getElementById("admin");

if (user.name.toLowerCase() === "admin") {
  badge.innerHTML = "👑 <span class='super-badge'>Super Admin</span>";
  if (adminSection) adminSection.classList.remove("hidden");
  if (adminBtn) adminBtn.style.display = "block";
} else {
  if (adminSection) adminSection.remove();
  if (adminBtn) adminBtn.remove();
}

// === FALLBACK: LOAD ADMIN PANEL IF SECTION IS VISIBLE ===
document.addEventListener("DOMContentLoaded", () => {
  if (user.name.toLowerCase() === "admin") {
    const adminVisible = !adminSection.classList.contains("hidden");
    if (adminVisible) loadAdminPanel();
  }
});
function payBill() {
  const type = document.getElementById("billType").value;
  const recipient = document.getElementById("billRecipient").value.trim();
  const amount = parseFloat(document.getElementById("billAmount").value);
  const msg = document.getElementById("billMsg");

  if (!type || !recipient || isNaN(amount) || amount <= 0) {
    return showMessage("billMsg", "⚠️ Please fill all fields correctly.");
  }

  if (type === "Airtime" || type === "Data" || type === "Internet") {
    const phoneRegex = /^[0-9]{10,14}$/;
    if (!phoneRegex.test(recipient)) {
      return showMessage("billMsg", "⚠️ Enter a valid phone/account number.");
    }
  }

  if (user.balance < amount) {
    return showMessage("billMsg", "❌ Insufficient funds.");
  }

  user.balance -= amount;

  user.history = user.history || [];
  user.history.push({
    type: `Bill Payment (${type})`,
    to: recipient,
    amount,
    billType: type,
    date: new Date().toLocaleString()
  });

  localStorage.setItem("smarxx_users", JSON.stringify(users));
  document.getElementById("balanceDisplay").textContent = user.balance.toLocaleString();

  showMessage("billMsg", `✅ ₦${amount.toLocaleString()} paid for ${type}`);
  document.getElementById("billRecipient").value = "";
  document.getElementById("billAmount").value = "";
  document.getElementById("billType").value = "";

  loadBillHistory(); // update the list
}

function loadBillHistory(filter = "All") {
  const list = document.getElementById("billHistoryList");
  list.innerHTML = "";

  const bills = (user.history || []).filter(tx => tx.type?.startsWith("Bill Payment"));
  const filtered = filter === "All" ? bills : bills.filter(tx => tx.billType === filter);

  if (filtered.length === 0) {
    list.innerHTML = "<p>No bill payments found.</p>";
    return;
  }

  filtered.reverse().forEach(tx => {
    const p = document.createElement("p");
    p.textContent = `${tx.date} – ${tx.billType}: ₦${tx.amount.toLocaleString()} to ${tx.to}`;
    list.appendChild(p);
  });
}

function filterBills(filterType) {
  loadBillHistory(filterType);
}
