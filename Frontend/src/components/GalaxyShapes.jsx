import * as THREE from 'three';

export const GALAXY_THEMES = {
  'cyber-neon': {
    name: 'Cyber Neon',
    coreColor: new THREE.Color(0xffffff),
    innerColor: new THREE.Color(0x38bdf8), // Cyan
    midColor: new THREE.Color(0x60a5fa),   // Sky Blue
    outerColor: new THREE.Color(0xc084fc), // Violet
    haloColor: new THREE.Color(0x3b82f6)
  },
  'cosmic-violet': {
    name: 'Cosmic Violet',
    coreColor: new THREE.Color(0xffe4e6),
    innerColor: new THREE.Color(0xf472b6), // Pink
    midColor: new THREE.Color(0xc084fc),   // Purple
    outerColor: new THREE.Color(0x818cf8), // Indigo
    haloColor: new THREE.Color(0xd946ef)
  },
  'solar-gold': {
    name: 'Solar Flare',
    coreColor: new THREE.Color(0xffffff),
    innerColor: new THREE.Color(0xfef08a), // Pale Yellow
    midColor: new THREE.Color(0xfbbf24),   // Amber Gold
    outerColor: new THREE.Color(0xf97316), // Orange
    haloColor: new THREE.Color(0xef4444)
  },
  'deep-emerald': {
    name: 'Emerald Nebula',
    coreColor: new THREE.Color(0xffffff),
    innerColor: new THREE.Color(0x6ee7b7), // Mint
    midColor: new THREE.Color(0x34d399),   // Emerald
    outerColor: new THREE.Color(0x06b6d4), // Cyan
    haloColor: new THREE.Color(0x059669)
  }
};

/**
 * 1. Open Palm → Logarithmic Spiral Galaxy
 */
export function generateSpiralGalaxy(count, galaxyRadius = 55.0) {
  const positions = new Float32Array(count * 3);
  const arms = 4;
  const spin = 1.35;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const isBulge = Math.random() < 0.22;
    const isHalo = Math.random() < 0.08;

    let x, y, z;

    if (isBulge) {
      const r = Math.pow(Math.random(), 2.2) * (galaxyRadius * 0.22);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      x = r * Math.sin(phi) * Math.cos(theta);
      y = r * Math.sin(phi) * Math.sin(theta) * 0.45;
      z = r * Math.cos(phi);
    } else if (isHalo) {
      const r = 20.0 + Math.random() * (galaxyRadius * 1.2);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      x = r * Math.sin(phi) * Math.cos(theta);
      y = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      z = r * Math.cos(phi);
    } else {
      const armIndex = i % arms;
      const armAngle = (armIndex / arms) * Math.PI * 2;
      const r = Math.pow(Math.random(), 1.7) * galaxyRadius;
      const spinAngle = r * (spin / galaxyRadius) * 4.0;
      const totalAngle = armAngle + spinAngle;

      const spreadFactor = 0.18 * r + 0.6;
      const spreadX = (Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1)) * spreadFactor;
      const spreadY = (Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1)) * (spreadFactor * 0.45);
      const spreadZ = (Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1)) * spreadFactor;

      x = Math.cos(totalAngle) * r + spreadX;
      y = spreadY;
      z = Math.sin(totalAngle) * r + spreadZ;
    }

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;
  }

  return positions;
}

/**
 * 2. Closed Fist → Glowing 3D Sphere / Singularity
 */
export function generateSphere(count, sphereRadius = 16.0) {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const layerRand = Math.random();
    let r;

    if (layerRand < 0.25) {
      r = Math.pow(Math.random(), 1.5) * (sphereRadius * 0.3);
    } else if (layerRand < 0.85) {
      r = sphereRadius * (0.65 + Math.random() * 0.35);
    } else {
      r = sphereRadius * (1.0 + Math.pow(Math.random(), 3) * 0.7);
    }

    const phi = Math.acos(1 - 2 * ((i + 0.5) / count));
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const theta = goldenAngle * i;

    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);
  }

  return positions;
}

/**
 * 3. One Finger Pointing → Concentrated Particle Beam / Plasma Ray
 * Collimated beam aligned along the pointing direction with energetic spiral sheath
 */
