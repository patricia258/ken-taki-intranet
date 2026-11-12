import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Laptop, Smartphone, Sparkles } from "lucide-react";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [{ title: "Demonstração · Intranet Ken Taki" }],
  }),
  component: DemoShowcase,
});

type Role = "colaborador" | "gestor";

const ROLES: { id: Role; label: string; descricao: string }[] = [
  {
    id: "colaborador",
    label: "Visão do colaborador",
    descricao: "Check-in, documentos, mural, aniversários e canais de escuta.",
  },
  {
    id: "gestor",
    label: "Visão do gestor",
    descricao: "Clima da equipe, feedbacks, sugestões, vagas e assinaturas de política.",
  },
];

function DemoShowcase() {
  const [role, setRole] = useState<Role>("colaborador");
  const src = `/demo-login?role=${role}`;

  return (
    <div className="min-h-[100dvh] bg-[#fbf7f4]">
      <header className="border-b border-[#6c2444]/10 bg-[#4b1736] px-5 py-5 text-white sm:px-10">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black tracking-[0.08em]">KEN TAKI</span>
            <span className="h-5 w-px bg-white/25" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
              Intranet
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-[#e9c5d5]">
            <Sparkles className="h-3.5 w-3.5" />
            Ambiente de demonstração · dados fictícios
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-5 py-8 sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-extrabold text-[#351526] sm:text-3xl">
            Navegue pela intranet Ken Taki
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#5f4d56] sm:text-base">
            Escolha o acesso e veja as versões celular e web ao mesmo tempo. Tudo abaixo é navegável
            — os dados de pessoas e conteúdo são fictícios, só para apresentação.
          </p>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {ROLES.map((item) => (
            <button
              key={item.id}
              onClick={() => setRole(item.id)}
              className={`rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
                role === item.id
                  ? "bg-[#4b1736] text-white shadow-md"
                  : "bg-white text-[#4b1736] ring-1 ring-[#6c2444]/15 hover:bg-[#f4e9ed]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-xs font-medium text-[#8a6e7c]">
          {ROLES.find((item) => item.id === role)?.descricao}
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[320px_1fr] lg:items-start">
          <div className="flex flex-col items-center">
            <FrameLabel icon={<Smartphone className="h-4 w-4" />} label="Versão celular" />
            <PhoneFrame src={src} roleKey={role} />
          </div>
          <div className="flex flex-col items-center">
            <FrameLabel icon={<Laptop className="h-4 w-4" />} label="Versão web" />
            <DesktopFrame src={src} roleKey={role} />
          </div>
        </div>
      </main>
    </div>
  );
}

function FrameLabel({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-[#6c2444] shadow-sm ring-1 ring-[#6c2444]/10">
      {icon}
      {label}
    </div>
  );
}

const PHONE_W = 390;
const PHONE_H = 844;
const PHONE_SCALE = 0.82;

function PhoneFrame({ src, roleKey }: { src: string; roleKey: string }) {
  return (
    <div
      className="overflow-hidden rounded-[2.4rem] border-[6px] border-[#1c1420] bg-[#1c1420] shadow-[0_24px_60px_-28px_rgba(53,21,38,0.55)]"
      style={{ width: PHONE_W * PHONE_SCALE, height: PHONE_H * PHONE_SCALE }}
    >
      <div
        style={{
          width: PHONE_W,
          height: PHONE_H,
          transform: `scale(${PHONE_SCALE})`,
          transformOrigin: "top left",
        }}
      >
        <iframe
          key={roleKey}
          src={src}
          title="Pré-visualização celular"
          style={{ width: PHONE_W, height: PHONE_H, border: 0, background: "#fff" }}
        />
      </div>
    </div>
  );
}

const DESKTOP_W = 1360;
const DESKTOP_H = 860;

// O gestor demo compartilha uma única conta: se as duas telas pedirem acesso no
// mesmo instante, o Supabase recusa a segunda tentativa (limite de segurança
// contra pedidos repetidos). Atrasar a tela web evita essa corrida.
const SECOND_FRAME_DELAY_MS = 700;

function DesktopFrame({ src, roleKey }: { src: string; roleKey: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [readySrc, setReadySrc] = useState<string | null>(null);

  useEffect(() => {
    setReadySrc(null);
    const timer = setTimeout(() => setReadySrc(src), SECOND_FRAME_DELAY_MS);
    return () => clearTimeout(timer);
  }, [src, roleKey]);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? DESKTOP_W;
      setScale(width / DESKTOP_W);
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-[#6c2444]/15 bg-white shadow-[0_24px_60px_-28px_rgba(53,21,38,0.35)]">
      <div className="flex items-center gap-1.5 border-b border-[#6c2444]/10 bg-[#f4e9ed] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#e3a9bb]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#e9c5d5]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#f3dbe4]" />
      </div>
      <div ref={boxRef} className="w-full overflow-hidden" style={{ height: DESKTOP_H * scale }}>
        <div
          style={{
            width: DESKTOP_W,
            height: DESKTOP_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {readySrc ? (
            <iframe
              key={roleKey}
              src={readySrc}
              title="Pré-visualização web"
              style={{ width: DESKTOP_W, height: DESKTOP_H, border: 0, background: "#fff" }}
            />
          ) : (
            <div
              style={{ width: DESKTOP_W, height: DESKTOP_H }}
              className="flex items-center justify-center text-sm font-semibold text-[#6c2444]"
            >
              Abrindo ambiente de demonstração…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
