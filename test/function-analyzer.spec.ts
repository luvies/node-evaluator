import {
  EvaluatorOptions,
  ExpressionAnalyzer,
  FunctionAnalysis,
  FunctionAnalysisConfig,
  FunctionAnalyzer,
  FunctionArgs,
  FunctionCall,
  RuntimeValue,
} from "../src";

function fnAnalyze<T extends FunctionArgs<T>>(
  expr: string,
  {
    evalOpts,
    conf,
  }: { evalOpts?: EvaluatorOptions; conf: FunctionAnalysisConfig<T> },
): FunctionAnalysis<T> {
  const analyzer = new ExpressionAnalyzer({ evalOpts });
  const fnAnalyzer = new FunctionAnalyzer<T>(conf);

  const analysis = analyzer.analyze(expr);
  return fnAnalyzer.analyze(analysis);
}

describe("Function Analyzer", () => {
  it("handles simple expressions", () => {
    interface Funcs {
      fn: [number, string];
    }

    const conf: FunctionAnalysisConfig<Funcs> = {
      fn: {
        args: ["number", "string"],
      },
    };

    const fna = (expr: string): FunctionAnalysis<Funcs> =>
      fnAnalyze(expr, { conf });

    let res = fna("true");

    expect(res).toStrictEqual({
      fn: { invalid: [], valid: [] },
    });

    res = fna("1 + 2");

    expect(res).toStrictEqual({
      fn: { invalid: [], valid: [] },
    });

    res = fna('"value"');

    expect(res).toStrictEqual({
      fn: { invalid: [], valid: [] },
    });

    res = fna("[1, 2, 3, 4]");

    expect(res).toStrictEqual({
      fn: { invalid: [], valid: [] },
    });
  });

  it("analyses simple functions", () => {
    interface Funcs {
      a: [number];
      b: [string];
      c: [number, string, boolean];
      x: [any];
    }

    const conf: FunctionAnalysisConfig<Funcs> = {
      a: {
        args: ["number"],
      },
      b: {
        args: ["string"],
      },
      c: {
        args: ["number", "string", "boolean"],
      },
      x: {
        args: ["any"],
      },
    };

    const fna = (expr: string): FunctionAnalysis<Funcs> =>
      fnAnalyze(expr, { conf });

    let res = fna("a(1)");

    expect(res).toStrictEqual({
      a: {
        invalid: [],
        valid: [[1]],
      },
      b: {
        invalid: [],
        valid: [],
      },
      c: {
        invalid: [],
        valid: [],
      },
      x: {
        invalid: [],
        valid: [],
      },
    });

    res = fna('b("1")');

    expect(res).toStrictEqual({
      a: {
        invalid: [],
        valid: [],
      },
      b: {
        invalid: [],
        valid: [["1"]],
      },
      c: {
        invalid: [],
        valid: [],
      },
      x: {
        invalid: [],
        valid: [],
      },
    });

    res = fna('c(1, "2", true)');

    expect(res).toStrictEqual({
      a: {
        invalid: [],
        valid: [],
      },
      b: {
        invalid: [],
        valid: [],
      },
      c: {
        invalid: [],
        valid: [[1, "2", true]],
      },
      x: {
        invalid: [],
        valid: [],
      },
    });

    res = fna('d(false, "unknown", 20)');

    expect(res).toStrictEqual({
      a: {
        invalid: [],
        valid: [],
      },
      b: {
        invalid: [],
        valid: [],
      },
      c: {
        invalid: [],
        valid: [],
      },
      x: {
        invalid: [],
        valid: [],
      },
    });

    res = fna('a(11), b("12"), a(21)');

    expect(res).toStrictEqual({
      a: {
        invalid: [],
        valid: [[11], [21]],
      },
      b: {
        invalid: [],
        valid: [["12"]],
      },
      c: {
        invalid: [],
        valid: [],
      },
      x: {
        invalid: [],
        valid: [],
      },
    });

    res = fna(
      'a(99, 98), b("a", "b", "c", "d"), c(100, "2 hundred", false, "other", ["values"])',
    );

    expect(res).toStrictEqual({
      a: {
        invalid: [],
        valid: [[99, 98]],
      },
      b: {
        invalid: [],
        valid: [["a", "b", "c", "d"]],
      },
      c: {
        invalid: [],
        valid: [[100, "2 hundred", false, "other", ["values"]]],
      },
      x: {
        invalid: [],
        valid: [],
      },
    });

    res = fna('a([1, 2]), a("test"), b(13), c("2", 3, false)');

    expect(res).toStrictEqual({
      a: {
        invalid: [[[1, 2]], ["test"]],
        valid: [],
      },
      b: {
        invalid: [[13]],
        valid: [],
      },
      c: {
        invalid: [["2", 3, false]],
        valid: [],
      },
      x: {
        invalid: [],
        valid: [],
      },
    });

    res = fna('x(1), x("a"), x(true), x([1, "b", false])');

    expect(res).toStrictEqual({
      a: {
        invalid: [],
        valid: [],
      },
      b: {
        invalid: [],
        valid: [],
      },
      c: {
        invalid: [],
        valid: [],
      },
      x: {
        invalid: [],
        valid: [[1], ["a"], [true], [[1, "b", false]]],
      },
    });
  });

  it("handles array arguments", () => {
    interface Funcs {
      a: [number[]];
      b: [string[]];
      c: [boolean[]];
    }

    const conf: FunctionAnalysisConfig<Funcs> = {
      a: {
        args: ["number[]"],
      },
      b: {
        args: ["string[]"],
      },
      c: {
        args: ["boolean[]"],
      },
    };

    const res = fnAnalyze(
      'a([1, 2, 3, 4]), a([1, "2"]), a(1), b(["a", "b", "c"]), b(["a", 2]), b("a"), c([true, false]), c([false, "true"]), c(true)',
      { conf },
    );

    expect(res).toStrictEqual({
      a: {
        invalid: [[[1, "2"]], [1]],
        valid: [[[1, 2, 3, 4]]],
      },
      b: {
        invalid: [[["a", 2]], ["a"]],
        valid: [[["a", "b", "c"]]],
      },
      c: {
        invalid: [[[false, "true"]], [true]],
        valid: [[[true, false]]],
      },
    });
  });

  it("handles function checkers", () => {
    interface Funcs {
      a: [number];
      b: [string, boolean];
    }

    const conf: FunctionAnalysisConfig<Funcs> = {
      a: {
        args: [(arg) => arg === 1],
      },
      b: {
        args: ([arg0, arg1]) => arg0 === "a" && arg1 === true,
      },
    };

    const res = fnAnalyze('a(1), a("a"), b("a", true), b(1, "b")', { conf });

    expect(res).toStrictEqual({
      a: {
        invalid: [["a"]],
        valid: [[1]],
      },
      b: {
        invalid: [[1, "b"]],
        valid: [["a", true]],
      },
    });
  });

  it("handles optional arguments", () => {
    interface Funcs {
      a: [number, number, string | undefined];
    }

    const conf: FunctionAnalysisConfig<Funcs> = {
      a: {
        args: ["number", "number", "string"],
        requiredArgsCount: 2,
      },
    };

    const res = fnAnalyze(
      'a(1, 2, "3"), a(9, 8), a(5), a(12, 13, "14", "15"), a(11, 22, undefined)',
      { conf, evalOpts: { context: { undefined } } },
    );

    expect(res).toStrictEqual({
      a: {
        invalid: [[5]],
        valid: [
          [1, 2, "3"],
          [9, 8],
          [12, 13, "14", "15"],
          [11, 22, undefined],
        ],
      },
    });
  });

  it("handles alternate names", () => {
    interface Funcs {
      a: [number, number, string | undefined];
    }

    const conf: FunctionAnalysisConfig<Funcs> = {
      a: {
        name: "b",
        args: ["number", "string"],
      },
    };

    const res = fnAnalyze('b(1, "2"), a(9, "8"), b(5), a(12)', { conf });

    expect(res).toStrictEqual({
      a: {
        invalid: [[5]],
        valid: [[1, "2"]],
      },
    });
  });

  it("handles paths", () => {
    interface Funcs {
      a: [number];
    }

    const conf: FunctionAnalysisConfig<Funcs> = {
      a: {
        path: ["c", "b"],
        args: ["number"],
      },
    };

    const res = fnAnalyze(
      'c.b.a(1), c.b.a(9, 8), c.b.a("test"), b.c.a(5), a(12)',
      { conf },
    );

    expect(res).toStrictEqual({
      a: {
        invalid: [["test"]],
        valid: [[1], [9, 8]],
      },
    });
  });

  it("handles function calls", () => {
    interface Funcs {
      a: [number];
    }

    const conf: FunctionAnalysisConfig<Funcs> = {
      a: {
        args: ["number"],
      },
    };

    const expr = "a(1), a(b()), a(5, b()), a(b(), 9)";
    const bCall = new FunctionCall("b", [], []);

    let res = fnAnalyze(expr, { conf });

    expect(res).toStrictEqual({
      a: {
        invalid: [[bCall], [bCall, 9]],
        valid: [[1], [5, bCall]],
      },
    });

    conf.a.functionCallArgValid = true;

    res = fnAnalyze(expr, { conf });

    expect(res).toStrictEqual({
      a: {
        invalid: [],
        valid: [[1], [bCall], [5, bCall], [bCall, 9]],
      },
    });
  });

  it("handles runtime values", () => {
    interface Funcs {
      a: [number];
    }

    const conf: FunctionAnalysisConfig<Funcs> = {
      a: {
        args: ["number"],
      },
    };

    const expr = "a(1), a(1 + 2), a(5, 3 - 4), a(7 * 8, 9)";
    const rval = new RuntimeValue();

    let res = fnAnalyze(expr, { conf });

    expect(res).toStrictEqual({
      a: {
        invalid: [[rval], [rval, 9]],
        valid: [[1], [5, rval]],
      },
    });

    conf.a.runtimeValueValid = true;

    res = fnAnalyze(expr, { conf });

    expect(res).toStrictEqual({
      a: {
        invalid: [],
        valid: [[1], [rval], [5, rval], [rval, 9]],
      },
    });
  });
});
