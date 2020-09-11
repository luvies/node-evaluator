import jsep from "jsep";

import {
  ExpressionAnalyzer,
  FunctionCall,
  RuntimeValue,
  standardMemberChecks,
} from "../src";

describe("Expression Analyzer", () => {
  it("analyses simple expressions without context", () => {
    const analyzer = new ExpressionAnalyzer();

    let res = analyzer.analyze("a");

    expect(res.functionCalls).toHaveLength(0);
    expect(res.errors).toHaveLength(0);

    res = analyzer.analyze("b()");

    expect(res.functionCalls).toHaveLength(1);
    expect(res.errors).toHaveLength(0);

    expect(res.functionCalls[0].name).toBe("b");
    expect(res.functionCalls[0].args).toHaveLength(0);
    expect(res.functionCalls[0].path).toHaveLength(0);

    res = analyzer.analyze("a.b");

    expect(res.functionCalls).toHaveLength(0);
    expect(res.errors).toHaveLength(0);

    res = analyzer.analyze("a.b.c()");

    expect(res.functionCalls).toHaveLength(1);
    expect(res.errors).toHaveLength(0);

    expect(res.functionCalls[0].name).toBe("c");
    expect(res.functionCalls[0].args).toHaveLength(0);
    expect(res.functionCalls[0].path).toStrictEqual(["a", "b"]);

    res = analyzer.analyze("a + c");

    expect(res.functionCalls).toHaveLength(0);
    expect(res.errors).toHaveLength(0);

    res = analyzer.analyze("a * (b && c(1, 2))");

    expect(res.functionCalls).toHaveLength(1);
    expect(res.errors).toHaveLength(0);

    expect(res.functionCalls[0].name).toBe("c");
    expect(res.functionCalls[0].args).toStrictEqual([1, 2]);
    expect(res.functionCalls[0].path).toHaveLength(0);

    // Run through jsep first to test arguments.
    const expr = jsep("a ? b() : c()");
    res = analyzer.analyze(expr);

    expect(res.functionCalls).toHaveLength(2);
    expect(res.errors).toHaveLength(0);

    expect(res.functionCalls[0].name).toBe("b");
    expect(res.functionCalls[0].args).toHaveLength(0);
    expect(res.functionCalls[0].path).toHaveLength(0);

    expect(res.functionCalls[1].name).toBe("c");
    expect(res.functionCalls[1].args).toHaveLength(0);
    expect(res.functionCalls[1].path).toHaveLength(0);

    res = analyzer.analyze("+a(1)");

    expect(res.functionCalls).toHaveLength(1);
    expect(res.errors).toHaveLength(0);

    expect(res.functionCalls[0].name).toBe("a");
    expect(res.functionCalls[0].args).toStrictEqual([1]);
    expect(res.functionCalls[0].path).toHaveLength(0);

    res = analyzer.analyze("");

    expect(res.functionCalls).toHaveLength(0);
    expect(res.errors).toHaveLength(1);

    res = analyzer.analyze('a(1), b("2"), c(true)');

    expect(res.functionCalls).toHaveLength(3);
    expect(res.errors).toHaveLength(0);

    expect(res.functionCalls[0].name).toBe("a");
    expect(res.functionCalls[0].args).toStrictEqual([1]);
    expect(res.functionCalls[0].path).toHaveLength(0);

    expect(res.functionCalls[1].name).toBe("b");
    expect(res.functionCalls[1].args).toStrictEqual(["2"]);
    expect(res.functionCalls[1].path).toHaveLength(0);

    expect(res.functionCalls[2].name).toBe("c");
    expect(res.functionCalls[2].args).toStrictEqual([true]);
    expect(res.functionCalls[2].path).toHaveLength(0);
  });

  it("analyses simple expressions with simple context", () => {
    const analyzer = new ExpressionAnalyzer({
      evalOpts: {
        context: {
          a: "__a__",
          b: "__b__",
          f: () => undefined,
        },
      },
    });

    let res = analyzer.analyze("a");

    expect(res.functionCalls).toHaveLength(0);
    expect(res.errors).toHaveLength(0);

    res = analyzer.analyze("b()");

    expect(res.functionCalls).toHaveLength(1);
    expect(res.errors).toHaveLength(0);

    expect(res.functionCalls[0].name).toBe("b");
    expect(res.functionCalls[0].args).toHaveLength(0);
    expect(res.functionCalls[0].path).toHaveLength(0);

    res = analyzer.analyze("a.b");

    expect(res.functionCalls).toHaveLength(0);
    expect(res.errors).toHaveLength(1);

    res = analyzer.analyze("a.b.c()");

    expect(res.functionCalls).toHaveLength(1);
    expect(res.errors).toHaveLength(1);

    expect(res.functionCalls[0].name).toBe("c");
    expect(res.functionCalls[0].args).toHaveLength(0);
    expect(res.functionCalls[0].path).toStrictEqual(["a", "b"]);

    res = analyzer.analyze("a + c");

    expect(res.functionCalls).toHaveLength(0);
    expect(res.errors).toHaveLength(1);

    res = analyzer.analyze("a * (b && c(1, 2))");

    expect(res.functionCalls).toHaveLength(1);
    expect(res.errors).toHaveLength(1);

    expect(res.functionCalls[0].name).toBe("c");
    expect(res.functionCalls[0].args).toStrictEqual([1, 2]);
    expect(res.functionCalls[0].path).toHaveLength(0);

    res = analyzer.analyze("f(a, this.b)");

    expect(res.functionCalls).toHaveLength(1);
    expect(res.errors).toHaveLength(0);

    expect(res.functionCalls[0].name).toBe("f");
    expect(res.functionCalls[0].args).toStrictEqual(["__a__", "__b__"]);
    expect(res.functionCalls[0].path).toHaveLength(0);
  });

  it("analyses complex expressions with member access", () => {
    const analyzer = new ExpressionAnalyzer({
      evalOpts: {
        context: {
          a: {
            b: () => undefined,
          },
          c: () => undefined,
          d: "d",
          e: "e",
        },
        memberChecks: standardMemberChecks,
      },
    });

    let res = analyzer.analyze("a.b");

    expect(res.functionCalls).toHaveLength(0);
    expect(res.errors).toHaveLength(0);

    res = analyzer.analyze("a.b([1,2,2], c(3))");

    expect(res.functionCalls).toHaveLength(2);
    expect(res.errors).toHaveLength(0);

    expect(res.functionCalls[0].name).toBe("b");
    expect(res.functionCalls[0].args).toHaveLength(2);
    expect(res.functionCalls[0].args[0]).toStrictEqual([1, 2, 2]);
    expect(res.functionCalls[0].args[1]).toBeInstanceOf(FunctionCall);
    expect((res.functionCalls[0].args[1] as FunctionCall).name).toBe("c");
    expect((res.functionCalls[0].args[1] as FunctionCall).path).toHaveLength(0);
    expect((res.functionCalls[0].args[1] as FunctionCall).args).toStrictEqual([
      3,
    ]);
    expect(res.functionCalls[0].path).toStrictEqual(["a"]);

    expect(res.functionCalls[1].name).toBe("c");
    expect(res.functionCalls[1].path).toHaveLength(0);
    expect(res.functionCalls[1].args).toStrictEqual([3]);

    res = analyzer.analyze("a.b.c()");

    expect(res.functionCalls).toHaveLength(1);
    expect(res.errors).toHaveLength(1);

    expect(res.functionCalls[0].name).toBe("c");
    expect(res.functionCalls[0].args).toHaveLength(0);
    expect(res.functionCalls[0].path).toStrictEqual(["a", "b"]);

    res = analyzer.analyze("a / b + c");

    expect(res.functionCalls).toHaveLength(0);
    expect(res.errors).toHaveLength(1);

    res = analyzer.analyze("a * (b && c(1, 2))");

    expect(res.functionCalls).toHaveLength(1);
    expect(res.errors).toHaveLength(1);

    expect(res.functionCalls[0].name).toBe("c");
    expect(res.functionCalls[0].args).toStrictEqual([1, 2]);
    expect(res.functionCalls[0].path).toHaveLength(0);

    res = analyzer.analyze("a[f()].b()");

    expect(res.functionCalls).toHaveLength(2);
    expect(res.errors).toHaveLength(1);

    expect(res.functionCalls[0].name).toBe("b");
    expect(res.functionCalls[0].args).toHaveLength(0);
    expect(res.functionCalls[0].path).toHaveLength(1);
    expect(res.functionCalls[0].path[0]).toBeInstanceOf(RuntimeValue);

    expect(res.functionCalls[1].name).toBe("f");
    expect(res.functionCalls[1].args).toHaveLength(0);
    expect(res.functionCalls[1].path).toHaveLength(0);

    res = analyzer.analyze("a.b(d) + c(this.e)");

    expect(res.functionCalls).toHaveLength(2);
    expect(res.errors).toHaveLength(0);

    expect(res.functionCalls[0].name).toBe("b");
    expect(res.functionCalls[0].args).toStrictEqual(["d"]);
    expect(res.functionCalls[0].path).toStrictEqual(["a"]);

    expect(res.functionCalls[1].name).toBe("c");
    expect(res.functionCalls[1].args).toStrictEqual(["e"]);
    expect(res.functionCalls[1].path).toHaveLength(0);
  });
});
