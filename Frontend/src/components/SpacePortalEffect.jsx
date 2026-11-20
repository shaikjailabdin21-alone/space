import * as THREE from 'three';

/**
 * Space Portal / Wormhole Effect
 * Glowing relativistic particle vortex and Einstein-Rosen bridge accretion disk
 */
export class SpacePortalEffect {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.visible = false;
    this.targetOpacity = 0.0;
    this.opacity = 0.0;

    this.initAccretionDisk();
    this.initEventHorizonRings();
    this.scene.add(this.group);
  }

  initAccretionDisk() {
    // Rotating luminous accretion ring
    const diskGeom = new THREE.RingGeometry(8.0, 36.0, 64);
    const diskMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        void main() {
          vUv = uv;
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uOpacity;

        void main() {
          float dist = length(vPos.xy);
          float angle = atan(vPos.y, vPos.x);

          // Swirling relativistic arms
          float spiral = sin(dist * 0.45 - angle * 3.0 + uTime * 6.0);
          spiral = smoothstep(-0.2, 0.8, spiral);

          // Radial falloff from inner horizon to outer edge
          float radialGlow = smoothstep(8.0, 16.0, dist) * smoothstep(36.0, 18.0, dist);

          vec3 cyan = vec3(0.2, 0.9, 1.0);
          vec3 purple = vec3(0.85, 0.35, 1.0);
          vec3 color = mix(cyan, purple, sin(angle + uTime * 2.0) * 0.5 + 0.5);

          float alpha = radialGlow * (0.6 + spiral * 0.4) * uOpacity;
          gl_FragColor = vec4(color * 1.3, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.diskMesh = new THREE.Mesh(diskGeom, diskMat);
    this.group.add(this.diskMesh);
  }

  initEventHorizonRings() {
    this.rings = [];
    const ringCount = 5;

    for (let i = 0; i < ringCount; i++) {
      const radius = 9.0 + i * 5.5;
      const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(64);
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0x38bdf8 : 0xc084fc,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending
      });

      const line = new THREE.Line(geom, mat);
      line.position.z = -i * 6.0; // Extend backwards like a wormhole cylinder
      this.group.add(line);
      this.rings.push({ line, baseZ: -i * 6.0, speed: 0.03 * (i + 1) });
    }
  }

  setActive(active) {
    this.targetOpacity = active ? 1.0 : 0.0;
  }

  update(delta, elapsed) {
    this.opacity += (this.targetOpacity - this.opacity) * 0.12;
    this.group.visible = this.opacity > 0.01;
    if (!this.group.visible) return;

    if (this.diskMesh.material.uniforms) {
      this.diskMesh.material.uniforms.uTime.value = elapsed;
      this.diskMesh.material.uniforms.uOpacity.value = this.opacity;
    }
    this.diskMesh.rotation.z = elapsed * 0.8;

    this.rings.forEach((r, idx) => {
      r.line.rotation.z += r.speed;
      r.line.material.opacity = 0.65 * this.opacity;
      // Oscillate in depth
      r.line.position.z = r.baseZ + Math.sin(elapsed * 4.0 + idx) * 1.5;
    });
  }

  dispose() {
    this.diskMesh.geometry.dispose();
    this.diskMesh.material.dispose();
    this.rings.forEach((r) => {
      r.line.geometry.dispose();
      r.line.material.dispose();
    });
    this.scene.remove(this.group);
  }
}
