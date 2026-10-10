import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
    type PressableProps,
} from "react-native";

import { useThemeColors } from "@/src/hooks/use-theme-color";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export type ButtonProps = Omit<PressableProps, "children"> & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  icon?: ComponentProps<typeof MaterialIcons>["name"];
};

export function Button({
  title,
  variant = "primary",
  loading,
  icon,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;

  const background = {
    primary: colors.tint,
    secondary: colors.card,
    ghost: "transparent",
    danger: colors.danger,
  }[variant];
  const foreground = {
    primary: colors.onTint,
    secondary: colors.text,
    ghost: colors.tint,
    danger: "#fff",
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        {
          backgroundColor: background,
          opacity: isDisabled ? 0.6 : state.pressed ? 0.85 : 1,
        },
        variant === "secondary" && {
          borderWidth: 1,
          borderColor: colors.border,
        },
        typeof style === "function" ? style(state) : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <View style={styles.content}>
          {icon && <MaterialIcons name={icon} size={20} color={foreground} />}
          <Text style={[styles.label, { color: foreground }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
});
