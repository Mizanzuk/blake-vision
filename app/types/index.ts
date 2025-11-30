// Database types
export type Universe = {
  id: string;
  user_id: string;
  nome: string;
  descricao?: string | null;
  created_at: string;
  updated_at: string;
};

export type World = {
  id: string;
  universe_id: string;
  user_id: string;
  nome: string;
  descricao?: string | null;
  is_root?: boolean;
  has_episodes?: boolean;
  ordem?: number | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  slug: string;
  universe_id: string;
  user_id: string;
  label: string;
  description?: string | null;
  prefix?: string | null;
  created_at: string;
};

export type Ficha = {
  id: string;
  world_id: string;
  user_id: string;
  tipo: string;
  titulo: string;
  slug?: string | null;
  codigo?: string | null;
  resumo?: string | null;
  conteudo?: string | null;
  ano_diegese?: number | null;
  tags?: string | null;
  episodio?: string | null;
  imagem_capa?: string | null;
  album_imagens?: string[] | null;
  descricao_data?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  granularidade_data?: string | null;
  camada_temporal?: string | null;
  embedding?: number[] | null;
  created_at: string;
  updated_at: string;
};

export type Relation = {
  id: string;
  source_ficha_id: string;
  target_ficha_id: string;
  tipo_relacao: string;
  descricao?: string | null;
  created_at: string;
};

// UI types
export type ChatMode = "consulta" | "criativo";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
};

export type ChatSession = {
  id: string;
  title: string;
  mode: ChatMode;
  createdAt: number;
  messages: ChatMessage[];
  universeId?: string;
};

export type Theme = "light" | "dark";

export type Locale = "pt-BR" | "en-US";

export type UserPreferences = {
  theme: Theme;
  locale: Locale;
};

export type UserProfile = {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
};

// Component prop types
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
export type ButtonSize = "sm" | "md" | "lg";

export type InputVariant = "default" | "error" | "success";
export type InputSize = "sm" | "md" | "lg";

export type BadgeVariant = "default" | "primary" | "success" | "warning" | "error" | "urizen" | "urthona";
export type BadgeSize = "sm" | "md" | "lg";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

// Granularidades de data
export const GRANULARIDADES = {
  DIA: "dia",
  MES: "mes",
  ANO: "ano",
  DECADA: "decada",
  SECULO: "seculo",
  INDEFINIDO: "indefinido",
} as const;

export type Granularidade = typeof GRANULARIDADES[keyof typeof GRANULARIDADES];

// Camadas temporais
export const CAMADAS_TEMPORAIS = {
  LINHA_PRINCIPAL: "linha_principal",
  FLASHBACK: "flashback",
  FLASHFORWARD: "flashforward",
  SONHO_VISAO: "sonho_visao",
  MUNDO_ALTERNATIVO: "mundo_alternativo",
  HISTORICO_ANTIGO: "historico_antigo",
  RELATO_MEMORIA: "relato_memoria",
  PUBLICACAO: "publicacao",
} as const;

export type CamadaTemporal = typeof CAMADAS_TEMPORAIS[keyof typeof CAMADAS_TEMPORAIS];

// Tipos de relação
export const TIPOS_RELACAO = {
  // Familiares
  PAI_DE: "pai_de",
  MAE_DE: "mae_de",
  FILHO_DE: "filho_de",
  FILHA_DE: "filha_de",
  IRMAO_DE: "irmao_de",
  IRMA_DE: "irma_de",
  AVO_DE: "avo_de",
  AVOA_DE: "avoa_de",
  NETO_DE: "neto_de",
  NETA_DE: "neta_de",
  TIO_DE: "tio_de",
  TIA_DE: "tia_de",
  SOBRINHO_DE: "sobrinho_de",
  SOBRINHA_DE: "sobrinha_de",
  PRIMO_DE: "primo_de",
  PRIMA_DE: "prima_de",
  CONJUGE_DE: "conjuge_de",
  CASADO_COM: "casado_com",
  EX_CONJUGE_DE: "ex_conjuge_de",
  
  // Sociais
  AMIGO_DE: "amigo_de",
  INIMIGO_DE: "inimigo_de",
  RIVAL_DE: "rival_de",
  MENTOR_DE: "mentor_de",
  APRENDIZ_DE: "aprendiz_de",
  COLEGA_DE: "colega_de",
  CONHECIDO_DE: "conhecido_de",
  
  // Profissionais
  CHEFE_DE: "chefe_de",
  LIDER_DE: "lider_de",
  SUBORDINADO_DE: "subordinado_de",
  FUNCIONARIO_DE: "funcionario_de",
  COLEGA_TRABALHO_DE: "colega_trabalho_de",
  SOCIO_DE: "socio_de",
  PARCEIRO_DE: "parceiro_de",
  CLIENTE_DE: "cliente_de",
  FORNECEDOR_DE: "fornecedor_de",
  
  // Narrativas
  PROTAGONIZADO_POR: "protagonizado_por",
  ANTAGONIZADO_POR: "antagonizado_por",
  PARTICIPOU_DE: "participou_de",
  TESTEMUNHOU: "testemunhou",
  CRIADOR_DE: "criador_de",
  CRIADO_POR: "criado_por",
  
  // Espaciais
  LOCALIZADO_EM: "localizado_em",
  MORA_EM: "mora_em",
  VIVE_EM: "vive_em",
  NASCEU_EM: "nasceu_em",
  MORREU_EM: "morreu_em",
  TRABALHA_EM: "trabalha_em",
  ESTUDOU_EM: "estudou_em",
  VISITOU: "visitou",
  
  // Pertencimento
  PARTE_DE: "parte_de",
  MEMBRO_DE: "membro_de",
  CONTEM: "contem",
  POSSUI: "possui",
  PERTENCE_A: "pertence_a",
  ASSOCIADO_A: "associado_a",
} as const;

export type TipoRelacao = typeof TIPOS_RELACAO[keyof typeof TIPOS_RELACAO];
