import { TypeMap } from '../evaluator';

function toString(value: any): string {
  return String(value);
}

function toNumber(value: any): number {
  return Number(value);
}

export const ConvertContext: TypeMap = {
  toString,
  toNumber,
};
