import type { Project, GalleryPiece, Copy, GameKind } from "@/lib/types";
const c = (pt: string, en: string): Copy => ({ pt, en });
export const profile = {
  name: "Lucas Melo",
  email: "lucas.melo10441816@gmail.com",
  github: "https://github.com/lucshllw",
  linkedin: "https://www.linkedin.com/in/lucashenriquemelobarbosa/",
  resume: "https://lucasmeloo.netlify.app/arquivos/curriculo-lucas-melo.pdf",
};
const previousProjects: Project[] = [
  {
    slug: "aplicacao-web",
    preview: "tasks",
    title: c("Aplicação web", "Web application"),
    description: c(
      "Uma experiência simples para organizar tarefas, prioridades e projetos.",
      "A simple experience for organizing tasks, priorities and projects.",
    ),
    problem: c(
      "Como reunir tarefas e acompanhamento de projetos em um lugar claro e acessível?",
      "How can tasks and project progress come together in a clear, accessible space?",
    ),
    contribution: c(
      "Estudo de interface e protótipo interativo de planejamento, desenvolvido para este portfólio.",
      "Interface study and interactive planning prototype developed for this portfolio.",
    ),
    decisions: c(
      "Conteúdo em HTML, controles nativos, estado local e uma hierarquia que coloca a próxima ação em primeiro plano.",
      "HTML content, native controls, local state and a hierarchy that puts the next action first.",
    ),
    evidence: c(
      "A prévia permite concluir tarefas e adicionar uma nova. Estado em memória; sem conta ou banco remoto.",
      "The preview lets you complete tasks and add a new one. In-memory state; no account or remote database.",
    ),
    technologies: ["React", "TypeScript", "CSS"],
    media: ["/obras/planejamento.svg", "/obras/planejamento-mobile.svg"],
    published: true,
    kind: c("Estudo conceitual", "Concept study"),
  },
  {
    slug: "fluxo-automacao",
    preview: "workflow",
    title: c("Fluxo de automação", "Automation flow"),
    description: c(
      "Da entrada de informação à ação: um processo que pode ser observado.",
      "From incoming information to action: a process you can observe.",
    ),
    problem: c(
      "Como tornar visível cada etapa de uma rotina automatizada?",
      "How can each step in an automated workflow become visible?",
    ),
    contribution: c(
      "Modelo de fluxo e simulação local com validação e estados explícitos.",
      "Workflow model and local simulation with validation and explicit states.",
    ),
    decisions: c(
      "Separar entrada, validação e saída permite inspecionar erros sem esconder o processo.",
      "Separating input, validation and output lets you inspect errors without hiding the process.",
    ),
    evidence: c(
      "Execute o fluxo da prévia para acompanhar a passagem por três etapas. Sem API externa conectada.",
      "Run the preview workflow to follow all three stages. No external API connected.",
    ),
    technologies: ["TypeScript", "React", "SVG"],
    media: ["/obras/fluxo.svg"],
    published: true,
    kind: c("Estudo conceitual", "Concept study"),
  },
  {
    slug: "experimento-dados",
    preview: "network",
    title: c("Experimento de dados", "Data experiment"),
    description: c(
      "Relações, trajetórias e sistemas explorados por interação.",
      "Relationships, trajectories and systems explored through interaction.",
    ),
    problem: c(
      "Como investigar relações através de uma visualização manipulável?",
      "How can relationships be investigated through a manipulable visualization?",
    ),
    contribution: c(
      "Rede interativa e galeria de simulações matemáticas autorais.",
      "Interactive network and gallery of original mathematical simulations.",
    ),
    decisions: c(
      "Uma única simulação ativa; dados sintéticos identificados e parâmetros acessíveis.",
      "One active simulation; identified synthetic data and accessible parameters.",
    ),
    evidence: c(
      "A obra Conexões permite arrastar nós. Os pontos são dados sintéticos, sem modelo de IA treinado.",
      "The Connections piece lets you drag nodes. Points are synthetic data, with no trained AI model.",
    ),
    technologies: ["Canvas 2D", "TypeScript", "Three.js"],
    media: ["/obras/conexoes.svg"],
    published: true,
    kind: c("Projeto pessoal", "Personal project"),
  },
  ...(
    [
      [
        "percurso",
        "Percurso",
        "Passage",
        "Saltos entre planos. Um caminho feito de pequenas decisões.",
        "Jumps between planes. A path made of small decisions.",
      ],
      [
        "travessia",
        "Travessia",
        "Crossing",
        "O espaço muda. Encontre o momento de atravessar.",
        "Space changes. Find the moment to cross.",
      ],
      [
        "fragmentos",
        "Fragmentos",
        "Fragments",
        "Explore, encontre e recomponha uma escultura de prata.",
        "Explore, discover and rebuild a silver sculpture.",
      ],
    ] as const
  ).map(([game, pt, en, descPt, descEn]): Project => ({
    slug: game,
    game: game as GameKind,
    preview: "game",
    title: c(pt, en),
    description: c(descPt, descEn),
    problem: c(
      game === "fragmentos"
        ? "Como fazer a exploração revelar uma forma?"
        : "Como transformar espaço e tempo em uma interação compreensível?",
      game === "fragmentos"
        ? "How can exploration reveal a form?"
        : "How can space and time become an understandable interaction?",
    ),
    contribution: c(
      "Cenário autoral, controlador cinemático, linguagem de movimento e interface acessível desenvolvidos neste portfólio.",
      "Original environment, kinematic controller, motion language and accessible interface developed for this portfolio.",
    ),
    decisions: c(
      "Física com passo fixo, estados explícitos, controles equivalentes por teclado e toque. A experiência é opcional.",
      "Fixed timestep physics, explicit states and equivalent keyboard and touch controls. The experience is optional.",
    ),
    evidence: c(
      "Protótipo jogável local. Sem conta, ranking, cliente comercial ou persistência remota. O objetivo pode ser alcançado por comandos reais.",
      "Local playable prototype. No account, leaderboard, commercial client or remote persistence. The goal can be reached through actual controls.",
    ),
    technologies: ["Three.js", "React Three Fiber", "Rapier", "TypeScript"],
    media: [`/obras/${game}.svg`],
    published: true,
    kind: c("Protótipo autoral", "Original prototype"),
  })),
];
/** Historical demonstrations remain addressable, but are not selected work. */
export const archivedProjects = previousProjects.filter(project => !project.game);
export const projects: Project[] = [
  {
    slug: "jorak-editor", url: "https://jorakeditor.netlify.app/",
    title: c("Jorak Editor", "Jorak Editor"),
    description: c("Portfólio para edição MMV e motion design, com uma coleção de discos que revela os trabalhos.", "An MMV and motion design portfolio, with an interactive record collection showcasing the work."),
    problem: c("Apresentar trabalhos audiovisuais em uma experiência que convida a explorar e assistir.", "Present audiovisual work through an experience that invites exploration and viewing."),
    contribution: c("Desenvolvimento do site, navegação interativa, apresentação dos projetos e interface de contato.", "Website development, interactive navigation, project presentation and contact interface."),
    decisions: c("Discos exploráveis, páginas de projeto e prévias de mídia, com navegação adaptada ao celular.", "Explorable records, project pages and media previews, with navigation adapted to mobile."),
    evidence: c("Site publicado e código local conferidos. Os vídeos e créditos pertencem ao portfólio do editor; minha contribuição é o desenvolvimento do site.", "Published website and local source verified. Videos and credits belong to the editor’s portfolio; my contribution is website development."),
    technologies: ["Next.js", "React", "TypeScript", "GSAP", "Three.js"],
    media: ["/projetos/jorak-editor.jpg"], published: true,
    kind: c("Site publicado", "Published website"),
  },
  {
    slug: "ohm-engenharia", url: "https://ohm-engenharia.netlify.app/",
    title: c("OHM Engenharia", "OHM Engenharia"),
    description: c("Site de engenharia elétrica e segurança eletrônica, com serviços, trabalhos e uma cena arquitetônica interativa.", "An electrical engineering and electronic security website, with services, projects and an interactive architectural scene."),
    problem: c("Organizar soluções de energia, proteção e comunicação e facilitar o contato com a empresa.", "Organize energy, security and communication solutions and make company contact easier."),
    contribution: c("Desenvolvimento do site, apresentação dos serviços, galeria de projetos e interação da maquete.", "Website development, service presentation, project gallery and architectural model interaction."),
    decisions: c("Uma maquete conecta os três sistemas. Conteúdo real e chamadas diretas orientam a exploração e o contato.", "A model connects the three systems. Real content and direct calls to action guide exploration and contact."),
    evidence: c("Site publicado e código local conferidos. A maquete é conceitual; as fotografias de trabalhos são apresentadas com seu contexto.", "Published website and local source verified. The model is conceptual; project photographs are presented with context."),
    technologies: ["Astro", "TypeScript", "GSAP", "Lenis", "Three.js"],
    media: ["/projetos/ohm-engenharia.jpg"], published: true,
    kind: c("Site publicado", "Published website"),
  },
  ...previousProjects.filter(project => project.game),
];
export const education = [
  { institution: "Centro Universitário FACENS", course: c("Análise e Desenvolvimento de Sistemas", "Systems Analysis and Development"), status: c("Em andamento · conclusão prevista em 2028", "In progress · expected completion in 2028"), year: "2028", diagram: "systems" },
  { institution: "SENAI Gaspar Ricardo", course: c("Eletricista de Manutenção Eletroeletrônica", "Electrical and Electronic Maintenance Electrician"), status: c("Conclusão indicada no currículo: 2026", "Completion listed in the résumé: 2026"), year: "2026", diagram: "circuit" },
  { institution: "ETEC Elias Miguel Júnior", course: c("Ensino médio integrado — Informática para Internet", "Integrated secondary education — Internet Computing"), status: c("Concluído em 2024", "Completed in 2024"), year: "2024", diagram: "web" },
];

