import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Laptop, Smartphone, Sparkles } from "lucide-react";
import { notificarAcessoDemoFn, notificarSaidaDemoFn } from "@/lib/demo-track-fns";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demonstração · Intranet Ken Taki" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DemoShowcase,
});

type Role = "colaborador" | "gestor";
type Device = "celular" | "web";

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

const DEVICES: { id: Device; label: string; icon: typeof Smartphone }[] = [
  { id: "celular", label: "Celular", icon: Smartphone },
  { id: "web", label: "Web", icon: Laptop },
];

function DemoShowcase() {
  const [role, setRole] = useState<Role>("colaborador");
  const [device, setDevice] = useState<Device>("celular");
  const src = `/demo-login?role=${role}`;

  const entradaRef = useRef<number>(Date.now());
  const roleRef = useRef(role);
  roleRef.current = role;
  const saidaAvisadaRef = useRef(false);

  useEffect(() => {
    void notificarAcessoDemoFn({ data: { role } }).catch(() => undefined);

    const avisarSaida = () => {
      if (saidaAvisadaRef.current) return;
      const durationSeconds = Math.round((Date.now() - entradaRef.current) / 1000);
      if (durationSeconds < 3) return;
      saidaAvisadaRef.current = true;
      void notificarSaidaDemoFn({
        data: { role: roleRef.current, durationSeconds },
      }).catch(() => undefined);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") avisarSaida();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", avisarSaida);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", avisarSaida);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <main className="mx-auto w-full max-w-[1240px] px-5 py-8 sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-extrabold text-[#351526] sm:text-3xl">
            Navegue pela intranet Ken Taki
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#5f4d56] sm:text-base">
            Escolha o acesso e o tamanho de tela. Tudo abaixo é navegável — os dados de pessoas e
            conteúdo são fictícios, só para apresentação.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
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

        <div className="mt-5 flex justify-center gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-[#6c2444]/10 mx-auto w-fit">
          {DEVICES.map((item) => (
            <button
              key={item.id}
              onClick={() => setDevice(item.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                device === item.id ? "bg-[#6c2444] text-white" : "text-[#6c2444] hover:bg-[#f4e9ed]"
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          {device === "celular" ? (
            <PhoneFrame key={`phone-${role}`} src={src} />
          ) : (
            <DesktopFrame key={`web-${role}`} src={src} />
          )}
        </div>
      </main>
    </div>
  );
}

function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

const PHONE_W = 390;
const PHONE_H = 844;
const PHONE_MAX_RENDER_W = 380;
const PHONE_BEZEL_SIDE = 10;
const PHONE_BEZEL_TOP = 30;
const PHONE_BEZEL_BOTTOM = 26;

function PhoneFrame({ src }: { src: string }) {
  const [containerRef, containerWidth] = useContainerWidth();
  const available = containerWidth > 0 ? containerWidth : PHONE_MAX_RENDER_W;
  const renderW = Math.min(PHONE_MAX_RENDER_W, available);
  const scale = renderW / PHONE_W;

  return (
    <div ref={containerRef} className="w-full max-w-[380px]">
      <div
        className="mx-auto overflow-hidden rounded-[2.6rem] border-[6px] border-[#1c1420] bg-[#1c1420] shadow-[0_24px_60px_-28px_rgba(53,21,38,0.55)]"
        style={{
          width: PHONE_W * scale + PHONE_BEZEL_SIDE * 2,
          height: PHONE_H * scale + PHONE_BEZEL_TOP + PHONE_BEZEL_BOTTOM,
        }}
      >
        <div className="flex justify-center" style={{ height: PHONE_BEZEL_TOP }}>
          <span className="mt-2 h-4 w-24 rounded-full bg-black/80" />
        </div>
        <div
          className="overflow-hidden rounded-[1.4rem] bg-white"
          style={{ width: PHONE_W * scale, height: PHONE_H * scale, marginLeft: PHONE_BEZEL_SIDE }}
        >
          <div
            style={{
              width: PHONE_W,
              height: PHONE_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <iframe
              src={src}
              title="Pré-visualização celular"
              style={{ width: PHONE_W, height: PHONE_H, border: 0, background: "#fff" }}
            />
          </div>
        </div>
        <div className="flex justify-center" style={{ height: PHONE_BEZEL_BOTTOM }}>
          <span className="mt-2 h-1 w-28 rounded-full bg-white/70" />
        </div>
      </div>
    </div>
  );
}

const DESKTOP_W = 1360;
const DESKTOP_H = 860;

function DesktopFrame({ src }: { src: string }) {
  const [containerRef, containerWidth] = useContainerWidth();
  const scale = containerWidth > 0 ? Math.min(1, containerWidth / DESKTOP_W) : 1;

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-xl border border-[#6c2444]/15 bg-white shadow-[0_24px_60px_-28px_rgba(53,21,38,0.35)]"
    >
      <div className="flex items-center gap-1.5 border-b border-[#6c2444]/10 bg-[#f4e9ed] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#e3a9bb]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#e9c5d5]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#f3dbe4]" />
      </div>
      <div className="w-full overflow-hidden" style={{ height: DESKTOP_H * scale }}>
        <div
          style={{
            width: DESKTOP_W,
            height: DESKTOP_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <iframe
            src={src}
            title="Pré-visualização web"
            style={{ width: DESKTOP_W, height: DESKTOP_H, border: 0, background: "#fff" }}
          />
        </div>
      </div>
    </div>
  );
}
