import FileSaver from "npm:file-saver@2.0.5";

import html2canvas from "npm:html2canvas@1.4.1";

export function canvas2blob(canvas, type = "image/jpeg", quality) {
    let resolve, reject;
    const promise = new Promise((y, n) => ((resolve = y), (reject = n)));
    canvas.toBlob(
        (blob) => {
            if (blob == null) {
                return reject();
            }
            resolve(blob);
        },
        type,
        quality
    );
    return promise;
}

export function generateDownloader(el, options) {
    return async function () {
        let resolve, reject;
        const { filename = "untitled", type, quality, ...html2canvasOptions } = options;
        const canvas = await html2canvas(el, html2canvasOptions);
        const blob = await canvas2blob(canvas, type, quality);
        FileSaver(blob, filename);
    };
}

export function downloadHtmlAsImage(el, options) {
    const { label, ...restOptions } = Object.assign(
        { label: "Download as Image", scale: window.devicePixelRatio },
        options
    );
    const ui = Inputs.button(label, {
        value: null,
        reduce: generateDownloader(el, restOptions)
    });
    return ui;
}
