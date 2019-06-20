import {
  EvaluatorOptions,
  ExpressionError,
  ExpressionReturnType,
  SimpleType,
  canAccessMember,
} from '../evaluator';
import { ExpressionInfo } from './expression-info';
import { FunctionCall } from './function-call';
import { RuntimeValue } from './runtime-value';
import jsep, {
  ArrayExpression,
  BinaryExpression,
  CallExpression,
  Compound,
  ConditionalExpression,
  Expression,
  Identifier,
  LogicalExpression,
  MemberExpression,
  UnaryExpression,
} from 'jsep';

export class ExpressionInfoCollector {
  private readonly _options?: EvaluatorOptions;
  private readonly _valueFormatter: (value: any) => string;

  private _visited = new WeakSet<Expression>();

  public constructor({
    evalOpts,
    valueFormatter,
  }: {
    evalOpts?: EvaluatorOptions;
    /**
     * Used to override the formatter in the eval opts, or to provide
     * a formatter without any eval opts.
     * Defaults to `String`.
     */
    valueFormatter?: (value: any) => string;
  } = {}) {
    this._options = evalOpts;
    this._valueFormatter = valueFormatter || (evalOpts && evalOpts.valueFormatter) || String;
  }

  public collect(expression: Expression | string): ExpressionInfo {
    this._visited = new WeakSet();

    return this._collectExpression(typeof expression === 'string' ? jsep(expression) : expression);
  }

  //////////// Collection methods ////////////

  private _collectExpression(expression: Expression): ExpressionInfo {
    switch (expression.type) {
      case 'ArrayExpression':
        return this._collectArrayExpression(expression);
      case 'BinaryExpression':
        return this._collectBinaryExpression(expression);
      case 'CallExpression':
        return this._collectCallExpression(expression);
      case 'Compound':
        return this._collectCompoundExpression(expression);
      case 'ConditionalExpression':
        return this._collectConditionalExpression(expression);
      case 'Identifier':
        return this._collectIdentifierExpression(expression);
      case 'Literal':
        return this._collectLiteralExpression();
      case 'LogicalExpression':
        return this._collectLogicalExpression(expression);
      case 'MemberExpression':
        return this._collectMemberExpression(expression);
      case 'ThisExpression':
        return this._collectThisExpression();
      case 'UnaryExpression':
        return this._collectUnaryExpression(expression);
    }
  }

  private _collectArrayExpression(expression: ArrayExpression): ExpressionInfo {
    return ExpressionInfo.merge(
      expression.elements.map(element => this._collectExpression(element)),
    );
  }

  private _collectBinaryExpression(expression: BinaryExpression): ExpressionInfo {
    return ExpressionInfo.merge([
      this._collectExpression(expression.left),
      this._collectExpression(expression.right),
    ]);
  }

  private _collectCallExpression(expression: CallExpression): ExpressionInfo {
    const fn = this._tryResolveCallExpression(expression);
    const callee = this._collectExpression(expression.callee);
    const args = expression.arguments.map(arg => this._collectExpression(arg));

    return ExpressionInfo.merge(
      fn instanceof FunctionCall
        ? [
            ExpressionInfo.empty({
              functionCalls: [fn],
            }),
            callee,
            ...args,
          ]
        : [callee, ...args],
    );
  }

  private _collectCompoundExpression(expression: Compound): ExpressionInfo {
    if (expression.body.length > 0) {
      return ExpressionInfo.merge(expression.body.map(item => this._collectExpression(item)));
    } else {
      return ExpressionInfo.empty({
        errors: [new ExpressionError('Compound expression cannot be empty')],
      });
    }
  }

  private _collectConditionalExpression(expression: ConditionalExpression): ExpressionInfo {
    return ExpressionInfo.merge([
      this._collectExpression(expression.test),
      this._collectExpression(expression.consequent),
      this._collectExpression(expression.alternate),
    ]);
  }

  private _collectIdentifierExpression(expression: Identifier): ExpressionInfo {
    if (this._options) {
      const errors: ExpressionError[] = [];
      this._tryResolveFromIdentifier(expression, errors);

      return ExpressionInfo.empty({
        errors,
      });
    } else {
      return ExpressionInfo.empty();
    }
  }

  private _collectLiteralExpression(): ExpressionInfo {
    return ExpressionInfo.empty();
  }

  private _collectLogicalExpression(expression: LogicalExpression): ExpressionInfo {
    return ExpressionInfo.merge([
      this._collectExpression(expression.left),
      this._collectExpression(expression.right),
    ]);
  }

  private _collectMemberExpression(expression: MemberExpression): ExpressionInfo {
    // Resolve the errors for the member chain.
    // The result doesn't matter, only the error resolution here.
    const errors: ExpressionError[] = [];
    this._tryResolveFromMember(expression, errors);

    return ExpressionInfo.merge([
      ExpressionInfo.empty({
        errors,
      }),
      this._collectExpression(expression.object),
      expression.computed ? this._collectExpression(expression.property) : ExpressionInfo.empty(),
    ]);
  }

  private _collectThisExpression(): ExpressionInfo {
    return ExpressionInfo.empty();
  }

  private _collectUnaryExpression(expression: UnaryExpression): ExpressionInfo {
    return this._collectExpression(expression.argument);
  }

