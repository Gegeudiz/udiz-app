/** Dispara notificação server-side para a equipe (WhatsApp CallMeBot / e-mail). Fire-and-forget. */
export function requestNotificarAdminNovaSolicitacao(
  accessToken: string,
  solicitacaoId: string
): void {
  void fetch("/api/notify/solicitacao-estoque", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ solicitacaoId }),
  }).catch(() => {});
}
