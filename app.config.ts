import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
  const projectId = process.env.EAS_PROJECT_ID ?? config.extra?.eas?.projectId;
  if (process.env.EAS_BUILD_PLATFORM === "android" && !mapsKey) {
    throw new Error(
      "Configurá EXPO_PUBLIC_GOOGLE_MAPS_KEY en el entorno preview de EAS antes de generar el APK.",
    );
  }
  return {
    ...config,
    name: config.name ?? "Directorio Concepción",
    slug: config.slug ?? "directorio-concepcion",
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        ...(mapsKey ? { googleMaps: { apiKey: mapsKey } } : {}),
      },
    },
    extra: {
      ...config.extra,
      ...(projectId ? { eas: { ...config.extra?.eas, projectId } } : {}),
    },
    plugins: [
      ...(config.plugins ?? []),
      "@react-native-vector-icons/ionicons",
      [
        "expo-image-picker",
        {
          photosPermission:
            "Permitir elegir fotos y videos para tu comercio o reseña.",
          cameraPermission:
            "Permitir tomar fotos y grabar la presentación del comercio.",
          microphonePermission:
            "Permitir grabar el audio del video de presentación.",
        },
      ],
    ],
  };
};
