import { FunctionAnalysisConfig } from '../analyzer';
import { TypeMap } from '../evaluator';

function toString(value: unknown): string {
  return String(value);
}

function toNumber(value: unknown): number {
  return Number(value);
}

export const ConvertContext: TypeMap = {
  toString,
  toNumber,
};

export interface ConvertFunctionArgs {
  'Convert.toString': [any];
  'Convert.toNumber': [any];
}

const path = ['Convert'];

export const convertFunctionAnalysisConfig: FunctionAnalysisConfig<ConvertFunctionArgs> = {
  'Convert.toString': { path, name: 'toString', args: ['any'] },
  'Convert.toNumber': { path, name: 'toNumber', args: ['any'] },
};
