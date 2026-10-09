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
- Antagonistas (ex-Vilões; mesma construção de campeões), Lacaios e Ambientes com reviravoltas.
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
O cofre cifrado do Mestre (`data/gm-vault.js`) é copiado como está, sem abrir.

## Antagonistas (Forja do Antagonista)

O JSON exportado pela Forja do Antagonista (Escudo do Mestre do site) é importado pelo mesmo botão
**"Importar personagem Runeterra"**: o sistema reconhece o arquivo e cria um ator do tipo
**Antagonista** (`villain`). Também funciona na ficha vazia e em **"Atualizar do JSON"** (mantém a
Vida atual e a situação de Status escolhida).

- O arquivo guarda só as **escolhas**; dados, Vida (abordagem + arquétipo + 5 × campeões + melhorias),
  habilidades e linhas de Status são recalculados com os blocos de construção do livro, que ficam no
  **cofre cifrado** (`data/gm-vault.js`, o mesmo do site). O repositório é público, então o material
  nunca vai em texto puro.
- Na primeira importação da aba o Mestre digita a **senha do cofre**. Ela não é gravada: só a chave
  derivada fica no `sessionStorage` da aba (some ao fechá-la). Só o Mestre importa antagonistas.
- Brutamontes e Frágil têm o Status preso à zona de Vida; os demais arquétipos dependem da cena, então
  a ficha mostra as linhas de Status e o Mestre clica na que vale agora.
- Testes: `GM_PASSWORD='…' node scripts/test-antagonist.mjs` (a senha nunca vai para o repositório;
  sem ela só rodam as checagens do cofre fechado).

## Ferramentas do Escudo do Mestre no VTT

Usam o mesmo **cofre cifrado** dos antagonistas (senha pedida uma vez por aba; só o Mestre usa).

- **Reviravolta do Mestre** — na ficha da **Cena**: escolha a região e clique em *Reviravolta menor*
  ou *maior*. O sorteio (mesmas regras do Escudo: lista da região + as 2 primeiras gerais, sem repetir
  o último) sai no chat **sussurrado só aos Mestres**. API: `game.runeterra.rollTwist({ region, kind })`.
- **Lacaios e tenentes** — **só por export**: o VTT não os lê do cofre nem tem botão de criação. Entram pelo
  **backup do Escudo** (abaixo) e, no futuro, por um export da Forja (formato a registrar, ver "Abertura à Forja").
  Cada lacaio vira um ator do tipo Lacaio (mesmo `group`, então a rolagem de grupo funciona), numa pasta.
- **Backup do Escudo** — o arquivo *Exportar backup* do Escudo (`runeterra-gm-backup`) é importado
  pelo botão "Importar personagem Runeterra": os lacaios e tenentes da mesa viram atores (desafios e
  antagonistas simples da mesa são avisados, não importados).

### Abertura à Forja (novos exports)

Todo JSON que a Forja exporta passa por `module/forge.js` (`sniffForge`). Para aceitar um export novo
basta registrar **um** formato, sem mexer no resto:

```js
registerForgeFormat({
  id: 'meu-formato',
  label: 'Nome para mensagens',
  detect: o => o?.app === 'runeterra-algo',          // sniff barato do JSON já lido
  create: async json => ({ ok: true, actor, warnings }), // cria o(s) documento(s)
  into: async (actor, json) => ({ ok: true, actor })     // opcional: preenche/atualiza uma ficha
});
```

Formatos atuais: `champion` e `antagonist` (`module/import.js`), `gm-backup` (`module/foes.js`). Os
modelos de lacaio/tenente usam o formato do Escudo (`{ n, d, t, a, tac }`), então um export futuro
de lacaios da Forja só precisa mapear para ele e chamar `buildFoeActors` (`module/foes.js`).
Testes: `GM_PASSWORD='…' node scripts/test-gm-tools.mjs`.

### Desafios da cena

Na ficha da **Cena**, o bloco **Desafios** (sem cofre; visível a quem vê a ficha): nome, sucessos (1–5) e contador
opcional (0–8). Clique numa caixa para marcar até ela (clicar numa já marcada volta até ali). Sucessos
completos = *Resolvido*; contador cheio antes disso = *Disparou!*. Um Superar de 12+ vale dois sucessos
(regra do Escudo). Mesmo modelo do Escudo, então os desafios de um backup do Escudo importam como estão
(viram uma Cena "Cena do Escudo (desafios)").
