import { ExpressionAnalysis } from "./expression-analysis";
import { FunctionArg, FunctionCall } from "./function-call";
import { RuntimeValue } from "./runtime-value";
import { SimpleType } from "../evaluator";

export type FunctionArgs<T> = {
  [K in keyof T]: any[];
};

type FnBaseTypeString = "any" | "string" | "number" | "boolean";
type FnArrTypeString = "any[]" | "string[]" | "number[]" | "boolean[]";

export type FunctionArgTypeString = FnBaseTypeString | FnArrTypeString;

const fnArrTypeMap: Record<FnArrTypeString, FnBaseTypeString> = {
  "any[]": "any",
  "string[]": "string",
  "number[]": "number",
  "boolean[]": "boolean",
};

export type FunctionArgsValidator =
  | Array<FunctionArgTypeString | ((arg: FunctionArg) => boolean)>
  | ((args: FunctionArg[]) => boolean);

export interface FunctionCallAnalysisConfig {
  /**
   * The path of the function.
   * Directly maps to the `FunctionCall.path` field.
   */
  path?: SimpleType[];
  /**
   * The name of the function.
   * Directly maps to the `FunctionCall.name` field.
   * If unset, then the key of this object is used.
   */
  name?: string;
  /**
   * An array providing the types or type checker functions for each argument.
   *
   * This array will be used to validate the types for every argument in each
   * function call that matches the name & path. If they all match, then the
   * arguments are included in the `args` field of the results objects, otherwise
   * they are put into the `invalid` field.
   *
   * If a function is given, then the entire function argument array is passed through,
   * and only the result of that function is used to decide which output field to
   * put the arguments into.
   */
  args: FunctionArgsValidator;
  /**
   * The number of arguments that are actually required for the function call.
   * By default, this is the same as the length of the `args` field, if it is
   * an array. If the `args` field is a function, then this is not checked.
   */
  requiredArgsCount?: number;
  /**
   * By default, `FunctionCall` instances cause a function arguments array to be
   * considered invalid. If this is set to `true`, however, then they are considered valid.
   *
   * This does mean that the function argument typings have to take this into account
   * (e.g. if this is true, an argument typing of `[string, string, number]` would instead
   * have to be `[string | FunctionCall, string | FunctionCall, number | FunctionCall]`).
   */
  functionCallArgValid?: boolean;
  /**
   * By default, `RuntimeValue` instances cause a function arguments array to be
   * considered invalid. If this is set to `true`, however, then they are considered valid.
   *
   * This does mean that the function argument typings have to take this into account
   * (e.g. if this is true, an argument typing of `[string, string, number]` would instead
   * have to be `[string | RuntimeValue, string | RuntimeValue, number | RuntimeValue]`).
   */
  runtimeValueValid?: boolean;
}

/**
 * The configuration object used to initialise the function analyzer.
 */
export type FunctionAnalysisConfig<T extends FunctionArgs<T>> = {
  [K in keyof T]: FunctionCallAnalysisConfig;
};

export type FunctionAnalysis<T extends FunctionArgs<T>> = {
  [K in keyof T]: {
    invalid: FunctionArg[][];
    valid: Array<T[K]>;
  };
};

interface FnAnalysisConf {
  name: string;
  path: SimpleType[];
  args: FunctionArgsValidator;
  requiredArgsCount?: number;
  functionCallArgValid?: boolean;
  runtimeValueValid?: boolean;
}

interface FnAnalysisRes {
  invalid: FunctionArg[][];
  valid: any[][];
}

export class FunctionAnalyzer<T extends FunctionArgs<T>> {
  public constructor(private readonly _config: FunctionAnalysisConfig<T>) {}

  public analyze(exprAnalysis: ExpressionAnalysis): FunctionAnalysis<T> {
    const analysis: Record<string, FnAnalysisRes> = {};

    for (const [keyName, config] of Object.entries<FunctionCallAnalysisConfig>(
      this._config,
    )) {
      const fn: FnAnalysisConf = {
        name: config.name ?? keyName,
        path: config.path ?? [],
        args: config.args,
        requiredArgsCount: config.requiredArgsCount,
        functionCallArgValid: config.functionCallArgValid,
        runtimeValueValid: config.runtimeValueValid,
      };

      analysis[keyName] = this._analyzeFunction(exprAnalysis, fn);
    }

    return analysis as FunctionAnalysis<T>;
  }

  private _analyzeFunction(
    exprAnalysis: ExpressionAnalysis,
    { name, path, ...argConf }: FnAnalysisConf,
  ): FnAnalysisRes {
    const analysis: FnAnalysisRes = {
      invalid: [],
      valid: [],
    };

    for (const fn of exprAnalysis.functionCalls) {
      // Match the function name & path.
      if (
        fn.name !== name ||
        fn.path.length !== path.length ||
        !path.reduce<boolean>(
          (prev, curr, index) => prev && curr === fn.path[index],
          true,
        )
      ) {
        continue;
      }

      // Validate the arguments.
      if (this._functionArgsValid(fn, argConf)) {
        analysis.valid.push(fn.args);
      } else {
        analysis.invalid.push(fn.args);
      }
    }

    return analysis;
  }

  private _functionArgsValid(
    fn: FunctionCall,
    {
      args,
      requiredArgsCount,
      functionCallArgValid,
      runtimeValueValid,
    }: Omit<FnAnalysisConf, "name" | "path">,
  ): boolean {
    if (Array.isArray(args)) {
      requiredArgsCount =
        requiredArgsCount === undefined ? args.length : requiredArgsCount;

      if (fn.args.length < requiredArgsCount) {
        return false;
      }

      for (let i = 0; i < fn.args.length; i++) {
        if (i >= args.length) {
          break;
        }

        const val = fn.args[i];
        const type = args[i];

        if (i >= requiredArgsCount && val === undefined) {
          // If we are in optional arguments, and the value is
          // undefined, then skip to the next argument.
          continue;
        }

        if (val instanceof FunctionCall) {
          if (functionCallArgValid) {
            continue;
          } else {
            return false;
          }
        }

        if (val instanceof RuntimeValue) {
          if (runtimeValueValid) {
            continue;
          } else {
            return false;
          }
        }

        let valid: boolean;
        switch (type) {
          case "any":
            valid = true;
            break;
          case "any[]":
            valid = Array.isArray(val);
            break;
          case "string":
          case "number":
          case "boolean":
            valid = typeof val === type;
            break;
          case "string[]":
          case "number[]":
          case "boolean[]":
            valid = this._validTypedArray(val, fnArrTypeMap[type]);
            break;
          default:
            valid = type(val);
            break;
        }

        if (!valid) {
          return false;
        }
      }

      return true;
    } else {
      return args(fn.args);
    }
  }

  private _validTypedArray(arr: FunctionArg, type: FnBaseTypeString): boolean {
    if (!Array.isArray(arr)) {
      return false;
    }

    for (const val of arr) {
      if (typeof val !== type) {
        return false;
      }
    }

    return true;
  }
}
