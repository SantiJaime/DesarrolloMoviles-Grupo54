import { View } from "react-native";
import { ThemedText } from "@/src/components/themed-text";
import { TextField } from "@/src/components/ui/text-field";
import { Button } from "@/src/components/ui/button";
import type { Horario } from "@/src/tipos";

const dias = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
export function EditorHorarios({
  horarios,
  onChange,
}: {
  horarios: Horario[];
  onChange: (h: Horario[]) => void;
}) {
  return (
    <View style={{ gap: 16 }}>
      <ThemedText>
        Agregá un tramo por cada turno. Un cierre menor que la apertura termina
        al día siguiente.
      </ThemedText>
      {([1, 2, 3, 4, 5, 6, 0] as const).map((dia) => (
        <View key={dia} style={{ gap: 8 }}>
          <ThemedText type="defaultSemiBold">{dias[dia]}</ThemedText>
          {!horarios.some((h) => h.dia === dia) && (
            <ThemedText>Cerrado</ThemedText>
          )}
          {horarios.map((h, i) =>
            h.dia !== dia ? null : (
              <View key={i} style={{ gap: 6 }}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <TextField
                      label="Abre"
                      value={h.abre}
                      maxLength={5}
                      placeholder="08:00"
                      keyboardType="numbers-and-punctuation"
                      onChangeText={(abre) =>
                        onChange(
                          horarios.map((item, j) =>
                            i === j ? { ...item, abre } : item,
                          ),
                        )
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextField
                      label="Cierra"
                      value={h.cierra}
                      maxLength={5}
                      placeholder="12:00"
                      keyboardType="numbers-and-punctuation"
                      onChangeText={(cierra) =>
                        onChange(
                          horarios.map((item, j) =>
                            i === j ? { ...item, cierra } : item,
                          ),
                        )
                      }
                    />
                  </View>
                </View>
                <Button
                  title="Quitar tramo"
                  variant="ghost"
                  size="small"
                  onPress={() => onChange(horarios.filter((_, j) => j !== i))}
                />
              </View>
            ),
          )}
          <Button
            title={`Agregar turno de ${dias[dia].toLowerCase()}`}
            variant="secondary"
            size="small"
            icon="add"
            onPress={() =>
              onChange([...horarios, { dia, abre: "08:00", cierra: "12:00" }])
            }
          />
        </View>
      ))}
    </View>
  );
}
