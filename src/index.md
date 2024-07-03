# Map Folio

```js echo
///import * as d3 from "npm:d3";
```


```js echo
import * as htl from "npm:htl";
// import * from "npm:@observablehq/stdlib";
```

```js echo
// import { northArrow } from "@adb/cartographic-symbols";
import { northArrow } from "./components/cartographic-symbols.js";
```

```js echo
//import { resize } from "@saneef/resize";
import { resize } from "./components/resize.js";
```

```js echo
//import { partitionLine } from "@adb/helper-functions-geometry";
import { partitionLine } from "./components/helper-functions-geometry.js";
```

```js echo
//import {rewind} from "@fil/rewind";
import {rewind} from "./components/rewind.js";

```

```js
display(htl.svg)
```

```js
import {context2d} from "./components/DOM.js";

const DOM = context2d;
```

```js echo
// Asynchronous imports for external modules
const bbox = (await import("https://cdn.jsdelivr.net/npm/@turf/bbox/+esm")).default;
const bboxPolygon = (await import("https://cdn.jsdelivr.net/npm/@turf/bbox-polygon/+esm")).default;
const d3GeoScaleBar = await import("https://cdn.jsdelivr.net/npm/d3-geo-scale-bar/+esm");
const polylabel = (await import('https://cdn.skypack.dev/polylabel@1.1.0?min')).default;
```

```js echo
// Declaring variables
const html = htl.html;
```

```js echo
const svg = htl.svg;
```

```js echo
const defaultFontFamily = `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`;

// Additional function and pattern definitions
const ns = (() => {
    const base = Inputs.text().classList[0];
    return base.replace("oi-", "map-folio-");
  })();
  
const patterns = new Map([
    [
      "water",
      svg`<pattern patternTransform="scale(0.5)" patternUnits="userSpaceOnUse" width="24" height="24">
        <rect width="24" height="24" fill="hsl(217, 88%, 68%)" />
        <path fill="none" stroke-width=".75" stroke="hsl(217, 88%, 79%)" d="M12.5 9a.5.5 0 0 0-1 0h1ZM0 20.5c3.134 0 6.25-1.303 8.582-3.376C10.915 15.05 12.5 12.172 12.5 9h-1c0 2.828-1.415 5.45-3.582 7.376C5.75 18.303 2.866 19.5 0 19.5v1ZM11.5 9c0 3.172 1.585 6.05 3.918 8.124C17.75 19.197 20.866 20.5 24 20.5v-1c-2.866 0-5.75-1.197-7.918-3.124C13.915 14.45 12.5 11.828 12.5 9h-1Z" />
      </pattern>`
    ]
  ]);
```

```js echo
// Function to get SVG pattern
 function getSvgPattern(key, patternsMap = patterns) {
    const p = patternsMap.get(key);
    if (p) {
      const pClone = p.cloneNode(true);
      const id = getSvgPatternId(key);
      pClone.setAttribute("id", id);
      return pClone;
    }
  }
  
  // Function to get SVG pattern ID
   function getSvgPatternId(key, namespace = ns ?? "") {
    return `${namespace}-pattern-${key}`;
  }
  
  // Function to get SVG pattern URL
   function getSvgPatternUrl(key) {
    const id = getSvgPatternId(key);
    return `url(#${id})`;
  }
  
  // Function to initialize styles
  const initializeStyles = (() => {
    let initialized;
    const inputsNs = Inputs.text().classList[0];
    
    return () => {
      if (initialized) return;
    
      initialized = true;
    
      const styles = html`<style>
        .${ns} .flow > * + * {
          margin-top: var(--flow-space, 1rem);
        }
        .${ns} .flow-child > * > * + * {
          margin-top: var(--flow-space, 1rem);
        }
        .${ns} .flow-space-xs {
          --flow-space: .25rem;
        }
        .${ns} .flow-space-s {
          --flow-space: .5rem;
        }
        .${ns} .flow-space-m {
          --flow-space: 1rem;
        }
        .${ns} .flow-space-l {
          --flow-space: 1.5rem;
        }
        .${ns} .flow-space-xl {
          --flow-space: 1.5rem;
        }
        .${ns}__aside * {
          margin-top: 0;
          margin-bottom: 0;
        }
      </style>`;
    
      document.querySelector("head").append(styles);
    
      invalidation.then(
        () => styles.parentNode && styles.parentNode.removeChild(styles)
      );
    };
  })();
