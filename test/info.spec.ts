import { ExpressionInfoCollector, FunctionCall, RuntimeValue, standardMemberChecks } from '../src';

describe('Info collector', () => {
  it('analyses simple expressions without context', () => {
    const info = new ExpressionInfoCollector();

    let res = info.collect('a');

    expect(res.functionCalls).toHaveLength(0);
    expect(res.errors).toHaveLength(0);

    res = info.collect('b()');

    expect(res.functionCalls).toHaveLength(1);
    expect(res.errors).toHaveLength(0);

    expect(res.functionCalls[0].name).toBe('b');
    expect(res.functionCalls[0].args).toHaveLength(0);
    expect(res.functionCalls[0].path).toHaveLength(0);

    res = info.collect('a.b');

    expect(res.functionCalls).toHaveLength(0);
    expect(res.errors).toHaveLength(0);

    res = info.collect('a.b.c()');

    expect(res.functionCalls).toHaveLength(1);
    expect(res.errors).toHaveLength(0);

    expect(res.functionCalls[0].name).toBe('c');
    expect(res.functionCalls[0].args).toHaveLength(0);
    expect(res.functionCalls[0].path).toStrictEqual(['a', 'b']);

    res = info.collect('a + c');

    expect(res.functionCalls).toHaveLength(0);
    expect(res.errors).toHaveLength(0);

    res = info.collect('a * (b && c(1, 2))');

    expect(res.functionCalls).toHaveLength(1);
    expect(res.errors).toHaveLength(0);

    expect(res.functionCalls[0].name).toBe('c');
    expect(res.functionCalls[0].args).toStrictEqual([1, 2]);
    expect(res.functionCalls[0].path).toHaveLength(0);
  });

  it('analyses simple expressions with simple context', () => {
    const info = new ExpressionInfoCollector({
      evalOpts: {
        context: {
          a: '__a__',
          b: '__b__',
        },
      },
    });

    let res = info.collect('a');

    expect(res.functionCalls).toHaveLength(0);
    expect(res.errors).toHaveLength(0);

    res = info.collect('b()');

    expect(res.functionCalls).toHaveLength(1);
    expect(res.errors).toHaveLength(0);

    expect(res.functionCalls[0].name).toBe('b');
    expect(res.functionCalls[0].args).toHaveLength(0);
    expect(res.functionCalls[0].path).toHaveLength(0);

    res = info.collect('a.b');

    expect(res.functionCalls).toHaveLength(0);
    expect(res.errors).toHaveLength(1);

    res = info.collect('a.b.c()');

    expect(res.functionCalls).toHaveLength(1);
    expect(res.errors).toHaveLength(1);

    expect(res.functionCalls[0].name).toBe('c');
    expect(res.functionCalls[0].args).toHaveLength(0);
    expect(res.functionCalls[0].path).toStrictEqual(['a', 'b']);

    res = info.collect('a + c');

    expect(res.functionCalls).toHaveLength(0);
    expect(res.errors).toHaveLength(1);

    res = info.collect('a * (b && c(1, 2))');

    expect(res.functionCalls).toHaveLength(1);
    expect(res.errors).toHaveLength(1);

    expect(res.functionCalls[0].name).toBe('c');
    expect(res.functionCalls[0].args).toStrictEqual([1, 2]);
    expect(res.functionCalls[0].path).toHaveLength(0);
  });

  it('analysis complex expressions with member access', () => {
    const info = new ExpressionInfoCollector({
      evalOpts: {
        context: {
          a: {
            b: () => undefined,
          },
          c: () => undefined,
        },
        memberChecks: standardMemberChecks,
      },
    });

    let res = info.collect('a.b');

    expect(res.functionCalls).toHaveLength(0);
    expect(res.errors).toHaveLength(0);

    res = info.collect('a.b([1,2,2], c(3))');

    expect(res.functionCalls).toHaveLength(2);
    expect(res.errors).toHaveLength(0);

    expect(res.functionCalls[0].name).toBe('b');
    expect(res.functionCalls[0].args).toHaveLength(2);
    expect(res.functionCalls[0].args[0]).toStrictEqual([1, 2, 2]);
    expect(res.functionCalls[0].args[1]).toBeInstanceOf(FunctionCall);
    expect((res.functionCalls[0].args[1] as FunctionCall).name).toBe('c');
    expect((res.functionCalls[0].args[1] as FunctionCall).path).toHaveLength(0);
    expect((res.functionCalls[0].args[1] as FunctionCall).args).toStrictEqual([3]);
    expect(res.functionCalls[0].path).toStrictEqual(['a']);

    expect(res.functionCalls[1].name).toBe('c');
    expect(res.functionCalls[1].path).toHaveLength(0);
    expect(res.functionCalls[1].args).toStrictEqual([3]);

    res = info.collect('a.b.c()');

    expect(res.functionCalls).toHaveLength(1);
    expect(res.errors).toHaveLength(1);

    expect(res.functionCalls[0].name).toBe('c');
    expect(res.functionCalls[0].args).toHaveLength(0);
    expect(res.functionCalls[0].path).toStrictEqual(['a', 'b']);

    res = info.collect('a / b + c');

    expect(res.functionCalls).toHaveLength(0);
    expect(res.errors).toHaveLength(1);

    res = info.collect('a * (b && c(1, 2))');

    expect(res.functionCalls).toHaveLength(1);
    expect(res.errors).toHaveLength(1);

    expect(res.functionCalls[0].name).toBe('c');
    expect(res.functionCalls[0].args).toStrictEqual([1, 2]);
    expect(res.functionCalls[0].path).toHaveLength(0);

    res = info.collect('a[d()].b()');

    expect(res.functionCalls).toHaveLength(2);
    expect(res.errors).toHaveLength(1);

    expect(res.functionCalls[0].name).toBe('b');
    expect(res.functionCalls[0].args).toHaveLength(0);
    expect(res.functionCalls[0].path).toHaveLength(1);
    expect(res.functionCalls[0].path[0]).toBeInstanceOf(RuntimeValue);

    expect(res.functionCalls[1].name).toBe('d');
    expect(res.functionCalls[1].args).toHaveLength(0);
    expect(res.functionCalls[1].path).toHaveLength(0);
  });
});