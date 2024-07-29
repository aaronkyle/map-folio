import * as htl from "../../_npm/htl@0.3.1/_esm.js";

export const html = htl.html;

export function resize(...args) {
  const outerStyles = { paddingBottom: "0.125rem" };
  const innerStyles = {
    overflow: "auto",
    resize: "horizontal",
    padding: "0.25rem",
    border: "1px solid #e8e8e8",
    borderRadius: "0.25rem",
    width: "fit-content",
    maxWidth: "100%"
  };
  return html`<div style=${outerStyles}>
  <div style=${innerStyles}>${html(...args)}</div>
</div>`;
}