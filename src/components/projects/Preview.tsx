"use client";
import { useEffect, useRef, useState } from "react";
import { useShell } from "@/components/shell/context";
const initial = [
  "Definir escopo do projeto",
  "Desenvolver protótipo",
  "Integração com API",
  "Testes e ajustes",
  "Documentação",
];
export default function Preview({ index = 0 }: { index?: number }) {
  const { t } = useShell(),
    [tasks, setTasks] = useState(
      initial.map((title, i) => ({ id: i, title, done: false })),
    ),
    [flow, setFlow] = useState(-1),
    timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );
  const run = () => {
    if (timer.current) clearInterval(timer.current);
    setFlow(0);
    let step = 0;
    timer.current = setInterval(() => {
      step++;
      setFlow(step);
      if (step === 3 && timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    }, 600);
  };
  return (
    <div className={"project-preview preview-" + index}>
      {index === 0 ? (
        <>
          <div className="desktop-device">
            <div className="device-top">
              <span>LM</span>
              <span>{t("Estudo de interface", "Interface study")}</span>
              <i />
            </div>
            <div className="workspace-preview">
              <aside>
                <span>{t("Início", "Home")}</span>
                <b>{t("Tarefas", "Tasks")}</b>
                <span>{t("Projetos", "Projects")}</span>
                <span>{t("Calendário", "Calendar")}</span>
              </aside>
              <div className="task-area">
                <h3>{t("Planejamento", "Planning")}</h3>
                <div className="task-menu">
                  <span>{t("Suas próximas ações", "Your next actions")}</span>
                  <button
                    onClick={() =>
                      setTasks([
                        ...tasks,
                        {
                          id: Date.now(),
                          title: t("Nova tarefa", "New task"),
                          done: false,
                        },
                      ])
                    }
                  >
                    {t("+ Nova tarefa", "+ New task")}
                  </button>
                </div>
                <div className="tasks">
                  {tasks.map((task, i) => (
                    <label key={task.id}>
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() =>
                          setTasks(
                            tasks.map((x) =>
                              x.id === task.id ? { ...x, done: !x.done } : x,
                            ),
                          )
                        }
                      />
                      <span className={task.done ? "done" : ""}>
                        {initial.includes(task.title)
                          ? t(
                              task.title,
                              [
                                "Define project scope",
                                "Develop prototype",
                                "API integration",
                                "Tests and refinements",
                                "Documentation",
                              ][i % 5],
                            )
                          : task.title}
                      </span>
                      <small>···</small>
                    </label>
                  ))}
                </div>
                <div className="task-stats">
                  <div>
                    <small>{t("Em andamento", "In progress")}</small>
                    <b>{tasks.filter((x) => !x.done).length}</b>
                  </div>
                  <div>
                    <small>{t("Concluídas", "Completed")}</small>
                    <b>{tasks.filter((x) => x.done).length}</b>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="phone-device" aria-hidden="true">
            <span>LM</span>
            <h4>{t("Tarefas", "Tasks")}</h4>
            {tasks.slice(0, 4).map((x) => (
              <div key={x.id}>
                <i />
                {t(
                  x.title,
                  [
                    "Define scope",
                    "Develop prototype",
                    "API integration",
                    "Tests",
                  ][x.id % 4],
                )}
              </div>
            ))}
            <span className="phone-add">+</span>
          </div>
        </>
      ) : index === 1 ? (
        <div className="flow-preview">
          <span>{t("Simulação local", "Local simulation")}</span>
          <div className="flow-track">
            {[
              t("Entrada", "Input"),
              t("Validação", "Validation"),
              t("Ação", "Action"),
            ].map((label, i) => (
              <div key={label} className={flow >= i ? "lit" : ""}>
                <i>{["↳", "✓", "↗"][i]}</i>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <button className="button" onClick={run}>
            {t("Executar fluxo", "Run workflow")} ↗
          </button>
          <p aria-live="polite">
            {flow === 3
              ? t("Fluxo concluído localmente.", "Workflow completed locally.")
              : flow >= 0
                ? t("Processando etapa", "Processing stage") + " " + (flow + 1)
                : t(
                    "Inicie para acompanhar o processo.",
                    "Start to follow the process.",
                  )}
          </p>
        </div>
      ) : (
        <div className="data-preview">
          <svg viewBox="0 0 500 400" aria-hidden="true">
            <defs>
              <radialGradient id="node">
                <stop stopColor="#F1F3F5" />
                <stop offset=".4" stopColor="#A4ABB3" />
                <stop offset="1" stopColor="#24272B" />
              </radialGradient>
            </defs>
            {Array.from({ length: 12 }, (_, i) => {
              const x = 250 + Math.sin(i * 2.4) * 175,
                y = 200 + Math.cos(i * 1.9) * 135;
              return (
                <g key={i}>
                  <path
                    d={`M250 200L${x} ${y}L${250 + Math.sin((i + 1) * 2.4) * 175} ${200 + Math.cos((i + 1) * 1.9) * 135}`}
                    stroke="#747E87"
                    strokeWidth=".7"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={i % 3 === 0 ? 18 : 8}
                    fill="url(#node)"
                  />
                </g>
              );
            })}
            <circle cx="250" cy="200" r="28" fill="url(#node)" />
          </svg>
          <span>
            {t(
              "Dados sintéticos · explore na galeria",
              "Synthetic data · explore in the gallery",
            )}
          </span>
        </div>
      )}
    </div>
  );
}