```

```js echo
// Function to create a FeatureCollection from layers
 function featureCollectionFromLayers(layers) {
    // Based on https://github.com/neocarto/bertin/blob/main/src/helpers/height.js
    let L = layers
      .map((l) => l.geojson)
      .filter(Boolean)
      .map((f) => Array.isArray(f.features) ? f.features : [f]); // Assume it is a single feature
  
    return {
      type: "FeatureCollection",
      features: L.flat()
    };
  }
  
  // Function to convert an extent (bounding box) into a GeoJSON feature
   function getExtentAsFeature(extent) {
    let feat;
    if (
      Array.isArray(extent) &&
      Array.isArray(extent[0]) &&
      Array.isArray(extent[1])
    ) {
      feat = bboxPolygon(extent.flat());
    } else {
      feat = bboxPolygon(bbox(extent));
    }
  
    return rewind(feat, true);
  }
  ```

```js echo
  // Function to calculate bounds as a GeoJSON feature based on dimensions and margins
   function getBoundsAsFeature({
    projection,
    width,
    height,
    marginTop = 0,
    marginRight = 0,
    marginLeft = 0,
    marginBottom = 0,
    precision = 2.5
  } = {}) {
    const p1 = [marginLeft, marginTop];
    const p2 = [width - marginRight, marginTop];
    const p3 = [width - marginRight, height - marginBottom];
    const p4 = [marginLeft, height - marginBottom];
  
    const vertices = [p1, p2, p3, p4, p1];
  
    const viewportSize = Math.min(
      width - marginRight - marginLeft,
      height - marginTop - marginBottom
    );
    const parts = Math.floor(viewportSize / precision);
  
    let lines = pairUp(vertices);
    lines = lines
      .flatMap(([p1, p2]) => partitionLine(...p1, ...p2, parts))
      .map((l) => l[0]);
    lines = [...lines, p1];
  
    return {
      type: "Polygon",
      coordinates: [lines.map((p) => projection.invert(p))]
    };
  }

// Helper function to pair up consecutive elements in an array
 function pairUp(arr) {
    return arr.reduce((res, cur, i, arr) => {
      if (i === 0) return res;
      return [...res, [arr[i - 1], cur]];
    }, []);
  }
  
  // Helper function to check if a value is a finite number
   function isNumber(value) {
    return typeof value === "number" && isFinite(value);
  }
  
  // Function to calculate the height of a projection given specific dimensions and padding
   function getHeight({
    projection,
    extentGeo,
    width,
    padding = 0,
    marginTop = 0,
    marginRight = 0,
    marginLeft = 0,
    marginBottom = 0
  }) {
    const [[x0, y0], [x1, y1]] = d3
      .geoPath(
        projection.fitWidth(
          width - padding * 2 - marginLeft - marginRight,
          extentGeo
        )
      )
      .bounds(extentGeo);
  
    let trans = projection.translate();
    projection.translate([
      trans[0] + padding + marginLeft,
      trans[1] + padding + marginTop
    ]);
  
    return Math.ceil(y1 - y0) + padding * 2 + marginTop + marginBottom;
  }
```

```js echo
// Define a mapping of symbol names to their corresponding D3 symbol fill functions
const symbols = "circle cross diamond square star triangle wye"
  .split(/ /) // Split the string into an array of symbol names
  .reduce((obj, n, i) => ({ ...obj, [n]: d3.symbolsFill[i] }), {}); // Create an object mapping symbol names to D3 symbol fill functions
```

```js echo
   function drawScaleBar({
    projection,
    width,
    height,
    padding,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    units,
    svgBaseStyles,
    scaleHeight = 48,
    debug
  }) {
    // Create an SVG element with the specified width and height
    const node = DOM.svg(width, scaleHeight);
    const svg = d3.select(node).attr("style", svgBaseStyles);
  
    const x = 3; // X position for the scale bar
    const y = 24; // Y position for the scale bar
  
    // If debug mode is enabled, draw a yellow rectangle to visualize the scale bar area
    if (debug) {
      svg
        .append("rect")
        .attr("width", width)
        .attr("height", scaleHeight)
        .attr("fill", "#ff0");
    }
  
    // Configure the scale bar
    const scaleBar = d3GeoScaleBar
      .geoScaleBar()
      .projection(projection)
      .size([width, height])
      .label(units === "miles" ? "Miles" : "Kilometres")
      .orient(d3GeoScaleBar.geoScaleTop)
      .tickSize(6)
      .left(0)
      .top(0)
      .units(
        units === "miles"
          ? d3GeoScaleBar.geoScaleMiles
          : d3GeoScaleBar.geoScaleKilometers
      );
  
    // Append the scale bar to the SVG element
    const bar = svg
      .append("g")
      .attr("transform", `translate(${x},${y})`)
      .append("g");
  
    bar.call(scaleBar);
    bar.attr("font-family", "inherit");
  
    return node;
  }
  ```

```js echo
// Calculates positions for graticule labels.
   function graticuleLabelPositions(boundsGeo, { step = [1, 1] }) {
    let i = []; // Initialize an empty array to store label positions
    let poly = boundsGeo.coordinates[0].slice();  // Copy the coordinates of the bounds
    let cur = poly[0]; // Start with the first coordinate
    // poly.push(cur);
    // let p0 = cur;
    poly.forEach((p) => {
      let latStep = Math.abs(p[1]) > 80 ? 90 : step[1];
      let lonStep = step[0];
      // Check if the current position crosses a latitude line
      if (Math.floor(p[1] / latStep) != Math.floor(cur[1] / latStep)) {
        p.type = "latitude";
        i.push(p);
      // Check if the current position crosses a longitude line
      } else if (Math.floor(p[0] / lonStep) != Math.floor(cur[0] / lonStep)) {
        p.type = "longitude";
        i.push(p);
      }
      cur = p; // Update the current position
    });
  
    return i;
  }
