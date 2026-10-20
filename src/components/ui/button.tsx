import { AppIcon, type IconName } from "@/src/components/ui/app-icon";
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
type ButtonSize = "normal" | "small";

export type ButtonProps = Omit<PressableProps, "children"> & {
  title: string;
  variant?: Variant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: IconName;
};

export function Button({
  title,
  variant = "primary",
  size = "normal",
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

  const isSmall = size === "small";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        isSmall && styles.baseSmall,
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
        <ActivityIndicator color={foreground} size={isSmall ? "small" : undefined} />
      ) : (
        <View style={styles.content}>
          {icon && <AppIcon name={icon} size={isSmall ? 16 : 20} color={foreground} />}
          <Text
            style={[
              styles.label,
              isSmall && styles.labelSmall,
              { color: foreground },
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 46,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  baseSmall: {
    minHeight: 34,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
  labelSmall: {
    fontSize: 13,
    fontWeight: "600",
  },
});
