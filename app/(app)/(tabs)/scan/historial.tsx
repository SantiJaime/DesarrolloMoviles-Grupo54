import { StateView } from "@/src/components/state-view";
import { ThemedView } from "@/src/components/themed-view";

export default function HistorialScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <StateView
        type="empty"
        icon="receipt-long"
        title="Todavía no canjeaste promociones"
        message="Cuando escanees un código QR, el canje va a aparecer acá."
      />
    </ThemedView>
  );
}