export function generateParticleBeam(count, beamLength = 110.0, beamRadius = 3.2) {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const t = (i / count);
    // Length from -beamLength/2 to +beamLength/2
    const z = (t - 0.5) * beamLength;

    // Density concentrated in hyper-tight core with outer spiral sheath
    const isCore = Math.random() < 0.55;
    let r, theta;

    if (isCore) {
      r = Math.pow(Math.random(), 2.0) * (beamRadius * 0.45);
      theta = Math.random() * Math.PI * 2;
    } else {
      // Swirling outer helical plasma envelope
      r = beamRadius * (0.5 + Math.random() * 0.75);
      theta = t * Math.PI * 24.0 + (i % 3) * ((Math.PI * 2) / 3);
    }

    positions[i3] = r * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(theta);
    positions[i3 + 2] = z;
  }

  return positions;
}

/**
 * 4. Two Fingers Raised → Two Rotating Orthogonal Particle Rings
 * Nested concentric / perpendicular stellar gyroscopic rings
 */
export function generateTwoRings(count, ringRadius1 = 30.0, ringRadius2 = 42.0) {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const isRing1 = i % 2 === 0;
    const theta = Math.random() * Math.PI * 2;
    const thickness = 2.2 * (Math.random() - 0.5);

    if (isRing1) {
      // Ring 1 in the XY plane (with subtle tilt)
      const r = ringRadius1 + (Math.random() - 0.5) * 2.8;
      positions[i3] = r * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(theta);
      positions[i3 + 2] = thickness;
    } else {
      // Ring 2 in the YZ plane (orthogonal)
      const r = ringRadius2 + (Math.random() - 0.5) * 3.5;
      positions[i3] = thickness;
      positions[i3 + 1] = r * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(theta);
    }
  }

  return positions;
}

/**
 * Three Fingers Raised → Three Rotating Orthogonal Cosmic Rings
 * 3-Axis Gyroscopic Celestial Gimbal (XY, YZ, and XZ planes)
 */
export function generateThreeRings(count, ringRadius1 = 24.0, ringRadius2 = 36.0, ringRadius3 = 48.0) {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const ringIndex = i % 3;
    const theta = Math.random() * Math.PI * 2;
    const thickness = 2.2 * (Math.random() - 0.5);

    if (ringIndex === 0) {
      // Ring 1 in the XY plane
      const r = ringRadius1 + (Math.random() - 0.5) * 2.6;
      positions[i3]     = r * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(theta);
      positions[i3 + 2] = thickness;
    } else if (ringIndex === 1) {
      // Ring 2 in the YZ plane
      const r = ringRadius2 + (Math.random() - 0.5) * 3.2;
      positions[i3]     = thickness;
      positions[i3 + 1] = r * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(theta);
    } else {
      // Ring 3 in the XZ plane
      const r = ringRadius3 + (Math.random() - 0.5) * 3.8;
      positions[i3]     = r * Math.cos(theta);
      positions[i3 + 1] = thickness;
      positions[i3 + 2] = r * Math.sin(theta);
    }
  }

  return positions;
}

/**
 * Four Fingers Raised → Four Rotating Armillary Sphere Rings
 * Nested concentric rings rotated at 0°, 45°, 90°, and 135° tilts
 */
export function generateFourRings(count, r1 = 20.0, r2 = 31.0, r3 = 42.0, r4 = 53.0) {
  const positions = new Float32Array(count * 3);
  const radii = [r1, r2, r3, r4];
  const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const ringIndex = i % 4;
    const theta = Math.random() * Math.PI * 2;
    const alpha = angles[ringIndex];
    const r = radii[ringIndex] + (Math.random() - 0.5) * (2.2 + ringIndex * 0.6);
    const thickness = 2.0 * (Math.random() - 0.5);

    const cosAlpha = Math.cos(alpha);
    const sinAlpha = Math.sin(alpha);
    const rx = r * Math.cos(theta);
    const ry = r * Math.sin(theta);

    // Coordinate rotation around the Y axis by alpha
    positions[i3]     = rx * cosAlpha + thickness * sinAlpha;
    positions[i3 + 1] = ry;
    positions[i3 + 2] = -rx * sinAlpha + thickness * cosAlpha;
  }

  return positions;
}

