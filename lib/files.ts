/** Limite alinhado ao bucket Supabase (2MB) em `storage_udiz_uploads`. */
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function validateImageFile(file: File | null | undefined): string | null {
  if (!file) return "Nenhum arquivo selecionado.";
  if (!file.type.startsWith("image/")) return "Selecione um arquivo de imagem válido.";
  if (file.size > MAX_IMAGE_SIZE) return "Imagem muito grande. Use até 2MB (JPEG, PNG ou WebP).";
  return null;
}

