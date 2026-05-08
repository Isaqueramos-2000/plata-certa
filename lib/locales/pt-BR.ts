/**
 * Strings em pt-BR. Mantenha as chaves em camelCase agrupadas por tela/contexto.
 * Use `{{nome}}` para placeholders que serão substituídos pela função t().
 */
const ptBR = {
  // Tabs
  'tabs.home': 'Meu Jardim',
  'tabs.identify': 'Identificar',
  'tabs.learn': 'Aprender',
  'tabs.profile': 'Perfil',

  // Home
  'home.greeting.morning': 'Bom dia',
  'home.greeting.afternoon': 'Boa tarde',
  'home.greeting.evening': 'Boa noite',
  'home.identifyCta': 'Identificar planta',
  'home.empty.title': 'Seu jardim ainda está vazio',
  'home.empty.subtitle':
    'Comece tirando uma foto de uma planta para criar sua coleção.',

  // Identify
  'identify.title': 'Identificar planta',
  'identify.takePhoto': 'Tirar foto',
  'identify.fromGallery': 'Escolher da galeria',
  'identify.analyze': 'Analisar',
  'identify.loading.consultingHerbarium': 'Consultando o herbário...',
  'identify.loading.analyzingFoliage': 'Analisando folhagem...',
  'identify.loading.checkingDatabase': 'Comparando com nosso banco...',

  // Learn
  'learn.title': 'Aprender',
  'learn.empty': 'Em breve, novos artigos por aqui.',

  // Profile
  'profile.title': 'Perfil',
  'profile.displayMode': 'Modo de exibição',
  'profile.displayMode.standard': 'Padrão',
  'profile.displayMode.accessible': 'Acessível',
  'profile.notifications': 'Notificações',
  'profile.location': 'Localização',
  'profile.language': 'Idioma',
  'profile.about': 'Sobre o app',
  'profile.privacy': 'Privacidade',

  // Comum
  'common.retry': 'Tentar novamente',
  'common.cancel': 'Cancelar',
  'common.save': 'Salvar',
  'common.continue': 'Continuar',
  'common.back': 'Voltar',
};

export default ptBR;
export type PtBRKeys = keyof typeof ptBR;
