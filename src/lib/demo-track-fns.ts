import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

// Avisa por e-mail quando alguém abre (e quando sai de) a vitrine pública
// /demo. Não depende de nenhuma tabela nova — se RESEND_API_KEY ou
// DEMO_NOTIFY_EMAIL não estiverem configurados no servidor, não faz nada.

type GeoInfo = { cidade: string; regiao: string; pais: string };

async function geolocalizarIp(ip: string): Promise<GeoInfo | null> {
  if (!ip || ip === "(desconhecido)" || ip === "::1" || ip.startsWith("127.") || ip.startsWith("192.168.")) {
    return null;
  }
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { "User-Agent": "ken-taki-demo-notify" },
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { city?: string; region?: string; country_name?: string; error?: boolean };
    if (json.error) return null;
    return {
      cidade: json.city || "cidade desconhecida",
      regiao: json.region || "",
      pais: json.country_name || "",
    };
  } catch {
    return null;
  }
}

function tipoDispositivo(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "Tablet";
  if (/mobile|android|iphone/.test(ua)) return "Celular";
  return "Computador";
}

function navegadorLegivel(userAgent: string) {
  const ua = userAgent;
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/chrome\//i.test(ua)) return "Chrome";
  if (/crios\//i.test(ua)) return "Chrome (iOS)";
  if (/fxios\//i.test(ua)) return "Firefox (iOS)";
  if (/firefox\//i.test(ua)) return "Firefox";
  if (/safari\//i.test(ua)) return "Safari";
  return "Navegador desconhecido";
}

async function enviarEmail(resendKey: string, notifyEmail: string, subject: string, rows: [string, string][]) {
  const linhas = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 10px 4px 0;color:#888">${label}</td><td>${value}</td></tr>`,
    )
    .join("");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Remetente de testes do Resend: não exige domínio verificado.
      // Isso é só um aviso interno para você, não um e-mail de produto.
      from: "Ken Taki Demo <onboarding@resend.dev>",
      to: [notifyEmail],
      subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
        <table style="font-size:13px;color:#333">${linhas}</table>
      </div>`,
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[demo-track] resend falhou", response.status, detail);
    return false;
  }
  return true;
}

export const notificarAcessoDemoFn = createServerFn({ method: "POST" })
  .validator((input: { role: string }) => input)
  .handler(async ({ data }) => {
    const resendKey = process.env["RESEND_API_KEY"];
    const notifyEmail = process.env["DEMO_NOTIFY_EMAIL"];
    if (!resendKey || !notifyEmail) return { sent: false as const };

    const userAgent = getRequestHeader("user-agent") || "(desconhecido)";
    const ip = getRequestIP() || "(desconhecido)";
    const quando = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const geo = await geolocalizarIp(ip);
    const local = geo ? `${geo.cidade}${geo.regiao ? " - " + geo.regiao : ""}${geo.pais ? ", " + geo.pais : ""}` : "não foi possível localizar";

    const sent = await enviarEmail(resendKey, notifyEmail, `Demo Ken Taki aberta agora (${data.role})`, [
      ["Quando", quando],
      ["Visão", data.role],
      ["Dispositivo", tipoDispositivo(userAgent)],
      ["Navegador", navegadorLegivel(userAgent)],
      ["Local (aprox.)", local],
      ["IP", ip],
    ]).catch(() => false);

    return { sent };
  });

export const notificarSaidaDemoFn = createServerFn({ method: "POST" })
  .validator((input: { role: string; durationSeconds: number }) => input)
  .handler(async ({ data }) => {
    const resendKey = process.env["RESEND_API_KEY"];
    const notifyEmail = process.env["DEMO_NOTIFY_EMAIL"];
    if (!resendKey || !notifyEmail) return { sent: false as const };

    const minutos = Math.floor(data.durationSeconds / 60);
    const segundos = data.durationSeconds % 60;
    const tempo = minutos > 0 ? `${minutos}min ${segundos}s` : `${segundos}s`;
    const quando = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    const sent = await enviarEmail(resendKey, notifyEmail, `Demo Ken Taki: sessão encerrada (${tempo})`, [
      ["Quando", quando],
      ["Visão", data.role],
      ["Tempo na página", tempo],
    ]).catch(() => false);

    return { sent };
  });
