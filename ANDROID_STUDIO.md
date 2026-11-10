# Atlas no Android Studio

O ZIP `atlas-android-studio.zip` contém o código do app e o projeto nativo `android/` gerado pelo Expo SDK 58. O ZIP de bundle JavaScript antigo não é um projeto importável no Android Studio.

1. Extraia o ZIP inteiro, preservando a pasta `android` junto de `src`, `assets` e `package.json`.
2. Instale o Node.js LTS e execute `npm ci` na pasta que contém `package.json`.
3. No Android Studio, escolha **Open** e selecione a pasta `android`.
4. Use o JDK integrado ao Android Studio e aceite a instalação dos componentes do SDK pedidos pelo Gradle.
5. Aguarde a sincronização e crie/inicie um emulador no Device Manager.

Para desenvolvimento, execute `npx expo start --localhost` na raiz. Em outro terminal, execute `adb reverse tcp:8081 tcp:8081`, com o emulador conectado. Selecione a variante `debug` e pressione **Run** no Android Studio. Como alternativa, `npm run android` compila e inicia o app com o Expo CLI.

Para um APK que inclui o JavaScript e funciona sem Metro, execute no terminal da pasta `android`:

```powershell
.\gradlew.bat :app:assembleRelease
```

O arquivo fica em `android/app/build/outputs/apk/release/app-release.apk`. Arraste esse APK para o emulador ou instale com `adb install -r caminho/do/app-release.apk`. Fotos e clima precisam de conexão à internet.

Para gerar o Android App Bundle:

```powershell
.\gradlew.bat :app:bundleRelease
```

O arquivo fica em `android/app/build/outputs/bundle/release/app-release.aab`. AAB é destinado à distribuição e não se instala diretamente no emulador. O template usa a chave de teste; para publicar na loja, configure sua própria assinatura.

O projeto usa Continuous Native Generation. Para regenerar o projeto Android a partir de um clone do repositório, execute `npx expo prebuild --platform android --no-install`. Mantenha alterações nativas em `app.json` e plugins de configuração.
