import { StyleSheet, Text, type TextProps } from "react-native";

import { useTheme } from "@/src/hooks/use-theme";

export type ThemedTextProps = TextProps & {
  type?: keyof typeof styles;
};

export function ThemedText({ style, type = "default", ...rest }: ThemedTextProps) {
  const { palette: colors } = useTheme();

  return (
    <Text
      style={[
        { color: type === "link" ? colors.accent : colors.text },
        styles[type],
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
  },
});
