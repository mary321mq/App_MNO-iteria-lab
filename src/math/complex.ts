export interface ComplexValue {
  re: number;
  im: number;
}

export const complex = (re: number, im = 0): ComplexValue => ({ re, im });

export const add = (a: ComplexValue, b: ComplexValue): ComplexValue => ({
  re: a.re + b.re,
  im: a.im + b.im,
});

export const sub = (a: ComplexValue, b: ComplexValue): ComplexValue => ({
  re: a.re - b.re,
  im: a.im - b.im,
});

export const mul = (a: ComplexValue, b: ComplexValue): ComplexValue => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});

export const div = (a: ComplexValue, b: ComplexValue): ComplexValue => {
  const denominator = b.re * b.re + b.im * b.im;
  if (Math.abs(denominator) < 1e-14) throw new Error("Division entre cero.");
  return {
    re: (a.re * b.re + a.im * b.im) / denominator,
    im: (a.im * b.re - a.re * b.im) / denominator,
  };
};

export const abs = (a: ComplexValue): number => Math.hypot(a.re, a.im);

export const sqrtComplex = (z: ComplexValue): ComplexValue => {
  const magnitude = abs(z);
  const re = Math.sqrt((magnitude + z.re) / 2);
  const imSign = z.im < 0 ? -1 : 1;
  const im = imSign * Math.sqrt(Math.max(0, (magnitude - z.re) / 2));
  return complex(re, im);
};

export const neg = (a: ComplexValue): ComplexValue => complex(-a.re, -a.im);

export const scale = (a: ComplexValue, scalar: number): ComplexValue => ({
  re: a.re * scalar,
  im: a.im * scalar,
});

export function toComplex(value: unknown): ComplexValue {
  if (typeof value === "number") return complex(value, 0);
  if (value && typeof value === "object" && "re" in value && "im" in value) {
    const candidate = value as { re: number; im: number };
    return complex(candidate.re, candidate.im);
  }
  throw new Error("La evaluacion no produjo un numero valido.");
}