```

```js echo
// Draws symbols on a D3 selection.
   function drawSymbols({ selection, projection, layer }) {
    const {
      geojson,
      size = 64,
      symbol = "circle",
      fill = "black",
      fillOpacity = "1",
      stroke = "none",
      strokeWidth = 0.75,
      strokeOpacity = 1,
      strokeLinecap = "round",
      strokeLinejoin = "round",
      strokeDasharray = "none",
      style
    } = layer;
  
    if (geojson == null) return;
  
     // Ensure features is an array of geojson features
    const features = Array.isArray(geojson.features)
      ? [...geojson.features]
      : [geojson];
  
    const L = features.map((f) => {
      if (f?.geometry?.type === "Point") return f.geometry.coordinates;
      return d3.geoCentroid(f);
    });
  
    //?? Is the typo here for circle intentional? (i.e. correcting for an expected errror in the source?)
    const symbolObj = symbols[symbol] ?? symbols["cirlce"];
    /// should the following instead be `d3.symbol().type(symbolObj)`?
    const mark = d3.symbol(symbolObj).size(size);
  
    selection
      .append("g")
      .selectAll("path")
      .data(L)
      .join("path")
      .attr("d", mark())
      .attr("transform", (pos) => `translate(${projection(pos)})`)
      .attr("fill", fill)
      .attr("fill-opacity", fillOpacity)
      .attr("stroke", stroke)
      .attr("stroke-width", strokeWidth)
      .attr("stroke-opacity", strokeOpacity)
      .attr("stroke-linecap", strokeLinecap)
      .attr("stroke-linejoin", strokeLinejoin)
      .attr("stroke-dasharray", strokeDasharray)
      .attr("style", style);
  }
```

```js echo
   function computeLabelPole(feat, precision) {
    if (feat.geometry.type === "Polygon") {
      return polylabel(feat.geometry.coordinates, precision);
    }
  
    return d3.geoCentroid(feat);
  }
```

```js echo
   function multilineText(
    el,
    {
      fontSize = 10,
      lineHeight = 1.05,
      textAnchor = "middle",
      dominantBaseline = "middle",
      textFn
    } = {}
  ) {
    el.each(function (d) {
      const text = textFn(d);
      if (text == null) return;
  
      const lines = text.split("\n");
      const textContentHeight = (lines.length - 1) * lineHeight * fontSize;
  
      const el = d3.select(this);
  
      const anchor = {
        x: +el.attr("x"),
        y: +el.attr("y")
      };
  
      const dy =
        dominantBaseline === "middle"
          ? -textContentHeight / 2
          : dominantBaseline === "hanging"
          ? -textContentHeight
          : 0;
  
      el
        // .attr("font-family", fontFamily)
        .attr("font-size", fontSize)
        .attr("dominant-baseline", dominantBaseline)
        .attr("text-anchor", textAnchor)
        .selectAll("tspan")
        .data(lines)
        .join("tspan")
        .text((d) => d)
        .attr("x", anchor.x)
        .attr("y", (d, i) => anchor.y + i * lineHeight * fontSize + dy);
    });
  }
```

```js echo
   function drawLabels({ selection, projection, layer, debug }) {
    let {
      geojson,
      label,
      callout = false,
      fontFamily = "inherit",
      fontSize = 12,
      fontWeight = "500",
      lineHeight,
      fontFill = "black",
      fontStroke = "white",
      fontStrokeWidth = 3,
      stroke = "black",
      strokeWidth = 1,
      strokeOpacity = 1,
      strokeLinecap = "round",
      strokeLinejoin = "round",
      dominantBaseline,
      textAnchor,
      dLat = 0,
      dLon = 0,
      dCLat = 0,
      dCLon = 0,
      calloutStroke = "black",
      calloutStrokeWidth = 1.25,
      callOutStrokeDasharray = "none",
      callOutStrokeOpacity = 1,
      callOutStrokeLinecap = "round",
      callOutStrokeLinejoin = "round",
      calloutPadding = 3
    } = layer;
    if (geojson == null) return;
  
    const labelGenerator =
      typeof label === "function" ? label : () => label || "";
    const F = Array.isArray(geojson.features) ? [...geojson.features] : [geojson];
  
    const dLatFn = typeof dLat === "function" ? dLat : () => dLat;
    const dLonFn = typeof dLon === "function" ? dLon : () => dLon;
  
    const dCLatFn = typeof dCLat === "function" ? dCLat : () => dCLat;
    const dCLonFn = typeof dCLon === "function" ? dCLon : () => dCLon;
  
    const line = d3.line();
  
    let LC = F.map(computeLabelPole);
    let CC = [...LC];
    LC = LC.map(([lon, lat], i) => [
      lon + dLonFn(F[i], i),
      lat + dLatFn(F[i], i)
    ]);
    CC = CC.map(([lon, lat], i) => [
      lon + dCLonFn(F[i], i),
      lat + dCLatFn(F[i], i)
    ]);
  
    selection.attr("class", "labels");
  
    const labels = selection
      .selectAll(".label-group")
      .data(F)
      .join("g")
      .join("text")
      .attr("class", "label-group");
  
    labels
      .append("text")
      .attr("font-family", fontFamily)
      .attr("font-size", fontSize)
      .attr("font-weight", fontWeight)
      .attr("fill", fontFill)
      .attr("stroke", fontStroke)
      .attr("stroke-width", fontStrokeWidth)
      .attr("stroke-linejoin", strokeLinejoin)
      .attr("stroke-linecap", strokeLinecap)
      .attr("dominant-baseline", dominantBaseline)
      .attr("text-anchor", textAnchor)
      .attr("paint-order", "stroke");
  
    // Insert label text and break in lines
    labels.each(function (d, i) {
      const s = d3.select(this).select("text");
      const [x, y] = projection(LC[i]);
  
      s.attr("x", x)
        .attr("y", y)
        .call(multilineText, {
          fontSize,
          lineHeight,
          textAnchor,
          dominantBaseline,
          textFn: (d) => labelGenerator(d, i)
        });
  
      if (debug) {
        selection
          .append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 2)
          .attr("fill", "#f0f");
      }
    });
  
    // Add arrows
    if (callout) {
      labels.each(function (d, i) {
        const label = d3.select(this);
        const labelText = label.select("text");
        const [x, y] = projection(LC[i]);
        const [cx, cy] = projection(CC[i]);
  
        // Draw the arrows on next cycle to get bounding box of the label
        setTimeout(() => {
          const padding = calloutPadding + calloutStrokeWidth / 2;
          const rect = labelText.node().getBBox();
          let x1 = cx;
          let y1 = cy;
          let x2 = rect.x;
          let y2 = rect.y + rect.height + padding;
          let x3 = rect.x + rect.width;
          let y3 = y2;
  
          // Connect on right edge
          if (rect.x + rect.width / 2 < cx) {
            x3 = rect.x;
            x2 = rect.x + rect.width;
          }
  
          if (rect.y > cy) {
            y2 = rect.y - padding;
            y3 = y2;
          }
  
          label
            .append("path")
            .attr(
              "d",
              line([
                [x1, y1],
                [x2, y2],
                [x3, y3]
              ])
            )
            .attr("fill", "none")
            .attr("stroke", calloutStroke)
            .attr("stroke-width", calloutStrokeWidth)
            .attr("stroke-dasharray", callOutStrokeDasharray)
            .attr("stroke-opacity", callOutStrokeOpacity)
            .attr("stroke-linecap", callOutStrokeLinecap)
            .attr("stroke-join", callOutStrokeLinejoin);
  
          if (debug) {
            label
              .append("rect")
              .attr("x", rect.x)
              .attr("y", rect.y)
              .attr("width", rect.width)
              .attr("height", rect.height)
              .attr("fill", "none")
              .attr("stroke", "#f0f");
          }
        });
  
        if (debug) {
          label
            .append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", 2)
            .attr("fill", "none")
            .attr("stroke", "#f0f");
        }
      });
    }
  }
