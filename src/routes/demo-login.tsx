import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { criarSessaoGestorDemoFn } from "@/lib/demo-server-fns";
import { criarSessaoColaboradorFn } from "@/lib/employee-server-fns";
import { saveEmployeeAccess } from "@/lib/employee-session";
import { useSession } from "@/lib/kt-store";
import { supabase } from "@/lib/supabase";

// Ponte de acesso para o ambiente de demonstração: autentica automaticamente
// com uma identidade fictícia, sem exigir nenhuma etapa de quem está navegando.

const DEMO_COLABORADOR = { nome: "Mariana Alves", cpf3: "101", filial: "cristo-rei" as const };

const searchSchema = z.object({
  role: z.enum(["colaborador", "gestor"]).catch("colaborador"),
});

export const Route = createFileRoute("/demo-login")({
  validateSearch: searchSchema,
  component: DemoLogin,
});

function DemoLogin() {
  const { role } = useSearch({ from: "/demo-login" });
  const navigate = useNavigate();
  const [, setSession] = useSession();
  const [erro, setErro] = useState("");

  useEffect(() => {
    let active = true;

    async function entrarColaborador() {
      const resultado = await criarSessaoColaboradorFn({ data: DEMO_COLABORADOR });
      if (!resultado.ok) throw new Error("demo colaborador indisponível");
      const { error } = await supabase.auth.setSession({
        access_token: resultado.supabaseSession.accessToken,
        refresh_token: resultado.supabaseSession.refreshToken,
      });
      if (error) throw error;
      saveEmployeeAccess(resultado.access);
      setSession({
        tipo: "colaborador",
        nome: resultado.access.nome,
        cpf3: DEMO_COLABORADOR.cpf3,
        filial: resultado.access.filial,
      });
      if (active) navigate({ to: "/painel", replace: true });
    }

    async function entrarGestor() {
      const { accessToken, refreshToken } = await criarSessaoGestorDemoFn();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
      if (active) navigate({ to: "/gestor", replace: true });
    }

    (role === "gestor" ? entrarGestor() : entrarColaborador()).catch(() => {
      if (active) setErro("Não foi possível abrir o ambiente de demonstração agora.");
    });

    return () => {
      active = false;
    };
  }, [role, navigate, setSession]);

  return (
    <div className="flex h-full min-h-[100dvh] items-center justify-center bg-[#fbf7f4] p-6 text-center">
      {erro ? (
        <p className="text-sm font-medium text-destructive">{erro}</p>
      ) : (
        <p className="text-sm font-semibold text-[#6c2444]">Abrindo ambiente de demonstração…</p>
      )}
    </div>
  );
}
