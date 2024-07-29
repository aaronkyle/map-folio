import proj4 from "npm:proj4@2.8";
import d3 from "npm:d3@7.9";

export function proj4d3(proj4string) {
    const degrees = 180 / Math.PI;
    const radians = 1 / degrees;
    const raw = proj4(proj4string);
    
    const p = function (lambda, phi) {
      return raw.forward([lambda * degrees, phi * degrees]);
    };
  
    p.invert = function (x, y) {
      return raw.inverse([x, y]).map(d => d * radians);
    };
  
    const projection = d3.geoProjection(p).scale(1).translate([0, 0]);
    projection.raw = raw;
    
    return projection;
  }