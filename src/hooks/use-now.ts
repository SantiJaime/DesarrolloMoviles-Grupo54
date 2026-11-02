import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { AppState } from "react-native";

export function useNow() {
  const [ahora, setAhora] = useState(Date.now);
  useFocusEffect(
    useCallback(() => {
      const actualizar = () => setAhora(Date.now());
      actualizar();
      const timer = setInterval(() => {
        if (AppState.currentState === "active") actualizar();
      }, 1000);
      const listener = AppState.addEventListener("change", actualizar);
      return () => {
        clearInterval(timer);
        listener.remove();
      };
    }, []),
  );
  return ahora;
}
