import { TypeMap } from '../evaluator';

function regex(pattern: string, flags?: string): RegExp {
  return new RegExp(pattern, flags);
}

export const StringContext: TypeMap = {
  regex,
};
