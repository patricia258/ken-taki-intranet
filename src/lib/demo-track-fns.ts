import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { BRAND } from "./brand";

// Avisa por e-mail quando alguém abre a vitrine pública /demo. Não depende de
// nenhuma tabela nova — se RESEND_API_KEY ou DEMO_NOTIFY_EMAIL não estiverem
// configurados no servidor, a chamada simplesmente não faz nada.

export const notificarAcessoDemoFn = createServerFn({ method: "POST" })
  .validator((input: { role: string; path: string }) => input)
  .handler(async ({ data }) => {
    const resendKey = process.env["RESEND_API_KEY"];
    const notifyEmail = process.env["DEMO_NOTIFY_EMAIL"];
    if (!resendKey || !notifyEmail) {
      return {
        sent: false as const,
        debug: `faltando env: ${!resendKey ? "RESEND_API_KEY " : ""}${!notifyEmail ? "DEMO_NOTIFY_EMAIL" : ""}`.trim(),
      };
    }

    const referer = getRequestHeader("referer") || "(direto, sem referência)";
    const userAgent = getRequestHeader("user-agent") || "(desconhecido)";
    const ip = getRequestIP() || "(desconhecido)";
    const quando = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: BRAND.emailFrom,
          to: [notifyEmail],
          subject: `Demo Ken Taki acessada agora (${data.role})`,
          html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
            <p><strong>Alguém abriu a vitrine /demo.</strong></p>
            <table style="font-size:13px;color:#333">
              <tr><td style="padding:4px 10px 4px 0;color:#888">Quando</td><td>${quando}</td></tr>
              <tr><td style="padding:4px 10px 4px 0;color:#888">Visão</td><td>${data.role}</td></tr>
              <tr><td style="padding:4px 10px 4px 0;color:#888">Página</td><td>${data.path}</td></tr>
              <tr><td style="padding:4px 10px 4px 0;color:#888">Veio de</td><td>${referer}</td></tr>
              <tr><td style="padding:4px 10px 4px 0;color:#888">IP</td><td>${ip}</td></tr>
              <tr><td style="padding:4px 10px 4px 0;color:#888">Navegador</td><td style="word-break:break-all">${userAgent}</td></tr>
            </table>
          </div>`,
        }),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        console.error("[demo-track] resend falhou", response.status, detail);
        return { sent: false as const, debug: `status ${response.status}: ${detail}` };
      }
      return { sent: true as const };
    } catch (error) {
      console.error("[demo-track] erro de rede", error);
      return { sent: false as const, debug: (error as Error).message };
    }
  });
