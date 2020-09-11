import type { FunctionAnalysisConfig } from "../analyzer";
import type { TypeMap } from "../evaluator";

function regex(pattern: string, flags?: string): RegExp {
  return new RegExp(pattern, flags);
}

export const StringContext: TypeMap = {
  regex,
};

export interface StringFunctionArgs {
  "String.regex": [string, string | undefined];
}

const path = ["String"];

export const stringFunctionAnalysisConfig: FunctionAnalysisConfig<StringFunctionArgs> = {
  "String.regex": {
    path,
    name: "regex",
    args: ["string", "string"],
    requiredArgsCount: 1,
  },
};