/**
 * 5. Pinch Gesture → Magnetic Pinch Attraction Field
 * Hyper-dense vortex contracting directly towards the pinch focal point
 */
export function generatePinchCluster(count, radius = 9.0) {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const r = Math.pow(Math.random(), 3.0) * radius;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);
  }

  return positions;
}

/**
 * 6. Both Hands Open → Super-Expanded Galaxy
 * Deep volumetric expansion (1.9x radius) with energetic dispersion
 */
export function generateExpandedGalaxy(count) {
  return generateSpiralGalaxy(count, 105.0);
}

/**
 * 7. Both Hands Closed → Ultra-Dense Singularity Core
 * Extreme compression into micro singularity (R = 5.0)
 */
export function generateHyperCompressedSphere(count) {
  return generateSphere(count, 5.5);
}

/**
 * 8. Cube Formation (3D Hypercube Lattice)
 */
export function generateCube(count, size = 38.0) {
  const positions = new Float32Array(count * 3);
  const half = size * 0.5;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const isEdge = Math.random() < 0.65;
    let x, y, z;

    if (isEdge) {
      // Concentrate particles on the 12 edges and 6 faces of the cube
      const face = Math.floor(Math.random() * 6);
      const u = (Math.random() - 0.5) * size;
      const v = (Math.random() - 0.5) * size;

      switch (face) {
        case 0: x = half; y = u; z = v; break;
        case 1: x = -half; y = u; z = v; break;
        case 2: y = half; x = u; z = v; break;
        case 3: y = -half; x = u; z = v; break;
        case 4: z = half; x = u; y = v; break;
        default: z = -half; x = u; y = v; break;
      }
    } else {
      // Volumetric interior dust
      x = (Math.random() - 0.5) * size;
      y = (Math.random() - 0.5) * size;
      z = (Math.random() - 0.5) * size;
    }

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;
  }
  return positions;
}

/**
 * 9. Pyramid Formation (4-Sided Cosmic Tetrahedron / Obelisk)
 */
export function generatePyramid(count, baseSize = 42.0, height = 40.0) {
  const positions = new Float32Array(count * 3);
  const halfBase = baseSize * 0.5;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    // Height ratio t from 0 (base) to 1 (apex)
    const t = Math.pow(Math.random(), 0.8);
    const y = -height * 0.5 + t * height;
    const currentBase = halfBase * (1.0 - t);

    // Pick one of the 4 faces or base
    const rFace = Math.random();
    let x, z;

    if (rFace < 0.2) {
      // Base
      x = (Math.random() - 0.5) * baseSize;
      z = (Math.random() - 0.5) * baseSize;
    } else {
      // 4 sloping triangular faces
      const side = Math.floor(Math.random() * 4);
      const u = (Math.random() - 0.5) * 2.0 * currentBase;
      switch (side) {
        case 0: x = u; z = currentBase; break;
        case 1: x = u; z = -currentBase; break;
        case 2: x = currentBase; z = u; break;
        default: x = -currentBase; z = u; break;
      }
      // Add slight jitter for cosmic particle dispersion
      x += (Math.random() - 0.5) * 1.5;
      z += (Math.random() - 0.5) * 1.5;
    }

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;
  }
  return positions;
}

/**
 * 10. 3D Celestial Star Formation (Stellated Polyhedron)
 */
export function generate3DStar(count, outerR = 46.0, innerR = 18.0) {
  const positions = new Float32Array(count * 3);
  const points = 5;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    // Modulate radius by 5-fold angular frequency to create star spikes
    const starAngle = Math.atan2(Math.sin(theta), Math.cos(theta));
    const spikeFactor = Math.pow(Math.cos(points * starAngle * 0.5), 2.0);
    const targetR = innerR + (outerR - innerR) * spikeFactor;

    const r = targetR * (0.8 + Math.random() * 0.25);
    const zThickness = Math.cos(phi) * 14.0 * (1.0 - spikeFactor * 0.5);

    positions[i3] = r * Math.sin(theta);
    positions[i3 + 1] = zThickness;
    positions[i3 + 2] = r * Math.cos(theta);
  }
  return positions;
}

