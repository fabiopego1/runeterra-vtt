# Forja de Campeões · Runeterra — Foundry VTT System

Sistema não oficial de Foundry VTT (V14) para o RPG de mesa **Runeterra · Crônica de Mesa**
(da [Forja de Campeões](https://fabiopego1.github.io/Runeterra/)), construído de forma
independente sobre a base técnica do sistema SCRPG não-oficial
([RabidRaccoon](https://gitlab.com/RabidRaccoon/scrpg)).

> Projeto de fã não oficial. Runeterra e League of Legends são © Riot Games. Uso pessoal e não comercial.
> Você precisa das regras (site da Forja de Campeões) para jogar.

## Recursos

- **Campeões completos**: importe o JSON exportado pela Forja de Campeões
  (`Arquivo → Exportar campeão`) direto no botão **"Importar personagem Runeterra"**
  do diretório de Atores — traços, habilidades renomeadas, princípios, retrato,
  dados de status e vida são recalculados pelas mesmas fórmulas do site.
- **Ficha jogável** baseada na `ficha.html` do site: poderes/qualidades com nomes
  personalizados, habilidades por zona de vida (verde/amarela/vermelha) com bloqueio,
  nocaute, princípios, caminhos especiais (Dividido, Modular, Fabricante de Lacaios,
  Troca-Formas).
- **Rolagens** Poder + Qualidade + Status (Máx/Méd/Mín), modificadores persistentes/
  exclusivos com aviso de penalidade esquecida.
- **Gestor de Cena** com passos configuráveis por zona que mudam o cenário para todos
  os campeões.
- Vilões (mesma construção de campeões), Lacaios e Ambientes com reviravoltas.
- Interface própria (tinta/hextech), Português (Brasil) como idioma principal.

## Instalação

1. Copie a pasta `runeterra` para `Data/systems/` do Foundry, ou
2. Use o manifest: `https://raw.githubusercontent.com/fabiopego1/runeterra-vtt/main/system.json`

## Macros (jogar sem abrir ficha)

O compêndio **Runeterra Macros** vem com 5 macros prontas — arraste para a hotbar:

- **Cena Verde / Amarela / Vermelha** — muda a cena e recalcula o Status de todos
  (alinha as estrelas do Gestor também, quando ele existe).
- **Zerar Cena** — volta tudo para verde.
- **Rolar Selecionados** — rolagem combinada de cada token de campeão/vilão marcado.

As macros são só GM por padrão; para liberar aos jogadores, configure a propriedade
da macro no compêndio. Fonte versionada em `packs/_source/macros.json`
(`node scripts/build-macros.mjs` regenera o `.db`; `node scripts/check-packs.mjs` valida).

## API para macros próprias (`game.runeterra`)

- `game.runeterra.setScene('green'|'yellow'|'red')`
- `game.runeterra.resetScene()`
- `game.runeterra.rollSelected()` → promessas das rolagens
- `game.runeterra.importChampion(json)` / `parseChampion(json)`

Exemplo — dano em área nos selecionados: selecione os tokens e rode
`for (const t of canvas.tokens.controlled) await t.actor.update({'system.play.current': String(Math.max(0, (+t.actor.system.play.current || 0) - 5))});`
(a ficha recalcula zona e Status sozinha ao reabrir/atualizar a Vida).

## Fontes (SIL OFL): Marcellus, Barlow Semi Condensed, IBM Plex Mono.

## Decisões de design

- **Status é automático**: o dado de Status é sempre recalculado (Temperamento → zona de Vida;
  a Cena só empurra para baixo: verde→amarelo com Cena amarela, tudo→vermelho com Cena vermelha).
  Não existe seletor manual — é a regra do livro.
- **Habilidades na ficha são espelho da Forja**: não há botão de excluir/criar habilidades na
  ficha de propósito — o personagem nasce no site e chega pela importação; mudou o personagem,
  mude no site e re-importe. Criar/excluir habilidades manuais continua possível via Diretório
  de Itens (construção sem importação).
- **O botão de importação sobrevive a re-renders** do diretório de Atores (re-injetado por
  observação de mutação); se algum dia desaparecer, `game.runeterra.importChampion(json)` na
  console faz a mesma coisa.

## Manutenção dos dados (sincronizar com o site)

Os catálogos em `data/` são cópias dos arquivos do site (`js/`). Para não divergirem:
`node scripts/sync-from-web.mjs` (copia o que mudou), `--check` (só compara), `--pull`
(`git pull --ff-only` no clone do site antes) e `--test` (roda os testes depois). O caminho do
clone vem de `--web <dir>` ou da variável `WEB_REPO`. Testes de lógica (Node puro):
`test-retcon`, `test-import-fixture`, `test-zone-locks`, `test-divided` em `scripts/`.
O material do Mestre do site (cofre cifrado) não é copiado.
