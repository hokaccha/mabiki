# mabiki

mabiki provides throttle and debounce, which are compatible with lodash.

## Install

```
$ npm install mabiki
```

## Usage

```javascript
import { debounce, throttle } from "mabiki";

window.addEventListener("scroll", debounce(() => {
  // do something
}, 200));

window.addEventListener("scroll", throttle(() => {
  // do something
}, 200));
```
