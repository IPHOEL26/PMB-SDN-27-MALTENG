// ============================================================
// KONFIGURASI WAJIB
// 1. Deploy Code.gs sebagai Web App.
// 2. Salin URL Web App ke variabel WEB_APP_URL di bawah ini.
// ============================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzMzSv0HPrWYPKQxUE6Z5qC8j8zifepM0eS3u6HPvBVi0t17J2xNdImi0RVN10dkkKs/exec";

const form = document.getElementById("pmbForm");
const allSteps = Array.from(document.querySelectorAll(".step"));
const mutationStep = document.getElementById("mutationStep");
const mutationInputs = mutationStep ? Array.from(mutationStep.querySelectorAll("input, select, textarea")) : [];
const jenisPendaftaranInput = document.getElementById("jenisPendaftaran");
const typeSelector = document.getElementById("typeSelector");
const progressWrap = document.getElementById("progressWrap");
const chooseNewBtn = document.getElementById("chooseNewBtn");
const chooseMutasiBtn = document.getElementById("chooseMutasiBtn");
const changeTypeBtn = document.getElementById("changeTypeBtn");
const selectedTypeLabel = document.getElementById("selectedTypeLabel");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const stepLabel = document.getElementById("stepLabel");
const percentLabel = document.getElementById("percentLabel");
const progressFill = document.getElementById("progressFill");
const stepper = document.getElementById("stepper");
const toast = document.getElementById("toast");
const submitFrame = document.getElementById("submitFrame");
const successModal = document.getElementById("successModal");
const newEntryBtn = document.getElementById("newEntryBtn");
const summaryBox = document.getElementById("summaryBox");

let currentStep = 0;
let submitted = false;
let registrationType = "Murid Baru";

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
normalizeDigitInput("#nisn, #mutasiNisn", 10);
normalizeDigitInput("#kodePos", 5);
normalizeDigitInput("#npsnAsal", 8);
normalizeDigitInput("#hp, #telepon, #rekening", 20);

function getActiveSteps() {
  return allSteps.filter(step => !step.classList.contains("step-hidden"));
}

function setMutationFieldsState(isMutation) {
  if (!mutationStep) return;

  mutationStep.classList.toggle("step-hidden", !isMutation);
  mutationInputs.forEach(input => {
    input.disabled = !isMutation;

    if ([
      "mutasiNama",
      "sekolahAsalLengkap",
      "kabupatenAsal",
      "kecamatanAsal",
      "npsnAsal",
      "mutasiNisn"
    ].includes(input.id)) {
      input.required = isMutation;
    }

    if (!isMutation) input.classList.remove("invalid");
  });
}

function startForm(type) {
  registrationType = type === "Murid Mutasi" ? "Murid Mutasi" : "Murid Baru";
  jenisPendaftaranInput.value = registrationType;
  selectedTypeLabel.textContent = registrationType;

  const isMutation = registrationType === "Murid Mutasi";
  setMutationFieldsState(isMutation);

  typeSelector.classList.add("is-hidden");
  progressWrap.classList.remove("is-hidden");
  form.classList.remove("is-hidden");

  submitBtn.textContent = isMutation ? "Kirim Data Mutasi" : "Kirim Pendaftaran";
  currentStep = 0;
  updateStep();
}

