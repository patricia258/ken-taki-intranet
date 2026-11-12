import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

// Bridge de acesso só para a vitrine pública /demo. Nenhuma senha ou segredo
// fica no código-fonte: usamos a service role (já configurada no servidor
// para o login do colaborador) para abrir uma sessão da conta fictícia de
// gestor, do mesmo jeito que o login do colaborador já faz com magiclink.

const SUPABASE_URL = "https://nxmwhtkygiljkbovwixk.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bXdodGt5Z2lsamtib3Z3aXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMzU0MTcsImV4cCI6MjA5MjgxMTQxN30.vhFqRbCoArHrzsC65Pw6Ht9oPykvE3_lijn4unowKs8";

const DEMO_GESTOR_EMAIL = "demo.gestor@exemplo-kentaki.com";

function adminClient() {
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.");
  return createClient(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function authClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const criarSessaoGestorDemoFn = createServerFn({ method: "POST" }).handler(async () => {
  const admin = adminClient();
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: DEMO_GESTOR_EMAIL,
  });
  const tokenHash = linkData?.properties?.hashed_token;
  if (linkError || !tokenHash) {
    throw new Error(linkError?.message ?? "Ambiente de demonstração do gestor indisponível.");
  }

  const verifier = authClient();
  const { data: verified, error: verifyError } = await verifier.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });
  if (verifyError || !verified.session) {
    throw new Error(verifyError?.message ?? "Não foi possível abrir a sessão de demonstração.");
  }

  return {
    accessToken: verified.session.access_token,
    refreshToken: verified.session.refresh_token,
  };
});
