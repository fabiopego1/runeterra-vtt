// pt-BR: princípios (interpretação, reviravoltas e habilidade Verde), habilidades de Nocaute e formas de lacaio.
(() => {
  'use strict';
  const I = window.I18N;
  const HP = 'Você e cada um dos seus aliados ganham um ponto de inspiração.';
  // [interpretação, reviravolta menor, reviravolta maior, habilidade]
  const PR = {
    destiny: ['Sinais e presságios te guiam rumo a um lugar inevitável na sua vida. Você sempre consegue algum senso de direção quando precisa.', 'Que presságio de má sorte você acabou de testemunhar?', 'Que profecia terrível acabou de se cumprir?', 'Supere uma situação diretamente ligada ao seu destino e use seu dado Máx. ' + HP],
    'energy-element': ['Você tem afinidade ou paixão por [energy/element]. Você interage com esse [energy/element] com facilidade.', 'Que outra energia/elemento está fazendo seus poderes falharem agora?', 'Que fonte de energia/elemento está abafando todos os seus poderes agora?', 'Supere um desafio que envolva [energy/element] e use seu dado Máx. ' + HP],
    exorcism: ['Você detecta os sinais sutis da influência de outros reinos num acontecimento.', 'O que (literal ou figurativamente) está voltando para te assombrar?', 'O que recebeu permissão para entrar neste mundo?', 'Supere entidades ou elementos de outra dimensão e use seu dado Máx. ' + HP],
    fauna: ['Sua natureza animal inata permite identificar qualquer tipo de vida animal não racional e determinar sua origem em linhas gerais, como nativa de Runeterra, tocada por espíritos, gerada pelo Vazio etc.', 'Como sua natureza primitiva levou a melhor sobre você?', 'Qual é o único jeito de conter o animal dentro de você?', 'Supere com a ajuda da fauna local e use seu dado Máx. ' + HP],
    flora: ['Você identifica qualquer tipo de vida vegetal e determina sua origem em linhas gerais, como nativa de Runeterra, tocada por espíritos, gerada pelo Vazio etc.', 'O que cresce fora do seu controle?', 'Como a natureza está retomando algo importante?', 'Supere com a ajuda da flora local e use seu dado Máx. ' + HP],
    future: ['Você tem visões ou conhecimento de coisas que ainda estão por vir.', 'Que efeito colateral imprevisto suas ações causaram?', 'Que efeito cascata agora ameaça o futuro que você conhece?', 'Supere usando seu conhecimento de futuros possíveis e use seu dado Máx. ' + HP],
    immortality: ['Você não envelhece e não é afetado por males comuns.', 'Você enxerga as coisas a longo prazo. Como isso te deixa lento demais?', 'De que apego importante você precisa se desfazer?', 'Supere uma situação que envolva sua condição física e use seu dado Máx. ' + HP],
    'inner-demon': ['Há uma escuridão em você que você luta para manter contida. Você pode recorrer ao seu lado sombrio para se conectar com forças parecidas.', 'Que ato sinistro nasce de você recorrer ao seu lado sombrio?', 'Que estrago seu lado sombrio causa quando você deixa ele assumir o controle?', 'Recorra à sua psique sombria para Superar um problema e use seu dado Máx. ' + HP],
    magic: ['Você está sintonizado com uma força sobrenatural e sente as energias místicas do lugar.', 'Que maldição esquisita está te seguindo agora?', 'Que contragolpe místico mudou sua vida?', 'Supere contra uma força mística e use seu dado Máx. ' + HP],
    sea: ['Você fala com criaturas aquáticas e respira debaixo d\'água.', 'Que desafio o mundo da superfície te impõe?', 'Que desastre está chegando agora que o mar veio te chamar?', 'Supere uma situação debaixo d\'água e use seu dado Máx. ' + HP],
    space: ['Você sobrevive no vácuo entre as estrelas sem equipamento extra.', 'Quem consegue te ouvir gritar?', 'O que te fez vagar à deriva rumo ao desconhecido?', 'Supere estando entre as estrelas (ou em condições parecidas) e use seu dado Máx. ' + HP],
    'time-traveler': ['Você está longe do seu tempo e muitas vezes não sabe como agir nesta época. Você tem um senso inato de quando o tempo não está bem certo na era em que está.', 'Que detalhe desta era você não conhecia?', 'Que efeitos estão acontecendo enquanto você se desfaz no tempo?', 'Supere um problema usando o conhecimento da sua era natal e use seu dado Máx. ' + HP],
    undead: ['Você é "vitalmente desafiado". Ainda pode se ferir e sofrer dano, mas ignora muitas das aflições que incomodam os vivos.', 'Como sua natureza morta-viva deixou quem está por perto desconfortável?', 'Como o que aconteceu põe em risco seu vínculo com o mundo dos vivos?', 'Supere uma situação em que sua natureza morta-viva seja útil e use seu dado Máx. ' + HP],
    clockwork: ['Você é bom em entender como as peças funcionam em conjunto e identifica falhas em sistemas ordenados.', 'Que ferramenta acabou de quebrar?', 'Em que lugar distante suas ferramentas foram parar?', 'Supere um problema complexo com uma ferramenta simples e use seu dado Máx. ' + HP],
    gearhead: ['Você sempre sabe o estado geral de conservação ou funcionamento de um aparelho, seja uma simples torradeira ou um sistema de defesa orbital alienígena.', 'Que dispositivo mecânico acabou de entrar em curto?', 'Que máquina acabou de sair terrivelmente dos trilhos?', 'Supere um desafio tecnológico e use seu dado Máx. ' + HP],
    history: ['Você tem muitos contatos e referências nas áreas de arqueologia, história e antropologia.', 'Como seu jeito antiquado causou um problema?', 'Que força ancestral agora se manifesta no presente?', 'Supere uma situação que envolva arqueologia, história ou enigmas e use seu dado Máx. ' + HP],
    indestructible: ['Você ignora dano de armas e ataques corpo a corpo sem poder, como porretes e punhos comuns, ou de ataques básicos à distância, como fundas e flechas.', 'O que dá errado com suas defesas?', 'Quem além de você se machuca porque você não consegue sofrer dano?', 'Supere numa situação em que você se joga de cabeça no perigo e use seu dado Máx. ' + HP],
    lab: ['Você tem acesso quase ilimitado a um espaço de pesquisa próprio e se sente em casa lá.', 'Que desvio você fez para observar e coletar amostras para experimentos futuros?', 'Algo deu muito errado no laboratório; o que foi?', 'Supere estando num espaço de trabalho familiar ou quando tiver bastante tempo de pesquisa. Use seu dado Máx. ' + HP],
    mastery: ['Você estudou a fundo os próprios poderes e se orgulha do seu domínio sobre eles. Entende bastante da metafísica dos seus poderes.', 'Como seus poderes te deixaram na mão naquele momento?', 'Que efeitos colaterais dos seus poderes você está sofrendo?', 'Supere numa situação que use seus poderes de um jeito novo e use seu dado Máx. ' + HP],
    mentor: ['Para você é importante dividir seu conhecimento e sua experiência com campeões menos calejados. Todos te respeitam, de algum modo, pela sua sabedoria.', 'Que fedelho acabou de te passar para trás?', 'O que acabou de provar que você está ultrapassado demais?', 'Supere um desafio que alguém mais jovem já tentou e falhou. Use seu dado Máx. ' + HP],
    powerless: ['Você valoriza o treino e o trabalho duro mais do que habilidades sobrenaturais. Sabe resolver as coisas sem poderes e como explorar as falhas de quem tem poderes.', 'Que ferimento temporário você acabou de sofrer?', 'Que ferimento mais sério você acabou de sofrer?', 'Use seu conhecimento das limitações dos poderes numa ação de Superar e use seu dado Máx. ' + HP],
    science: ['Você está por dentro da maioria das teorias e pesquisas da filosofia natural moderna e consegue citá-las numa conversa.', 'Quais foram os efeitos surpreendentes de aplicar aquele princípio científico nesta situação?', 'Ai, caramba! O que acabou de explodir?', 'Supere aplicando princípios científicos específicos. Use seu dado Máx. ' + HP],
    speed: ['Você é rápido e não gosta de perder tempo. Gosta de seguir caminho o quanto antes.', 'Que desvantagens físicas você sofre por ir rápido demais?', 'Que detalhe crucial você atropelou antes e agora está voltando para te assombrar?', 'Quando você Superar com sucesso, pode terminar em qualquer lugar do ambiente atual. ' + HP],
    stealth: ['Você sempre sabe o jeito mais eficiente de entrar ou sair de um lugar.', 'Que pista da sua presença você acabou de deixar para trás?', 'O que acabou de acontecer que te denunciou como uma ameaça óbvia?', 'Supere para se infiltrar em algum lugar ou evitar ser detectado e use seu dado Máx. ' + HP],
    strength: ['Você é muito forte, então precisa tomar cuidado para não esmagar coisas delicadas. Você não precisa rolar para realizar proezas comuns de grande força.', 'O que acabou de quebrar?', 'Quem acabou de quebrar?', 'Supere usando força bruta e use seu dado Máx. ' + HP],
    tactician: ['Você está sempre avaliando a situação, fazendo planos e planos de reserva, e então reavaliando tudo.', 'Que variável seu plano não levou em conta?', 'Que grande ameaça é revelada e invalida todos os seus planos?', 'Supere quando puder fazer um flashback de como se preparou exatamente para esta situação. Use seu dado Máx. ' + HP],
    whispers: ['Você ouve uma voz na cabeça que ninguém mais ouve. Essa voz te conta coisas, que podem ser verdade ou não, mas ela com certeza parece saber muito.', 'Como a voz na sua cabeça acabou de te distrair?', 'O que a voz está exigindo de você agora?', 'Supere um desafio que envolva informações que você não teria como saber e use seu dado Máx. ' + HP],
    chaos: ['Você é um espírito livre e imprevisível. Nem as mentes mais brilhantes conseguem prever o que você vai fazer.', 'Como você entrou na linha para conseguir fazer algo?', 'O que te deixou previsível e sem graça?', 'Supere uma situação de um jeito realmente imprevisível e use seu dado Máx. ' + HP],
    compassion: ['Você é uma pessoa empática. Sente o sofrimento dos outros ao seu redor.', 'Que injustiça avassaladora te causa uma dor a mais?', 'Como você vai lidar com se desconectar da humanidade?', 'Supere para se conectar com alguém num nível pessoal e use seu dado Máx. ' + HP],
    defender: ['Você se coloca no caminho do perigo para defender outra pessoa sem pensar duas vezes.', 'Como suas ações te colocam em mais perigo do que antes?', 'Que grande sacrifício você acabou de fazer para ter sucesso?', 'Supere uma situação que exija que você segure a linha e use seu dado Máx OU use seu dado Médio e Defenda com seu dado Mín. ' + HP],
    dependence: ['Você depende de [algo] e normalmente não funciona sem isso.', 'Como o objeto da sua dependência foi danificado ou perdido?', 'Como sua dependência está te impedindo de agir como campeão?', 'Supere numa situação para a qual o objeto da sua dependência foi feito. Use seu dado Máx. ' + HP],
    equality: ['Você tem um senso aguçado de status social e percebe qualquer situação em que as pessoas são tratadas de forma injusta.', 'Quem está em perigo e você acabou de perceber?', 'O que você vai sacrificar para proteger os oprimidos?', 'Supere para proteger os direitos dos desfavorecidos e use seu dado Máx. ' + HP]
  };
  window.__PR_PT = PR;
})();
(() => {
  'use strict';
  const I = window.I18N;
  const HP = 'Você e cada um dos seus aliados ganham um ponto de inspiração.';
  Object.assign(window.__PR_PT, {
    'great-power': ['Seus poderes são tão fortes que às vezes assustam até você, mas você se esforça para controlá-los. Pode usá-los para intimidar os outros.', 'Como você se segura para não liberar todo o seu poder?', 'Que grande estrago você causa no processo de salvar o dia?', 'Supere uma situação usando um dos seus poderes de maior graduação e use seu dado Máx. ' + HP],
    hero: ['Por causa das suas habilidades, você tem a vocação de proteger os outros.', 'Sua necessidade imediata de ajudar alguém te faz deixar a bola cair na vida pessoal. O que foi?', 'Você recebe um ultimato entre sua vida de campeão e algo que você valoriza. Do que você abre mão?', 'Supere numa situação em que inocentes estejam em perigo imediato e use seu dado Máx. ' + HP],
    honor: ['Você segue um código de conduta rígido. Mesmo sob coação, não abre mão dos seus ideais.', 'Sua honra foi desafiada. Como você vai responder?', 'Você vai escolher a honra ou a vida?', 'Supere uma situação para manter seu código de honra e use seu dado Máx. ' + HP],
    justice: ['Você sempre percebe os atos de injustiça ao seu redor e quem os cometeu.', 'Como você está gastando tempo a mais para se mostrar um exemplo brilhante de justiça?', 'Como sua busca obstinada por justiça deixa seus aliados desconfortáveis?', 'Supere para impedir um ato de injustiça em andamento e use seu dado Máx. ' + HP],
    liberty: ['Você acredita firmemente na liberdade e sempre fica do lado dos oprimidos. Sua mente nunca pode ser realmente aprisionada.', 'Como você fica temporariamente preso?', 'Como você mesmo virou um prisioneiro?', 'Supere numa situação em que você esteja preso ou amarrado e use seu dado Máx. ' + HP],
    order: ['Você acredita em organização e harmonia. Sempre mantém a cabeça no lugar diante do caos.', 'Que elemento de desordem faz seu plano desmoronar?', 'Como o caos arruinou sua existência ordenada?', 'Supere um desafio em que você possa organizar outras pessoas. Use seu dado Máx. ' + HP],
    'self-preservation': ['Você valoriza a própria segurança mais do que a maioria na sua profissão. Nunca é pego completamente desprevenido quando sua vida está em jogo.', 'Quem sofre por causa da sua hesitação?', 'Você está disposto a dar a vida para salvar os outros?', 'Supere para se tirar de um perigo imediato e use seu dado Máx. ' + HP],
    zealot: ['Sua vontade é indomável e suas crenças guiam suas ações.', 'Quem sofreu mais por causa da sua perseguição fanática?', 'O que sua fé te chamou a fazer que ninguém mais vai entender?', 'Supere uma situação que ponha sua fé à prova e use seu dado Máx. ' + HP],
    ambition: ['Há algo que você quer, e você luta para alcançar seus objetivos, custe o que custar. Você enxerga caminhos para a vitória que ninguém mais vê.', 'Como a busca pelos seus objetivos está atrapalhando você a ser campeão nesta situação?', 'O que você acabou de deixar passar que finalmente teria te ajudado a alcançar seu maior objetivo?', 'Supere uma situação em que outra pessoa tenha te dado um bônus de Fortalecer e use seu dado Máx. ' + HP],
    amnesia: ['Seu passado está perdido ou encoberto. Os outros têm uma dificuldade enorme de te rastrear.', 'Um lampejo da sua vida anterior te distraiu por um instante. O que você viu?', 'Um detalhe chocante do seu passado muda a situação atual. Como isso afeta a cena?', 'Supere uma situação em que uma perspectiva totalmente nova seja útil e use seu dado Máx. ' + HP],
    detachment: ['Você se mantém distante de situações emocionais e nunca perde a calma.', 'Que campeão ou coadjuvante você acabou de afastar com seu jeito distante?', 'Como você se retraiu da situação atual para conseguir lidar com ela?', 'Supere um desafio ligado a pressão ou medo e use seu dado Máx. ' + HP],
    discovery: ['Você está ávido por aprender coisas novas a qualquer custo. Recita dados sobre conceitos e ideias recém-descobertos.', 'Que nova descoberta te faz repensar o que está fazendo?', 'Que nova descoberta você precisa esconder a qualquer custo?', 'Quando você estiver na vanguarda de uma descoberta ou invenção e fizer uma ação de Superar para ampliar seu conhecimento, use seu dado Máx. ' + HP],
    loner: ['Você é o melhor no que faz, desde que ninguém esteja olhando. Sempre acha o próprio caminho.', 'Agora que você se separou do grupo, como vai voltar?', 'Como seu jeito solitário afasta o resto do grupo?', 'Supere fazendo algo diferente do resto do grupo e use seu dado Máx. ' + HP],
    nomad: ['Você está longe de casa, mas está acostumado a viver na estrada. Sabe se virar em fuga.', 'Que problema sua falta de vínculos causa?', 'Como você se perdeu do seu novo lar?', 'Supere uma situação em que possa aplicar lições da estrada e use seu dado Máx. ' + HP],
    peace: ['Você acredita que o objetivo final da sua missão é a paz e que a violência geralmente não é a resposta. Mesmo sem ser pacifista, quase sempre encontra uma solução não violenta para os problemas.', 'O que te faz perder a calma?', 'Que grande problema você cria com o grupo ao se recusar a partir para a violência?', 'Supere uma situação com serenidade em vez de violência e use seu dado Máx. ' + HP],
    rage: ['Ninguém gosta de você quando está com raiva. Sua fúria intimida muita gente.', 'O que sua raiva acabou de estragar?', 'Quem você afastou de vez com seus acessos de fúria?', 'Supere uma situação em que possa canalizar sua fúria para o bem e use seu dado Máx. ' + HP],
    split: ['Você tem duas (ou mais) facetas completamente separadas na personalidade. Por isso, enxerga uma situação por muitos ângulos diferentes.', 'Que perspectiva acabou sendo a errada para a situação?', 'Que conflito interno te desestabilizou por completo?', 'Supere uma situação que se beneficie de um ponto de vista completamente novo e use seu dado Máx. ' + HP],
    savagery: ['Seus instintos selvagens te acompanham e guiam suas ações. Você sobrevive na natureza e resiste às armadilhas da civilização.', 'Quem você machucou no seu frenesi?', 'Por que grande dano colateral você é responsável?', 'Supere uma situação que recorra à sua natureza primitiva e use seu dado Máx. ' + HP],
    levity: ['Você mantém o otimismo mesmo quando toda esperança se perdeu. Seu espírito é quase impossível de quebrar.', 'Quem você ofendeu fazendo piada na hora errada?', 'O que aconteceu que finalmente quebrou seu bom humor?', 'Supere uma situação desesperadora em que suas piadas evitem a desmoralização e use seu dado Máx. ' + HP],
    'spotless-mind': ['Você vive num estado de bendita ignorância. Rancores, enroscos e compromissos escorregam de você.', 'O que escorregou de você antes e seria útil agora?', 'Que coisa importante você esqueceu, e por que esquecer piorou muito a situação?', 'Supere uma situação em que estar livre do passado seja útil e use seu dado Máx. ' + HP],
    business: ['Você é um empreendedor, e tocar um negócio é parte importante da sua vida e da sua identidade. Você tem uma base de operações em que pode se apoiar.', 'Você sempre olha o panorama geral. Como isso cria atrito com o grupo no momento?', 'Seus interesses comerciais estão em perigo. Quais são, de verdade, suas prioridades?', 'Supere numa situação ligada à área do seu negócio ou ao seu conhecimento dos locais. Use seu dado Máx. ' + HP],
    debtor: ['Você deve a alguém ou a algo mais do que um dia vai conseguir pagar. Conhece muita gente disposta a fazer favores, mas vai custar caro depois.', 'Que possível fonte de riqueza parece bem tentadora agora?', 'Quem veio cobrar?', 'Supere numa situação ligada a pagar uma dívida e use seu dado Máx. ' + HP],
    detective: ['Você sempre percebe quando uma informação importante está sendo omitida ou escondida, mesmo sem saber exatamente qual é.', 'Que pista importante você deixou passar?', 'Que grande segredo acabou de ser revelado e você preferia que continuasse escondido?', 'Supere para descobrir informações ocultas e use seu dado Máx. ' + HP],
    'double-agent': ['Você é leal a mais de uma organização, possivelmente com interesses opostos. Sempre apaga seus rastros.', 'O que você acabou de ser forçado a fazer que pareceu estranho aos seus aliados atuais?', 'Você vai destruir a confiança dos seus aliados atuais ou abrir mão do que sua outra lealdade oferece?', 'Supere numa situação em que possa recorrer aos recursos da sua outra organização e use seu dado Máx. ' + HP],
    everyman: ['Você é só uma pessoa comum que recebeu poder de repente ou que está metida em algo grande demais. Não tem o mesmo senso de propósito elevado dos outros campeões. Quando precisa, consegue virar só mais um rosto na multidão.', 'Que campeão você fez parecer bem à sua própria custa?', 'Como você está completa e totalmente fora da sua liga?', 'Supere ao usar um bônus criado por outro campeão e use seu dado Máx. ' + HP],
    family: ['Sua família é parte importante da sua vida. Você tem parentes em várias áreas a quem pode recorrer.', 'Que membro da sua família acabou de comprometer sua missão?', 'Do que você precisa abrir mão na vida de campeão pelo bem da sua família?', 'Supere numa situação em que tenha recebido um conselho de alguém da família e use seu dado Máx. ' + HP],
    mask: ['É vital esconder sua verdadeira identidade. Você tem uma profissão que te permite alternar entre identidades quando precisa.', 'Que pista sobre sua identidade real você deixou para trás?', 'Quem da sua vida civil está agora em perigo iminente?', 'Supere usando o conhecimento da sua vida civil e use seu dado Máx. ' + HP],
    sidekick: ['Você parece estar sempre onde está a confusão; nunca está longe quando uma crise atinge o grupo que você acompanha.', 'Que campeão precisa te resgatar da enrascada atual?', 'Que lição séria que você ignorou agora está te metendo em grandes apuros?', 'Supere um desafio que já confundiu um companheiro mais experiente e use seu dado Máx. ' + HP],
    team: ['Seu grupo heroico ocupa uma parte importante da sua vida e você tem um posto oficial nele. As autoridades civis reconhecem seu status no grupo.', 'Que vexame você acabou de causar como representante do seu grupo?', 'Que grandes sanções você vai sofrer por causa das suas ações?', 'Supere usando seu status de representante oficial e use seu dado Máx. ' + HP],
    underworld: ['Você tem vários contatos no submundo do crime e no crime organizado.', 'Que detalhe suspeito faz os outros desconfiarem de você?', 'Você é culpado daquilo pelo qual está sendo preso?', 'Supere um problema ligado ao seu conhecimento do submundo do crime ou usando um dos seus contatos e use seu dado Máx. ' + HP],
    veteran: ['Você mantém a cabeça fria em situações de combate intenso.', 'O que no conflito atual mexeu com você emocionalmente?', 'Como você está se retirando do conflito atual?', 'Supere um desafio tático usando o conhecimento de um conflito anterior e use seu dado Máx. ' + HP],
    youth: ['Você tem uma visão inocente e alegre da maioria das coisas, graças à sua personalidade animada e à falta de experiência. Você consegue entrar em muitas situações em que adultos teriam dificuldade.', 'Quem ficou chateado com seu excesso de confiança?', 'Que pessoa que você odiaria decepcionar agora está muito decepcionada com você?', 'Supere uma situação em que sua idade ou tamanho sejam uma vantagem e use seu dado Máx. ' + HP]
  });

  // Reviravoltas escritas para o nome de Runeterra de cada princípio: [menor, maior].
  // A menor é um incômodo resolvido na cena; a maior, uma complicação que dura a sessão inteira.
  const TW = {
    // Esotérico
    destiny: ['Que presságio de má sorte, um corvo, um eclipse ou uma estrela cadente, você acabou de testemunhar?', 'Que profecia sobre você acabou de se cumprir, do pior jeito possível?'],
    'energy-element': ['Que elemento oposto ao seu está enfraquecendo seus poderes agora?', 'Que fonte de poder do seu elemento está sufocando você, ou fugindo do seu controle?'],
    exorcism: ['Que rastro da Névoa Negra ou de outro reino te distraiu e te fez perder o foco?', 'Que espectro, espírito ou cria do Vazio atravessou para este mundo porque você falhou?'],
    fauna: ['Que instinto de fera tomou conta de você na hora errada?', 'Que animal, espírito ou matilha agora te vê como rival, e não como parente?'],
    flora: ['Que raiz, espinho ou flor está crescendo fora do seu controle?', 'Que floresta, jardim ou terra sagrada a natureza está tomando de volta, e quem sofre com isso?'],
    future: ['Que visão do futuro te distraiu no pior momento?', 'Que futuro terrível você vislumbrou começou a se tornar realidade por causa das suas ações?'],
    immortality: ['Você vê tudo em escala de séculos. Como isso te deixou lento ou distante demais agora?', 'Que mortal querido você está vendo envelhecer, se ferir ou partir, enquanto você continua igual?'],
    'inner-demon': ['Que ato sombrio escapa de você quando a voz de dentro fala mais alto?', 'O que a escuridão dentro de você destrói quando assume o controle?'],
    magic: ['Que magia instável reagiu ao seu toque do jeito errado?', 'Que contragolpe arcano, das Runas ou do Reino Espiritual, mudou sua vida?'],
    sea: ['Que dificuldade a vida em terra firme, longe do mar, está te causando agora?', 'O mar veio cobrar o que é dele. Que tempestade, criatura ou maré está chegando por sua causa?'],
    space: ['Que vertigem, frio ou falta de ar das alturas te pegou desprevenido?', 'Que força celestial ou Aspecto de Targon te arrastou para longe, ou está te chamando para o alto?'],
    'time-traveler': ['Que costume desta era te deixou perdido, ou te fez passar vergonha?', 'Que eco da sua era perdida está bagunçando o presente, ou apagando você dele?'],
    undead: ['Como sua natureza de espectro assustou quem estava por perto?', 'Como a Névoa Negra está te puxando de volta, e o que você perde do mundo dos vivos?'],
    // Maestria
    clockwork: ['Que engrenagem, mola ou ferramenta de precisão acabou de quebrar?', 'Que mecanismo que você construiu ou consertou foi parar nas mãos erradas?'],
    gearhead: ['Que aparelho acabou de soltar faísca e entrar em curto?', 'Que máquina saiu de controle e agora ameaça todo mundo por perto?'],
    history: ['Que detalhe histórico você lembrou errado, ou que costume antigo te fez tropeçar agora?', 'Que força ancestral, de uma ruína, relíquia ou era esquecida, despertou por causa do que você descobriu?'],
    indestructible: ['O que atravessou suas defesas, ou que ponto fraco elas acabaram de revelar?', 'Quem saiu ferido no seu lugar, porque o golpe desviou de você?'],
    lab: ['Que amostra, reagente ou peça rara você parou para coletar no pior momento?', 'O que deu terrivelmente errado na sua oficina enquanto você estava fora?'],
    mastery: ['Como o seu dom falhou, ou respondeu de um jeito inesperado, bem agora?', 'Que preço o seu poder está cobrando do seu corpo ou da sua mente?'],
    mentor: ['Que aprendiz ou novato acabou de te passar para trás?', 'Seu aluno seguiu um caminho que você nunca ensinou. O que ele fez?'],
    powerless: ['Que ferimento, arranhão ou pancada você levou por enfrentar magia sem magia?', 'Que magia te atingiu de verdade, e que ferimento sério ela deixou?'],
    science: ['Que efeito colateral inesperado a sua teoria causou nesta situação?', 'Que experimento, químico ou hextec, acabou de explodir, e o que ele levou junto?'],
    speed: ['Que tropeço ou cansaço você sofreu por correr rápido demais?', 'Que detalhe crucial você atropelou na pressa e agora está voltando para te assombrar?'],
    stealth: ['Que rastro da sua presença você acabou de deixar para trás?', 'Quem te viu e agora sabe exatamente quem você é e o que você faz?'],
    strength: ['O que você acabou de quebrar sem querer?', 'Quem você acabou de machucar sem querer?'],
    tactician: ['Que variável o seu plano não previu?', 'Que traição ou ameaça revelada joga fora todos os seus planos, até o plano B?'],
    whispers: ['Como a voz na sua cabeça acabou de te distrair ou te enganar?', 'O que a voz exige de você agora, e o que acontece se você recusar?'],
    // Ideais
    chaos: ['Que regra ou ordem você teve que engolir para conseguir fazer algo?', 'Quem aprendeu a prever o seu caos, e está usando isso contra você?'],
    compassion: ['Que sofrimento à sua volta pesou tanto que te atrapalhou agora?', 'Que dor alheia você teve que ignorar para seguir em frente, e o que isso fez com você?'],
    defender: ['Como proteger alguém te deixou mais exposto do que antes?', 'Que grande sacrifício você fez para manter alguém em segurança?'],
    dependence: ['Como a coisa de que você depende foi danificada, perdida ou roubada?', 'Como a falta dela está te impedindo de agir como campeão?'],
    equality: ['Que injustiça contra os mais fracos você acabou de perceber no meio da cena?', 'O que você vai sacrificar para defender os oprimidos, mesmo contra os poderosos?'],
    'great-power': ['Como você se segura para não liberar todo o seu poder, e o que isso te custa agora?', 'Que grande estrago o seu poder causou enquanto você salvava o dia?'],
    hero: ['Sua necessidade de ajudar te fez deixar algo da vida pessoal cair. O que foi?', 'Você recebe um ultimato entre ser campeão e algo que você ama. Do que você abre mão?'],
    honor: ['Quem desafiou a sua honra, e como você vai responder?', 'Manter a palavra agora vai custar caro. Você escolhe a honra ou a vida?'],
    justice: ['Como você perdeu tempo tentando ser um exemplo perfeito de justiça?', 'Como a sua busca obstinada por justiça está deixando seus aliados desconfortáveis?'],
    liberty: ['Que corrente, cela ou ordem te prendeu por um momento?', 'Como você mesmo virou prisioneiro, de alguém ou de uma promessa?'],
    order: ['Que pedaço de desordem fez o seu plano desmoronar?', 'Como o caos arruinou a ordem que você tinha construído?'],
    'self-preservation': ['Quem sofreu porque você hesitou para se proteger?', 'Você está disposto a arriscar a própria vida para salvar os outros?'],
    zealot: ['Quem sofreu por causa do seu zelo fanático?', 'O que a sua fé te chamou a fazer que ninguém mais vai entender?'],
    // Identidade
    ambition: ['Como a busca pelo topo está te atrapalhando a ser campeão agora?', 'Que chance de finalmente alcançar o que você quer você acabou de deixar escapar?'],
    amnesia: ['Que lampejo da sua vida esquecida te distraiu por um instante?', 'Que verdade chocante do seu passado acabou de vir à tona e muda tudo?'],
    detachment: ['Quem você acabou de afastar com o seu jeito distante?', 'Que emoção você deixou de sentir para aguentar esta situação, e o que isso te custou?'],
    discovery: ['Que nova descoberta te fez repensar o que está fazendo?', 'Que descoberta você agora precisa esconder a qualquer custo?'],
    loner: ['Agora que você se separou do grupo, como vai voltar?', 'Como o seu jeito solitário afastou o resto do grupo?'],
    nomad: ['Que problema a sua falta de raízes causou agora?', 'Que lar, caravana ou companhia de estrada você perdeu, e como?'],
    peace: ['O que te fez perder a calma e o equilíbrio?', 'Que grande problema você criou ao se recusar a partir para a violência?'],
    rage: ['O que a sua fúria acabou de estragar?', 'Quem você afastou de vez com os seus acessos de raiva?'],
    split: ['Que lado seu tomou a decisão errada agora?', 'Que briga entre as suas duas almas te deixou completamente sem rumo?'],
    savagery: ['Quem você machucou no seu frenesi selvagem?', 'Que grande estrago na cidade, ou entre os civilizados, é culpa sua?'],
    levity: ['Quem você ofendeu com uma piada na hora errada?', 'O que aconteceu que finalmente acabou com o seu bom humor?'],
    'spotless-mind': ['O que escorregou da sua memória antes e seria útil agora?', 'Que coisa importante você esqueceu, e como esquecer piorou muito a situação?'],
    // Responsabilidade
    business: ['Como o seu olho no lucro criou atrito com o grupo agora?', 'Seu negócio está em perigo. Quais são, de verdade, as suas prioridades?'],
    debtor: ['Que chance de dinheiro fácil parece tentadora demais agora?', 'Quem veio cobrar a dívida, e o que ele quer em vez de moedas?'],
    detective: ['Que pista importante você deixou passar?', 'Que segredo que você preferia manter escondido acabou de ser revelado?'],
    'double-agent': ['O que você foi forçado a fazer pela sua outra lealdade que pareceu estranho aos seus aliados?', 'Você vai trair a confiança dos seus aliados ou abrir mão do que a sua outra lealdade oferece?'],
    everyman: ['Que campeão você fez parecer bem à sua própria custa?', 'Como você está completa e totalmente fora da sua liga?'],
    family: ['Que parente acabou de complicar a sua missão?', 'Do que você precisa abrir mão como campeão pelo bem da sua família, da sua casa ou do seu clã?'],
    mask: ['Que pista sobre a sua verdadeira identidade você deixou para trás?', 'Quem da sua vida comum está agora em perigo por causa do seu segredo?'],
    sidekick: ['Que campeão precisa te tirar da enrascada em que você se meteu?', 'Que conselho do seu parceiro você ignorou, e agora ele está te metendo em grandes apuros?'],
    team: ['Que vexame você acabou de causar em nome do seu bando ou ordem?', 'Que punição o seu bando ou ordem vai te impor por causa das suas ações?'],
    underworld: ['Que detalhe suspeito faz os outros desconfiarem de você?', 'Os guardas vieram te prender. Você é culpado do que te acusam?'],
    veteran: ['Que lembrança da guerra esta luta despertou em você?', 'A guerra voltou para dentro da sua cabeça. Como você está saindo deste conflito?'],
    youth: ['Quem ficou chateado com o seu excesso de confiança?', 'Que pessoa que você odiaria decepcionar agora está muito decepcionada com você?']
  };

  // Aplica: interpretação e reviravoltas direto nos dados; a habilidade vai para I18N.text (o inglês segue valendo nas regras).
  for (const p of window.PRINCIPLES) {
    const v = window.__PR_PT[p.id];
    if (!v) continue;
    I.text[p.ability] = v[3];
    p.rp = v[0]; p.minor = v[1]; p.major = v[2];
    if (TW[p.id]) { p.minor = TW[p.id][0]; p.major = TW[p.id][1]; }
  }
  delete window.__PR_PT;

  // Habilidades de Nocaute (Personalidades)
  Object.assign(I.text, {
    'Boost an ally by rolling your single [quality] die.': 'Fortaleça um aliado rolando só o seu dado de [quality].',
    'The hero who goes directly after you may take 1 damage to reroll their dice pool.': 'O campeão que age logo depois de você pode sofrer 1 de dano para rolar de novo a reserva de dados dele.',
    'Hinder an opponent by rolling your single [power] die.': 'Atrapalhe um oponente rolando só o seu dado de [power].',
    'Hinder an opponent by rolling your single [quality] die.': 'Atrapalhe um oponente rolando só o seu dado de [quality].',
    'Boost an ally by rolling your single Red status die.': 'Fortaleça um aliado rolando só o seu dado de status Vermelho.',
    'Defend an ally by rolling your single [power] die.': 'Defenda um aliado rolando só o seu dado de [power].',
    'Hinder a minion or lieutenant by rolling your single [quality] die, and increase that penalty by -1.': 'Atrapalhe um lacaio ou tenente rolando só o seu dado de [quality] e aumente essa penalidade em -1.',
    'Choose an ally. Until your next turn, that ally may reroll one of their dice by using a Reaction.': 'Escolha um aliado. Até o seu próximo turno, esse aliado pode rolar de novo um dos dados dele usando uma Reação.',
    'Boost an ally by rolling your single [power] die.': 'Fortaleça um aliado rolando só o seu dado de [power].',
    'Defend an ally by rolling your single [quality] die.': 'Defenda um aliado rolando só o seu dado de [quality].',
    'Remove a bonus or penalty of your choice.': 'Remova um bônus ou penalidade à sua escolha.'
  });

  // Formas de lacaio (Criador de Lacaios): nome + texto
  const MF = {
    Autonomous: ['Autônomo', 'O lacaio pode fazer qualquer ação básica, não só uma.'],
    Burrowing: ['Escavador', 'O lacaio consegue cavar túneis pela terra.'],
    Floating: ['Flutuante', 'O lacaio consegue voar e manobrar no ar.'],
    Pack: ['Matilha', 'O lacaio soma +1 ao Ataque para cada outro lacaio da matilha atacando o mesmo alvo nesta rodada.'],
    Explosive: ['Explosivo', 'Quando o lacaio for destruído, remova também um bônus ou penalidade à sua escolha.'],
    Reinforced: ['Reforçado', 'O lacaio soma +1 à rolagem de resistência.'],
    Harsh: ['Implacável', 'Ao Atrapalhar, o alvo também sofre dano igual a essa penalidade.'],
    Stealth: ['Furtivo', 'Quando o lacaio passar na resistência, não diminua o tamanho do dado dele.'],
    Swift: ['Veloz', 'O lacaio rola duas vezes para a ação dele e escolhe o dado maior.'],
    Champion: ['Campeão', 'Ao Fortalecer, pode aplicar o bônus a todas as ações do seu criador e dos lacaios dele até o seu próximo turno.'],
    'Hive-Mind': ['Mente de Colmeia', 'Enquanto este lacaio estiver ativo, todos os seus outros lacaios podem fazer a mesma ação que ele.'],
    Turret: ['Torreta', 'Ao Atacar, o lacaio pode dividir o dado dele em dois dados, cada um um tamanho menor, e Atacar um alvo com os dois ou dois alvos.']
  };
  for (const f of window.MINION_FORMS) { const v = MF[f[0]]; if (v) { I.names[f[0]] = v[0]; I.text[f[1]] = v[1]; } }
})();
