import { StateView } from "@/src/components/state-view";
import { ThemedView } from "@/src/components/themed-view";

export default function MapaScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <StateView
        type="info"
        icon="map"
        title="Mapa de comercios"
        message="Acá vas a ver los comercios del centro ubicados en el mapa."
      />
    </ThemedView>
  );
}
