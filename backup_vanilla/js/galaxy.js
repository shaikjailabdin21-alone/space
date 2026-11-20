/**
 * Galaxy 3D Particle Engine
 * Built with Three.js and custom GLSL Shaders
 * Handles Galaxy <-> Sphere morphing, differential rotation, and hand interactions
 */

export class GalaxyEngine {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.particleCount = 75000;
    this.morphProgress = 1.0; // 1.0 = Galaxy, 0.0 = Sphere
    this.targetMorph = 1.0;

    // Hand tracking offsets (smoothly interpolated)
    this.handOffset = new THREE.Vector3(0, 0, 0);
    this.targetHandOffset = new THREE.Vector3(0, 0, 0);
    this.handRotation = new THREE.Vector2(0, 0);
    this.targetHandRotation = new THREE.Vector2(0, 0);
    this.handZoom = 1.0;
    this.targetHandZoom = 1.0;

    // Presets and themes
    this.currentTheme = 'cyber-neon';
    this.themes = {
      'cyber-neon': {
        name: 'Cyber Neon',
        coreColor: new THREE.Color(0xffffff),
        innerColor: new THREE.Color(0x38bdf8), // Neon Cyan
        midColor: new THREE.Color(0x60a5fa),   // Sky Blue
        outerColor: new THREE.Color(0xc084fc), // Electric Violet
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
        outerColor: new THREE.Color(0xf97316), // Blazing Orange
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

    this.clock = new THREE.Clock();
    this.initScene();
    this.createGalaxyGeometry();
    this.createBackgroundStars();
    this.createCoreGlow();
    this.setupResizeListener();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x030712, 0.005);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 35, 75);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x030712, 1);
    this.container.appendChild(this.renderer.domElement);
    this.renderer.domElement.id = 'webgl-canvas';
  }

  createGalaxyGeometry() {
    const count = this.particleCount;
    const geometry = new THREE.BufferGeometry();

    const galaxyPositions = new Float32Array(count * 3);
    const spherePositions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const randoms = new Float32Array(count);
    const twinkleSpeeds = new Float32Array(count);

    // Galaxy parameters
    const galaxyRadius = 55.0;
    const arms = 4;
    const spin = 1.35;
    const theme = this.themes[this.currentTheme];

    // Sphere parameters
    const sphereRadius = 16.0;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      randoms[i] = Math.random();
      twinkleSpeeds[i] = 1.0 + Math.random() * 3.5;

      // ==========================================
      // 1. GALAXY FORMATION (Spiral Arms + Bulge + Halo)
      // ==========================================
      const isBulge = Math.random() < 0.22; // 22% core bulge stars
      const isHalo = Math.random() < 0.08;  // 8% spherical halo stars

      let gx, gy, gz;
      let particleColor = new THREE.Color();

      if (isBulge) {
        // High density spherical/elliptical central core
        const r = Math.pow(Math.random(), 2.2) * (galaxyRadius * 0.22);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        gx = r * Math.sin(phi) * Math.cos(theta);
        gy = r * Math.sin(phi) * Math.sin(theta) * 0.45; // flatten slightly
        gz = r * Math.cos(phi);

        particleColor.copy(theme.coreColor).lerp(theme.innerColor, r / (galaxyRadius * 0.22));
        sizes[i] = 2.5 + Math.random() * 3.0;
      } else if (isHalo) {
        // Diffuse outer spherical stellar halo
        const r = 20.0 + Math.random() * (galaxyRadius * 1.2);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        gx = r * Math.sin(phi) * Math.cos(theta);
        gy = r * Math.sin(phi) * Math.sin(theta) * 0.6;
        gz = r * Math.cos(phi);

        particleColor.copy(theme.haloColor);
        sizes[i] = 1.2 + Math.random() * 1.5;
      } else {
        // Logarithmic spiral arms
        const armIndex = i % arms;
        const armAngle = (armIndex / arms) * Math.PI * 2;

        // Exponential distribution for realistic density falloff
        const r = Math.pow(Math.random(), 1.7) * galaxyRadius;
        const spinAngle = r * (spin / galaxyRadius) * 4.0;
        const totalAngle = armAngle + spinAngle;

        // Random scattering around the arm spine
        const spreadFactor = 0.18 * r + 0.6;
        const spreadX = (Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1)) * spreadFactor;
        const spreadY = (Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1)) * (spreadFactor * 0.45);
        const spreadZ = (Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? 1 : -1)) * spreadFactor;

        gx = Math.cos(totalAngle) * r + spreadX;
        gy = spreadY;
        gz = Math.sin(totalAngle) * r + spreadZ;

        // Color interpolation based on radius
        const normR = r / galaxyRadius;
        if (normR < 0.3) {
          particleColor.copy(theme.innerColor).lerp(theme.midColor, normR / 0.3);
          sizes[i] = 2.0 + Math.random() * 2.2;
        } else if (normR < 0.7) {
          particleColor.copy(theme.midColor).lerp(theme.outerColor, (normR - 0.3) / 0.4);
          sizes[i] = 1.6 + Math.random() * 1.8;
        } else {
          particleColor.copy(theme.outerColor).lerp(theme.haloColor, (normR - 0.7) / 0.3);
          sizes[i] = 1.2 + Math.random() * 1.5;
        }
      }

      galaxyPositions[i3] = gx;
      galaxyPositions[i3 + 1] = gy;
      galaxyPositions[i3 + 2] = gz;

      colors[i3] = particleColor.r;
      colors[i3 + 1] = particleColor.g;
      colors[i3 + 2] = particleColor.b;

      // ==========================================
      // 2. SPHERE FORMATION (Fibonacci Shells + Singularity Core)
      // ==========================================
      // Multi-layer volumetric sphere with dense core and corona
      const sphereLayerRand = Math.random();
      let sr;

      if (sphereLayerRand < 0.25) {
        // High density singularity core
        sr = Math.pow(Math.random(), 1.5) * (sphereRadius * 0.3);
      } else if (sphereLayerRand < 0.85) {
        // Main sphere shell (Fibonacci distributed surface & volume)
        sr = sphereRadius * (0.65 + Math.random() * 0.35);
      } else {
        // Solar prominence flares / corona reaching outwards
        sr = sphereRadius * (1.0 + Math.pow(Math.random(), 3) * 0.7);
      }

      // Golden ratio Fibonacci sphere distribution
      const phi = Math.acos(1 - 2 * ((i + 0.5) / count));
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const theta = goldenAngle * i;

      spherePositions[i3] = sr * Math.sin(phi) * Math.cos(theta);
      spherePositions[i3 + 1] = sr * Math.sin(phi) * Math.sin(theta);
      spherePositions[i3 + 2] = sr * Math.cos(phi);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(galaxyPositions.slice(), 3));
    geometry.setAttribute('aGalaxyPos', new THREE.BufferAttribute(galaxyPositions, 3));
    geometry.setAttribute('aSpherePos', new THREE.BufferAttribute(spherePositions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
    geometry.setAttribute('aTwinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));

    // Custom GLSL Shader Material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMorphProgress: { value: 1.0 }, // 1 = Galaxy, 0 = Sphere
        uPointSizeScale: { value: window.innerHeight * 0.85 },
        uSphereCoreBoost: { value: 0.0 },
        uThemeCoreColor: { value: theme.coreColor }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uMorphProgress;
        uniform float uPointSizeScale;
        uniform float uSphereCoreBoost;

        attribute vec3 aGalaxyPos;
        attribute vec3 aSpherePos;
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aRandom;
        attribute float aTwinkleSpeed;

        varying vec3 vColor;
        varying float vAlpha;
        varying float vGlow;

        // Simple smooth noise helper
        float hash(float n) { return fract(sin(n) * 43758.5453123); }

        void main() {
          // Smooth non-linear S-curve transition
          float t = smoothstep(0.0, 1.0, uMorphProgress);

          // 1. GALAXY DYNAMICS: Differential Galactic Rotation
          // Core stars rotate faster than edge stars
          vec3 gPos = aGalaxyPos;
          float gDist = length(gPos.xz);
          float rotSpeed = 12.0 / (gDist + 15.0);
          float gAngle = uTime * rotSpeed * 0.35;
          float cosG = cos(gAngle);
          float sinG = sin(gAngle);
          gPos.xz = vec2(
            gPos.x * cosG - gPos.z * sinG,
            gPos.x * sinG + gPos.z * cosG
          );

          // Subtle floating vertical drift
          gPos.y += sin(uTime * 0.8 + aRandom * 6.28) * 0.35;

          // 2. SPHERE DYNAMICS: High-energy containment & coronal pulse
          vec3 sPos = aSpherePos;
          // Rapid energetic rotation for singularity
          float sAngle = uTime * 1.8;
          float cosS = cos(sAngle);
          float sinS = sin(sAngle);
          sPos.xz = vec2(
            sPos.x * cosS - sPos.z * sinS,
            sPos.x * sinS + sPos.z * cosS
          );

          // Surface vibration & coronal pulsing
          float pulse = sin(uTime * 8.0 + aRandom * 15.0) * (1.0 - t);
          sPos += normalize(sPos + 0.001) * pulse * 0.55;

          // Swirl transition path during collapse / explosion
          // Adds a dynamic spiral twist during morphing
          float morphTwist = sin(uMorphProgress * 3.14159) * 1.5;
          float twistAngle = (1.0 - t) * morphTwist * (aRandom - 0.5) * 4.0;
          float cosT = cos(twistAngle);
          float sinT = sin(twistAngle);

          // Interpolate positions
          vec3 morphedPos = mix(sPos, gPos, t);
          morphedPos.xz = vec2(
            morphedPos.x * cosT - morphedPos.z * sinT,
            morphedPos.x * sinT + morphedPos.z * cosT
          );

          // Project to view space
          vec4 mvPosition = modelViewMatrix * vec4(morphedPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Point size attenuation with distance
          float sizeFactor = mix(1.3, 1.0, t); // Particles appear denser/larger in singularity
          gl_PointSize = aSize * sizeFactor * (uPointSizeScale / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 1.5, 60.0);

          // Color & Twinkling
          vColor = aColor;
          // In sphere mode, boost core intensity to pure blazing energy
          if (t < 0.6) {
            float sphereGlow = (1.0 - t) * 0.45;
            vColor = mix(vColor, vec3(1.0, 0.95, 0.85), sphereGlow);
          }

          // Twinkle effect
          float twinkle = sin(uTime * aTwinkleSpeed + aRandom * 6.28) * 0.25 + 0.75;
          vAlpha = twinkle;
          vGlow = 1.0 - t;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vColor;
        varying float vAlpha;
        varying float vGlow;

        void main() {
          // Circular particle with smooth gaussian glow falloff
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);

          if (dist > 0.5) discard;

          // Multi-layer glowing star sprite
          // Bright center core
          float core = smoothstep(0.12, 0.0, dist);
          // Soft outer atmospheric glow
          float halo = exp(-dist * 5.0);

          vec3 finalColor = vColor * halo + vec3(1.0) * core * 0.8;

          // Extra energy boost when compressed in singularity
          finalColor += vGlow * vec3(0.2, 0.1, 0.3) * halo;

          gl_FragColor = vec4(finalColor, (halo + core * 0.5) * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particleMesh = new THREE.Points(geometry, this.material);
    this.scene.add(this.particleMesh);
  }

  createBackgroundStars() {
    // 6,000 deep space background stars for infinite depth
    const count = 6000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const bgColors = [
      new THREE.Color(0x94a3b8), // Slate
      new THREE.Color(0x38bdf8), // Cyan
      new THREE.Color(0xc084fc), // Purple
      new THREE.Color(0xffffff)  // Pure White
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = 250 + Math.random() * 600;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      const color = bgColors[Math.floor(Math.random() * bgColors.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = 1.0 + Math.random() * 2.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 2.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    this.bgStars = new THREE.Points(geometry, material);
    this.scene.add(this.bgStars);
  }

  createCoreGlow() {
    // Glowing radiant volumetric core sprite for galactic center / singularity
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(56, 189, 248, 0.8)');
    gradient.addColorStop(0.5, 'rgba(192, 132, 252, 0.35)');
    gradient.addColorStop(1, 'rgba(3, 7, 18, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.9
    });

    this.coreSprite = new THREE.Sprite(spriteMaterial);
    this.coreSprite.scale.set(18, 18, 1);
    this.scene.add(this.coreSprite);
  }

  setTheme(themeKey) {
    if (!this.themes[themeKey]) return;
    this.currentTheme = themeKey;
    const theme = this.themes[themeKey];

    const colorsAttr = this.particleMesh.geometry.attributes.aColor;
    const count = this.particleCount;
    const colors = colorsAttr.array;
    const galaxyPos = this.particleMesh.geometry.attributes.aGalaxyPos.array;
    const galaxyRadius = 55.0;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const gx = galaxyPos[i3];
      const gz = galaxyPos[i3 + 2];
      const r = Math.sqrt(gx * gx + gz * gz);
      const normR = Math.min(r / galaxyRadius, 1.0);

      const color = new THREE.Color();
      if (normR < 0.2) {
        color.copy(theme.coreColor).lerp(theme.innerColor, normR / 0.2);
      } else if (normR < 0.6) {
        color.copy(theme.innerColor).lerp(theme.midColor, (normR - 0.2) / 0.4);
      } else {
        color.copy(theme.midColor).lerp(theme.outerColor, (normR - 0.6) / 0.4);
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    colorsAttr.needsUpdate = true;
  }

  /**
   * Set target morph state:
   * 1.0 = Full Galaxy (Open Palm)
   * 0.0 = Full Sphere (Closed Fist)
   */
  setMorphTarget(target) {
    this.targetMorph = Math.max(0.0, Math.min(1.0, target));
  }

  /**
   * Update Hand Tracking displacement & rotation
   * @param {number} x - Normalized hand X (-1 to 1)
   * @param {number} y - Normalized hand Y (-1 to 1)
   * @param {number} z - Depth / hand scale factor
   */
  updateHandTarget(x, y, z = 1.0) {
    // Left/Right: Panning and Galaxy tilt
    this.targetHandOffset.x = x * 28.0;
    // Up/Down: Panning and Galaxy pitch
    this.targetHandOffset.y = y * 20.0;
    // Hand distance / depth controls zoom
    this.targetHandZoom = THREE.MathUtils.clamp(z, 0.45, 1.9);

    // Natural camera / galaxy tilt
    this.targetHandRotation.y = x * 0.75;
    this.targetHandRotation.x = -y * 0.55;
  }

  resetUniverse() {
    this.targetMorph = 1.0;
    this.targetHandOffset.set(0, 0, 0);
    this.targetHandRotation.set(0, 0);
    this.targetHandZoom = 1.0;
    this.camera.position.set(0, 35, 75);
    this.camera.lookAt(0, 0, 0);
  }

  setupResizeListener() {
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      if (this.material) {
        this.material.uniforms.uPointSizeScale.value = height * 0.85;
      }
    });
  }

  update() {
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Smoothly interpolate morphProgress (60 FPS smooth lerp)
    this.morphProgress += (this.targetMorph - this.morphProgress) * 0.085;

    // Smoothly interpolate hand tracking offsets
    this.handOffset.lerp(this.targetHandOffset, 0.08);
    this.handRotation.lerp(this.targetHandRotation, 0.08);
    this.handZoom += (this.targetHandZoom - this.handZoom) * 0.08;

    // Update Shader Uniforms
    if (this.material) {
      this.material.uniforms.uTime.value = elapsedTime;
      this.material.uniforms.uMorphProgress.value = this.morphProgress;
    }

    // Apply hand movement controls to Galaxy Mesh
    if (this.particleMesh) {
      this.particleMesh.position.x = this.handOffset.x;
      this.particleMesh.position.y = this.handOffset.y;
      this.particleMesh.rotation.y = this.handRotation.y + elapsedTime * 0.02;
      this.particleMesh.rotation.x = this.handRotation.x + 0.35; // gentle initial top-down slant
    }

    // Core sprite pulsing & morph reaction
    if (this.coreSprite) {
      this.coreSprite.position.copy(this.particleMesh.position);

      // Core expands and pulses fiercely when in sphere mode
      const isSphere = 1.0 - this.morphProgress;
      const pulse = 1.0 + Math.sin(elapsedTime * 6.0) * 0.15;
      const coreScale = (14.0 + isSphere * 16.0) * pulse;
      this.coreSprite.scale.set(coreScale, coreScale, 1);
      this.coreSprite.material.opacity = 0.7 + isSphere * 0.3;
    }

    // Distant background star slow drift
    if (this.bgStars) {
      this.bgStars.rotation.y = elapsedTime * 0.003;
    }

    // Camera zoom adaptation based on hand depth
    const targetCamZ = 75.0 / this.handZoom;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.06;

    this.renderer.render(this.scene, this.camera);
  }
}
