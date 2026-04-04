/**
 * Número do WhatsApp da equipe Udiz (somente dígitos, com DDI 55).
 * Sobrescreva em .env.local / Vercel: NEXT_PUBLIC_UDIZ_WHATSAPP_SUPORTE=5534998335489
 */
export function getUdizWhatsappSuporteDigits(): string {
  const raw = process.env.NEXT_PUBLIC_UDIZ_WHATSAPP_SUPORTE?.replace(/\D/g, "") ?? "";
  if (raw.length >= 10) return raw;
  return "5534998335489";
}

export function abrirWhatsAppComTexto(texto: string): void {
  if (typeof window === "undefined") return;
  const n = getUdizWhatsappSuporteDigits();
  const url = `https://wa.me/${n}?text=${encodeURIComponent(texto)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

const MSG_ESPECIALISTA = "Olá, gostaria de falar com um Especialista do Udiz";

export function abrirWhatsAppEspecialistaUdiz(): void {
  abrirWhatsAppComTexto(MSG_ESPECIALISTA);
}

export function montarTextoWhatsAppNovaSolicitacaoEstoque(input: {
  nomeCompletoDono: string;
  cpf: string;
  segmento: string;
  cidade: string;
  bairro: string;
  endereco: string;
  cep: string;
  whatsappLoja: string;
  userId?: string;
}): string {
  const linhas = [
    "📋 *Nova solicitação — Udiz Estoque*",
    "",
    `Nome do dono: ${input.nomeCompletoDono}`,
    `CPF: ${input.cpf}`,
    `Segmento: ${input.segmento}`,
    `Cidade: ${input.cidade}`,
    `Bairro: ${input.bairro}`,
    `Endereço: ${input.endereco}`,
    `CEP: ${input.cep}`,
    `WhatsApp da loja: ${input.whatsappLoja}`,
  ];
  if (input.userId) {
    linhas.push(`ID usuário (Supabase): ${input.userId}`);
  }
  linhas.push("", "_Enviado pelo formulário do app._");
  return linhas.join("\n");
}
