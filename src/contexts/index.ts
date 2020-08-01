import {
  ConvertContext,
  ConvertFunctionArgs,
  convertFunctionAnalysisConfig,
} from "./convert";
import { FunctionAnalysisConfig } from "../analyzer";
import {
  MathContext,
  MathFunctionArgs,
  mathFunctionAnalysisConfig,
} from "./math";
import {
  StringContext,
  StringFunctionArgs,
  stringFunctionAnalysisConfig,
} from "./string";

export * from "./convert";
export * from "./math";
export * from "./string";

export const contexts = {
  Convert: ConvertContext,
  Math: MathContext,
  String: StringContext,
};

export type ContextArgs = ConvertFunctionArgs &
  MathFunctionArgs &
  StringFunctionArgs;

export const contextFunctionAnalysisConfig: FunctionAnalysisConfig<ContextArgs> = {
  ...convertFunctionAnalysisConfig,
  ...mathFunctionAnalysisConfig,
  ...stringFunctionAnalysisConfig,
};