```

```js echo
const drawGraticuleLabels = (() => {
   const defaultPositions = ["top", "left", "bottom", "right"];

    function drawGraticuleTicks({
      selection,
      projection,
      width,
      height,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
      layer,
      debug
    }) {
      const {
        tickPositions = defaultPositions,
        place = "outside", // or, "inside"
        fontFamily = "inherit",
        fontSize = "12px",
        fontWeight = "500",
        fontFill = "black",
        fontStroke = "white",
        fontStrokeWidth = 3,
        stroke = "black",
        strokeWidth = 1,
        strokeOpacity = 1,
        strokeLinecap = "round",
        strokeLinejoin = "round",
        tickSize = 4,
        tickPadding = 4,
        step = [10, 10],
        closenessPrecision = 0.001,
        precision,
        formatLonTick,
        formatLatTick
      } = layer;
  
      const formatLatLon = d3.format(".2~f");
      const formatLongitude =
        typeof formatLonTick === "function"
          ? formatLonTick
          : (x) => `${formatLatLon(Math.abs(x))}°${x < 0 ? "W" : "E"}`;
      const formatLatitude =
        typeof formatLatTick === "function"
          ? formatLatTick
          : (y) => `${formatLatLon(Math.abs(y))}°${y < 0 ? "S" : "N"}`;
  
      const boundsGeo = getBoundsAsFeature({
        projection,
        width,
        height,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        precision
      });
      const pos = graticuleLabelPositions(boundsGeo, { step });
      const P = pos.map((p) => {
        const [x, y] = projection(p);
  
        p.x = x;
        p.y = y;
        return p;
      });
      const g = selection.append("g").attr("class", "graticule-labels");
      let topTicks = [],
        rightTicks = [],
        bottomTicks = [],
        leftTicks = [];
  
      if (tickPositions.includes("top")) {
        const topMost = d3.min(P, (p) => p.y);
        let topTicks = pos.filter(
          (p) => Math.abs(p.y - topMost) <= closenessPrecision
        );
        topTicks = topTicks.filter((t) => t.type === "longitude");
        const topTickG = g
          .append("g")
          .attr("class", "bottom-graticules-ticks")
          .selectAll(".tick")
          .data(topTicks)
          .join("g")
          .attr("class", "tick")
          .attr("transform", (d) => `translate(${d.x},${d.y})`);
        topTickG
          .append("line")
          .attr("class", "tick-line")
          .attr("y2", (place === "outside" ? -1 : 1) * tickSize);
        topTickG
          .append("text")
          .attr("dy", (place === "outside" ? -1 : 1) * (tickSize + tickPadding))
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", place === "outside" ? "auto" : "hanging");
      }
  
      if (tickPositions.includes("bottom")) {
        const bottomMost = d3.max(P, (p) => p.y);
        let bottomTicks = pos.filter(
          (p) => Math.abs(p.y - bottomMost) <= closenessPrecision
        );
        bottomTicks = bottomTicks.filter((t) => t.type === "longitude");
        const bottomTickG = g
          .append("g")
          .attr("class", "bottom-graticules-ticks")
          .selectAll(".tick")
          .data(bottomTicks)
          .join("g")
          .attr("class", "tick")
          .attr("transform", (d) => `translate(${d.x},${d.y})`);
        bottomTickG
          .append("line")
          .attr("class", "tick-line")
          .attr("y2", (place === "outside" ? 1 : -1) * tickSize);
        bottomTickG
          .append("text")
          .attr("dy", (place === "outside" ? 1 : -1) * (tickSize + tickPadding))
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", place === "outside" ? "hanging" : "auto");
      }
      if (tickPositions.includes("right")) {
        const rightMost = d3.max(P, (p) => p.x);
        rightTicks = pos.filter(
          (p) => Math.abs(p.x - rightMost) <= closenessPrecision
        );
        rightTicks = rightTicks.filter((t) => t.type === "latitude");
  
        const rightTickG = g
          .append("g")
          .attr("class", "left-graticules-ticks")
          .selectAll(".tick")
          .data(rightTicks)
          .join("g")
          .attr("class", "tick")
          .attr("transform", (d) => `translate(${d.x},${d.y})`);
        rightTickG
          .append("line")
          .attr("class", "tick-line")
          .attr("x2", (place === "outside" ? 1 : -1) * tickSize);
        rightTickG
          .append("text")
          .attr("dy", (place === "outside" ? -1 : 1) * (tickSize + tickPadding))
          .attr("dominant-baseline", place === "outside" ? "auto" : "hanging")
          .attr("text-anchor", "middle")
          .attr("transform", "rotate(90)");
      }
  
      if (tickPositions.includes("left")) {
        const leftMost = d3.min(P, (p) => p.x);
        leftTicks = pos.filter(
          (p) => Math.abs(p.x - leftMost) <= closenessPrecision
        );
        leftTicks = leftTicks.filter((t) => t.type === "latitude");
        const leftTickG = g
          .append("g")
          .attr("class", "left-graticules-ticks")
          .selectAll(".tick")
          .data(leftTicks)
          .join("g")
          .attr("class", "tick")
          .attr("transform", (d) => `translate(${d.x},${d.y})`);
        leftTickG
          .append("line")
          .attr("class", "tick-line")
          .attr("x2", (place === "outside" ? -1 : 1) * tickSize);
        leftTickG
          .append("text")
          .attr("dy", (place === "outside" ? -1 : 1) * (tickSize + tickPadding))
          .attr("dominant-baseline", place === "outside" ? "auto" : "hanging")
          .attr("text-anchor", "middle")
          .attr("transform", "rotate(-90)");
      }
  
      // Add tick styles
      g.selectAll(".tick-line")
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-opacity", strokeOpacity)
        .attr("stroke-linecap", strokeLinecap)
        .attr("stroke-linejoin", strokeLinejoin);
  
      // Add label text
      g.selectAll("text")
        .attr("font-family", fontFamily)
        .attr("font-size", fontSize)
        .attr("font-weight", fontWeight)
        .attr("fill", fontFill)
        .attr("stroke", fontStroke)
        .attr("stroke-width", fontStrokeWidth)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("paint-order", "stroke")
        .text((d) =>
          d.type === "longitude" ? formatLongitude(d[0]) : formatLatitude(d[1])
        );
  
      if (debug) {
        g.append("path")
          .attr("class", "debug-dgt-bounds")
          .attr("d", d3.geoPath(projection)(boundsGeo))
          .attr("fill", "#0ff")
          .attr("fill-opacity", 0.5)
          .attr("stroke", "none");
  
        g.selectAll(".debug-dgt-corner")
          .data([
            [marginLeft, marginTop],
            [width - marginRight, marginTop],
            [width - marginRight, height - marginBottom],
            [marginLeft, height - marginBottom]
          ])
          .join("circle")
          .attr("class", "debug-dgt-corner")
          .attr("fill", "#0ff")
          .attr("cx", (d) => d[0])
          .attr("cy", (d) => d[1])
          .attr("r", 5);
  
        g.append("g")
          .attr("class", "graticules-intersection-points")
          .selectAll(".graticules-intersection-point")
          .data(pos)
          .join("circle")
          .attr("class", "graticules-intersection-point")
          .attr("r", 4)
          .attr("fill", "none")
          .attr("stroke-width", 2)
          .each(function (d) {
            const [cx, cy] = projection(d);
            d3.select(this)
              .attr("cx", cx)
              .attr("cy", cy)
              .attr("stroke", d.type === "longitude" ? "red" : "orange");
          });
      }
    }

    drawGraticuleTicks.margins = {
      x: 20,
      y: 20
    };
    drawGraticuleTicks.positions = defaultPositions;
  
    return drawGraticuleTicks;
  })();
