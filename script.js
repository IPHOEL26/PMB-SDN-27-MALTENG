// ============================================================
// KONFIGURASI WAJIB
// 1. Deploy Code.gs sebagai Web App.
// 2. Salin URL Web App ke variabel WEB_APP_URL di bawah ini.
// ============================================================
const WEB_APP_URL = "https://script.google.com/a/macros/admin.sd.belajar.id/s/AKfycbyouVQOkDP0wMBY797HEj4kM1oe0NCCEl09pKhw_4r8TnP9zZEXFFQmyfFSExUQ8-2gJA/exec";

const form = document.getElementById("pmbForm");
const steps = Array.from(document.querySelectorAll(".step"));
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const stepLabel = document.getElementById("stepLabel");
const percentLabel = document.getElementById("percentLabel");
const progressFill = document.getElementById("progressFill");
const toast = document.getElementById("toast");
const submitFrame = document.getElementById("submitFrame");
const successModal = document.getElementById("successModal");
const newEntryBtn = document.getElementById("newEntryBtn");
const summaryBox = document.getElementById("summaryBox");

let currentStep = 0;
let submitted = false;

function showToast(message, type = "") {
  toast.textContent = message;
  toast.className = `toast show ${type}`.trim();
  setTimeout(() => toast.className = "toast", 3200);
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeDigitInput(selector, maxLength) {
  document.querySelectorAll(selector).forEach(input => {
    input.addEventListener("input", () => {
      input.value = digitsOnly(input.value).slice(0, maxLength);
    });
  });
}

normalizeDigitInput("#nik, #ayahNik, #ibuNik, #waliNik, #noKk", 16);
normalizeDigitInput("#nisn", 10);
normalizeDigitInput("#kodePos", 5);
normalizeDigitInput("#hp, #telepon, #rekening", 20);

function updateStep() {
  steps.forEach((step, index) => step.classList.toggle("active", index === currentStep));
  const percent = Math.round(((currentStep + 1) / steps.length) * 100);
  stepLabel.textContent = `Langkah ${currentStep + 1} dari ${steps.length}: ${steps[currentStep].dataset.title}`;
  percentLabel.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;
  prevBtn.style.display = currentStep === 0 ? "none" : "inline-flex";
  nextBtn.style.display = currentStep === steps.length - 1 ? "none" : "inline-flex";
  submitBtn.style.display = currentStep === steps.length - 1 ? "inline-flex" : "none";

  if (currentStep === steps.length - 1) renderSummary();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateField(input) {
  input.classList.remove("invalid");

  if (input.hasAttribute("required")) {
    const isCheckbox = input.type === "checkbox";
    if ((isCheckbox && !input.checked) || (!isCheckbox && !input.value.trim())) {
      input.classList.add("invalid");
      return false;
    }
  }

  const id = input.id;
  const value = input.value.trim();

  if (["nik", "noKk"].includes(id) && value && !/^\d{16}$/.test(value)) {
    input.classList.add("invalid");
    return false;
  }

  if (["ayahNik", "ibuNik", "waliNik"].includes(id) && value && !/^\d{16}$/.test(value)) {
    input.classList.add("invalid");
    return false;
  }

  if (id === "nisn" && value && !/^\d{10}$/.test(value)) {
    input.classList.add("invalid");
    return false;
  }

  if (id === "email" && value && !/^\S+@\S+\.\S+$/.test(value)) {
    input.classList.add("invalid");
    return false;
  }

  return true;
}

function validateCurrentStep() {
  const inputs = Array.from(steps[currentStep].querySelectorAll("input, select, textarea"));
  const valid = inputs.every(validateField);
  if (!valid) {
    const firstInvalid = steps[currentStep].querySelector(".invalid");
    if (firstInvalid) firstInvalid.focus();
    showToast("Mohon lengkapi atau perbaiki data yang bertanda merah.", "error");
  }
  return valid;
}

function renderSummary() {
  const data = new FormData(form);
  const rows = [
    ["Nama Murid", data.get("Nama")],
    ["NIK Murid", data.get("NIK")],
    ["Tanggal Lahir", data.get("Tanggal Lahir")],
    ["Jenis Kelamin", data.get("JK")],
    ["Alamat", data.get("Alamat")],
    ["HP", data.get("HP")],
    ["Nama Ayah", data.get("Data Ayah - Nama")],
    ["Nama Ibu", data.get("Data Ibu - Nama")],
    ["No KK", data.get("No KK")]
  ];
  summaryBox.innerHTML = rows.map(([label, value]) => `
    <div class="summary-row"><strong>${label}</strong><span>${value || "-"}</span></div>
  `).join("");
}

prevBtn.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep -= 1;
    updateStep();
  }
});

nextBtn.addEventListener("click", () => {
  if (!validateCurrentStep()) return;
  if (currentStep < steps.length - 1) {
    currentStep += 1;
    updateStep();
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateCurrentStep()) return;

  if (!WEB_APP_URL || WEB_APP_URL.includes("PASTE_URL")) {
    showToast("URL Web App Google Apps Script belum dipasang di script.js.", "error");
    return;
  }

  submitted = true;
  submitBtn.disabled = true;
  submitBtn.textContent = "Mengirim...";
  form.action = WEB_APP_URL;

  // Submit standar ke iframe agar aman dari kendala CORS GitHub Pages -> Apps Script.
  HTMLFormElement.prototype.submit.call(form);

  // Cadangan tampilan berhasil. Data tetap diproses oleh Apps Script.
  setTimeout(() => {
    if (submitted) showSuccess();
  }, 1800);
});

submitFrame.addEventListener("load", () => {
  if (submitted) showSuccess();
});

function showSuccess() {
  submitted = false;
  submitBtn.disabled = false;
  submitBtn.textContent = "Kirim Pendaftaran";
  successModal.classList.add("show");
  successModal.setAttribute("aria-hidden", "false");
}

newEntryBtn.addEventListener("click", () => {
  successModal.classList.remove("show");
  successModal.setAttribute("aria-hidden", "true");
  form.reset();
  currentStep = 0;
  updateStep();
});

updateStep();
