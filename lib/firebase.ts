/**
 * Firebase Anonymous Authentication.
 *
 * Por que autenticação anônima?
 * ─────────────────────────────
 * • O usuário não precisa criar conta — basta abrir o app.
 * • Cada instalação recebe um UID único e verificável criptograficamente.
 * • O backend verifica o token JWT gerado pelo Firebase (não pode ser forjado).
 * • É impossível chamar /api/identify com um token falso — só instâncias
 *   reais do app conseguem um token válido.
 *
 * Configuração necessária (console.firebase.google.com):
 * ──────────────────────────────────────────────────────
 * 1. Crie um projeto → adicione um app Web → copie o firebaseConfig
 * 2. Authentication → Sign-in method → habilite "Anônimo"
 * 3. Preencha as variáveis EXPO_PUBLIC_FIREBASE_* no .env
 *
 * Sem config: o módulo retorna null (app funciona em modo degradado
 * com rate limiting apenas por device ID).
 */

import { getApps, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, type User } from 'firebase/auth';

// ─── Configuração ─────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** Firebase está configurado quando todas as variáveis de ambiente existem. */
function isConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

// Inicializa o app apenas uma vez (evita erro "already initialized").
let _initialized = false;

function getFirebaseAuth() {
  if (!isConfigured()) return null;
  if (!_initialized) {
    if (!getApps().length) initializeApp(firebaseConfig);
    _initialized = true;
  }
  return getAuth(getApps()[0]);
}

// ─── Auth anônimo ─────────────────────────────────────────────────────────────

let _currentUser: User | null = null;

/**
 * Garante que o usuário está autenticado anonimamente.
 * Retorna o User do Firebase, ou null se Firebase não estiver configurado.
 */
export async function ensureFirebaseUser(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;

  if (_currentUser) return _currentUser;
  if (auth.currentUser) {
    _currentUser = auth.currentUser;
    return _currentUser;
  }

  try {
    const { user } = await signInAnonymously(auth);
    _currentUser = user;
    return user;
  } catch (err) {
    console.warn('[firebase] signInAnonymously falhou:', err);
    return null;
  }
}

/**
 * Retorna o ID Token JWT desta sessão.
 * O token expira em 1h — getIdToken() renova automaticamente se necessário.
 * Retorna null se Firebase não estiver configurado ou se o login falhar.
 */
export async function getFirebaseToken(): Promise<string | null> {
  try {
    const user = await ensureFirebaseUser();
    if (!user) return null;
    return user.getIdToken(/* forceRefresh */ false);
  } catch (err) {
    console.warn('[firebase] getIdToken falhou:', err);
    return null;
  }
}

/** true se Firebase está configurado nas variáveis de ambiente. */
export { isConfigured as isFirebaseConfigured };
