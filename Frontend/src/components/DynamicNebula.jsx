import * as THREE from 'three';
import { GALAXY_THEMES } from './GalaxyShapes';

/**
 * Dynamic Nebula System
 * Multi-layered procedural cosmic gas clouds with animated turbulent fluid dynamics
 */
export class DynamicNebula {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.initNebulaClouds();
  }

  initNebulaClouds() {
    const cloudCount = 12;
    const geometry = new THREE.PlaneGeometry(160, 160, 16, 16);

    // Procedural noise vertex & fragment shader for realistic gaseous interstellar nebula
    const nebulaVertexShader = `
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const nebulaFragmentShader = `
      uniform float uTime;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vPosition;

      // 2D Simplex-like noise generator
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 centeredUv = vUv - vec2(0.5);
        float dist = length(centeredUv);

        // Soft radial vignette falloff
        float falloff = smoothstep(0.5, 0.05, dist);

        // Multi-octave swirling turbulent gas
        float n1 = snoise(vUv * 2.5 + vec2(uTime * 0.03, uTime * 0.02));
        float n2 = snoise(vUv * 5.0 - vec2(uTime * 0.05, -uTime * 0.04));
        float n3 = snoise(vUv * 9.0 + vec2(n1 * 0.5, n2 * 0.5));

        float gasDensity = (n1 * 0.5 + n2 * 0.35 + n3 * 0.25) * 0.5 + 0.5;
        gasDensity = pow(gasDensity, 1.6) * falloff;

        // Tri-color chromatic blending
        vec3 color = mix(uColor1, uColor2, smoothstep(0.1, 0.6, gasDensity));
        color = mix(color, uColor3, smoothstep(0.5, 0.9, gasDensity));

        float finalAlpha = gasDensity * uOpacity;
        if (finalAlpha < 0.005) discard;

        gl_FragColor = vec4(color, finalAlpha);
      }
    `;

    for (let i = 0; i < cloudCount; i++) {
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: Math.random() * 100 },
          uColor1: { value: new THREE.Color(0x1e1b4b) }, // Deep Indigo
          uColor2: { value: new THREE.Color(0x38bdf8) }, // Cyan
          uColor3: { value: new THREE.Color(0xc084fc) }, // Violet
          uOpacity: { value: 0.35 + Math.random() * 0.25 }
        },
        vertexShader: nebulaVertexShader,
        fragmentShader: nebulaFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geometry, material);

      // Distribute in deep background sphere
      const radius = 180 + Math.random() * 140;
      const theta = (i / cloudCount) * Math.PI * 2 + (Math.random() - 0.5);
      const phi = (Math.random() - 0.5) * Math.PI * 0.6;

      mesh.position.set(
        radius * Math.cos(theta) * Math.cos(phi),
        radius * Math.sin(phi),
        radius * Math.sin(theta) * Math.cos(phi)
      );

      mesh.lookAt(0, 0, 0);
      mesh.scale.setScalar(0.8 + Math.random() * 0.8);
      mesh.userData = {
        rotSpeed: (Math.random() - 0.5) * 0.002,
        timeOffset: Math.random() * 1000
      };

      this.group.add(mesh);
      this.clouds.push(mesh);
    }
  }

  setTheme(themeKey) {
    const theme = GALAXY_THEMES[themeKey] || GALAXY_THEMES['cyber-neon'];
    this.clouds.forEach((cloud) => {
      if (cloud.material.uniforms) {
        cloud.material.uniforms.uColor1.value.copy(theme.outerColor).multiplyScalar(0.5);
        cloud.material.uniforms.uColor2.value.copy(theme.innerColor);
        cloud.material.uniforms.uColor3.value.copy(theme.midColor);
      }
    });
  }

  update(elapsedTime) {
    this.group.rotation.y = elapsedTime * 0.004;
    this.clouds.forEach((cloud) => {
      if (cloud.material.uniforms) {
        cloud.material.uniforms.uTime.value = elapsedTime + cloud.userData.timeOffset;
      }
      cloud.rotation.z += cloud.userData.rotSpeed;
    });
  }

  dispose() {
    this.clouds.forEach((cloud) => {
      cloud.geometry.dispose();
      cloud.material.dispose();
    });
    this.scene.remove(this.group);
  }
}
