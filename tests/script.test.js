const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateDigits, formatCNPJ, generateCNPJ, normalizeCNPJ, validateCNPJ } = require("../script.js");

test("reproduz o exemplo oficial 12.ABC.345/01DE-35", () => {
  assert.equal(calculateDigits("12ABC34501DE"), "35");
  assert.equal(validateCNPJ("12.ABC.345/01DE-35").valid, true);
});

test("mantém compatibilidade com CNPJ numérico conhecido", () => {
  assert.equal(validateCNPJ("11.222.333/0001-81").valid, true);
});

test("rejeita formato e DV inválidos", () => {
  assert.equal(validateCNPJ("12.ABC.345/01DE-00").valid, false);
  assert.equal(validateCNPJ("ABC").valid, false);
  assert.throws(() => calculateDigits("abc"), /12 letras/);
});

test("gera e formata CNPJ sintético válido", () => {
  for (let index = 0; index < 100; index += 1) {
    const generated = generateCNPJ();
    assert.match(generated, /^[A-Z0-9]{12}\d{2}$/);
    assert.equal(validateCNPJ(generated).valid, true);
    assert.match(formatCNPJ(generated), /^[A-Z0-9]{2}\.[A-Z0-9]{3}\.[A-Z0-9]{3}\/[A-Z0-9]{4}-\d{2}$/);
  }
});

test("normaliza somente máscara e espaços", () => {
  assert.equal(normalizeCNPJ(" 12.abc.345/01de-35 "), "12ABC34501DE35");
});
