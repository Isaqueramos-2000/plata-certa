import type { PlantIdentification } from '@/types/plant';

/**
 * Identificações falsas para desenvolvimento e modo mock. Em produção
 * essas estruturas vêm do Claude (services/plantAI.ts). Mantemos os
 * dados aqui em pt-BR e em linguagem acessível, sem jargão botânico.
 */

const costelaDeAdao: PlantIdentification = {
  identified: true,
  confidence: 'high',
  commonName: 'Costela-de-adão',
  scientificName: 'Monstera deliciosa',
  family: 'Araceae',
  description:
    'Planta tropical de folhas grandes e recortadas, popular em ambientes internos. Cresce rápido e gosta de espaço para se espalhar.',
  care: {
    light: 'Luz indireta brilhante. Evite sol direto da tarde.',
    water: 'Quando os 2 cm de cima do solo estiverem secos.',
    waterFrequencyDays: 5,
    soil: 'Solo leve e bem drenado, com matéria orgânica.',
    temperature: 'Entre 18°C e 27°C. Sensível a friagens.',
    humidity: 'Alta. Borrife as folhas se o ar estiver seco.',
    fertilizer: 'Adubo líquido balanceado a cada 30 dias na primavera e verão.',
  },
  calendar: {
    pruning: 'Remova folhas amareladas o ano todo. Pode formativa no fim do inverno.',
    repotting: 'A cada 2 anos, na primavera, em vaso um pouco maior.',
    fertilizing: 'De setembro a março, mensalmente. Pause no inverno.',
  },
  commonProblems: [
    {
      problem: 'Folhas sem furos',
      signs: 'Folhas novas saem inteiras, sem os recortes característicos.',
      solution: 'Mais luz indireta. A planta precisa amadurecer e ter espaço para se apoiar.',
    },
    {
      problem: 'Pontas marrons',
      signs: 'Bordas das folhas ressecam e ficam crocantes.',
      solution: 'Aumente a umidade do ar e verifique se a água tem cloro em excesso.',
    },
    {
      problem: 'Folhas amareladas',
      signs: 'Folhas inteiras amarelam, geralmente as mais velhas.',
      solution: 'Reduza a frequência de rega. O solo provavelmente está encharcando.',
    },
  ],
  funFacts: [
    'O nome "deliciosa" vem do fruto, comestível quando completamente maduro.',
    'Os furos nas folhas são uma adaptação para resistir a ventos fortes na natureza.',
    'Pode chegar a 20 metros de altura no habitat natural, escalando árvores.',
  ],
  difficulty: 'fácil',
};

const espadaDeSaoJorge: PlantIdentification = {
  identified: true,
  confidence: 'high',
  commonName: 'Espada-de-são-jorge',
  scientificName: 'Dracaena trifasciata',
  family: 'Asparagaceae',
  description:
    'Folhas eretas, rígidas e listradas. Tolera quase tudo: pouca luz, esquecimento, ar seco. Ideal para iniciantes.',
  care: {
    light: 'De luz indireta a sol pleno. Aceita cantos escuros, mas cresce mais devagar.',
    water: 'Quando o solo estiver completamente seco. Menos é mais.',
    waterFrequencyDays: 14,
    soil: 'Solo arenoso, bem drenado. Substrato para cactos funciona bem.',
    temperature: 'De 15°C a 30°C. Não gosta de frio abaixo de 10°C.',
    humidity: 'Baixa a média. Tolera ar seco sem problemas.',
    fertilizer: 'Adubo diluído pela metade, a cada 2 meses na primavera e verão.',
  },
  calendar: {
    pruning: 'Corte folhas danificadas rente ao solo. Pouca poda necessária.',
    repotting: 'A cada 3 ou 4 anos, ou quando estourar o vaso.',
    fertilizing: 'Outubro a março, a cada 60 dias. Suspenda no inverno.',
  },
  commonProblems: [
    {
      problem: 'Apodrecimento da base',
      signs: 'Folhas amolecidas, escuras na base, com cheiro ruim.',
      solution: 'Excesso de água. Suspenda a rega, retire partes podres e replante em solo seco.',
    },
    {
      problem: 'Folhas curvadas',
      signs: 'Folhas tombam para fora do vaso.',
      solution: 'Sinal de pouca luz. Mova para um local mais iluminado, mesmo que indireto.',
    },
  ],
  funFacts: [
    'Estudos da NASA mostram que ela ajuda a filtrar formaldeído e xileno do ar.',
    'No Brasil é cultivada como amuleto contra mau-olhado em muitas tradições.',
    'Pode passar semanas sem rega — é uma das plantas mais resistentes que existem.',
  ],
  difficulty: 'fácil',
};

