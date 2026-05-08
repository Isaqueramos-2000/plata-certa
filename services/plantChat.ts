import Anthropic from '@anthropic-ai/sdk';

import { isWeb } from '@/lib/platform';
import type { ChatMessage, PlantIdentification } from '@/types/plant';

/**
 * Q&A breve sobre uma planta usando Haiku 4.5. Diferente da identificação,
 * essa rota é só texto — sem imagem, sem JSON estruturado. A resposta volta
 * em prosa curta (3-5 frases) pra ser fácil de ler tanto pra jovens
 * quanto pra idosos.
 *
 * Custo médio: ~$0.0017 por pergunta (400 input + 250 output).
 *
 * O prompt cache da Anthropic é aplicado no system prompt + dados da
 * espécie — quando o usuário faz várias perguntas seguidas sobre a mesma
 * planta, o input cacheado custa ~10% do normal.
 */

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_OUTPUT_TOKENS = 350;

const SHARED_TONE_RULES = `Diretrizes do tom:
- Linguagem clara e acolhedora, sem jargão técnico.
- Frases curtas. Vá direto ao ponto.
- Estruture a resposta em 3 a 5 frases curtas. Use até 2 listas curtas com "- item" se ajudar.
- Em vez de "abscisão foliar", diga "queda das folhas".
- Para problemas, dê o passo prático antes da explicação ("Reduza a rega: provavelmente é excesso de água.").
- Nunca invente diagnósticos com certeza absoluta. Se houver várias causas possíveis, diga "Pode ser X ou Y" e explique como o usuário descobre.
- Pode usar **negrito** com asteriscos duplos pra destacar palavras-chave. NÃO use cabeçalhos (#), tabelas, código, ou outro markdown. Não use emojis em alertas sérios; use com moderação.`;

const SYSTEM_PROMPT = `Você é um assistente de cuidado de plantas conversando em português brasileiro com um usuário do app PlantaCerta.

${SHARED_TONE_RULES}

Você está respondendo perguntas sobre uma planta específica (informações abaixo). Use esses dados como base. Se a pergunta sair completamente do escopo de plantas, traga educadamente de volta ao tema.`;

const GENERAL_SYSTEM_PROMPT = `Você é um assistente de cuidado de plantas conversando em português brasileiro com um usuário do app PlantaCerta.

${SHARED_TONE_RULES}

Você está respondendo dúvidas gerais sobre cuidado de plantas (sem foco em uma espécie específica). Se o usuário citar uma planta, considere isso na resposta. Se a pergunta sair completamente do escopo de plantas, traga educadamente de volta ao tema.`;

function plantContext(plant: PlantIdentification): string {
  return `Planta em questão:
- Nome popular: ${plant.commonName}
- Nome científico: ${plant.scientificName}
- Família: ${plant.family}
- Dificuldade de cuidado: ${plant.difficulty}
- Cuidados básicos: luz ${plant.care.light}; rega ${plant.care.water}; temperatura ${plant.care.temperature}; umidade ${plant.care.humidity}.
- Problemas comuns conhecidos: ${plant.commonProblems
    .map((p) => `${p.problem} (sinais: ${p.signs}; solução: ${p.solution})`)
    .join('; ')}.`;
}

function isMockEnabled(): boolean {
  if (process.env.EXPO_PUBLIC_USE_MOCK === 'true') return true;
  return !process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
}

function getClient(): Anthropic {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('EXPO_PUBLIC_ANTHROPIC_API_KEY não configurada.');
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: isWeb });
}

/**
 * Manda uma pergunta sobre a planta + opcional histórico da conversa.
 * Retorna o texto da resposta. A UI cuida de incrementar o contador
 * e persistir o histórico — esta função só fala com o Claude.
 */
export async function askAboutPlant(
  plant: PlantIdentification,
  question: string,
  history: ChatMessage[] = [],
): Promise<string> {
  if (isMockEnabled()) {
    await new Promise((r) => setTimeout(r, 1200));
    return mockAnswer(plant, question);
  }

  const client = getClient();

  const messages: Anthropic.Messages.MessageParam[] = history.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
  messages.push({ role: 'user', content: question });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: [
      // System prompt principal: idêntico a cada pergunta → cacheado.
      { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      // Contexto da planta: idêntico durante uma conversa sobre a mesma
      // planta → cacheado também. Se o usuário pular pra outra planta,
      // este bloco muda e o cache reseta (esperado).
      { type: 'text', text: plantContext(plant), cache_control: { type: 'ephemeral' } },
    ],
    messages,
  });

  for (const block of response.content) {
    if (block.type === 'text') return block.text.trim();
  }
  throw new Error('Resposta vazia do assistente.');
}

