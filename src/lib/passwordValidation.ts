// src/lib/passwordValidation.ts
// Validação de senha: mínimo 6 caracteres + 1 caractere especial

export interface PasswordValidationResult {
  isValid: boolean;
  strength: number; // 0-2
  errors: string[];
  checks: {
    minLength: boolean;
    hasSpecial: boolean;
  };
}

const SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?\\]/;

export function validatePassword(password: string): PasswordValidationResult {
  const checks = {
    minLength: password.length >= 6,
    hasSpecial: SPECIAL_CHARS.test(password),
  };

  const errors: string[] = [];
  if (!checks.minLength) errors.push("pelo menos 6 caracteres");
  if (!checks.hasSpecial) errors.push("um caractere especial (!@#$%^&*)");

  const passed = Object.values(checks).filter(Boolean).length;

  return {
    isValid: errors.length === 0,
    strength: passed,
    errors,
    checks,
  };
}

export const PASSWORD_REQUIREMENTS = [
  { key: "minLength" as const, label: "Mínimo 6 caracteres" },
  { key: "hasSpecial" as const, label: "Caractere especial (!@#$%^&*)" },
];
