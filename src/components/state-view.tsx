import Ionicons from "@react-native-vector-icons/ionicons";
import type { ComponentProps } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ThemedText } from "@/src/components/themed-text";
import { Button } from "@/src/components/ui/button";
import { useTheme } from "@/src/hooks/use-theme";

type StateViewProps =
  | { type: "loading"; message?: string }
  | {
      type: "empty" | "error" | "info";
      title: string;
      message?: string;
      icon?: ComponentProps<typeof Ionicons>["name"];
      actionLabel?: string;
      onAction?: () => void;
    };

export function StateView(props: StateViewProps) {
  const { palette: colors } = useTheme();

  if (props.type === "loading") {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} />
        {props.message ? (
          <ThemedText style={{ color: colors.muted }}>
            {props.message}
          </ThemedText>
        ) : null}
      </View>
    );
  }

  const defaultIcon = {
    empty: "file-tray-outline",
    error: "alert-circle-outline",
    info: "information-circle-outline",
  } as const;

  return (
    <View style={styles.container}>
      <Ionicons
        name={props.icon ?? defaultIcon[props.type]}
        size={56}
        color={props.type === "error" ? colors.danger : colors.muted}
      />
      <ThemedText type="subtitle" style={styles.center}>
        {props.title}
      </ThemedText>
      {props.message ? (
        <ThemedText style={[styles.center, { color: colors.muted }]}>
          {props.message}
        </ThemedText>
      ) : null}
      {props.actionLabel && props.onAction ? (
        <Button
          title={props.actionLabel}
          onPress={props.onAction}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  center: {
    textAlign: "center",
  },
  action: {
    marginTop: 8,
    minWidth: 160,
  },
});