```

```js echo
 function drawGraticules({
    svg,
    selection,
    projection,
    width,
    height,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    layer
  }) {
    const {
      geojson,
      stroke = "#ccc",
      strokeWidth = 1,
      strokeOpacity = 1,
      strokeLinecap = "round",
      strokeLinejoin = "round",
      strokeDasharray = 2,
      style,
      step = [10, 10],
      clipId = DOM.uid("clip"),
      precision
    } = layer;
  
    const graticuleGenerator = d3.geoGraticule().step(step);
    if (precision) {
      graticuleGenerator.precision(precision);
    }
    const graticules = graticuleGenerator();
    const path = d3.geoPath(projection);
  
    const defs = svg.select("defs").node()
      ? svg.select("defs")
      : svg.insert("defs", ":first-child");
  
    defs
      .append("clipPath")
      .attr("id", clipId.id)
      .append("rect")
      .attr("x", marginLeft)
      .attr("y", marginTop)
      .attr("width", width - (marginLeft + marginRight))
      .attr("height", height - (marginTop + marginBottom));
  
    selection
      .append("path")
      .attr("class", "graticules")
      .attr("fill", "none")
      .style("stroke", stroke)
      .style("stroke-width", strokeWidth)
      .style("stroke-opacity", strokeOpacity)
      .style("stroke-linecap", strokeLinecap)
      .style("stroke-linejoin", strokeLinejoin)
      .style("stroke-dasharray", strokeDasharray)
      .attr("style", style)
      .attr("clip-path", clipId.id)
      .attr("d", path(graticules));
  }
