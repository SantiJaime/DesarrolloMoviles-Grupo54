import type { Horario } from "@/src/tipos";

export function fechaLocal(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}
export function horaLocal(fecha: Date): string {
  return `${String(fecha.getHours()).padStart(2, "0")}:${String(fecha.getMinutes()).padStart(2, "0")}`;
}
export function fechaHoraISO(fecha: string, hora: string): string {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)
  )
    throw new Error("Usá fechas AAAA-MM-DD y horas HH:MM.");
  const [y, m, d] = fecha.split("-").map(Number);
  const [h, min] = hora.split(":").map(Number);
  const valor = new Date(y, m - 1, d, h, min);
  if (fechaLocal(valor) !== fecha)
    throw new Error("La fecha ingresada no existe.");
  return valor.toISOString();
}
export function validarHorarios(horarios: Horario[]): void {
  const intervalos: { inicio: number; fin: number }[] = [];
  const semana = 7 * 24 * 60;
  for (const h of horarios) {
    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(h.abre) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(h.cierra)
    )
      throw new Error(
        "Revisá los horarios: usá HH:MM, por ejemplo 08:00 y 16:30.",
      );
    const minutos = (v: string) => {
      const [hh, mm] = v.split(":").map(Number);
      return hh * 60 + mm;
    };
    const abre = minutos(h.abre),
      cierra = minutos(h.cierra);
    if (abre === cierra)
      throw new Error(
        "La apertura y el cierre de un tramo deben ser diferentes.",
      );
    const inicio = h.dia * 1440 + abre;
    const fin = h.dia * 1440 + cierra + (cierra < abre ? 1440 : 0);
    for (const previo of intervalos)
      for (const desplazamiento of [-semana, 0, semana])
        if (
          inicio < previo.fin + desplazamiento &&
          fin > previo.inicio + desplazamiento
        )
          throw new Error(
            "Hay tramos horarios superpuestos. Revisá también los que terminan al día siguiente.",
          );
    intervalos.push({ inicio, fin });
  }
}
