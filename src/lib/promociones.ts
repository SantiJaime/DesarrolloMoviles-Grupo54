import type { Promocion } from "@/src/tipos";

export function esPromocionVigente(
  promo: Promocion,
  ahora = Date.now(),
): boolean {
  return (
    promo.activa &&
    Date.parse(promo.desde) <= ahora &&
    Date.parse(promo.hasta) > ahora
  );
}

export function estadoPromocion(promo: Promocion, ahora = Date.now()): string {
  if (!promo.activa) return "Dada de baja";
  if (Date.parse(promo.hasta) <= ahora) return "Vencida";
  return Date.parse(promo.desde) > ahora ? "Próxima" : "Vigente";
}
