import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatarDataVigente(dataStr: string, options?: Intl.DateTimeFormatOptions) {
  if (!dataStr) return "";
  // Adiciona T12:00:00 para garantir que a data seja interpretada no meio do dia local, 
  // evitando que o fuso horário (UTC vs Local) subtraia um dia.
  const date = new Date(dataStr.includes('T') ? dataStr : `${dataStr}T12:00:00`);
  return date.toLocaleDateString("pt-BR", options || { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Redimensiona e comprime uma imagem para reduzir o tamanho do arquivo antes do upload.
 */
export async function compressImage(file: File, maxWidth = 1000, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Erro ao comprimir imagem"));
          }
          // Limpa o canvas da memoria
          canvas.width = 0;
          canvas.height = 0;
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}
/**
 * Aplica máscara de telefone (formato brasileiro) dinamicamente.
 * Suporta (99) 9999-9999 e (99) 99999-9999
 */
export function mascaraTelefone(value: string) {
  if (!value) return "";
  value = value.replace(/\D/g, "");
  value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
  value = value.replace(/(\d)(\d{4})$/, "$1-$2");
  return value.substring(0, 15);
}

/**
 * Gera um UUID v4 de forma segura. Usa crypto.randomUUID se disponível,
 * ou fallback matemático para navegadores antigos/contextos não seguros (iOS antigo).
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