const experiments = [
  [
    "fluxo",
    c("Correntes", "Currents"),
    c(
      "Um campo vetorial deixa rastros em prata. Cada gesto modifica sua direção.",
      "A vector field leaves silver traces. Each gesture changes its direction.",
    ),
    c(
      "Mova o ponteiro para desviar as partículas.",
      "Move the pointer to steer the particles.",
    ),
    "Canvas 2D",
  ],
  [
    "trajetorias",
    c("Trajetórias", "Trajectories"),
    c(
      "O atrator de Lorenz transforma três equações em uma trajetória espacial.",
      "The Lorenz attractor turns three equations into a spatial trajectory.",
    ),
    c("Arraste para mudar a orientação.", "Drag to change orientation."),
    "Lorenz / Canvas 2D",
  ],
  [
    "materia",
    c("Matéria", "Matter"),
    c(
      "Uma reação de Gray–Scott faz pequenos impulsos se tornarem padrões.",
      "A Gray–Scott reaction turns small impulses into patterns.",
    ),
    c("Arraste para semear o padrão.", "Drag to seed the pattern."),
    "Gray–Scott / Canvas 2D",
  ],
  [
    "forma",
    c("Fenda", "Fissure"),
    c(
      "Duas formas de prata se abrem ao redor de uma fenda diagonal.",
      "Two silver forms open around a diagonal fissure.",
    ),
    c(
      "Abra a peça, gire e desloque a luz para revelar suas faces internas.",
      "Open the piece, rotate it and move the light to reveal its inner faces.",
    ),
    "Three.js",
  ],
  [
    "palavra",
    c("Palavra em movimento", "Word in motion"),
    c(
      "A palavra ganha corpo entre contorno, tensão e profundidade.",
      "A word takes shape between outline, tension and depth.",
    ),
    c(
      "Mova o ponteiro ou ajuste a tensão.",
      "Move the pointer or adjust the tension.",
    ),
    "HTML / CSS",
  ],
  [
    "conexoes",
    c("Conexões", "Connections"),
    c(
      "Uma pequena rede de dados sintéticos. Mudar um ponto altera suas relações.",
      "A small synthetic data network. Changing one point alters its relationships.",
    ),
    c(
      "Arraste um nó para reorganizar a rede.",
      "Drag a node to rearrange the network.",
    ),
    "Canvas 2D",
  ],
  [
    "dobras",
    c("Dobras", "Folds"),
    c(
      "Lâminas de prata definem um volume feito de intervalos.",
      "Silver blades define a volume made of intervals.",
    ),
    c(
      "Arraste para inspecionar. Restaurar retorna à posição inicial.",
      "Drag to inspect. Reset returns to the initial position.",
    ),
    "CSS 3D",
  ],
  [
    "percurso",
    c("Percurso", "The passage"),
    c(
      "Uma escadaria, dois pontos de descanso e uma pequena criatura curiosa.",
      "A staircase, two resting points and a small curious creature.",
    ),
    c(
      "Abra o jogo e alcance o último pedestal.",
      "Open the game and reach the final pedestal.",
    ),
    "Rapier / Three.js",
  ],
] as const;
export const pieces: GalleryPiece[] = experiments.map(
  ([id, title, description, instruction, technique], i) => ({
    id,
    title,
    description,
    instruction,
    technique,
    position: [((i % 4) - 1.5) * 3.3, 0, Math.floor(i / 4) * 4.5],
  }),
);
