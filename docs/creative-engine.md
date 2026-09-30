# Proxy / Ichthus Creative Engine

## Objetivo

Criar uma camada de design determinístico para peças estáticas, separando:

1. briefing e direção de arte;
2. Brand Kit;
3. assets fotográficos/ilustrativos;
4. composição;
5. renderização;
6. exportação por formato.

## Piloto

Cliente: Santé Laboratório Veterinário  
Projeto: Outubro Rosa Pet 2026  
Formato inicial: 1080×1350  
Slides: 6

## Regras do piloto

- Briefing da cliente é especificação obrigatória.
- Brand Kit não pode apagar requisitos de campanha.
- Teal Santé permanece estrutural.
- Rosa entra como cor temática.
- Não gerar imagens de instalações/equipe e apresentá-las como reais.
- Rodapé obrigatório: Gláucia Dias · CRMV-DF 1042.

## Próximos passos técnicos

1. integrar renderização HTML/SVG -> PNG;
2. conectar upload/seleção de assets;
3. permitir múltiplas famílias de layout;
4. gerar 4:5 e 9:16 a partir do mesmo projeto;
5. adicionar histórico de versões;
6. adicionar outros Brand Kits.

## Arquitetura desejada

ChatGPT / agente -> project spec -> brand tokens -> layout family -> renderer -> exports
