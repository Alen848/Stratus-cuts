/**
 * Formatea un importe en pesos: 50000 -> "$50.000".
 *
 * Usa el formato argentino (punto para los miles, coma para los decimales) y
 * solo muestra decimales si el precio realmente los tiene, para que un
 * $50.000 no aparezca como $50.000,00.
 */
export const money = (n) => {
  if (n == null || n === '' || isNaN(Number(n))) return '';
  return `$${Number(n).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};
