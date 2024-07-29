import * as htl from "../../_npm/htl@0.3.1/_esm.js";

export const northArrow = (fill = "#000") =>
  htl.svg`<svg viewBox="0 0 38 62" width="38" height="62" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="m19 47.5 14.722 11L19 18 4.278 58.5 19 47.5ZM6.361 55.695 19 46.252l12.639 9.443L19 20.927 6.361 55.695Z" fill="${fill}"/><path d="M33.722 58.5 19 18v29.5l14.722 11ZM21.934 4.727V12h-1.009l-3.697-5.334h-.067V12h-1.097V4.727h1.015l3.7 5.341h.068v-5.34h1.087Z" fill="${fill}"/></svg>`