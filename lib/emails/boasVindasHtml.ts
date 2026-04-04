/** Corpo HTML do email de boas-vindas (cadastro sem obrigatoriedade de validar). */
export function buildBoasVindasEmailHtml(nomePrimeiro: string, linkValidar: string): string {
  const saudacao = nomePrimeiro.trim() || "Olá";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;font-family:Segoe UI,system-ui,sans-serif;background:#f4f4f5;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed 0%,#a855f7 100%);padding:28px 24px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.02em;">Bem-vindo ao Udiz!</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 8px;">
              <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#18181b;">${escapeHtml(saudacao)}</p>
              <p style="margin:0 0 16px;line-height:1.6;font-size:16px;color:#3f3f46;">
                Agora você pode <strong>encontrar o produto que quer</strong> — <strong>perto de você</strong>.
                O Udiz conecta você ao comércio local: busque, salve favoritos e descubra lojas da sua região.
              </p>
              <p style="margin:0 0 24px;line-height:1.6;font-size:16px;color:#3f3f46;">
                É rápido, simples e feito para quem prefere comprar bem pertinho.
              </p>
              <p style="margin:0 0 12px;font-size:14px;color:#71717a;">Clique aqui para validar seu cadastro (opcional):</p>
              <a href="${escapeAttr(linkValidar)}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;">
                Validar meu cadastro
              </a>
              <p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#a1a1aa;">
                Sua conta já funciona no app mesmo sem clicar neste link — use quando quiser confirmar que este email é seu.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 28px;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;">Udiz — Tudo bem pertinho de você.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
