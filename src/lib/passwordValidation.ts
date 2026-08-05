// src/lib/passwordValidation.ts
// Validação de senha forte com requisitos de segurança

export interface PasswordValidationResult {
  isValid: boolean;
  strength: number; // 0-4
  errors: string[];
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

const SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?\\]/;

export function validatePassword(password: string): PasswordValidationResult {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: SPECIAL_CHARS.test(password),
  };

  const errors: string[] = [];
  if (!checks.minLength) errors.push("pelo menos 8 caracteres");
  if (!checks.hasUppercase) errors.push("uma letra maiúscula");
  if (!checks.hasLowercase) errors.push("uma letra minúscula");
  if (!checks.hasNumber) errors.push("um número");
  if (!checks.hasSpecial) errors.push("um caractere especial (!@#$%^&*)");

  const passed = Object.values(checks).filter(Boolean).length;
  // 0 = nenhum, 1-2 = fraca, 3 = razoável, 4 = boa, 5 = forte
  const strength = Math.min(passed, 4);

  return {
    isValid: errors.length === 0,
    strength,
    errors,
    checks,
  };
}

export const PASSWORD_REQUIREMENTS = [
  { key: "minLength" as const, label: "Mínimo 8 caracteres" },
  { key: "hasUppercase" as const, label: "Letra maiúscula (A-Z)" },
  { key: "hasLowercase" as const, label: "Letra minúscula (a-z)" },
  { key: "hasNumber" as const, label: "Número (0-9)" },
  { key: "hasSpecial" as const, label: "Caractere especial (!@#$%)" },
];