  //////////// Resolution methods ////////////

  private _tryResolveCallExpression(expression: CallExpression): FunctionCall | RuntimeValue {
    const path = this._tryResolveCallIdent(expression.callee);

    if (path.length === 0) {
      return new RuntimeValue();
    }

    const name = path.pop();

    if (typeof name !== 'string') {
      return new RuntimeValue();
    }

    const args: Array<ExpressionReturnType | FunctionCall | RuntimeValue> = [];
    for (const arg of expression.arguments) {
      args.push(this._tryResolveLiteral(arg));
    }

    return new FunctionCall(name, args, path);
  }

  private _tryResolveCallIdent(
    expression: Expression,
  ): [RuntimeValue, ...SimpleType[]] | SimpleType[] {
    switch (expression.type) {
      case 'Identifier':
        return [expression.name];
      case 'MemberExpression': {
        let currIdent: RuntimeValue | SimpleType;
        if (expression.computed) {
          currIdent = this._tryResolveIndexLiteral(expression.property);
        } else {
          currIdent = expression.property.name;
        }

        if (currIdent instanceof RuntimeValue) {
          return [currIdent];
        }

        const subIdent = this._tryResolveCallIdent(expression.object);

        return [...subIdent, currIdent] as [RuntimeValue, ...SimpleType[]] | SimpleType[];
      }
      default:
        return [new RuntimeValue()];
    }
  }

  private _tryResolveIndexLiteral(expression: Expression): SimpleType | RuntimeValue {
    const lit = this._tryResolveLiteral(expression);

    if (typeof lit === 'string' || typeof lit === 'number' || typeof lit === 'boolean') {
      return lit;
    }

    return new RuntimeValue();
  }

  private _tryResolveLiteral(
    expression: Expression,
    errors?: ExpressionError[],
  ): ExpressionReturnType | FunctionCall | RuntimeValue {
    switch (expression.type) {
      case 'Literal':
        return expression.value;
      case 'Identifier':
        return this._tryResolveFromIdentifier(expression, errors);
      case 'MemberExpression':
        return this._tryResolveFromMember(expression, errors);
      case 'ArrayExpression':
        return this._tryResolveArrayLiteral(expression);
      case 'CallExpression':
        return this._tryResolveCallExpression(expression);
    }

    return new RuntimeValue();
  }

  private _tryResolveFromIdentifier(
    expression: Identifier,
    errors?: ExpressionError[],
  ): ExpressionReturnType | RuntimeValue {
    if (this._options) {
      if (Object.prototype.hasOwnProperty.call(this._options.context, expression.name)) {
        return this._options.context[expression.name];
      } else {
        this._tryAddError(
          expression,
          errors,
          new ExpressionError(`Identifier (${this._valueFormatter(expression.name)}) not found`),
        );
      }
    }

    return new RuntimeValue();
  }

  private _tryResolveFromMember(
    expression: MemberExpression,
    errors?: ExpressionError[],
  ): ExpressionReturnType | FunctionCall | RuntimeValue {
    if (this._options) {
      let index: SimpleType;

      if (expression.computed) {
        const comp = this._tryResolveIndexLiteral(expression.property);

        if (comp instanceof RuntimeValue) {
          return comp;
        }

        index = comp;
      } else {
        index = expression.property.name;
      }

      if (typeof index !== 'string' && typeof index !== 'number') {
        this._tryAddError(
          expression,
          errors,
          new ExpressionError(`Cannot index with type ${typeof index}`),
        );
      } else {
        let ctx: ExpressionReturnType | RuntimeValue;
        let gotCtx = false;

        switch (expression.object.type) {
          case 'MemberExpression':
            ctx = this._tryResolveFromMember(expression.object, errors);
            gotCtx = true;
            break;
          case 'Identifier':
            ctx = this._tryResolveFromIdentifier(expression.object);
            gotCtx = true;
            break;
        }

        if (ctx instanceof RuntimeValue) {
          return ctx;
        } else if (gotCtx) {
          if (!this._options) {
            return (ctx as any)[index];
          } else if (canAccessMember(this._options.memberChecks, ctx, index)) {
            return (ctx as any)[index];
          } else {
            this._tryAddError(
              expression,
              errors,
              new ExpressionError(
                `Not allowed to index ${this._valueFormatter(
                  ctx,
                )} (type: ${typeof ctx}) with ${this._valueFormatter(
                  index,
                )} (type: ${typeof index})`,
              ),
            );
          }
        }
      }
    }

    return new RuntimeValue();
  }

  private _tryResolveArrayLiteral(
    expression: ArrayExpression,
  ): Array<ExpressionReturnType | FunctionCall> | RuntimeValue {
    const values: ExpressionReturnType[] = [];
    for (const item of expression.elements) {
      const value = this._tryResolveLiteral(item);

      if (value instanceof RuntimeValue) {
        return value;
      } else {
        values.push(value);
      }
    }

    return values;
  }

  private _tryAddError(
    expression: Expression,
    errors: ExpressionError[] | undefined,
    error: ExpressionError,
  ): void {
    if (errors) {
      if (!this._visited.has(expression)) {
        errors.push(error);
        this._visited.add(expression);
      }
    }
  }
}
