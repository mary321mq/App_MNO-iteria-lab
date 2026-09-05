import { ComplexValue } from "./complex";

export function formatNumber(value: number, digits = 8): string {
  if (!Number.isFinite(value)) return "No definido";
  const rounded = Number(value.toPrecision(digits));
  return Math.abs(rounded) < 1e-12 ? "0" : rounded.toString();
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "No definido";
  return `${formatNumber(value, 8)}%`;
}

export function formatComplex(value: ComplexValue, digits = 8): string {
  const re = Math.abs(value.re) < 1e-12 ? 0 : value.re;
  const im = Math.abs(value.im) < 1e-12 ? 0 : value.im;
  if (im === 0) return formatNumber(re, digits);
  if (re === 0) return `${formatNumber(im, digits)}i`;
  const sign = im >= 0 ? "+" : "-";
  return `${formatNumber(re, digits)} ${sign} ${formatNumber(Math.abs(im), digits)}i`;
}
