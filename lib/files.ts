/** Limite alinhado ao bucket Supabase (2MB) em `storage_udiz_uploads`. */
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;

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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar imagem."));
    img.src = src;
  });
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Falha ao converter imagem."));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

/**
 * Tenta otimizar imagens grandes para caber no limite de upload (2MB).
 * Mantém o fluxo simples no celular: usuário pode tirar foto normal e o app reduz automaticamente.
 */
export async function optimizeImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= MAX_IMAGE_SIZE) return file;

  const dataUrl = await fileToDataUrl(file);
  const image = await loadImage(dataUrl);

  const scaleToFit = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
  let width = Math.max(1, Math.round(image.width * scaleToFit));
  let height = Math.max(1, Math.round(image.height * scaleToFit));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  const contentType = file.type.includes("png") ? "image/webp" : "image/jpeg";
  const ext = contentType === "image/webp" ? "webp" : "jpg";

  for (let attempt = 0; attempt < 7; attempt++) {
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    const quality = Math.max(0.45, 0.84 - attempt * 0.08);
    const blob = await canvasToBlob(canvas, contentType, quality);
    if (blob.size <= MAX_IMAGE_SIZE) {
      return new File([blob], `foto.${ext}`, { type: contentType });
    }

    width = Math.max(720, Math.round(width * 0.86));
    height = Math.max(720, Math.round(height * 0.86));
  }

  return file;
}

