// Paste your deployed Google Apps Script Web App URL here
const ENDPOINT = "https://script.google.com/macros/s/AKfycbyWMBCEKg_TO3nMkYL9RNP7iKm_KFX1uCSBmRhAzoTJ280KII1YeP-PgWMK89-Wnk8/exec";

const form = document.getElementById("messageForm");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submitBtn");

function normalizePhone(raw) {
  return raw.replace(/\D/g, "");
}

function setStatus(msg, kind) {
  statusEl.textContent = msg;
  statusEl.className = "status" + (kind ? " " + kind : "");
}

function showThankYou(name) {
  document.querySelector(".card").innerHTML = `
    <div class="thankyou">
      <h2>Thank you, ${name}!</h2>
      <p>Your message has been delivered to Tamanna.</p>
    </div>`;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("", "");

  const name = form.name.value.trim();
  const phone = normalizePhone(form.phone.value);
  const message = form.message.value.trim();

  if (!name || !phone || !message) {
    setStatus("Please fill in all fields.", "error");
    return;
  }
  if (phone.length < 7) {
    setStatus("Please enter a valid phone number.", "error");
    return;
  }

  // Local guard so the same device doesn't easily resubmit
  const localKey = "tamanna_submitted_" + phone;
  if (localStorage.getItem(localKey)) {
    setStatus("This number has already sent a message.", "error");
    return;
  }

  submitBtn.disabled = true;
  setStatus("Sending...", "");

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      // text/plain avoids CORS preflight with Apps Script
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ name, phone, message }),
    });
    const data = await res.json();

    if (data.ok) {
      localStorage.setItem(localKey, "1");
      showThankYou(name);
    } else if (data.error === "duplicate") {
      setStatus("This number has already sent a message.", "error");
      submitBtn.disabled = false;
    } else {
      setStatus(data.error || "Something went wrong. Please try again.", "error");
      submitBtn.disabled = false;
    }
  } catch (err) {
    setStatus("Network error. Please try again.", "error");
    submitBtn.disabled = false;
  }
});
