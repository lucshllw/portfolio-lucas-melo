import {
  BufferGeometry,
  CatmullRomCurve3,
  DataTexture,
  ExtrudeGeometry,
  Float32BufferAttribute,
  RepeatWrapping,
  Shape,
  TubeGeometry,
  Vector3,
} from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Weld lighting across the UV seam without stretching the texture coordinates. */
function finishOrganicSurface(geometry: BufferGeometry, rings: number, sides: number) {
  geometry.computeVertexNormals();
  const normals = geometry.getAttribute("normal");
  const average = new Vector3();
  for (let ring = 0; ring <= rings; ring++) {
    const start = ring * (sides + 1), end = start + sides;
    average.set(0, 0, 0);
    if (ring === 0 || ring === rings) {
      for (let vertex = start; vertex <= end; vertex++) {
        average.add(new Vector3().fromBufferAttribute(normals, vertex));
      }
      average.normalize();
      for (let vertex = start; vertex <= end; vertex++) {
        normals.setXYZ(vertex, average.x, average.y, average.z);
      }
    } else {
      average.fromBufferAttribute(normals, start)
        .add(new Vector3().fromBufferAttribute(normals, end)).normalize();
      normals.setXYZ(start, average.x, average.y, average.z);
      normals.setXYZ(end, average.x, average.y, average.z);
    }
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/** A folded, asymmetric body: broad shoulders, narrow lower body and a swept tip. */
export function creatureBody() {
  const rings = 52,
    sides = 64;
  const positions: number[] = [],
    indices: number[] = [],
    uv: number[] = [];
  for (let i = 0; i <= rings; i++) {
    const u = i / rings;
    const theta = u * Math.PI;
    const radius = i === 0 || i === rings ? 0 : Math.pow(Math.sin(theta), 0.65);
    const height = 0.35 + u * 1.46;
    const shoulder = Math.exp(-Math.pow((u - 0.63) * 3.4, 2));
    const tip = Math.pow(Math.max(0, (u - 0.72) / 0.28), 1.6);
    for (let j = 0; j <= sides; j++) {
      const v = (j / sides) * Math.PI * 2;
      const cx = Math.cos(v), sz = Math.sin(v);
      const x = Math.sign(cx) * Math.pow(Math.abs(cx), 0.84) * radius * (0.39 + shoulder * 0.15) - tip * 0.42;
      const y = height + cx * radius * 0.035 + tip * 0.1;
      const front = Math.max(0, Math.sin(v));
      const diagonal = y - (1.46 - x * 0.42);
      const fold = Math.exp(-Math.pow(diagonal / 0.045, 2));
      const z =
        Math.sign(sz) * Math.pow(Math.abs(sz), 0.69) * Math.pow(Math.sin(theta), 0.72) * (0.29 + shoulder * 0.025) -
        Math.pow(front, 3) * radius * fold * 0.044 + tip * 0.035;
      positions.push(x, y, z);
      uv.push(j / sides, i / rings);
      if (i < rings && j < sides) {
        const a = i * (sides + 1) + j,
          b = a + sides + 1;
        if (i > 0) indices.push(a, b, a + 1);
        if (i < rings - 1) indices.push(b, b + 1, a + 1);
      }
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geo.setIndex(indices);
  return finishOrganicSurface(geo, rings, sides);
}

/** Short sculpted arm with a round section; never a flat flipper. */
export function creatureLimb() {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const rings = 20, sides = 24;
  for (let i = 0; i <= rings; i++) {
    const u = i / rings;
    const r = i === 0 || i === rings ? 0 : Math.pow(Math.sin(Math.PI * u), 0.48) * (0.11 - u * 0.012);
    for (let j = 0; j <= sides; j++) {
      const a = j / sides * Math.PI * 2;
      positions.push(Math.cos(a) * r + Math.sin(u * Math.PI) * 0.045,
        0.065 - u * 0.43, Math.sin(a) * r * 1.08 + u * u * 0.065);
      uv.push(j / sides, u);
      if (i < rings && j < sides) {
        const p = i * (sides + 1) + j, q = p + sides + 1;
        if (i > 0) indices.push(p, p + 1, q);
        if (i < rings - 1) indices.push(q, p + 1, q + 1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  return finishOrganicSurface(geometry, rings, sides);
}

/** A solid machined ribbon, with rounded edges and a bent depth profile. */
export function architecturalRibbon(points: [number, number][], depth: number, side: number) {
  const shape = new Shape();
  points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: 0.048,
    bevelSize: 0.048, bevelSegments: 4, steps: 1, curveSegments: 1,
  });
  geometry.translate(0, 0, -depth / 2);
  const positions = geometry.getAttribute("position");
  // One continuous fold through the entire solid, rather than assembled face decals.
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i);
    const fold = side === 0
      ? Math.max(0, x + 0.92) * 0.30 + Math.max(0, 0.65 - y) * 0.10
      : Math.max(0, 1.06 - x) * -0.23 + Math.max(0, y - 2.05) * 0.20;
    positions.setZ(i, positions.getZ(i) + fold);
  }
  // ExtrudeGeometry is unindexed; weld coincident vertices before calculating
  // normals so the rounded chamfer catches a continuous studio highlight.
  geometry.deleteAttribute("normal");
  const finished = mergeVertices(geometry, 0.00001);
  geometry.dispose();
  finished.computeVertexNormals();
  finished.computeBoundingBox();
  finished.computeBoundingSphere();
  return finished;
}

export function roundedExtrusion(shape: Shape, depth = 0.14, bevel = 0.055) {
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments: 24,
    steps: 1,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

export function sculptedCurve(
  points: [number, number, number][],
  radius: number,
) {
  return new TubeGeometry(
    new CatmullRomCurve3(points.map((p) => new Vector3(...p))),
    28,
    radius,
    8,
    false,
  );
}

/** Tiny authored roughness variation. Shared, neutral, and never a color decal. */
export function surfaceGrain(seed = 706) {
  const size = 128,
    pixels = new Uint8Array(size * size * 4);
  let random = seed;
  const next = () => {
    random = (random * 1664525 + 1013904223) >>> 0;
    return random / 4294967296;
  };
  for (let y = 0; y < size; y++) {
    const stripe = next() * 8;
    for (let x = 0; x < size; x++) {
      const p = (y * size + x) * 4;
      const v = Math.round(222 + stripe + next() * 16);
      pixels[p] = pixels[p + 1] = pixels[p + 2] = v;
      pixels[p + 3] = 255;
    }
  }
  // Roughness reads green. RGBA preserves that channel on every renderer.
  const texture = new DataTexture(pixels, size, size);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 5);
  texture.needsUpdate = true;
  return texture;
}

type Point = [number, number, number];

/** Closed folded metal volume with separate skin, inner planes and chamfers. */
export function foldedVolume(
  perimeter: Point[],
  ridge: Point,
  thickness: number,
  polishedFaces: number[],
) {
  const geometry = new BufferGeometry();
  const positions: number[] = [],
    uvs: number[] = [];
  const faces: Vector3[][] = [[], [], []];
  const center = perimeter
    .reduce((sum, p) => sum.add(new Vector3(...p)), new Vector3())
    .divideScalar(perimeter.length);
  const outside = perimeter.map((p) => new Vector3(...p));
  const inset = outside.map((p) => {
    const direction = center.clone().sub(p);
    direction.z = 0;
    return p.clone().add(direction.normalize().multiplyScalar(0.025));
  });
  const front = inset.map((p) => p.clone().add(new Vector3(0, 0, 0.015)));
  const back = inset.map((p) =>
    p.clone().add(new Vector3(0, 0, -thickness - 0.015)),
  );
  const backEdge = outside.map((p) =>
    p.clone().add(new Vector3(0, 0, -thickness)),
  );
  const peak = new Vector3(...ridge);
  const rearPeak = peak.clone().add(new Vector3(0, 0, -thickness));
  const triangle = (a: Vector3, b: Vector3, c: Vector3, material: number) => {
    faces[material].push(a, b, c);
  };
  const quad = (
    a: Vector3,
    b: Vector3,
    c: Vector3,
    d: Vector3,
    material: number,
  ) => {
    triangle(a, b, c, material);
    triangle(a, c, d, material);
  };
  for (let i = 0; i < outside.length; i++) {
    const j = (i + 1) % outside.length;
    // All contours run clockwise: front normals point toward the viewer.
    triangle(front[j], front[i], peak, polishedFaces.includes(i) ? 1 : 0);
    triangle(back[i], back[j], rearPeak, 1);
    quad(outside[j], outside[i], front[i], front[j], 2);
    quad(outside[i], outside[j], backEdge[j], backEdge[i], 0);
    quad(backEdge[i], backEdge[j], back[j], back[i], 2);
  }
  // Three material groups per volume, rather than a draw call for each facet.
  faces.forEach((vertices, material) => {
    const start = positions.length / 3;
    vertices.forEach((p) => {
      positions.push(p.x, p.y, p.z);
      uvs.push(p.x * 0.4, p.y * 0.3);
    });
    geometry.addGroup(start, vertices.length, material);
  });
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
