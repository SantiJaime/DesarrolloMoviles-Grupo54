import { View, type ViewProps } from "react-native";

import { useTheme } from "@/src/hooks/use-theme";

export type ThemedViewProps = ViewProps;

export function ThemedView({ style, ...otherProps }: ThemedViewProps) {
  const { palette } = useTheme();

  return <View style={[{ backgroundColor: palette.background }, style]} {...otherProps} />;
}