function resetToTypeSelector() {
  form.reset();
  currentStep = 0;
  submitted = false;
  submitBtn.disabled = false;
  submitBtn.textContent = "Kirim Pendaftaran";
  selectedTypeLabel.textContent = "Belum dipilih";
  jenisPendaftaranInput.value = "Murid Baru";
  setMutationFieldsState(false);
  allSteps.forEach(step => step.classList.remove("active"));
  progressWrap.classList.add("is-hidden");
  form.classList.add("is-hidden");
  typeSelector.classList.remove("is-hidden");
  if (stepper) stepper.innerHTML = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderStepper(steps) {
  if (!stepper) return;

  stepper.innerHTML = steps.map((step, index) => {
    const state = index < currentStep ? "done" : index === currentStep ? "current" : "";
    const title = step.dataset.title || `Langkah ${index + 1}`;
    return `
      <li class="${state}">
        <span class="step-number">${index + 1}</span>
        <span class="step-title">${title}</span>
      </li>
    `;
  }).join("");
}

function updateStep() {
  const steps = getActiveSteps();
  if (currentStep > steps.length - 1) currentStep = steps.length - 1;

  allSteps.forEach(step => step.classList.remove("active"));
  steps[currentStep].classList.add("active");

  const percent = Math.round(((currentStep + 1) / steps.length) * 100);
  stepLabel.textContent = `Langkah ${currentStep + 1} dari ${steps.length}: ${steps[currentStep].dataset.title}`;
  percentLabel.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;
  renderStepper(steps);

  prevBtn.style.display = currentStep === 0 ? "none" : "inline-flex";
  nextBtn.style.display = currentStep === steps.length - 1 ? "none" : "inline-flex";
  submitBtn.style.display = currentStep === steps.length - 1 ? "inline-flex" : "none";

  if (currentStep === steps.length - 1) renderSummary();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateField(input) {
  if (input.disabled) return true;

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

  if (["nisn", "mutasiNisn"].includes(id) && value && !/^\d{10}$/.test(value)) {
    input.classList.add("invalid");
    return false;
  }

  if (id === "npsnAsal" && value && !/^\d{8}$/.test(value)) {
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
  const steps = getActiveSteps();
  const inputs = Array.from(steps[currentStep].querySelectorAll("input, select, textarea"));
  const valid = inputs.every(validateField);
  if (!valid) {
    const firstInvalid = steps[currentStep].querySelector(".invalid");
    if (firstInvalid) firstInvalid.focus();
    showToast("Mohon lengkapi atau perbaiki data yang bertanda merah.", "error");
  }
  return valid;
}

function syncMutationFields() {
  if (registrationType !== "Murid Mutasi") return;

  const nama = document.getElementById("nama");
  const nisn = document.getElementById("nisn");
  const mutasiNama = document.getElementById("mutasiNama");
  const mutasiNisn = document.getElementById("mutasiNisn");

  if (mutasiNama && nama && !mutasiNama.value.trim()) mutasiNama.value = nama.value.trim();
  if (mutasiNisn && nisn && !mutasiNisn.value.trim()) mutasiNisn.value = nisn.value.trim();
}

function renderSummary() {
  const data = new FormData(form);
  const rows = [
    ["Jenis Pendaftaran", registrationType],
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

  if (registrationType === "Murid Mutasi") {
    rows.push(
      ["Sekolah Asal Mutasi", data.get("Mutasi - Sekolah Asal Lengkap")],
      ["Kabupaten Sekolah Asal", data.get("Mutasi - Kabupaten Sekolah Asal")],
      ["Kecamatan Sekolah Asal", data.get("Mutasi - Kecamatan Sekolah Asal")],
      ["NPSN Sekolah Asal", data.get("Mutasi - NPSN Sekolah Asal")],
      ["NISN Murid Mutasi", data.get("Mutasi - NISN Murid")]
    );
  }

  summaryBox.innerHTML = rows.map(([label, value]) => `
    <div class="summary-row"><strong>${label}</strong><span>${value || "-"}</span></div>
  `).join("");
}

chooseNewBtn.addEventListener("click", () => startForm("Murid Baru"));
chooseMutasiBtn.addEventListener("click", () => startForm("Murid Mutasi"));
changeTypeBtn.addEventListener("click", resetToTypeSelector);

prevBtn.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep -= 1;
    updateStep();
  }
});

nextBtn.addEventListener("click", () => {
  syncMutationFields();
  if (!validateCurrentStep()) return;
  if (currentStep < getActiveSteps().length - 1) {
    currentStep += 1;
    updateStep();
  }
});

async function sendFormData() {
  syncMutationFields();
  if (!validateAllSteps()) return;

  if (!WEB_APP_URL || WEB_APP_URL.includes("PASTE_URL")) {
    showToast("URL Web App Google Apps Script belum dipasang di script.js.", "error");
    return;
  }

  submitted = true;
  submitBtn.disabled = true;
  submitBtn.textContent = "Mengirim...";
  showToast("Data sedang dikirim. Mohon tunggu...", "");

  try {
    const formData = new FormData(form);
    const body = new URLSearchParams();
    formData.forEach((value, key) => body.append(key, value));

    // mode no-cors dipakai agar pengiriman dari GitHub Pages/hosting ke Google Apps Script
    // tetap berjalan stabil pada browser HP. Respons tidak dibaca, tetapi data tetap terkirim.
    await fetch(WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      body
    });

    setTimeout(showSuccess, 600);
  } catch (error) {
    submitted = false;
    submitBtn.disabled = false;
    submitBtn.textContent = registrationType === "Murid Mutasi" ? "Kirim Data Mutasi" : "Kirim Pendaftaran";
    showToast("Data belum terkirim. Periksa koneksi internet, lalu tekan Kirim lagi.", "error");
  }
}

function validateAllSteps() {
  const steps = getActiveSteps();

  for (let i = 0; i < steps.length; i += 1) {
    const inputs = Array.from(steps[i].querySelectorAll("input, select, textarea"));
    const valid = inputs.every(validateField);

    if (!valid) {
      currentStep = i;
      updateStep();
      setTimeout(() => {
        const firstInvalid = steps[i].querySelector(".invalid");
        if (firstInvalid) firstInvalid.focus();
        showToast(`Mohon lengkapi atau perbaiki data pada Langkah ${i + 1}.`, "error");
      }, 150);
      return false;
    }
  }

  return true;
}

submitBtn.addEventListener("click", sendFormData);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  sendFormData();
});


function showSuccess() {
  submitted = false;
  submitBtn.disabled = false;
  submitBtn.textContent = registrationType === "Murid Mutasi" ? "Kirim Data Mutasi" : "Kirim Pendaftaran";
  successModal.classList.add("show");
  successModal.setAttribute("aria-hidden", "false");
}

newEntryBtn.addEventListener("click", () => {
  successModal.classList.remove("show");
  successModal.setAttribute("aria-hidden", "true");
  resetToTypeSelector();
});

setMutationFieldsState(false);
progressWrap.classList.add("is-hidden");
form.classList.add("is-hidden");
