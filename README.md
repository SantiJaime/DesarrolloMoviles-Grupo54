# TFI Desarrollo para móviles - Grupo 54 - Directorio Concepción

Los integrantes somos:

* Santiago Agustin Jaime
* Daniel Agustin Testa
* Thiago Serrano

## Descripción

Directorio de comercios del Centro Comercial, Industrial y de Servicios de Concepción del Uruguay. La app permite buscar comercios, ver su ficha (fotos, video, horarios, contacto), consultar promociones, dejar reseñas y, para los comercios, gestionar su ficha, sus promociones y validar cupones por QR.

Está hecha con Expo (SDK 54), React Native y Expo Router.

## Dependencias principales

| Dependencia | Para qué se usa |
|---|---|
| `expo` (~54) y `react-native` (0.81) | Base de la app. |
| `expo-router` | Navegación por archivos (pestañas y pantallas). |
| `axios` | Cliente HTTP para la API. |
| `react-hook-form`, `zod` y `@hookform/resolvers` | Formularios y validación. |
| `expo-sqlite` | Datos guardados en el teléfono para usar la app sin conexión. |
| `expo-secure-store` y `expo-local-authentication` | Sesión guardada de forma segura e ingreso con huella. |
| `expo-camera` | Escaneo de códigos QR de los cupones. |
| `react-native-qrcode-svg` y `react-native-svg` | Generación del QR del cupón. |
| `expo-image-picker` | Elegir o sacar fotos y videos. |
| `expo-video` | Reproducción del video del comercio. |
| `expo-file-system` | Guardar fotos y videos para verlos sin conexión. |
| `expo-location` y `react-native-maps` | Ubicación y mapa de comercios. |
| `expo-notifications` | Avisos de promociones y recordatorios. |
| `expo-network` | Detección de conexión. |
| `expo-haptics` | Vibración al validar un cupón o marcar un favorito. |
| `typescript` y `eslint` | Tipado y análisis de código. |

## Puesta en marcha

```bash
npm install
cp .env.example .env
npx expo run:android
```

Variables de entorno (`.env`):

| Variable | Para qué sirve |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL base de la API (`api-directorio-comercios`). |
| `EXPO_PUBLIC_GOOGLE_MAPS_KEY` | Clave de Google Maps SDK for Android. Sin ella la pestaña Mapa muestra "Mapa no disponible". |
| `EAS_PROJECT_ID` | ID del proyecto de EAS, necesario para las notificaciones push. |

## Scripts

* `npm start`: inicia el servidor de Expo.
* `npm run android`: compila y ejecuta en Android.
* `npm run typecheck`: verifica los tipos con TypeScript.
* `npm run lint`: ejecuta el linter de Expo.
* `npm run build:preview`: genera el APK de entrega con EAS.