const jade: PlantIdentification = {
  identified: true,
  confidence: 'medium',
  commonName: 'Suculenta-jade',
  scientificName: 'Crassula ovata',
  family: 'Crassulaceae',
  description:
    'Suculenta arbustiva com folhas redondas e brilhantes. Cresce devagar e pode viver décadas, ganhando tronco lenhoso.',
  care: {
    light: 'Sol direto pela manhã, luz brilhante o resto do dia.',
    water: 'Quando o solo secar por completo. No inverno, ainda menos.',
    waterFrequencyDays: 10,
    soil: 'Substrato para cactos, com boa drenagem. Adicione areia se necessário.',
    temperature: 'De 10°C a 30°C. Sensível a geadas.',
    humidity: 'Baixa. Não gosta de ambientes abafados.',
    fertilizer: 'Adubo para suculentas a cada 60 dias na primavera e verão.',
  },
  calendar: {
    pruning: 'Pode os galhos no fim do inverno para incentivar ramificação.',
    repotting: 'A cada 2 ou 3 anos, sempre em vaso pouco maior.',
    fertilizing: 'Setembro a fevereiro, a cada 2 meses.',
  },
  commonProblems: [
    {
      problem: 'Folhas murchas e enrugadas',
      signs: 'As folhas perdem firmeza e ficam franzidas.',
      solution: 'Falta de água. Regue com cuidado e aguarde alguns dias.',
    },
    {
      problem: 'Folhas caindo ao toque',
      signs: 'Folhas se soltam fácil, base do caule mole.',
      solution: 'Excesso de água. Pare de regar e aguarde o solo secar completamente.',
    },
  ],
  funFacts: [
    'Em algumas culturas asiáticas é considerada planta da prosperidade.',
    'Pode ser propagada a partir de uma única folha caída no solo.',
    'Plantas centenárias são possíveis — algumas viram heranças de família.',
  ],
  difficulty: 'fácil',
};

/**
 * Caso de baixa confiança — usado para validar a UX do aviso de
 * "tente uma foto melhor". Mantemos um conteúdo plausível, mas a UI
 * vai sinalizar a incerteza com destaque.
 */
const samambaia: PlantIdentification = {
  identified: true,
  confidence: 'low',
  commonName: 'Samambaia (provavelmente)',
  scientificName: 'Nephrolepis exaltata',
  family: 'Nephrolepidaceae',
  description:
    'A foto sugere uma samambaia, mas há ângulos que dificultam a identificação. Prefira luz natural e a planta centralizada para um resultado mais confiável.',
  care: {
    light: 'Luz indireta. Evite sol direto.',
    water: 'Mantenha o solo levemente úmido, sem encharcar.',
    waterFrequencyDays: 3,
    soil: 'Solo rico em matéria orgânica e bem drenado.',
    temperature: '18°C a 24°C.',
    humidity: 'Alta. Borrifar com frequência ajuda muito.',
    fertilizer: 'Adubo líquido diluído a cada 30 dias na primavera/verão.',
  },
  calendar: {
    pruning: 'Remova folhas secas o ano todo.',
    repotting: 'A cada 2 anos, na primavera.',
    fertilizing: 'Outubro a março, mensalmente.',
  },
  commonProblems: [
    {
      problem: 'Folhas marrons',
      signs: 'Pontas das folhas ressecam.',
      solution: 'Aumente a umidade e mova para longe de fontes de calor.',
    },
  ],
  funFacts: [
    'Plantas do gênero Nephrolepis têm origem em florestas tropicais.',
    'São conhecidas por melhorar a qualidade do ar em ambientes internos.',
  ],
  difficulty: 'médio',
};

export const MOCK_IDENTIFICATIONS = [costelaDeAdao, espadaDeSaoJorge, jade, samambaia];

/**
 * Retorna uma identificação mockada por índice (cíclico). Útil para
 * navegar de identify → result passando o índice via search params.
 */
export function getMockIdentification(index: number): PlantIdentification {
  const i = ((index % MOCK_IDENTIFICATIONS.length) + MOCK_IDENTIFICATIONS.length) %
    MOCK_IDENTIFICATIONS.length;
  return MOCK_IDENTIFICATIONS[i]!;
}
