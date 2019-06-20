import { ConvertContext } from './convert';
import { MathContext } from './math';
import { StringContext } from './string';

export { ConvertContext, MathContext, StringContext };

export const contexts = {
  Convert: ConvertContext,
  Math: MathContext,
  String: StringContext,
};
