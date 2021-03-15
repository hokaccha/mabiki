import { throttle } from "../src/mabiki";

export function identity<T>(value: T): T {
  return value;
}

describe("throttle", () => {
  it("should throttle a function", (done) => {
    let callCount = 0;
    const throttled = throttle(() => {
      callCount++;
    }, 32);

    throttled();
    throttled();
    throttled();

    const lastCount = callCount;
    expect(callCount).toBe(1);

    setTimeout(() => {
      expect(callCount > lastCount).toBe(true);
      done();
    }, 64);
  });

  it("subsequent calls should return the result of the first call", (done) => {
    const throttled = throttle(identity, 32);
    const results = [throttled("a"), throttled("b")];

    expect(results).toEqual(["a", "a"]);

    setTimeout(() => {
      const results = [throttled("c"), throttled("d")];
      expect(results[0]).not.toBe("a");
      expect(results[0]).not.toBe(undefined);

      expect(results[1]).not.toBe("d");
      expect(results[1]).not.toBe(undefined);
      done();
    }, 64);
  });

  it("should clear timeout when `func` is called", (done) => {
    let callCount = 0;
    let dateCount = 0;

    jest.spyOn(Date, "now").mockImplementation(() => {
      return ++dateCount == 5 ? Infinity : +new Date();
    });

    const throttled = throttle(() => {
      callCount++;
    }, 32);

    throttled();
    throttled();

    setTimeout(() => {
      expect(callCount).toBe(2);
      done();
    }, 64);
  });

  it("should not trigger a trailing call when invoked once", (done) => {
    let callCount = 0;
    const throttled = throttle(() => {
      callCount++;
    }, 32);

    throttled();
    expect(callCount).toBe(1);

    setTimeout(() => {
      expect(callCount).toBe(1);
      done();
    }, 64);
  });

  [0, 1].forEach((index) => {
    it("should trigger a call when invoked repeatedly" + (index ? " and `leading` is `false`" : ""), (done) => {
      let callCount = 0;
      const limit = 1000;
      const options = index !== 0 ? { leading: false } : {};
      const throttled = throttle(
        () => {
          callCount++;
        },
        32,
        options
      );

      const start = +new Date();
      while (new Date().valueOf() - start < limit) {
        throttled();
      }
      const actual = callCount > 1;
      setTimeout(() => {
        expect(actual).toBe(true);
        done();
      }, 1);
    });
  });

  it("should trigger a second throttled call as soon as possible", (done) => {
    let callCount = 0;

    const throttled = throttle(
      () => {
        callCount++;
      },
      128,
      { leading: false }
    );

    throttled();

    setTimeout(() => {
      expect(callCount).toBe(1);
      throttled();
    }, 192);

    setTimeout(() => {
      expect(callCount).toBe(1);
    }, 254);

    setTimeout(() => {
      expect(callCount).toBe(2);
      done();
    }, 384);
  });

  it("should apply default options", (done) => {
    let callCount = 0;
    const throttled = throttle(
      () => {
        callCount++;
      },
      32,
      {}
    );

    throttled();
    throttled();
    expect(callCount).toBe(1);

    setTimeout(() => {
      expect(callCount).toBe(2);
      done();
    }, 128);
  });

  it("should support a `leading` option", () => {
    const withLeading = throttle(identity, 32, { leading: true });
    expect(withLeading("a")).toBe("a");

    const withoutLeading = throttle(identity, 32, { leading: false });
    expect(withoutLeading("a")).toBe(undefined);
  });

  it("should support a `trailing` option", (done) => {
    let withCount = 0,
      withoutCount = 0;

    const withTrailing = throttle(
      (value) => {
        withCount++;
        return value;
      },
      64,
      { trailing: true }
    );

    const withoutTrailing = throttle(
      (value) => {
        withoutCount++;
        return value;
      },
      64,
      { trailing: false }
    );

    expect(withTrailing("a")).toBe("a");
    expect(withTrailing("b")).toBe("a");

    expect(withoutTrailing("a")).toBe("a");
    expect(withoutTrailing("b")).toBe("a");

    setTimeout(() => {
      expect(withCount).toBe(2);
      expect(withoutCount).toBe(1);
      done();
    }, 256);
  });

  it("should not update `lastCalled`, at the end of the timeout, when `trailing` is `false`", (done) => {
    let callCount = 0;

    const throttled = throttle(
      () => {
        callCount++;
      },
      64,
      { trailing: false }
    );

    throttled();
    throttled();

    setTimeout(() => {
      throttled();
      throttled();
    }, 96);

    setTimeout(() => {
      expect(callCount > 1).toBe(true);
      done();
    }, 192);
  });

  it("should work with a system time of `0`", (done) => {
    let callCount = 0;
    let dateCount = 0;

    jest.spyOn(Date, "now").mockImplementation(() => {
      return ++dateCount < 4 ? 0 : +new Date();
    });

    const throttled = throttle((value: any) => {
      callCount++;
      return value;
    }, 32);

    const results = [throttled("a"), throttled("b"), throttled("c")];
    expect(results).toEqual(["a", "a", "a"]);
    expect(callCount).toBe(1);

    setTimeout(() => {
      expect(callCount).toBe(2);
      done();
    }, 64);
  });
});