```

```js echo
   function drawOutline({
    selection,
    projection,
    width,
    height,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    layer
  }) {
    const {
      stroke = "black",
      strokeWidth = 1,
      strokeOpacity = 1,
      strokeLinecap = "round",
      strokeLinejoin = "round",
      strokeDasharray = "none",
      style,
      clipId
    } = layer;
  
    selection
      .append("rect")
      .attr("x", marginLeft)
      .attr("y", marginTop)
      .attr("width", width - marginLeft - marginRight)
      .attr("height", height - marginTop - marginBottom)
      .attr("fill", "none")
      .attr("stroke", stroke)
      .attr("stroke-width", strokeWidth)
      .attr("stroke-opacity", strokeOpacity)
      .attr("stroke-linecap", strokeLinecap)
      .attr("stroke-linejoin", strokeLinejoin)
      .attr("stroke-dasharray", strokeDasharray)
      .attr("style", style);
  }
```

```js echo
   function drawSimpleLayer({ selection, projection, layer }) {
    const {
      geojson,
      fill = "none",
      fillOpacity = "1",
      stroke = "black",
      strokeWidth = 0.75,
      strokeOpacity = 1,
      strokeLinecap = "round",
      strokeLinejoin = "round",
      strokeDasharray = "none",
      style
    } = layer;
  
    if (geojson == null) return;
  
    const features = Array.isArray(geojson.features)
      ? [...geojson.features]
      : [geojson];
  
    selection
      .selectAll("path")
      .data(features)
      .join("path")
      .attr("d", d3.geoPath(projection))
      .attr("fill", fill)
      .attr("fill-opacity", fillOpacity)
      .attr("stroke", stroke)
      .attr("stroke-width", strokeWidth)
      .attr("stroke-opacity", strokeOpacity)
      .attr("stroke-linecap", strokeLinecap)
      .attr("stroke-linejoin", strokeLinejoin)
      .attr("stroke-dasharray", strokeDasharray)
      .attr("style", style);
  }
```

```js echo
   function generateSwatch({
    symbol,
    fill,
    fillOpacity = 1,
    stroke,
    strokeWidth,
    strokeDasharray = "none",
    strokeOpacity = 1,
    strokeLinecap = "round",
    strokeLinejoin = "round",
    swatchWidth = 32,
    swatchHeight = 16
  } = {}) {
    const node = DOM.svg(swatchWidth, swatchHeight);
    const svg = d3.select(node).attr("style", "display: block");
  
    strokeWidth = strokeWidth ?? (stroke != null ? 1 : 0);
    if (symbol) {
      const symbolSize = 16;
      const maxSymbolSize = swatchHeight - 2;
      const symbolObj = symbols[symbol] ?? symbols["circle"];
      const mark = d3.symbol(symbolObj).size(symbolSize);
      const path = svg
        .append("path")
        .attr("d", mark())
        .attr("fill", fill)
        .attr("transform", `translate(${[swatchWidth / 2, swatchHeight / 2]})`)
        .attr("fill-opacity", fillOpacity)
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-opacity", strokeOpacity)
        .attr("stroke-linecap", strokeLinecap)
        .attr("stroke-linejoin", strokeLinejoin)
        .attr("stroke-dasharray", strokeDasharray);
  
      setTimeout(() => {
        // See https://observablehq.com/@d3/fitted-symbols
        const bbox = path.node().getBBox();
        const error = Math.min(
          maxSymbolSize / bbox.width,
          maxSymbolSize / bbox.height
        );
        mark.size(error * error * symbolSize);
        path.attr("d", mark());
      });
    } else if (fill) {
      svg
        .append("rect")
        .attr("x", strokeWidth / 2)
        .attr("y", strokeWidth / 2)
        .attr("width", swatchWidth - strokeWidth)
        .attr("height", swatchHeight - strokeWidth)
        .attr("fill", fill)
        .attr("fill-opacity", fillOpacity)
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-opacity", strokeOpacity)
        .attr("stroke-linecap", strokeLinecap)
        .attr("stroke-linejoin", strokeLinejoin)
        .attr("stroke-dasharray", strokeDasharray);
    } else {
      svg
        .append("line")
        .attr("x1", strokeWidth / 2)
        .attr("y1", swatchHeight / 2)
        .attr("x2", swatchWidth - strokeWidth / 2)
        .attr("y2", swatchHeight / 2)
        .attr("fill", "none")
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-opacity", strokeOpacity)
        .attr("stroke-linecap", strokeLinecap)
        .attr("stroke-linejoin", strokeLinejoin)
        .attr("stroke-dasharray", strokeDasharray);
    }
    return node;
  }
