import { EvaluatorOptions, ExpressionResult } from './utils';
import { ExpressionEvaluator } from './evaluator';
import jsep, { Expression } from 'jsep';

export * from './error';
export * from './evaluator';
export * from './member-checks';
export * from './utils';

export class Evaluator {
  public constructor(public options: EvaluatorOptions) {}

  public async eval(expression: string): Promise<ExpressionResult> {
    const ast = jsep(expression);

    return this.evalExpression(ast);
  }

  public async evalExpression(expression: Expression): Promise<ExpressionResult> {
    const expressionEvaluator = new ExpressionEvaluator(this.options);

    return expressionEvaluator.evalExpression(expression);
  }
}
