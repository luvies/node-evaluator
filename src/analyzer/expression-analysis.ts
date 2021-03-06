import type { ExpressionError } from "../evaluator";

import type { FunctionCall } from "./function-call";

export class ExpressionAnalysis {
  public static merge(infos: ExpressionAnalysis[]): ExpressionAnalysis {
    return new ExpressionAnalysis(
      infos.reduce<FunctionCall[]>(
        (prev, curr) => prev.concat(curr.functionCalls),
        [],
      ),
      infos.reduce<ExpressionError[]>(
        (prev, curr) => prev.concat(curr.errors),
        [],
      ),
    );
  }

  public static empty(
    diff: Partial<ExpressionAnalysis> = {},
  ): ExpressionAnalysis {
    return new ExpressionAnalysis(
      diff.functionCalls ? diff.functionCalls : [],
      diff.errors ? diff.errors : [],
    );
  }

  private constructor(
    /**
     * An array of every single function call used in the expression, ignoring nesting.
     * If the name of a function call is computed in any way, then it is excluded from
     * this list.
     */
    public readonly functionCalls: readonly FunctionCall[],
    /**
     * An array of all the errors generated during the info collection.
     */
    public readonly errors: readonly ExpressionError[],
  ) {}
}