```

```js echo
   function generateLegendElements(legend, legendTitle = "Legend") {
  
    legend = legend.filter(Boolean).filter((d) => d.active !== false);
    
    const items = legend.map(
      (l) =>
        html`<li style=${{
          display: "flex",
          alignItems: "center",
          gap: ".5rem",
          flex: "1 1 200px"
        }}><div style=${{
          flex: 0,
          position: "relative",
          top: "-0.08141665em" // 1px / 12px
        }}>${generateSwatch(l)}</div> ${l.label}`
    );
  
    return html`<div>
    <div class="flow flow-space-s">
      <h3>${legendTitle}</h3>
      <ul style=${{
        display: "flex",
        flexWrap: "wrap",
        gap: ".5rem",
        listStyle: "none",
        paddingLeft: 0,
        maxWidth: "100%",
        fontSize: ".85em"
      }}>
      ${items}
      </ul>
    </div>
  </div>`;
  }
```

```js echo
   function generateAsideElements({
    header,
    footer,
    legendTitle,
    legend,
    content,
    headerTag = "h2",
    footerColor = "#595959"
  } = {}) {
    const headerEl = header
      ? html`<header style=${{ fontSize: "1em" }}>${html({
          raw: [`<${headerTag}>${header}`]
        })}`
      : undefined;
    const footerEl = footer
      ? html`<div style=${{
          fontSize: ".85em",
          color: footerColor,
          paddingTop: "1rem",
          marginTop: "auto"
        }}>${footer}</div>`
      : undefined;
    const legendEl = legend
      ? generateLegendElements(legend, legendTitle)
      : undefined;
  
    const contentEl = content
      ? html`<div>
    <div class="flow-child flow-space-s" style=${{
      maxWidth: "640px"
    }}>${content}</div>
  </div>`
      : undefined;
  
    return [headerEl, contentEl, legendEl, footerEl];
  }

   function radiansToDegrees(radians) {
    const degrees = radians % (2 * Math.PI);
    return (degrees * 180) / Math.PI;
  }
```

```js echo
   function computeAngleToNorthAtCentroid(projection, width, height) {
    const [lon, lat] = projection.invert([width / 2, height / 2]);
  
    const c = projection([lon, lat]);
    const cNext = projection([lon + 1, lat]);
  
    const rad = Math.atan2(cNext[0] - c[0], cNext[1] - c[1]);
  
    return radiansToDegrees(Math.PI / 2 - rad);
  }

```

```js echo
   function drawNorthArrow({ projection, width, height } = {}) {
    const angle = computeAngleToNorthAtCentroid(projection, width, height);
    return svg`<svg
      viewBox=${[-31, -31, 62, 62]} width="62" height="62" style=${{
      display: "block",
      maxWidth: "100%",
      height: "auto"
    }}>
  <g 
    transform="rotate(${angle} 0 0)
               translate(-19 -31)
    ">${northArrow()}</g><svg>`;
  }