/**
 * 11. Diamond Formation (Octahedral Gem Crystal)
 */
export function generateDiamond(count, radius = 32.0, height = 48.0) {
  const positions = new Float32Array(count * 3);
  const halfH = height * 0.5;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const t = (Math.random() - 0.5) * 2.0; // -1 to +1
    const y = t * halfH;
    const rAtY = radius * (1.0 - Math.abs(t)); // Widest at equator

    // Octagonal / diamond faceting
    const theta = Math.random() * Math.PI * 2;
    const facet = Math.cos(4.0 * theta) * 0.2 + 0.8;
    const r = rAtY * facet * (0.85 + Math.random() * 0.2);

    positions[i3] = r * Math.cos(theta);
    positions[i3 + 1] = y;
    positions[i3 + 2] = r * Math.sin(theta);
  }
  return positions;
}

/**
 * 12. Torus Formation (Cosmic Donut Ring)
 */
export function generateTorus(count, majorR = 38.0, minorR = 12.0) {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    const rOffset = minorR * (0.7 + Math.random() * 0.35);

    positions[i3] = (majorR + rOffset * Math.cos(v)) * Math.cos(u);
    positions[i3 + 1] = rOffset * Math.sin(v);
    positions[i3 + 2] = (majorR + rOffset * Math.cos(v)) * Math.sin(u);
  }
  return positions;
}

/**
 * 13. Space Portal / Wormhole Funnel
 */
export function generateSpacePortal(count, radius = 48.0, depth = 85.0) {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const t = Math.pow(Math.random(), 1.5); // 0 (near event horizon) to 1 (outer rim)
    const z = (t - 0.5) * depth;
    // Funnel radius expands outward along Z
    const r = 4.0 + (radius - 4.0) * Math.pow(Math.abs(t - 0.5) * 2.0, 1.6);
    const theta = Math.random() * Math.PI * 2 + z * 0.25;

    positions[i3] = r * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(theta);
    positions[i3 + 2] = z;
  }
  return positions;
}

/**
 * 14. Solar System Mode (Sun & Planetary Orbit Lanes)
 */
export function generateSolarSystem(count) {
  const positions = new Float32Array(count * 3);
  const planetOrbits = [12, 18, 26, 35, 48, 62, 76, 90]; // 8 planetary orbits

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    let x, y, z;

    if (i < count * 0.18) {
      // Central Sun core
      const r = Math.pow(Math.random(), 2.0) * 8.5;
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      x = r * Math.sin(phi) * Math.cos(theta);
      y = r * Math.sin(phi) * Math.sin(theta);
      z = r * Math.cos(phi);
    } else {
      // Concentric planetary rings & asteroid belts
      const orbitIdx = Math.floor(Math.random() * planetOrbits.length);
      const orbitR = planetOrbits[orbitIdx];
      const theta = Math.random() * Math.PI * 2;
      const thickness = (Math.random() - 0.5) * 2.5;
      const r = orbitR + (Math.random() - 0.5) * 2.0;

      x = r * Math.cos(theta);
      y = thickness;
      z = r * Math.sin(theta);
    }

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;
  }
  return positions;
}

/**
 * 15. Supernova Blast Wave (Explosive Dispersal)
 */
export function generateSupernova(count, maxRadius = 95.0) {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const isShell = Math.random() < 0.6;
    let r;

    if (isShell) {
      // Concentrated expanding shockwave shell
      r = maxRadius * (0.8 + Math.random() * 0.25);
    } else {
      // Internal stellar ejecta & plasma filaments
      r = Math.pow(Math.random(), 0.7) * maxRadius;
    }

    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;

    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);
  }
  return positions;
}

/**
 * 16. Energy Ball / Plasma Orb
 */
export function generateEnergyBall(count, radius = 16.0) {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    // Core + coronal electrical tendrils
    const isCore = Math.random() < 0.45;
    let r;
    if (isCore) {
      r = Math.pow(Math.random(), 1.5) * (radius * 0.5);
    } else {
      r = radius * (0.7 + Math.random() * 0.5);
    }

    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;

    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);
  }
  return positions;
}
