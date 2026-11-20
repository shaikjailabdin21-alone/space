import * as THREE from 'three';

/**
 * Hand Trail System
 * Generates glowing particle spark ribbons that follow finger movements in real-time 3D space
 */
export class HandTrailSystem {
  constructor(scene, maxTrailPoints = 1200) {
    this.scene = scene;
    this.maxPoints = maxTrailPoints;
    this.currentIndex = 0;

    this.positions = new Float32Array(this.maxPoints * 3);
    this.colors = new Float32Array(this.maxPoints * 3);
    this.sizes = new Float32Array(this.maxPoints);
    this.lifetimes = new Float32Array(this.maxPoints); // 1.0 (new) -> 0.0 (dead)

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));
    geometry.setAttribute('aLife', new THREE.BufferAttribute(this.lifetimes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPointSizeScale: { value: window.innerHeight * 0.7 }
      },
      vertexShader: `
        uniform float uPointSizeScale;
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aLife;
        varying vec3 vColor;
        varying float vLife;

        void main() {
          vColor = aColor;
          vLife = aLife;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = aSize * vLife * (uPointSizeScale / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 45.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vLife;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          float halo = exp(-dist * 4.5);
          float core = smoothstep(0.15, 0.0, dist);
          vec3 col = vColor * halo + vec3(1.0) * core * 0.7;
          gl_FragColor = vec4(col, halo * vLife * 0.85);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particleMesh = new THREE.Points(geometry, material);
    this.scene.add(this.particleMesh);

    // Color palette per fingertip (Thumb, Index, Middle, Ring, Pinky)
    this.fingerColors = [
      new THREE.Color(0xf59e0b), // Amber (Thumb)
      new THREE.Color(0x38bdf8), // Cyan (Index)
      new THREE.Color(0xc084fc), // Purple (Middle)
      new THREE.Color(0xf472b6), // Pink (Ring)
      new THREE.Color(0x34d399)  // Emerald (Pinky)
    ];
  }

  /**
   * Add trail points for live detected fingertips
   * @param {Array<{x: number, y: number, z: number, fingerIndex: number}>} tipCoords - 3D coordinates
   */
  addFingertipPositions(tipCoords) {
    if (!tipCoords || tipCoords.length === 0) return;

    const posAttr = this.particleMesh.geometry.attributes.position;
    const colAttr = this.particleMesh.geometry.attributes.aColor;
    const sizeAttr = this.particleMesh.geometry.attributes.aSize;
    const lifeAttr = this.particleMesh.geometry.attributes.aLife;

    tipCoords.forEach((tip) => {
      // Add 2 jittered sparks per fingertip for rich ribbon glow
      for (let s = 0; s < 2; s++) {
        const idx = this.currentIndex;
        const i3 = idx * 3;

        this.positions[i3] = tip.x + (Math.random() - 0.5) * 1.2;
        this.positions[i3 + 1] = tip.y + (Math.random() - 0.5) * 1.2;
        this.positions[i3 + 2] = tip.z + (Math.random() - 0.5) * 1.2;

        const col = this.fingerColors[tip.fingerIndex % this.fingerColors.length] || this.fingerColors[1];
        this.colors[i3] = col.r;
        this.colors[i3 + 1] = col.g;
        this.colors[i3 + 2] = col.b;

        this.sizes[idx] = 2.4 + Math.random() * 2.8;
        this.lifetimes[idx] = 1.0;

        this.currentIndex = (this.currentIndex + 1) % this.maxPoints;
      }
    });

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    lifeAttr.needsUpdate = true;
  }

  update(delta) {
    const lifeAttr = this.particleMesh.geometry.attributes.aLife;
    const posAttr = this.particleMesh.geometry.attributes.position;
    let hasLiveParticles = false;

    // Fade and drift particles
    for (let i = 0; i < this.maxPoints; i++) {
      if (this.lifetimes[i] > 0.0) {
        this.lifetimes[i] -= delta * 1.65; // Decay in ~0.6 seconds
        if (this.lifetimes[i] < 0.0) this.lifetimes[i] = 0.0;
        else {
          hasLiveParticles = true;
          // Subtle upward cosmic drift
          this.positions[i * 3 + 1] += delta * 2.5;
        }
      }
    }

    if (hasLiveParticles) {
      lifeAttr.needsUpdate = true;
      posAttr.needsUpdate = true;
    }
  }

  dispose() {
    this.particleMesh.geometry.dispose();
    this.particleMesh.material.dispose();
    this.scene.remove(this.particleMesh);
  }
}
