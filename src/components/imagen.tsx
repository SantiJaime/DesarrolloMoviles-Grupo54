import { Image as ExpoImage, type ImageProps } from "expo-image";
import { useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { ThemedText } from "@/src/components/themed-text";
import { Button } from "@/src/components/ui/button";
import { useTheme } from "@/src/hooks/use-theme";

// Una URL de la API puede apuntar a un archivo retirado; la ficha debe seguir siendo usable.
export function Image(props: ImageProps) {
  const { palette } = useTheme();
  const [fallida, setFallida] = useState<string | null>(null);
  const clave = JSON.stringify(props.source);
  if (fallida === clave)
    return (
      <View
        style={[
          props.style as StyleProp<ViewStyle>,
          styles.fallback,
          { backgroundColor: palette.surface },
        ]}
      >
        <ThemedText style={{ textAlign: "center" }}>
          Imagen no disponible
        </ThemedText>
        <Button
          title="Reintentar imagen"
          variant="secondary"
          size="small"
          onPress={() => setFallida(null)}
        />
      </View>
    );
  return (
    <ExpoImage
      {...props}
      onError={(evento) => {
        setFallida(clave);
        props.onError?.(evento);
      }}
    />
  );
}
const styles = StyleSheet.create({
  fallback: { alignItems: "center", justifyContent: "center", gap: 8 },
});
