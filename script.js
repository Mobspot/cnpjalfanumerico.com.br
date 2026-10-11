(function (global) {
  "use strict";

  const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const WEIGHTS_FIRST = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const WEIGHTS_SECOND = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  function normalizeCNPJ(value) {
    return String(value || "").toUpperCase().replace(/[.\/-]/g, "").replace(/\s/g, "");
  }

  function charToValue(char) {
    return char.charCodeAt(0) - 48;
  }

  function calculateDigit(base, weights) {
    const sum = weights.reduce((total, weight, index) => total + charToValue(base[index]) * weight, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }

  function calculateDigits(base) {
    if (!/^[A-Z0-9]{12}$/.test(base)) {
      throw new TypeError("A base deve conter exatamente 12 letras maiúsculas ou números.");
    }
    const first = calculateDigit(base, WEIGHTS_FIRST);
    const second = calculateDigit(base + first, WEIGHTS_SECOND);
    return `${first}${second}`;
  }

  function secureRandomIndex(max) {
    if (global.crypto && typeof global.crypto.getRandomValues === "function") {
      const values = new Uint32Array(1);
      global.crypto.getRandomValues(values);
      return values[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function generateBase() {
    return Array.from({ length: 12 }, () => CHARS[secureRandomIndex(CHARS.length)]).join("");
  }

  function generateCNPJ() {
    const base = generateBase();
    return base + calculateDigits(base);
  }

  function formatCNPJ(value) {
    const cnpj = normalizeCNPJ(value);
    if (cnpj.length !== 14) return value;
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
  }

  function validateCNPJ(value) {
    const normalized = normalizeCNPJ(value);
    if (!/^[A-Z0-9]{12}\d{2}$/.test(normalized)) {
      return { valid: false, normalized, reason: "Formato inválido. Use 12 letras ou números e 2 dígitos finais." };
    }
    const expected = calculateDigits(normalized.slice(0, 12));
    const valid = normalized.slice(12) === expected;
    return {
      valid,
      normalized,
      reason: valid ? "Dígitos verificadores válidos." : `Dígitos verificadores inválidos. Para essa base, o DV calculado é ${expected}.`
    };
  }

  const api = { normalizeCNPJ, calculateDigits, generateCNPJ, formatCNPJ, validateCNPJ };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.CNPJAlfanumerico = api;

  if (!global.document) return;

  const generatedInput = document.getElementById("cnpjInput");
  const generateButton = document.getElementById("generateBtn");
  const copyButton = document.getElementById("copyBtn");
  const validateInput = document.getElementById("validateInput");
  const validateButton = document.getElementById("validateBtn");
  const validationResult = document.getElementById("validationResult");
  const toast = document.getElementById("toast");

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    global.setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function generateAndShow() {
    generatedInput.value = formatCNPJ(generateCNPJ());
  }

  generateButton.addEventListener("click", generateAndShow);
  copyButton.addEventListener("click", async () => {
    if (!generatedInput.value) return;
    try {
      await navigator.clipboard.writeText(generatedInput.value);
      showToast("CNPJ sintético copiado.");
    } catch (_error) {
      generatedInput.select();
      showToast("Selecione e copie o número manualmente.");
    }
  });

  function runValidation() {
    const result = validateCNPJ(validateInput.value);
    validationResult.textContent = result.reason;
    validationResult.className = `result ${result.valid ? "valid" : "invalid"}`;
  }

  validateButton.addEventListener("click", runValidation);
  validateInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") runValidation();
  });

  generateAndShow();
})(typeof window !== "undefined" ? window : globalThis);
