export const brandMainColors = {
    "900": "#007DB7", //rgb(0,125,183)
    "800": "#0088C7", //rgb(0,136,199)
    "700": "#0099D8", //rgb(0,153,216)
    "600": "#00A1CB", //rgb(0,161,203)
    "500": "#009FD6", //rgb(0,159,214)
    "400": "#41BEE8", //rgb(65,190,232)
    "300": "#68C5EA", //rgb(104,197,234)
    "200": "#6DBCE3", //rgb(109,188,227)
    "100": "#6DCFF6" //rgb(109,207,246)
  };
  
  export const brandAccentColors = {
    "900": "#00A5D2", // rgb(0,165,210)
    "800": "#00B6C9", // rgb(0,182,201)
    "700": "#63CCEC", // rgb(99,204,236)
    "600": "#8DC63F", // rgb(141,198,63)
    "500": "#C8DA2B", // rgb(200,218,43)
    "400": "#F2E600", // rgb(242,230,0)
    "300": "#E9532B", // rgb(233,83,43)
    "200": "#F57F29", // rgb(245,127,41)
    "100": "#FDB515" // rgb(253,181,21)
  };
  
  export const styleGuideMain = {
    blue: {
      "400": "#a1d3f2",
      "500": "#73beeb",
      "600": "#47a5da",
      "700": "#298abd",
      "800": "#156e9a",
      "900": "#075376"
    },
    green: {
      "400": "#b0da83",
      "500": "#96c45f",
      "600": "#7daa42",
      "700": "#648e2c",
      "800": "#4d7117",
      "900": "#375601"
    },
    red: {
      "400": "#f1c2b5",
      "500": "#eda28e",
      "600": "#e67d62",
      "700": "#d25a3b",
      "800": "#b23f20",
      "900": "#8d290c"
    },
    grey: {
      "100": "#fbfbfc",
      "200": "#eff1f4",
      "300": "#dde1e7",
      "400": "#c5cdd7",
      "500": "#aab5c4",
      "600": "#8e9bad",
      "700": "#728093",
      "800": "#576476",
      "900": "#3e4959",
      "1000": "#28303c",
      // "1100": "#131921",
      // "1200": "#010203"
    }
  };
  
  export const styleGuideAccent = {
    blue: brandMainColors["700"],
    red: brandAccentColors["300"],
    green: brandAccentColors["600"],
    grey: "#64748b" // TW Slate 500
  };
  
  export const extras = {
    blue: {
      "100": "#f4fafd",
      "200": "#e3f1fa",
      "300": "#c7e4f7"
    },
    green: {
      "100": "#f4faee",
      "200": "#e5f3d7",
      "300": "#cce9ae"
    },
    red: {
      "100": "#fefbfa",
      "200": "#faefec",
      "300": "#f6dcd5"
    },
    orange: {
      "100": "#fefbf7",
      "200": "#fbf0e0",
      "300": "#f7dfb9",
      "400": "#f1c885",
      "500": "#e2ae54",
      "600": "#c89435",
      "700": "#a97b21",
      "800": "#896213",
      "900": "#6a4a07"
    },
    purple: {
      "100": "#fcfbfd",
      "200": "#f4f0f9",
      "300": "#e7dff3",
      "400": "#d7c8ec",
      "500": "#c4ade3",
      "600": "#af8fd9",
      "700": "#9970cb",
      "800": "#8152b4",
      "900": "#663a95"
    },
    teal: {
      "100": "#f6fbfa",
      "200": "#e2f5f1",
      "300": "#beebe3",
      "400": "#92ddd0",
      "500": "#6ac9ba",
      "600": "#49afa0",
      "700": "#2f9385",
      "800": "#1a766a",
      "900": "#075a50"
    }
  };
  
  export const main = () => {
    const colorSets = [styleGuideMain, extras];
    const colorKeys = new Set([...colorSets.flatMap(Object.keys)]);
    const entries = Array.from(colorKeys).map((k) => {
      return [k, Object.assign({}, ...colorSets.map(o => o[k]))];
    });
    return Object.fromEntries(entries);
  };
  
  export const accent = {
    ...styleGuideAccent,
    orange: "#f59e0b",
    purple: "#a35cec",
    teal: "#00c1ad"
  };
  