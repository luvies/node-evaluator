/* eslint-disable @typescript-eslint/unbound-method */
import { FunctionAnalysisConfig } from "../analyzer";
import { TypeMap } from "../evaluator";

function sum(args: number[]): number {
  return args.reduce((previousValue, currentValue) => {
    return currentValue + previousValue;
  }, 0);
}

function avg(args: number[]): number {
  return sum(args) / args.length;
}

export const MathContext: TypeMap = {
  // Builtin Math functions.
  abs: Math.abs,
  acos: Math.acos,
  acosh: Math.acosh,
  asin: Math.asin,
  asinh: Math.asinh,
  atan: Math.atan,
  atanh: Math.atanh,
  atan2: Math.atan2,
  cbrt: Math.cbrt,
  ceil: Math.ceil,
  clz32: Math.clz32,
  cos: Math.cos,
  cosh: Math.cosh,
  exp: Math.exp,
  expm1: Math.expm1,
  floor: Math.floor,
  fround: Math.fround,
  hypot: (args: number[]) => Math.hypot(...args),
  imul: Math.imul,
  log: Math.log,
  log1p: Math.log1p,
  log10: Math.log10,
  log2: Math.log2,
  max: (args: number[]) => Math.max(...args),
  min: (args: number[]) => Math.min(...args),
  pow: Math.pow,
  random: Math.random,
  round: Math.round,
  sign: Math.sign,
  sin: Math.sin,
  sinh: Math.sinh,
  sqrt: Math.sqrt,
  tan: Math.tan,
  tanh: Math.tanh,
  trunc: Math.trunc,
  // Extensions
  sum,
  avg,
};

export interface MathFunctionArgs {
  "Math.abs": [number];
  "Math.acos": [number];
  "Math.acosh": [number];
  "Math.asin": [number];
  "Math.asinh": [number];
  "Math.atan": [number];
  "Math.atanh": [number];
  "Math.atan2": [number, number];
  "Math.cbrt": [number];
  "Math.ceil": [number];
  "Math.clz32": [number];
  "Math.cos": [number];
  "Math.cosh": [number];
  "Math.exp": [number];
  "Math.expm1": [number];
  "Math.floor": [number];
  "Math.fround": [number];
  "Math.hypot": [number[]];
  "Math.imul": [number, number];
  "Math.log": [number];
  "Math.log1p": [number];
  "Math.log10": [number];
  "Math.log2": [number];
  "Math.max": [number[]];
  "Math.min": [number[]];
  "Math.pow": [number, number];
  "Math.random": [];
  "Math.round": [number];
  "Math.sign": [number];
  "Math.sin": [number];
  "Math.sinh": [number];
  "Math.sqrt": [number];
  "Math.tan": [number];
  "Math.tanh": [number];
  "Math.trunc": [number];
  // Extensions
  "Math.sum": [number[]];
  "Math.avg": [number[]];
}

const path = ["Math"];

export const mathFunctionAnalysisConfig: FunctionAnalysisConfig<MathFunctionArgs> = {
  "Math.abs": { path, name: "abs", args: ["number"] },
  "Math.acos": { path, name: "acos", args: ["number"] },
  "Math.acosh": { path, name: "acosh", args: ["number"] },
  "Math.asin": { path, name: "asin", args: ["number"] },
  "Math.asinh": { path, name: "asinh", args: ["number"] },
  "Math.atan": { path, name: "atan", args: ["number"] },
  "Math.atanh": { path, name: "atanh", args: ["number"] },
  "Math.atan2": { path, name: "atan2", args: ["number", "number"] },
  "Math.cbrt": { path, name: "cbrt", args: ["number"] },
  "Math.ceil": { path, name: "ceil", args: ["number"] },
  "Math.clz32": { path, name: "clz32", args: ["number"] },
  "Math.cos": { path, name: "cos", args: ["number"] },
  "Math.cosh": { path, name: "cosh", args: ["number"] },
  "Math.exp": { path, name: "exp", args: ["number"] },
  "Math.expm1": { path, name: "expm1", args: ["number"] },
  "Math.floor": { path, name: "floor", args: ["number"] },
  "Math.fround": { path, name: "fround", args: ["number"] },
  "Math.hypot": { path, name: "hypot", args: ["number[]"] },
  "Math.imul": { path, name: "imul", args: ["number", "number"] },
  "Math.log": { path, name: "log", args: ["number"] },
  "Math.log1p": { path, name: "log1p", args: ["number"] },
  "Math.log10": { path, name: "log10", args: ["number"] },
  "Math.log2": { path, name: "log2", args: ["number"] },
  "Math.max": { path, name: "max", args: ["number[]"] },
  "Math.min": { path, name: "min", args: ["number[]"] },
  "Math.pow": { path, name: "pow", args: ["number", "number"] },
  "Math.random": { path, name: "random", args: [] },
  "Math.round": { path, name: "round", args: ["number"] },
  "Math.sign": { path, name: "sign", args: ["number"] },
  "Math.sin": { path, name: "sin", args: ["number"] },
  "Math.sinh": { path, name: "sinh", args: ["number"] },
  "Math.sqrt": { path, name: "sqrt", args: ["number"] },
  "Math.tan": { path, name: "tan", args: ["number"] },
  "Math.tanh": { path, name: "tanh", args: ["number"] },
  "Math.trunc": { path, name: "trunc", args: ["number"] },
  // Extensions
  "Math.sum": { path, name: "sum", args: ["number[]"] },
  "Math.avg": { path, name: "avg", args: ["number[]"] },
};
