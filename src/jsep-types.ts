export interface ArrayExpression {
  type: "ArrayExpression";
  elements: Expression[];
}

export interface BinaryExpression {
  type: "BinaryExpression";
  operator: string;
  left: Expression;
  right: Expression;
}

export interface CallExpression {
  type: "CallExpression";
  arguments: Expression[];
  callee: Expression;
}

export interface Compound {
  type: "Compound";
  body: Expression[];
}

export interface ConditionalExpression {
  type: "ConditionalExpression";
  test: Expression;
  consequent: Expression;
  alternate: Expression;
}

export interface Identifier {
  type: "Identifier";
  name: string;
}

export interface Literal {
  type: "Literal";
  value: boolean | number | string;
  raw: string;
}

export interface LogicalExpression {
  type: "LogicalExpression";
  operator: string;
  left: Expression;
  right: Expression;
}

interface BaseMemberExpression<T, U> {
  type: "MemberExpression";
  computed: T;
  object: Expression;
  property: U;
}

interface DirectMemberExpression
  extends BaseMemberExpression<false, Identifier> {}
interface ComputedMemberExpression
  extends BaseMemberExpression<true, Expression> {}

export type MemberExpression =
  | DirectMemberExpression
  | ComputedMemberExpression;

export interface ThisExpression {
  type: "ThisExpression";
}

export interface UnaryExpression {
  type: "UnaryExpression";
  operator: string;
  argument: Expression;
  prefix: boolean;
}

export type Expression =
  | ArrayExpression
  | BinaryExpression
  | CallExpression
  | Compound
  | ConditionalExpression
  | Identifier
  | Literal
  | LogicalExpression
  | MemberExpression
  | ThisExpression
  | UnaryExpression;
