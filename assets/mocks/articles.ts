export type ArticleLevel = 'iniciante' | 'intermediário' | 'avançado';

export type Article = {
  id: string;
  title: string;
  level: ArticleLevel;
  /** Tempo estimado de leitura, em minutos. */
  readTimeMin: number;
  /** Resumo de 1 frase pra usar nos cards. */
  summary: string;
  /** Conteúdo principal em markdown leve (mesmo subset do MarkdownText). */
  content: string;
};

/**
 * Conteúdo inicial de Aprender — 6 artigos curtos, em pt-BR, escritos
 * pra um público misto (jovens + idosos). Tom acolhedor, sem jargão.
 *
 * Em produção, esses artigos viriam de um CMS (Notion / Sanity) pra
 * facilitar atualizações sem deploy.
 */
export const ARTICLES: Article[] = [
  {
    id: 'agua-basica',
    title: 'Como saber se a planta precisa de água?',
    level: 'iniciante',
    readTimeMin: 2,
    summary:
      'O teste do dedo, sinais visuais e os erros mais comuns na rega.',
    content: `Regar planta é o cuidado que mais gera dúvida — e o que mais mata planta de gente iniciante. A boa notícia é que o teste mais confiável é gratuito e dura 2 segundos.

**O teste do dedo**

Encoste o dedo no solo, afundando 2 centímetros. Se sair seco, é hora de regar. Se ainda estiver úmido, espere mais um ou dois dias.

**Sinais que a planta dá**

- **Sede**: folhas murchas, terra escorrendo da borda do vaso, peso leve.
- **Excesso**: folhas amarelas que caem fácil, base do caule mole, mau cheiro na terra.

**Erros comuns**

- Regar pouco e sempre — o solo nunca chega a secar entre regas, e as raízes apodrecem.
- Regar de manhã ou à noite "porque é mais fresco" — o melhor é regar quando o solo precisa, independente do horário.
- Usar prato com água parada por dias — vira foco de fungos.

Se ficar na dúvida entre regar agora ou esperar, **espere**. Quase toda planta sobrevive 2-3 dias com sede; pouquíssimas sobrevivem ao encharcamento.`,
  },
  {
    id: 'luz-basica',
    title: 'Quanto sol cada planta precisa?',
    level: 'iniciante',
    readTimeMin: 3,
    summary:
      'Diferença entre sol pleno, meia-sombra e luz indireta — com exemplos.',
    content: `Luz é o segundo cuidado mais importante depois da água. Plantas de espaços diferentes precisam de quantidades muito diferentes.

**Sol pleno**

Pelo menos 6 horas de sol direto por dia. Use pra suculentas, cactos, manjericão, alecrim, tomateiro.

**Meia-sombra**

3 a 4 horas de sol direto, geralmente pela manhã. Boa pra jiboia, antúrio e espada-de-são-jorge.

**Luz indireta brilhante**

Lugar bem iluminado, mas sem o sol bater na planta. É onde a maioria das plantas tropicais de interior se sente em casa: costela-de-adão, samambaias, lírio-da-paz.

**Sombra**

Pouca luz, sem sol direto. Ainda precisa de claridade — planta nenhuma vive em escuridão total. Espada-de-são-jorge e zamioculca aceitam.

**Como saber se a luz tá certa**

- **Manchas marrons crocantes** nas folhas: sol em excesso. Mude pra um lugar mais protegido.
- **Caule esticado e folhas pequenas**: pouca luz. Aproxime da janela.

Mude a planta de lugar aos poucos. Mudanças bruscas de luz estressam — ela leva 1 a 2 semanas pra se adaptar.`,
  },
  {
    id: 'pragas-comuns',
    title: 'Pragas mais comuns e como combatê-las',
    level: 'iniciante',
    readTimeMin: 3,
    summary:
      'Como identificar e tratar cochonilha, ácaro e pulgão sem usar veneno.',
    content: `Quase toda planta vai pegar uma praga em algum momento. A boa notícia: a maioria se resolve com sabão neutro e paciência.

**Cochonilha**

Parece ponto branco algodonoso, costuma ficar na axila das folhas. Limpe com cotonete embebido em álcool 70 ou pano com água e sabão neutro. Se for caso grande, use óleo de neem semanalmente.

**Ácaro**

Microscópico. Você nota antes pelas **teias finas** entre as folhas e por **pontinhos amarelos**. Gosta de ar seco. Borrife as folhas com água, lave a planta no chuveiro e aumente a umidade do ambiente.

**Pulgão**

Aglomerados verdes ou pretos nos brotos novos. Esmague com os dedos ou borrife água com sabão neutro (1 colher de chá pra 1 litro). Joaninhas comem pulgão — se tiver no quintal, deixa elas trabalharem.

**Quando preocupar**

- Folhas pegajosas e formigas circulando: praga sugadora ativa.
- Planta inteira amarelando rápido: pode ser raiz comprometida, não só praga. Tire do vaso e olhe.

**Prevenção**

Plantas saudáveis resistem mais. Luz adequada, rega correta e arejamento já cortam 80% das infestações.`,
  },
  {
    id: 'replantio',
    title: 'Quando e como replantar',
    level: 'intermediário',
    readTimeMin: 3,
    summary: 'Sinais de que o vaso ficou pequeno e o passo a passo certo.',
    content: `Toda planta cresce. Em algum momento o vaso fica apertado e o substrato esgota os nutrientes — é hora de replantar.

**Sinais de que o vaso ficou pequeno**

- Raízes saindo pelos furos de drenagem.
- A água passa direto sem encharcar a terra (sinal de que tem mais raiz do que substrato).
- Crescimento parou mesmo com cuidados certos.
- A planta tomba do peso da copa.

**Quando fazer**

- **Melhor época**: começo da primavera, quando a planta vai crescer.
- **Frequência**: a cada 1-3 anos pra maioria. Suculentas e plantas de crescimento lento podem esperar mais.

**Passo a passo**

1. Escolha um vaso 2 a 5 cm maior que o atual. Pular pra um vaso muito grande deixa muito substrato úmido em volta da raiz e pode causar apodrecimento.
2. Garanta furos de drenagem. Se não tiver, considere fazer.
3. Regue a planta um dia antes pra facilitar a saída.
4. Vire o vaso atual e bata leve na borda pra soltar.
5. Solte um pouco as raízes que estão enroladas.
6. Coloque uma camada de pedrinha ou argila expandida no fundo do vaso novo, depois substrato.
7. Centralize a planta e complete com substrato sem comprimir muito.
8. Regue até a água sair pelos furos.

**Depois**

Mantenha em meia-sombra por 1 semana. Não adube por 4-6 semanas (o substrato novo já tem nutrientes).`,
  },
  {
    id: 'adubacao-basica',
    title: 'Adubação: o básico que todo jardineiro precisa saber',
    level: 'intermediário',
    readTimeMin: 2,
    summary: 'NPK, frequência e quando NÃO adubar.',
    content: `Adubo é o jeito de devolver à terra os nutrientes que a planta consome com o tempo. Mas adubar errado mata mais planta do que falta de adubo.

**Os três números (NPK)**

A maioria dos adubos tem 3 números na embalagem, ex: **10-10-10**. Eles representam:

- **N (Nitrogênio)**: folhagem. Adubo "verde", bom pra plantas de folhas grandes.
- **P (Fósforo)**: raízes e flores. Use em plantas que vão florir.
- **K (Potássio)**: imunidade geral, frutos.

Pra começar, um adubo **balanceado (10-10-10 ou 20-20-20)** atende quase tudo.

**Quando adubar**

- **Sim**: primavera e verão, quando a planta cresce. Geralmente a cada 30 dias.
- **Não**: no inverno (planta dormente), quando estiver doente, recém-replantada (espere 4-6 semanas) ou com solo seco (queima as raízes).

**Como aplicar**

- **Adubo líquido**: dilua na água da rega seguindo a embalagem. Mais fácil de controlar a dosagem.
- **Adubo granulado**: espalhe pequena quantidade na superfície, regue normalmente.

**Regra de ouro**

Se a embalagem manda 1 colher, use ½. Adubação em excesso queima as raízes — sintoma é folhas com bordas marrons crocantes mesmo regando direito.`,
  },
  {
    id: 'estaquia',
    title: 'Propagação por estaquia: criando novas plantas',
    level: 'avançado',
    readTimeMin: 4,
    summary: 'Como tirar mudas das suas plantas e ter um jardim que se multiplica.',
    content: `Propagação por estaquia é cortar um pedaço da planta-mãe e fazer ele criar raízes próprias. Uma das maneiras mais gratificantes de cultivar — e a mais econômica.

**O que serve pra estaquia**

A maioria das plantas de interior se propaga por estaca. Funciona muito bem com: jiboia, costela-de-adão, peperômias, hortelã, suculentas, hibisco, alecrim. Não funciona ou é difícil com: orquídeas, palmeiras, samambaias.

**Passo a passo**

1. Escolha um galho saudável, com pelo menos 2-3 nós (engrossamentos onde nascem folhas).
2. Corte logo abaixo de um nó usando tesoura limpa. Corte em diagonal aumenta a superfície de absorção.
3. Remova as folhas inferiores, deixando 2-3 no topo. Folhas a mais perdem água que a estaca ainda não consegue repor.
4. Opcional: mergulhe a base no hormônio enraizador (ou em mel — funciona como fungicida natural).
5. Plante em substrato leve e úmido (mistura de terra com areia ou perlita) ou em água, conforme a espécie.

**Cuidados nas primeiras semanas**

- Mantenha em **meia-sombra** com **alta umidade**. Cobrir com saco plástico transparente cria um mini-estufa.
- Substrato sempre **levemente úmido**, nunca encharcado.
- Não puxe pra ver se enraizou. Sinais de sucesso: folhas novas brotando, resistência ao puxar de leve depois de 3-4 semanas.

**Quanto tempo demora**

Espécies fáceis (jiboia, costela): 2-3 semanas. Suculentas: 1-2 semanas pra calo, depois mais 2-4 pra raízes. Lenhosas (alecrim): 4-8 semanas.

Paciência é o ingrediente principal.`,
  },
];

export function getArticleById(id: string): Article | undefined {
  return ARTICLES.find((a) => a.id === id);
}
