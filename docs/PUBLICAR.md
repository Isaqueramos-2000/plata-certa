# Guia de Publicação — PlantaCerta

Passo a passo para publicar versões novas no Google Play Store usando EAS.

---

## 📦 Estrutura de builds

O `eas.json` define 3 perfis:

| Perfil | Saída | Para que serve |
|---|---|---|
| `development` | APK | Debug local com `developmentClient` |
| `preview` | APK | Testar internamente em emulador/celular sem precisar do Play Store |
| `production` | AAB | Upload no Google Play Console |

---

## 🚀 Publicar nova versão (depois da conta verificada)

### 1. Subir o `versionCode`

Cada upload no Play Store precisa de `versionCode` maior que o anterior. Edite `app.json`:

```json
"android": {
  "package": "com.plantacerta.app",
  "versionCode": 2,   // ← bumpa aqui
  ...
}
```

Atualize também o `version` semver visível ao usuário:

```json
"version": "1.0.1",
```

### 2. Rodar o build de produção

```bash
eas build --platform android --profile production
```

Aguarde o build (~15 min). Baixa o `.aab` ao final ou pega o link em [expo.dev](https://expo.dev/accounts/isaqueramos82/projects/plantacerta/builds).

### 3. Submeter ao Play Console

**Opção A — Upload manual** (recomendado nas primeiras vezes):

1. Baixe o `.aab` do link da Expo
2. Vá em [play.google.com/console](https://play.google.com/console) → seu app → **Versões → Produção → Criar nova versão**
3. Faça upload do `.aab`
4. Preencha "Notas da versão" (o que mudou)
5. **Revisar versão → Iniciar lançamento**

**Opção B — Upload automático via `eas submit`** (depois de configurar a service account):

```bash
eas submit --platform android --profile production
```

Pré-requisito: ter o arquivo `google-play-key.json` na raiz do projeto (não comitar!).

---

## 🔑 Configurar `eas submit` (uma vez só)

Para automatizar o upload:

1. **Google Play Console** → ⚙️ Configurações → Acesso à API
2. Vincular projeto ao Google Cloud (vai criar um)
3. **Service accounts** → criar nova service account com permissões de **Release Manager**
4. Baixar a chave JSON e salvar como `google-play-key.json` na raiz do projeto
5. Adicionar ao `.gitignore`:
   ```
   google-play-key.json
   ```

Documentação: https://docs.expo.dev/submit/android/

---

## 🧪 Testar antes de publicar

Recomendo sempre rodar um build `preview` antes de produção:

```bash
eas build --platform android --profile preview
```

Instale o APK no seu Android (ou emulador) e teste:
- ✅ Identificação de planta funciona
- ✅ Foto é salva após adicionar ao jardim
- ✅ Lembrete de rega aparece
- ✅ Histórico registra ações
- ✅ App não trava em rotação / mudança de tema

---

## 🔄 Hotfix sem app update

Como o backend está separado (Vercel), **mudanças no servidor são instantâneas**:

```bash
vercel deploy --prod
```

Útil para ajustar prompts da IA, rate limits, validações etc. sem precisar passar pelo review da Play Store.

---

## 📊 Onde acompanhar

| O que | Onde |
|---|---|
| Builds do app | https://expo.dev/accounts/isaqueramos82/projects/plantacerta |
| Deploys do backend | https://vercel.com/isaqueramos-2000s-projects/plata-certa |
| Reviews/instalações | https://play.google.com/console |
| Erros do backend | Vercel → seu projeto → Logs |
| Uso da Anthropic | https://console.anthropic.com/usage |
