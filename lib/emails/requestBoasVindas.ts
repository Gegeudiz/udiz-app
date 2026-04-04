/** Dispara envio assíncrono; falhas não devem travar o cadastro. */
export function requestBoasVindasEmail(accessToken: string): void {
  void fetch("/api/emails/boas-vindas", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => {});
}
