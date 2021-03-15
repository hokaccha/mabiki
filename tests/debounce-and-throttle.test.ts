import { debounce, throttle } from "../src/mabiki";

function noop() {}

describe("debounce and throttle", () => {
  [debounce, throttle].forEach((func) => {
    const funcName = func.name;
    const isDebounce = func == debounce;

    it("`" + funcName + "` should not error for non-object `options` values", () => {
      func(noop, 32, 1 as any);
      expect(true).toBeTruthy();
    });

    it("`" + funcName + "` should use a default `wait` of `0`", (done) => {
      let callCount = 0;
      const funced = func(() => {
        callCount++;
      });

      funced();

      setTimeout(() => {
        funced();
        expect(callCount).toBe(isDebounce ? 1 : 2);
        done();
      }, 32);
    });

    it("`" + funcName + "` should invoke `func` with the correct `this` binding", (done) => {
      const actual: any = [];
      const object = {
        funced: func(function (this: any) {
          actual.push(this);
        }, 32),
      };
      const expected = isDebounce ? [object] : [object, object];

      object.funced();
      if (!isDebounce) {
        object.funced();
      }
      setTimeout(() => {
        expect(actual).toEqual(expected);
        done();
      }, 64);
    });

    it("`" + funcName + "` supports recursive calls", (done) => {
      const actual: any = [];
      const args = ["a", "b", "c"].map((chr) => {
        return [{}, chr];
      });
      const expected = args.slice();
      const queue = args.slice();

      const funced = func(function (this: any, ...args: any) {
        const current = [this];
        Array.prototype.push.apply(current, args);
        actual.push(current);

        const next = queue.shift();
        if (next) {
          funced.call(next[0], next[1]);
        }
      }, 32);

      const next = queue.shift();
      funced.call(next?.[0], next?.[1]);
      expect(actual).toEqual(expected.slice(0, isDebounce ? 0 : 1));

      setTimeout(() => {
        expect(actual).toEqual(expected.slice(0, actual.length));
        done();
      }, 256);
    });

    it("`" + funcName + "` should work if the system time is set backwards", (done) => {
      let callCount = 0;
      let dateCount = 0;

      jest.spyOn(Date, "now").mockImplementation(() => {
        return ++dateCount == 4 ? +new Date(2012, 3, 23, 23, 27, 18) : +new Date();
      });

      const funced = func(() => {
        callCount++;
      }, 32);

      funced();

      setTimeout(() => {
        funced();
        expect(callCount).toBe(isDebounce ? 1 : 2);
        done();
      }, 64);
    });

    it("`" + funcName + "` should support cancelling delayed calls", (done) => {
      let callCount = 0;

      const funced = func(
        () => {
          callCount++;
        },
        32,
        { leading: false }
      );

      funced();
      funced.cancel();

      setTimeout(() => {
        expect(callCount).toBe(0);
        done();
      }, 64);
    });

    it("`" + funcName + "` should reset `lastCalled` after cancelling", (done) => {
      let callCount = 0;

      const funced = func(
        () => {
          return ++callCount;
        },
        32,
        { leading: true }
      );

      expect(funced()).toBe(1);
      funced.cancel();

      expect(funced()).toBe(2);
      funced();

      setTimeout(() => {
        expect(callCount).toBe(3);
        done();
      }, 64);
    });

    it("`" + funcName + "` should support flushing delayed calls", (done) => {
      let callCount = 0;

      const funced = func(
        () => {
          return ++callCount;
        },
        32,
        { leading: false }
      );

      funced();
      expect(funced.flush()).toBe(1);

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 64);
    });

    it("`" + funcName + "` should noop `cancel` and `flush` when nothing is queued", (done) => {
      let callCount = 0;
      const funced = func(() => {
        callCount++;
      }, 32);

      funced.cancel();
      expect(funced.flush()).toBe(undefined);

      setTimeout(() => {
        expect(callCount).toBe(0);
        done();
      }, 64);
    });
  });
});