/**
 * Q&A geral, sem planta de referência — usado na aba Aprender.
 * Compartilha o mesmo contador de perguntas (questionsStore).
 */
export async function askGeneralPlantQuestion(
  question: string,
  history: ChatMessage[] = [],
): Promise<string> {
  if (isMockEnabled()) {
    await new Promise((r) => setTimeout(r, 1200));
    return mockGeneralAnswer(question);
  }

  const client = getClient();
  const messages: Anthropic.Messages.MessageParam[] = history.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
  messages.push({ role: 'user', content: question });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: [
      {
        type: 'text',
        text: GENERAL_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages,
  });

  for (const block of response.content) {
    if (block.type === 'text') return block.text.trim();
  }
  throw new Error('Resposta vazia do assistente.');
}

/**
 * Resposta falsa pro modo mock — varia um pouco com a pergunta pra dar
 * a sensação de algo dinâmico. Não é IA, é só pra UX dev.
 */
function mockGeneralAnswer(question: string): string {
  const lower = question.toLowerCase();
  if (/adub/.test(lower)) {
    return `**Como adubar a maioria das plantas de casa:**

- Use adubo líquido balanceado (NPK 10-10-10) diluído à metade.
- Adube **só na primavera e verão**, a cada 30 dias.
- Nunca adube planta com terra seca — regue antes pra evitar queimar as raízes.

Se a planta está doente ou recém-replantada, pule a adubação até ela se recuperar.`;
  }
  if (/sol direto|luz direta/.test(lower)) {
    return `Plantas tropicais de interior **não gostam** de sol direto da tarde — queimam as folhas. O sol da manhã (até umas 10h) costuma ser seguro pra maioria. Suculentas e cactos toleram bem mais luz direta.

Sinal de sol em excesso: **manchas marrons crocantes** nas folhas.`;
  }
  if (/podar|poda/.test(lower)) {
    return `A melhor época pra podar a maioria das plantas é **fim do inverno ou começo da primavera**, antes do crescimento ativo.

- Use tesoura limpa pra evitar transmitir doenças.
- Corte logo acima de uma gema ou nó.
- Remova só folhas mortas ou amareladas a qualquer hora do ano.`;
  }
  return `Boa pergunta! Em geral, observe três coisas: **luz, rega e umidade do ambiente**. Esses três pilares resolvem 80% dos problemas.

Se quiser uma resposta mais específica, me conte qual planta você tem ou o que está acontecendo com ela.`;
}

function mockAnswer(plant: PlantIdentification, question: string): string {
  const lower = question.toLowerCase();

  if (/amarel|caind/.test(lower)) {
    return `Em ${plant.commonName}, folhas amareladas geralmente são sinal de **excesso de água** ou pouca luz.

- Reduza a frequência da rega.
- Mova a planta para um local com **luz indireta brilhante**.
- Se as folhas ficarem moles e a base do caule estiver mole, replante em substrato seco e aguarde alguns dias.`;
  }
  if (/reg/.test(lower)) {
    return `Como regar sua **${plant.commonName}**:

- ${plant.care.water}
- Em média, a cada **${plant.care.waterFrequencyDays} dias** funciona bem.
- Antes de cada rega, encoste o dedo no solo. Se sair seco, é hora.

Evite molhar as folhas — a umidade ajuda fungos a se instalarem.`;
  }
  if (/prag|inset|bich/.test(lower)) {
    return `As pragas mais comuns em ${plant.commonName} são **cochonilhas** e **ácaros**. Procure pontinhos brancos, teias finas ou folhas pegajosas.

- Limpe as folhas com pano úmido e água com sabão neutro (1 colher por litro).
- Se persistir, use óleo de neem semanalmente.`;
  }
  if (/luz|sol/.test(lower)) {
    return `${plant.care.light}

Evite mover a planta com frequência — ela leva 1 a 2 semanas pra se adaptar.

- **Manchas marrons crocantes**: sol em excesso.
- **Caule esticado**: falta de luz.`;
  }

  return `Ótima pergunta sobre ${plant.commonName}. Em geral, observe três pilares: **luz, rega e umidade**. Eles resolvem a maioria dos problemas.

Se quiser uma resposta mais específica, me conte o que você está vendo (manchas, queda, cor das folhas).`;
}
