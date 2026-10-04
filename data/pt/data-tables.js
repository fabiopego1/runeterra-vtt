// pt-BR: Origens, Fontes de Poder, Caminhos, Personalidades e Supremas.
// Só os textos exibidos mudam; ids, dados e listas (a lógica das regras) ficam intactos.
(() => {
  'use strict';
  const W = window;
  const patch = (list, map, fn) => { for (const x of list) { const v = map[x.id]; if (v) fn(x, v); } };

  // [nome, subtítulo, lore]
  patch(W.BACKGROUNDS, {
    'upper-class': ['Classe Alta', 'Nascido em berço de ouro, numa família rica ou nobre.', 'Você cresceu entre riqueza, títulos e etiqueta, numa família influente da sua terra. Dinheiro, contatos e expectativas te moldaram muito antes de qualquer poder.'],
    'blank-slate': ['Página em Branco', 'Você não se lembra de nada antes do dia em que acordou.', 'Talvez você tenha saído de uma tumba, sido encontrado à beira de uma estrada ou tido a memória apagada por magia. O que você era se foi; o que você vai ser começa agora.'],
    struggling: ['Batalhador', 'Você sempre lutou para sobreviver, sem dinheiro e sem sorte.', 'Você cresceu na pobreza, contando moedas, fugindo de quem manda nas ruas e aprendendo que ninguém viria te salvar. Cada dia foi uma batalha.'],
    adventurer: ['Aventureiro', 'Ruínas, relíquias e a emoção do desconhecido.', 'Você já explorava ruínas esquecidas, mapeava terras selvagens ou corria atrás de boatos de tesouros perdidos muito antes de o destino te encontrar.'],
    unremarkable: ['Comum', 'Você era fazendeiro, ferreiro, pescador ou pastor. Até que tudo mudou.', 'Você levava uma vida tranquila, sem nada de especial, até que a guerra, a magia ou o destino bateram à porta.'],
    law: ['Agente da Lei', 'Guarda, xerife, caçador de recompensas ou executor da coroa.', 'Você fez carreira mantendo a ordem: patrulhando ruas, perseguindo fugitivos, caçando contrabandistas ou impondo a lei de quem governa. Talvez ainda carregue o distintivo.'],
    academic: ['Acadêmico', 'Uma academia, um mosteiro, uma grande biblioteca.', 'Você foi atrás do conhecimento, fosse ciência, magia, história ou saber espiritual, e essa busca te levou direto para o perigo.'],
    tragic: ['Trágico', 'Um único acontecimento terrível te define.', 'Uma catástrofe levou alguém que você amava, a guerra queimou seu vilarejo ou um culto massacrou sua família. A tragédia te move e, ao mesmo tempo, te assombra.'],
    performer: ['Artista', 'Bardo, compositor, pintor, dançarino, lutador de espetáculo ou sensação dos palcos.', 'Você nasceu para uma plateia, seja nos salões de música, nas danças dos festivais, diante de uma tela em branco ou nas arenas de gladiadores. Com uma canção, um pincel ou uma lâmina, sabe prender a atenção de todos.'],
    military: ['Militar', 'Soldado, legionário, guerreiro de um bando de guerra.', 'Você sangrou numa guerra organizada, fosse numa muralha de escudos, numa legião em marcha ou num saque, e ainda se move como um soldado.'],
    retired: ['Aposentado', 'Você pendurou a espada há muito tempo. Agora ela te chama de novo.', 'Seus feitos são cantados em tavernas por toda parte, mas você deixou essa vida para trás. Algo te arrastou de volta para uma última luta.'],
    criminal: ['Criminoso', 'Contrabandista, pirata ou ladrão tentando virar a página.', 'Você passou tempo demais do lado errado da lei, nas docas, nos becos ou nos antros da cidade. Agora usa seus talentos para algo melhor... quase sempre.'],
    medical: ['Médico', 'Cirurgião, herbalista, curandeiro ou alquimista.', 'Você remendou os feridos, seja com bisturi e remédios, com ervas e emplastros ou com magia de cura. Conhece o corpo como poucos.'],
    anachronistic: ['Anacrônico', 'Alguém de uma era antiga, ou perdido no tempo.', 'Você pertence a outra época, seja um império há muito caído, uma guerra de séculos atrás ou um futuro ainda não escrito. Este tempo não é o seu, mas você luta por ele mesmo assim.'],
    exile: ['Exilado', 'Expulso, fugitivo ou mandado para longe de casa.', 'Sua terra natal te marcou como traidor, desertor ou monstro. Você vaga longe de casa, abrindo o próprio caminho em terras que não confiam em você.'],
    'former-villain': ['Ex-Vilão', 'Você já serviu ao crime, a uma cabala ou a algo mais sombrio.', 'Você já lutou contra os heróis a serviço de um chefão do crime, de uma sociedade secreta ou de uma força maligna. Mudou de lado, mas muita gente ainda não confia em você.'],
    interstellar: ['Celestial', 'Visitante celestial, ser forjado nas estrelas ou mortal que tocou os céus.', 'Você vem de além do céu. Pode ser um ser celestial, uma estrela caída ou um mortal que voltou mudado depois de tocar as estrelas. Os costumes deste mundo te parecem estranhos.'],
    dynasty: ['Dinastia', 'Sua família produz campeões há gerações.', 'Seja descendente de imperadores, herdeiro de uma linhagem de heróis ou filho de uma família de magos, todos esperam heroísmo de você.'],
    otherworldly: ['Extraordinário', 'Tocado pelo sobrenatural. Humano, só em parte, se tanto.', 'Você carrega o sobrenatural no sangue: filho de um espírito, descendente de um semideus ou nascido de um povo mágico. Você nunca se encaixou por completo entre os mortais.'],
    created: ['Criado', 'Construído numa oficina, forjado num laboratório ou reerguido por magia antiga.', 'Você foi feito, ou refeito: um golem a vapor, uma boneca de relojoaria, um colosso de pedra encantada, uma arma viva criada em laboratório e mantida presa, ou um guerreiro morto reerguido por feitiçaria. Ainda assim, algo em você responde ao chamado.']
  }, (x, v) => { x.rt = v[0]; x.sub = v[1]; x.lore = v[2]; });

  // [nome, subtítulo, lore, texto do bônus especial]
  patch(W.POWER_SOURCES, {
    accident: ['Acidente', 'Uma explosão, um feitiço que deu errado, e você estava lá.', 'Um evento externo forçou poder para dentro de você: um experimento que saiu do controle, um artefato que se partiu, um contato com energias que ninguém entende. Isso te mudou para sempre.'],
    training: ['Treinamento', 'Poder conquistado no suor, com anos de disciplina.', 'Nada de magia, nada de mutação: seu poder são anos de treino num mosteiro, num salão de esgrima ou num campo de batalha.', 'No lugar de uma habilidade Verde: no próximo passo, escolha uma qualidade extra da lista de qualidades do seu Caminho em d8.'],
    genetic: ['Inato', 'Você nasceu com poder no sangue, um dom que alguns chamam de maldição.', 'Seu poder se manifestou sozinho, uma herança de nascença. Em alguns lugares você seria caçado; em outros, celebrado ou recrutado.'],
    experimentation: ['Experimentação', 'Um laboratório, um alquimista louco, um escultor de carne.', 'Seu poder foi feito em laboratório e veio com efeitos colaterais. Químicos, cirurgias ou alquimia distorcida reescreveram seu corpo.'],
    mystical: ['Místico', 'Magia estudada, um pacto com um espírito ou runas gravadas na carne.', 'Você aprendeu magia do jeito difícil, com um mestre, um grimório proibido ou runas entalhadas na sua pele.', 'No lugar de uma habilidade Verde: ganhe uma qualidade de Informação em d10.'],
    nature: ['Natureza', 'Os espíritos, as feras e os elementos do mundo selvagem.', 'O poder primordial de Runeterra corre por você, seja no uivo das tempestades, no crescimento das florestas ou na força das feras.'],
    relic: ['Relíquia', 'Uma arma antiga, uma coroa, um objeto de poder.', 'Um objeto de significado místico te escolheu, ou te refez: uma manopla tirada de uma tumba, uma arma lendária, uma joia que pulsa com magia.'],
    'powered-suit': ['Traje Tecnológico', 'Um exotraje, um mecha ou uma armadura mecânica te mantêm na luta.', 'Um traje de engenharia te dá seus poderes e talvez até te mantenha vivo. Algum tipo de núcleo de energia zumbe dentro dele.'],
    radiation: ['Mutação', 'Uma névoa tóxica, uma energia bruta, um vazamento que deveria ter te matado.', 'A exposição a algo tóxico ou instável mudou seu corpo e o carregou com um poder perigoso, seja uma névoa venenosa, um cristal de energia sem blindagem ou resíduos químicos.'],
    'tech-upgrades': ['Aprimoramentos Tecnológicos', 'Membros mecânicos, implantes, um corpo reconstruído.', 'Implantes e aprimoramentos te dão poder: pernas de metal, um braço mecânico, um coração bombeado a químicos.'],
    supernatural: ['Sobrenatural', 'A morte, os espíritos e o reino dos mortos te deram poder.', 'Você atravessou o véu entre a vida e a morte, seja tocado por uma névoa amaldiçoada, negociando com a própria Morte ou voltando do reino dos mortos.', 'No lugar de uma habilidade Verde: ganhe um poder que NÃO está na lista acima, em d10.'],
    artificial: ['Ser Artificial', 'Feito de relojoaria, vapor, pedra ou metal, sua própria natureza é o seu poder.', 'Você foi criado, e suas habilidades vêm daquilo de que você é feito: engrenagens de latão, um núcleo de energia ou pedra encantada.'],
    cursed: ['Amaldiçoado', 'Uma arma maldita, um pacto de sangue, uma praga antiga.', 'Uma maldição te prende, a você ou à sua linhagem, trazendo bênçãos e desgraças: uma lâmina que sussurra, um juramento de sangue, uma praga que passa de geração em geração.'],
    alien: ['Alienígena', 'Seu poder não é deste mundo.', 'Seu poder vem de fora da realidade: uma criatura estranha grudada na sua pele, um sussurro vindo do nada, ou um sangue que simplesmente não é de Runeterra.', 'No lugar de uma habilidade Verde: aumente um poder ou qualidade d6 para d8. Se você não tiver poderes d6, adicione um poder novo da lista acima em d6.'],
    genius: ['Gênio', 'Uma das mentes mais brilhantes, ou mais perigosas, do mundo.', 'Seu intelecto assombroso é a sua arma: protótipos, máquinas que dobram o tempo, bombas de segurança duvidosa.', 'No lugar de uma habilidade Verde: ganhe uma qualidade extra de Informação ou Mental em d10.'],
    cosmos: ['Cosmos', 'Um poder celestial desceu sobre você.', 'As estrelas responderam ao seu chamado: um ser celestial, a luz do sol ou da lua ou uma força cósmica agora divide o corpo com você.', 'No lugar de uma habilidade Verde: diminua um poder d8/d10/d12 em um tamanho e aumente um poder d6/d8/d10 em um tamanho.'],
    extradimensional: ['Interplanar', 'Você andou por outro reino e voltou mudado.', 'Sua afinidade com os reinos além do Material te define, ou você é um ser originário deles, seja o mundo dos espíritos, um plano de sonhos ou os espaços entre as coisas. De um jeito ou de outro, eles deixaram sua marca em você.'],
    unknown: ['Desconhecido', 'Seu poder simplesmente... apareceu. Isso aponta para um mistério maior.', 'Ninguém sabe de onde veio seu poder. Nem os sábios, nem os estudiosos, nem mesmo você. Talvez algo antigo durma dentro de você.', 'No lugar de uma habilidade Verde: ganhe uma qualidade Social em d8.'],
    'higher-power': ['Poder Superior', 'A bênção de um deus, o favor de um semideus.', 'Você foi escolhido por uma força maior, abençoado por um deus, marcado por um semideus ou erguido por um ritual antigo. Ou talvez você SEJA um desses seres.'],
    multiverse: ['Fratura no Espaço-Tempo', 'Outras realidades, o fluxo do tempo, o próprio tecido do mundo.', 'Você foi arremessado pelo tempo e pela realidade, vindo de outra versão do mundo ou de um tempo que ainda não existe. Sem essa ruptura, você não seria quem é.', 'No lugar de uma habilidade Verde: ganhe um poder extra de qualquer categoria em d6.']
  }, (x, v) => { x.rt = v[0]; x.sub = v[1]; x.lore = v[2]; if (v[3] && x.extra) x.extra.text = v[3]; });
  // Caminhos: [nome, papel, lore, rótulo do dado obrigatório, nota Verde, nota Amarela, texto extra]
  patch(W.ARCHETYPES, {
    speedster: ['Velocista', 'Escaramuçador', 'Rápido demais para ser pego: um dançarino de lâminas Wuju, um zaunita que corre a relâmpago, um cavaleiro espectral.', 'Velocidade', 'Cada uma usando um poder ou qualidade diferente da lista do Velocista.'],
    shadow: ['Sombra', 'Assassino', 'Você age nas sombras, com sutileza e astúcia, como um ninja Kinkou, uma faca da Rosa Negra ou um Ceifador de Águas de Sentina.', 'Furtividade', 'Cada uma usando um poder ou qualidade diferente da lista do Sombra.'],
    powerhouse: ['Potência Física', 'Colosso', 'Você é a força bruta na linha de frente: o machado de Noxus, o rei morto-vivo imparável, a avalanche ambulante.', 'Força', 'Cada uma usando um poder ou qualidade diferente da lista do Potência Física (incluindo Força).', 'Uma das habilidades de Potência Física acima, na Amarela, usando um poder ou qualidade diferente das suas Verdes.'],
    marksman: ['Atirador', 'Atirador', 'Sua arma é uma extensão da sua vontade: um rifle de precisão, um arco de gelo freljordiano, as pistolas-relíquia dos Sentinelas da Luz.', 'Arma Emblemática', 'Uma usando sua Arma Emblemática e a outra usando uma das suas qualidades.', 'Usando duas qualidades diferentes.'],
    blaster: ['Disparador', 'Mago (Explosão / Artilharia)', 'Você arremessa destruição elemental pura: luz demaciana, chama rúnica, lanças arcanas de Shurima.', 'um poder Elemental/Energia', 'Cada uma usa um poder diferente da sua lista de Disparador.', 'Usando dois poderes diferentes.'],
    cqc: ['Combatente Corpo a Corpo', 'Lutador / Duelista', 'Aço contra aço. Você é como um duelista demaciano, um espadachim do vento ioniano ou um lutador das arenas noxianas.', 'a qualidade Combate Corpo a Corpo', 'Pelo menos uma usando Combate Corpo a Corpo e outra usando um dos seus poderes.', 'Uma das habilidades de Combatente Corpo a Corpo acima, na Amarela, usando um poder ou qualidade diferente de todas as suas Verdes.'],
    armored: ['Blindado', 'Tanque / Vanguarda', 'Você é a muralha: uma porta-escudo freljordiana, um baluarte de petricita demaciano, o Aspecto do Sol encouraçado.', null, 'Usando pelo menos dois poderes diferentes.'],
    flyer: ['Voador', 'Escaramuçador Aéreo', 'O céu é seu campo de batalha, como o de uma patrulheira demaciana e sua águia, de um yordle num girocóptero ou de um Aspecto alado.', 'Voo ou uma Montaria Emblemática', 'Pelo menos uma usando Voo ou sua Montaria Emblemática.', 'Uma das habilidades de Voador acima, na Amarela.'],
    elemental: ['Manipulador Elemental', 'Mago (Controle)', 'Você dobra os próprios elementos: a terra e a água de Ixtal, o gelo do Freljord, a pedra de Shurima tecida como linha.', 'um poder Elemental/Energia', 'As duas precisam usar seus poderes de Elemental/Energia.', 'Usando um dos seus poderes de Elemental/Energia.'],
    robot: ['Robô/Ciborgue', 'Constructo / Aprimorado', 'Metal e engrenagens te definem, seja você construído do zero ou reconstruído peça por peça.', null, null, 'Uma das habilidades de Robô/Ciborgue acima, na Amarela.', 'Atribua um d10 a um poder Tecnológico que você ainda não tenha.'],
    sorcerer: ['Feiticeiro', 'Mago', 'Você empunha magia bruta em todas as formas, da magia rúnica à feitiçaria sombria e aos encantamentos aprendidos em tomos proibidos.'],
    psychic: ['Psíquico', 'Encantador / Mago de Controle', 'Sua mente é a arma, seja pelo encanto de uma vastaya, por esferas telecinéticas de soberania sombria ou por visões do que está por vir.', 'pelo menos dois poderes Psíquicos', null, 'Só habilidades cujo poder ou qualidade associado você tenha.'],
    transporter: ['Transportador', 'Andarilho / Tecelão de Portais', 'Você leva a si e aos outros aonde precisam estar, seja pelas Jornadas Mágicas do Bardo, por fendas do Vazio ou por uma carta do Destino.', 'uma Montaria Emblemática ou um poder de Mobilidade', null, 'Uma das habilidades de Transportador acima, na Amarela.'],
    'minion-maker': ['Criador de Lacaios', 'Invocador / Conjurador', 'Você nunca luta sozinho: torretas, Donzelas da Névoa, plantas mordedoras ou um urso bem grande pegando fogo.', null, 'Você ganha as duas, cada uma usando um poder diferente.'],
    'wild-card': ['Curinga', 'Trapaceiro', 'Ninguém sabe o que vem a seguir, muito menos você. Caixas-surpresa, mimetismo que muda de forma, caos alegre.'],
    'form-changer': ['Metamorfo', 'Metamorfo', 'Seu corpo muda como você quiser: estica, encolhe, endurece ou imita outras pessoas e criaturas.', 'um poder de Autocontrole'],
    gadgeteer: ['Engenhoqueiro', 'Inventor', 'Bolsos cheios de protótipos: bombas saltitantes, torretas, máquinas do tempo e bugigangas espertas.', 'um poder Intelectual'],
    'reality-shaper': ['Moldador da Realidade', 'Dobrador do Destino', 'Você dobra o tempo e a probabilidade, voltando segundos, roubando momentos e reescrevendo o que "acabou de acontecer".'],
    divided: ['Dividido', 'Natureza Dupla', 'Você tem duas formas bem diferentes e um jeito de trocar entre elas: uma caçadora e uma fera, um pequenino e um monstro enorme, uma pessoa comum e um campeão.'],
    modular: ['Modular', 'Multimodo', 'Você troca de modo no meio da luta: de uma arma para outra, de uma postura para outra, cada modo com suas vantagens e desvantagens.']
  }, (x, v) => {
    x.rt = v[0]; x.role = v[1]; x.lore = v[2];
    if (v[3] && x.req) x.req.label = v[3];
    if (v[4] && x.green) x.green.note = v[4];
    if (v[5] && x.yellow) x.yellow.note = v[5];
    if (v[6] && x.extra) x.extra.text = v[6];
    const needs = x.green && x.green.rules && x.green.rules.needs;
    if (needs) for (const n of needs) n.label = ({ 'your Signature Weapon': 'sua Arma Emblemática', 'one of your qualities': 'uma das suas qualidades', 'Melee Combat (Close Combat)': 'Combate Corpo a Corpo', 'one of your powers': 'um dos seus poderes', 'Flight or your Signature Mount/Vehicle': 'Voo ou sua Montaria Emblemática' })[n.label] || n.label;
  });

  // Dividido: métodos de transformação
  patch(W.DIVIDED.methods, {
    controllable: ['Transição Controlável', 'Você troca de forma por meio de algo que sempre controla, como uma palavra de poder, um gesto ritual ou um súbito clarão de luz. A troca sempre leva algum tempo.'],
    device: ['Transição por Dispositivo', 'Você se transforma por meio de um objeto: um implante tecnológico, uma arma amaldiçoada, uma coroa encantada. Perdeu o objeto, não consegue mudar.'],
    merging: ['Transição por Fusão ou Possessão', 'Você precisa de alguém ou de algo: um parceiro disposto a se fundir com você, ou um corpo ou objeto para possuir.'],
    uncontrollable: ['Transição Incontrolável', 'Você se transforma sob estresse, querendo ou não. A fera se solta.']
  }, (x, v) => { x.rt = v[0]; x.text = v[1]; });

  // Modular: descrição dos modos (o nome do modo é traduzido em I18N.names)
  const MODE = {
    Debilitator: 'Escolha quatro poderes do seu modo padrão: um no mesmo tamanho, um um tamanho abaixo (mín. d4), dois um tamanho acima (máx. d12). Neste modo você não pode Fortalecer, Defender nem Superar.',
    Improvement: 'Escolha quatro poderes: dois no mesmo tamanho, dois um tamanho acima (máx. d12). Neste modo você não pode Atacar nem Atrapalhar.',
    Scout: 'Escolha quatro poderes: dois no mesmo tamanho, um um tamanho abaixo (mín. d4), um um tamanho acima (máx. d12). Neste modo você não pode Atacar nem Fortalecer.',
    Analysis: 'Escolha quatro poderes: mantenha dois e aumente dois em um tamanho (máx. d12). Neste modo você não pode Atacar nem Defender.',
    Bombardment: 'Escolha três poderes: dois um tamanho abaixo (mín. d4) e um vira d12. Neste modo você não pode Fortalecer, Atrapalhar nem Superar.',
    Regeneration: 'Escolha dois poderes: mantenha um e aumente o outro em dois tamanhos (máx. d12). Neste modo você não pode Atacar nem Atrapalhar.',
    Skirmish: 'Escolha quatro poderes: um no mesmo tamanho, um um tamanho abaixo (mín. d4), dois um tamanho acima (máx. d12). Neste modo você não pode Fortalecer, Defender nem Superar.',
    Stalwart: 'Escolha quatro poderes: um no mesmo tamanho, dois um tamanho abaixo (mín. d4), um dois tamanhos acima (máx. d12). Neste modo você não pode Atrapalhar nem Superar.',
    Destroyer: 'Escolha três poderes: mantenha dois e aumente outro em um tamanho (máx. d12). Neste modo você fica imóvel e não pode Fortalecer.',
    'Hunter/Killer': 'Escolha dois poderes e aumente cada um em um tamanho (máx. d12). Neste modo você não pode Defender nem Superar.',
    Shield: 'Escolha quatro poderes: dois no mesmo tamanho, dois um tamanho acima (máx. d12). Neste modo você não pode Atacar.'
  };
  for (const z of ['green', 'yellow', 'red']) for (const m of W.MODULAR[z]) if (MODE[m.name]) m.text = MODE[m.name];

  // Personalidades: nome traduzido do livro
  patch(W.PERSONALITIES, {
    'lone-wolf': ['Lobo Solitário'], 'natural-leader': ['Líder Nato'], impulsive: ['Impulsivo'], mischievous: ['Travesso'],
    sarcastic: ['Sarcástico'], distant: ['Distante'], stalwart: ['Inabalável'], 'fast-talking': ['Tagarela'],
    inquisitive: ['Inquisitivo'], alluring: ['Sedutor'], stoic: ['Estoico'], nurturing: ['Acolhedor'], analytical: ['Analítico'],
    decisive: ['Decidido'], jovial: ['Jovial'], cheerful: ['Alegre'], naive: ['Ingênuo'], apathetic: ['Apático'],
    jaded: ['Desiludido'], arrogant: ['Arrogante']
  }, (x, v) => { x.rt = v[0]; });
  // Listas de campeões com comentários em inglês
  const CHAMPS = {
    "Amumu (a forgotten soul), Hecarim's lost riders": 'Amumu (uma alma esquecida), os cavaleiros perdidos do Hecarim',
    "Caitlyn, Vi, Morgana's pursuers": 'Caitlyn, Vi, os perseguidores da Morgana',
    "Jax, Graves, Tahm Kench's old marks": 'Jax, Graves, as antigas vítimas do Tahm Kench',
    'Soraka, Milio, Dr. Mundo (as a warning)': 'Soraka, Milio, Dr. Mundo (como aviso)',
    'Sett, Graves, a lapsed Black Rose agent': 'Sett, Graves, um ex-agente da Rosa Negra',
    'Brand (touched a World Rune), Zeri': 'Brand (tocou uma Runa Global), Zeri',
    "Rumble, Jayce's Mercury gear, Viktor's early rigs": 'Rumble, o equipamento de Mercúrio do Jayce, os primeiros protótipos do Viktor',
    "Kayn (Rhaast), Varus, Aatrox's hosts": 'Kayn (Rhaast), Varus, os hospedeiros do Aatrox',
    'Nocturne, Fiddlesticks, Bardo (probably)': 'Nocturne, Fiddlesticks, Bardo (provavelmente)',
    'Zilean, Ryze, Ekko (rewound)': 'Zilean, Ryze, Ekko (rebobinado)',
    'Gragas, Braum, Ornn (on a good day)': 'Gragas, Braum, Ornn (num dia bom)'
  };
  for (const list of [W.BACKGROUNDS, W.POWER_SOURCES, W.ARCHETYPES, W.PERSONALITIES]) for (const x of list) if (CHAMPS[x.champs]) x.champs = CHAMPS[x.champs];

})();
