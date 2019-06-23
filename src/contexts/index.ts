import { ConvertContext } from './convert';
import { MathContext } from './math';
import { StringContext } from './string';

export * from './convert';
export * from './math';
export * from './string';

export const contexts = {
  Convert: ConvertContext,
  Math: MathContext,
  String: StringContext,
};
