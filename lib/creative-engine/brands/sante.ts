export const santeBrand = {
  id: "sante",
  name: "Santé Laboratório Veterinário",
  audienceModes: ["veterinarios", "tutores"] as const,
  colors: {
    teal: "#009C9C",
    tealDark: "#006F73",
    tealLight: "#D9F0EF",
    white: "#FFFFFF",
    warm: "#F7F3ED",
    ink: "#163B40",
    gray: "#6E7677",
    pinkOctober: "#E95F87",
    pinkLight: "#F7DCE5",
  },
  typography: {
    display: "Inter",
    body: "Inter",
    notes:
      "Sans profissional e limpa. A tipografia oficial ainda deve ser validada contra arquivos de branding originais.",
  },
  rules: {
    visualDirection: [
      "Clean para conteúdos educativos",
      "Sofisticado para conteúdos institucionais",
      "Autoridade com profissionalismo",
      "Imagem realista, natural e sem aparência plástica",
      "Campanhas sazonais usam cor temática como accent, sem substituir o teal Santé",
    ],
    avoid: [
      "Visual veterinário infantil",
      "Excesso de patinhas",
      "Gradientes genéricos de IA",
      "Elementos gráficos gratuitos",
      "Representar instalações ou equipe geradas por IA como se fossem reais",
    ],
  },
} as const;

export type SanteBrand = typeof santeBrand;