```

```js echo
   function drawMap({
    // Map
    projection = d3.geoEquirectangular(),
    extent,
    width = 800,
    layers = [],
    padding = 10,
    marginLeft = 1,
    marginRight = 1,
    marginTop = 1,
    marginBottom = 1,
    height,
    background = "none",
    scaleBar = true,
    units = "km", // Supporst "km" | "miles"
    northingArrow = true,
    patterns,
    debug
  } = {}) {
    // Change to `max-width` if the map need not be expanded more than the width
    const svgBaseStyles =
      "display: block; width: 100%; height: auto; height: intrinsic;";
  
    layers = layers.filter(Boolean).filter((d) => d.active !== false);
  
    // Adjust margins based graticule-labels layer positions
    const graticuleTicksLayer = layers.find(
      (l) => l.type === "graticule-labels" && l.place != "inside"
    );
    if (graticuleTicksLayer) {
      const graticulePositions =
        graticuleTicksLayer.tickPositions || drawGraticuleLabels.positions;
  
      if (graticulePositions.includes("top")) {
        marginTop = Math.max(marginTop, drawGraticuleLabels.margins.y);
      }
      if (graticulePositions.includes("bottom")) {
        marginBottom = Math.max(marginBottom, drawGraticuleLabels.margins.y);
      }
      if (graticulePositions.includes("left")) {
        marginLeft = Math.max(marginLeft, drawGraticuleLabels.margins.x);
      }
      if (graticulePositions.includes("right")) {
        marginRight = Math.max(marginRight, drawGraticuleLabels.margins.x);
      }
    }
  
    const extentGeo =
      extent != null
        ? getExtentAsFeature(extent)
        : featureCollectionFromLayers(layers);
  
    height =
      height ??
      getHeight({
        projection,
        padding,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        width,
        extentGeo
      });
  
    projection.fitExtent(
      [
        [padding + marginLeft, padding + marginTop],
        [
          width - 2 * padding - marginLeft - marginRight,
          height - 2 * padding - marginTop - marginBottom
        ]
      ],
      extentGeo
    );
    projection.clipExtent([
      [marginLeft, marginTop],
      [width - marginRight, height - marginBottom]
    ]);
  
    const hasMarkings = scaleBar || northingArrow;
    const northArrowEl = northingArrow
      ? drawNorthArrow({ projection, width, height })
      : undefined;
    const scaleBarEl = scaleBar
      ? drawScaleBar({
          projection,
          width,
          height,
          padding,
          marginTop,
          marginRight,
          marginBottom,
          marginLeft,
          units,
          svgBaseStyles,
          debug
        })
      : undefined;
  
    const node = DOM.svg(width, height);
    const svg = d3.select(node);
    svg.attr("style", svgBaseStyles);
  
    // Add patterns
    if (patterns?.length) {
      const defs = svg.select("defs").node()
        ? svg.select("defs")
        : svg.insert("defs", ":first-child");
      patterns.forEach((p) => defs.node().appendChild(p));
    }
  
    const canvas = svg.append("g");
    //.attr("transform", `translate(${marginLeft},${marginTop})`);
  
    if (background != null || background !== "none") {
      canvas
        .append("rect")
        .attr("x", marginLeft)
        .attr("y", marginTop)
        .attr("width", width - marginRight - marginLeft)
        .attr("height", height - marginTop - marginBottom)
        .attr("fill", background);
    }
  
    layers.forEach((l) => {
      const selection = canvas.append("g");
  
      switch (l.type) {
        case "custom":
          if (typeof l.render === "function") {
            const { type, render, ...restOfLayer } = l;
            l.render(
              selection,
              {
                projection,
                width,
                height,
                svg
              },
              restOfLayer
            );
          }
          break;
        case "symbols":
          drawSymbols({
            selection,
            projection,
            width,
            height,
            layer: l,
            debug
          });
          break;
        case "labels":
          drawLabels({
            selection,
            projection,
            width,
            height,
            layer: l,
            debug
          });
          break;
        case "graticule":
          drawGraticules({
            svg, // Needs add defs and cilp
            selection,
            projection,
            width,
            height,
            marginTop,
            marginRight,
            marginBottom,
            marginLeft,
            layer: l,
            debug
          });
          break;
        case "graticule-labels":
          drawGraticuleLabels({
            selection: svg, 
            projection,
            width,
            height,
            marginTop,
            marginRight,
            marginBottom,
            marginLeft,
            layer: l,
            debug
          });
          break;
        case "outline":
          drawOutline({
            selection,
            projection,
            width,
            height,
            marginTop,
            marginRight,
            marginBottom,
            marginLeft,
            layer: l,
            debug
          });
          break;
        default:
          if (l.geojson) {
            drawSimpleLayer({
              selection,
              projection,
              width,
              height,
              layer: l,
              debug
            });
          }
          break;
      }
    });
  
    if (debug) {
      canvas
        .append("rect")
        .attr("stroke", "#f0f")
        .attr("fill", "none")
        .attr("x", padding + marginLeft)
        .attr("y", padding + marginTop)
        .attr("width", width - 2 * padding - marginLeft - marginRight)
        .attr("height", height - 2 * padding - marginTop - marginBottom);
    }
  
    return hasMarkings
      ? html`<div>
    <div>${node}</div>
    <div style=${{
      display: "grid",
      gridTemplateColumns: "1fr 3rem",
      alignItems: "center",
      paddingTop: "0.5rem"
    }}>
      <div style=${{ gridRow: 1, gridColumn: "1 / -1" }}> 
        ${scaleBarEl}
      </div>
      <div style=${{
        gridRow: 1,
        gridColumn: 2,
        justifyContent: "end"
      }}>${northArrowEl}</div>
    </div>
  </div>`
      : node;
  }
```

```js echo
   function draw(
  mapOptions,
  asideOptions,

  // Folio Options
  {
    borderWidth = 1,
    border = "whitesmoke",
    padding = "1rem",
    fontFamily = defaultFontFamily,
    debug
  } = {}
) {
  const mapEl = drawMap({ ...mapOptions, debug });
  const asideEls = generateAsideElements({ ...asideOptions, debug }).filter(
    Boolean
  );
  const hasSidebar = Boolean(asideEls.length);

  const folioBorderWidth =
    typeof borderWidth === "number" ? `${borderWidth}px` : borderWidth;

  initializeStyles();

  return html`<div class=${ns}  style=${{
    fontFamily,
    display: "flex",
    flexWrap: "wrap",
    flexDirection: "row-reverse",
    justifyContent: "start",

    borderWidth: folioBorderWidth,
    borderColor: border,
    borderStyle: "solid"
  }}>
  ${
    hasSidebar
      ? html`<div
    class="flow flow-space-l ${ns}__aside"
    style=${{
      flex: "1 1 200px",
      display: "flex",
      flexDirection: "column",
      fontSize: ".85rem",
      padding,
      borderWidth: 0,
      borderColor: folioBorderWidth ? border : undefined,
      borderStyle: "solid",
      borderLeftWidth: folioBorderWidth,
      marginLeft: folioBorderWidth ? `-${folioBorderWidth}` : undefined
    }}>
    ${asideEls}
  </div>`
      : undefined
  }
  
  <div style=${{
    flex: "4 1 600px",
    padding,
    borderWidth: 0,
    borderColor: folioBorderWidth ? border : undefined,
    borderStyle: "solid",
    borderTopWidth: folioBorderWidth,
    marginTop: folioBorderWidth ? `-${folioBorderWidth}` : undefined
  }}>
    ${mapEl}
  </div>
</div>`;
}
```