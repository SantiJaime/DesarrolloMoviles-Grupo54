import type { Horario } from "@/src/tipos";

export interface EstadoHorario {
  abierto: boolean;
  texto: string;
}

export function estaAbiertoAhora(
  horarios: Horario[],
  activo: boolean = true,
  fecha: Date = new Date()
): boolean {
  return obtenerEstadoHorario(horarios, activo, fecha).abierto;
}

export function obtenerEstadoHorario(
  horarios: Horario[],
  activo: boolean = true,
  fecha: Date = new Date()
): EstadoHorario {
  if (!activo) {
    return { abierto: false, texto: "Cerrado temporalmente" };
  }

  if (!horarios || horarios.length === 0) {
    return { abierto: false, texto: "Sin horario informado" };
  }

  const diaActual = fecha.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const minutosActuales = fecha.getHours() * 60 + fecha.getMinutes();

  const parsearMinutos = (horaStr: string): number => {
    const [hh, mm] = horaStr.split(":").map(Number);
    return hh * 60 + (mm || 0);
  };

  const tramosHoy = horarios.filter((h) => h.dia === diaActual);

  for (const tramo of tramosHoy) {
    const abre = parsearMinutos(tramo.abre);
    const cierra = parsearMinutos(tramo.cierra);

    if (cierra > abre) {
      if (minutosActuales >= abre && minutosActuales < cierra) {
        return { abierto: true, texto: `Abierto - Cierra ${tramo.cierra}` };
      }
    } else {
      if (minutosActuales >= abre || minutosActuales < cierra) {
        return { abierto: true, texto: `Abierto - Cierra ${tramo.cierra}` };
      }
    }
  }

  const proximoTramoHoy = tramosHoy
    .filter((tramo) => parsearMinutos(tramo.abre) > minutosActuales)
    .sort((a, b) => parsearMinutos(a.abre) - parsearMinutos(b.abre))[0];

  if (proximoTramoHoy) {
    return { abierto: false, texto: `Cerrado - Abre ${proximoTramoHoy.abre}` };
  }

  return { abierto: false, texto: "Cerrado hoy" };
}

export function formatearHorariosCompletos(horarios: Horario[]): string[] {
  const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const agrupados: { [key: number]: string[] } = {};

  for (const h of horarios) {
    if (!agrupados[h.dia]) agrupados[h.dia] = [];
    agrupados[h.dia].push(`${h.abre} a ${h.cierra}`);
  }

  const lineas: string[] = [];
  for (let d = 0; d < 7; d++) {
    if (agrupados[d] && agrupados[d].length > 0) {
      lineas.push(`${diasSemana[d]}: ${agrupados[d].join(" y ")}`);
    }
  }

  return lineas;
}
