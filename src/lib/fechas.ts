const OPCIONES: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
};

export function formatearFechaHora(valor: string | number | Date): string {
  return new Date(valor).toLocaleString("es-AR", OPCIONES);
}
