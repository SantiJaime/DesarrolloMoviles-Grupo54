import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import type { StyleProp, TextStyle } from "react-native";

export type IconName = keyof typeof Ionicons.glyphMap;

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function AppIcon({ name, size = 22, color = "#000", style }: AppIconProps) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}
