import * as THREE from 'three';
import {
  generateSpiralGalaxy,
  generateSphere,
  generateParticleBeam,
  generateTwoRings,
  generateThreeRings,
  generateFourRings,
  generatePinchCluster,
  generateExpandedGalaxy,
  generateHyperCompressedSphere,
  generateCube,
  generatePyramid,
  generate3DStar,
  generateDiamond,
  generateTorus,
  generateSpacePortal,
  generateSolarSystem,
  generateSupernova,
  generateEnergyBall,
  GALAXY_THEMES
} from './GalaxyShapes';

export class ParticleSystem {
  constructor(scene, particleCount = 75000) {
    this.scene = scene;
    this.particleCount = particleCount;
    this.currentTheme = 'cyber-neon';

    // Precompute primary formations
    this.shapes = {
      palm: generateSpiralGalaxy(particleCount),
      fist: generateSphere(particleCount),
      point: generateParticleBeam(particleCount),
      two_fingers: generateTwoRings(particleCount),
      three_fingers: generateThreeRings(particleCount),
      four_fingers: generateFourRings(particleCount),
      pinch: generatePinchCluster(particleCount),
      both_open: generateExpandedGalaxy(particleCount),
      both_closed: generateHyperCompressedSphere(particleCount)
    };

    this.activeGesture = 'palm';
    this.morphProgress = 1.0;
    this.targetMorph = 1.0;
    this.morphSpeed = 0.20; // Instant response, ultra-responsive GPU interpolation

    this.initGeometry();
    this.createCoreGlow();
  }

  getShape(shapeName) {
    if (!this.shapes[shapeName]) {
      switch (shapeName) {
        case 'three_fingers': this.shapes.three_fingers = generateThreeRings(this.particleCount); break;
        case 'four_fingers': this.shapes.four_fingers = generateFourRings(this.particleCount); break;
        case 'cube': this.shapes.cube = generateCube(this.particleCount); break;
        case 'pyramid': this.shapes.pyramid = generatePyramid(this.particleCount); break;
        case 'star': this.shapes.star = generate3DStar(this.particleCount); break;
        case 'diamond': this.shapes.diamond = generateDiamond(this.particleCount); break;
        case 'torus': this.shapes.torus = generateTorus(this.particleCount); break;
        case 'portal': this.shapes.portal = generateSpacePortal(this.particleCount); break;
        case 'solarsystem': this.shapes.solarsystem = generateSolarSystem(this.particleCount); break;
        case 'supernova': this.shapes.supernova = generateSupernova(this.particleCount); break;
        case 'energy_ball': this.shapes.energy_ball = generateEnergyBall(this.particleCount); break;
        default: this.shapes[shapeName] = this.shapes.palm; break;
      }
    }
    return this.shapes[shapeName];
  }

  initGeometry() {
    const count = this.particleCount;
    const geometry = new THREE.BufferGeometry();

    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const randoms = new Float32Array(count);
    const twinkleSpeeds = new Float32Array(count);

    const theme = GALAXY_THEMES[this.currentTheme];
    const initialPositions = this.shapes.palm;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      randoms[i] = Math.random();
      twinkleSpeeds[i] = 1.0 + Math.random() * 3.5;
      sizes[i] = 1.4 + Math.random() * 2.2;

      // Color assignment based on distance from core
      const r = Math.hypot(initialPositions[i3], initialPositions[i3 + 2]);
      const normR = Math.min(r / 55.0, 1.0);

      const color = new THREE.Color();
      if (normR < 0.25) {
        color.copy(theme.coreColor).lerp(theme.innerColor, normR / 0.25);
      } else if (normR < 0.65) {
        color.copy(theme.innerColor).lerp(theme.midColor, (normR - 0.25) / 0.4);
      } else {
        color.copy(theme.midColor).lerp(theme.outerColor, (normR - 0.65) / 0.35);
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    this.currentBuffer = new Float32Array(this.shapes.palm);

    geometry.setAttribute('position', new THREE.BufferAttribute(initialPositions.slice(), 3));
    geometry.setAttribute('aStartPos', new THREE.BufferAttribute(this.shapes.fist.slice(), 3));
    geometry.setAttribute('aEndPos', new THREE.BufferAttribute(this.shapes.palm.slice(), 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
    geometry.setAttribute('aTwinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMorphProgress: { value: 1.0 }, // 0.0 (start) -> 1.0 (end)
        uPointSizeScale: { value: window.innerHeight * 0.85 },
        uAudioBass: { value: 0.0 },
        uAudioIntensity: { value: 0.0 },
        uShapeMode: { value: 0.0 }, // 0: Galaxy, 1: Sphere, 2: Beam, 3: Rings, 4: Pinch, 5: Portal, 6: Supernova, 7: Energy Ball, 8: Geometry
        uGravityMode: { value: 0.0 }, // 0: Off, 1: Attract, 2: Repel, 3: Orbit
        uGravityCenter: { value: new THREE.Vector3(0, 0, 0) },
        uGravityStrength: { value: 1.0 },
        uSupernovaProgress: { value: 0.0 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uMorphProgress;
        uniform float uPointSizeScale;
        uniform float uAudioBass;
        uniform float uAudioIntensity;
        uniform float uShapeMode;
        uniform float uGravityMode;
        uniform vec3 uGravityCenter;
        uniform float uGravityStrength;
        uniform float uSupernovaProgress;

        attribute vec3 aStartPos;
        attribute vec3 aEndPos;
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aRandom;
        attribute float aTwinkleSpeed;

        varying vec3 vColor;
        varying float vAlpha;
        varying float vGlow;

        void main() {
          float t = smoothstep(0.0, 1.0, uMorphProgress);

          // 1. Start Shape Dynamics
          vec3 pStart = aStartPos;

          // 2. Target Shape Dynamics
          vec3 pEnd = aEndPos;
          float distEnd = length(pEnd.xz);

          if (uShapeMode < 0.5) {
            // Galaxy / Expanded Galaxy / Solar System: Differential Galactic Rotation
            float rotSpeed = (12.0 / (distEnd + 15.0));
            float gAngle = uTime * rotSpeed * 0.35;
            float cosG = cos(gAngle);
            float sinG = sin(gAngle);
            pEnd.xz = vec2(
              pEnd.x * cosG - pEnd.z * sinG,
              pEnd.x * sinG + pEnd.z * cosG
            );
          } else if (uShapeMode > 0.5 && uShapeMode < 1.5) {
            // Sphere / Singularity: High speed rotation & plasma vibration
            float sAngle = uTime * 1.8;
            float cosS = cos(sAngle);
            float sinS = sin(sAngle);
            pEnd.xz = vec2(
              pEnd.x * cosS - pEnd.z * sinS,
              pEnd.x * sinS + pEnd.z * cosS
            );
            float pulse = sin(uTime * 8.0 + aRandom * 15.0) * 0.45;
            pEnd += normalize(pEnd + 0.001) * pulse;
          } else if (uShapeMode > 1.5 && uShapeMode < 2.5) {
            // Beam Mode: Rapid axial particle velocity streaming along Z
            float speed = 25.0 * (0.8 + aRandom * 0.4);
            pEnd.z = mod(pEnd.z + uTime * speed + 55.0, 110.0) - 55.0;
            // Beam rotation
            float bAngle = uTime * 3.5;
            float cosB = cos(bAngle);
            float sinB = sin(bAngle);
            pEnd.xy = vec2(
              pEnd.x * cosB - pEnd.y * sinB,
              pEnd.x * sinB + pEnd.y * cosB
            );
          } else if (uShapeMode > 2.5 && uShapeMode < 3.8) {
            // Rings Mode (2, 3, or 4 Rotating Orthogonal & Gyroscopic Rings)
            float rAngle1 = uTime * 1.5;
            float cosR1 = cos(rAngle1);
            float sinR1 = sin(rAngle1);
            pEnd.xy = vec2(
              pEnd.x * cosR1 - pEnd.y * sinR1,
              pEnd.x * sinR1 + pEnd.y * cosR1
            );
            // Counter-rotation on YZ plane
            float rAngle2 = -uTime * 1.2;
            float cosR2 = cos(rAngle2);
            float sinR2 = sin(rAngle2);
            pEnd.yz = vec2(
              pEnd.y * cosR2 - pEnd.z * sinR2,
              pEnd.y * sinR2 + pEnd.z * cosR2
            );
            if (uShapeMode > 3.1) {
              // 3rd axis gyroscopic tumble for 3 and 4 rings
              float rAngle3 = uTime * 0.9;
              float cosR3 = cos(rAngle3);
              float sinR3 = sin(rAngle3);
              pEnd.xz = vec2(
                pEnd.x * cosR3 - pEnd.z * sinR3,
                pEnd.x * sinR3 + pEnd.z * cosR3
              );
            }
          } else if (uShapeMode > 3.8 && uShapeMode < 4.5) {
            // Pinch Mode: Rapid magnetic vortex swirl
            float pAngle = uTime * 4.0;
            float cosP = cos(pAngle);
            float sinP = sin(pAngle);
            pEnd.xz = vec2(
              pEnd.x * cosP - pEnd.z * sinP,
              pEnd.x * sinP + pEnd.z * cosP
            );
          } else if (uShapeMode > 4.5 && uShapeMode < 5.5) {
            // Space Portal / Wormhole Funnel: High speed vortex suction along Z
            float pAngle = uTime * 5.0 + pEnd.z * 0.15;
            float cosP = cos(pAngle);
            float sinP = sin(pAngle);
            pEnd.xy = vec2(
              pEnd.x * cosP - pEnd.y * sinP,
              pEnd.x * sinP + pEnd.y * cosP
            );
          } else if (uShapeMode > 5.5 && uShapeMode < 6.5) {
            // Supernova: Explosive blast wave expansion
            float blast = sin(uTime * 10.0 + aRandom * 6.28) * 2.0;
            pEnd += normalize(pEnd + 0.001) * (uSupernovaProgress * 45.0 + blast);
          } else if (uShapeMode > 6.5 && uShapeMode < 7.5) {
            // Energy Ball: High-frequency electrical plasma vibration
            float vib = sin(uTime * 18.0 + aRandom * 25.0) * 0.8;
            pEnd += normalize(pEnd + 0.001) * vib;
          } else if (uShapeMode > 7.5) {
            // 3D Geometric Formations (Cube, Pyramid, Star, Diamond, Torus): Multiaxial tumble
            float gAngleY = uTime * 0.55;
            float cosY = cos(gAngleY);
            float sinY = sin(gAngleY);
            pEnd.xz = vec2(pEnd.x * cosY - pEnd.z * sinY, pEnd.x * sinY + pEnd.z * cosY);
            float gAngleX = uTime * 0.35;
            float cosX = cos(gAngleX);
            float sinX = sin(gAngleX);
            pEnd.yz = vec2(pEnd.y * cosX - pEnd.z * sinX, pEnd.y * sinX + pEnd.z * cosX);
          }

          // 3. Fluid Swirl Path During Transformation
          float morphTwist = sin(uMorphProgress * 3.14159) * 1.2;
          float twistAngle = (1.0 - t) * morphTwist * (aRandom - 0.5) * 3.0;
          float cosT = cos(twistAngle);
          float sinT = sin(twistAngle);

          vec3 morphedPos = mix(pStart, pEnd, t);
          morphedPos.xz = vec2(
            morphedPos.x * cosT - morphedPos.z * sinT,
            morphedPos.x * sinT + morphedPos.z * cosT
          );

          // 4. Gravity Field Manipulation (Attract / Repel / Orbit)
          if (uGravityMode > 0.5) {
            vec3 toGrav = uGravityCenter - morphedPos;
            float gravDist = length(toGrav);
            vec3 gravDir = toGrav / (gravDist + 1.0);
            float influence = exp(-gravDist * 0.035) * uGravityStrength;

            if (uGravityMode < 1.5) {
              // Gravitational Attraction
              morphedPos += gravDir * min(influence * 24.0, gravDist * 0.85);
            } else if (uGravityMode < 2.5) {
              // Antigravity Repulsion
              morphedPos -= gravDir * (influence * 32.0);
            } else {
              // Orbital Swirl
              vec3 orbitTang = cross(vec3(0.0, 1.0, 0.0), gravDir);
              morphedPos += (gravDir * 6.0 + orbitTang * 22.0) * influence;
            }
          }

          // 5. Audio Reactive Wave
          if (uAudioIntensity > 0.05) {
            float audioWave = sin(uTime * 10.0 + distEnd * 0.25) * uAudioBass * 3.5;
            morphedPos += normalize(morphedPos + 0.001) * audioWave;
          }

          vec4 mvPosition = modelViewMatrix * vec4(morphedPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Responsive point size with distance attenuation + audio boost
          float sizeFactor = mix(1.3, 1.0, t) + uAudioBass * 0.5;
          if (uShapeMode > 1.5 && uShapeMode < 2.5) sizeFactor *= 1.35; // Brighten beam
          if (uShapeMode > 5.5 && uShapeMode < 6.5) sizeFactor *= 1.5; // Brighten supernova
          gl_PointSize = aSize * sizeFactor * (uPointSizeScale / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 1.5, 65.0);

          // Color modulation
          vColor = aColor;
          if (uShapeMode > 0.5 && uShapeMode < 1.5) {
            // White-hot energetic glow for sphere singularity
            vColor = mix(vColor, vec3(1.0, 0.95, 0.85), 0.45);
          } else if (uShapeMode > 1.5 && uShapeMode < 2.5) {
            // Electric cyan-white for beam
            vColor = mix(vColor, vec3(0.7, 0.95, 1.0), 0.55);
          } else if (uShapeMode > 3.5 && uShapeMode < 4.5) {
            // High energy magenta-pink for pinch
            vColor = mix(vColor, vec3(1.0, 0.4, 0.8), 0.6);
          } else if (uShapeMode > 4.5 && uShapeMode < 5.5) {
            // Deep violet / cyan event horizon for portal
            vColor = mix(vColor, vec3(0.35, 0.85, 1.0), 0.65);
          } else if (uShapeMode > 5.5 && uShapeMode < 6.5) {
            // Thermonuclear solar gold / orange for supernova
            vColor = mix(vColor, vec3(1.0, 0.75, 0.25), 0.85);
          } else if (uShapeMode > 6.5 && uShapeMode < 7.5) {
            // Electric blue-white plasma for energy ball
            vColor = mix(vColor, vec3(0.65, 0.9, 1.0), 0.75);
          } else if (uShapeMode > 7.5) {
            // Geometric shapes: Emerald crystal matrix
            vColor = mix(vColor, vec3(0.45, 1.0, 0.85), 0.45);
          }

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
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          float core = smoothstep(0.12, 0.0, dist);
          float halo = exp(-dist * 5.0);

          vec3 finalColor = vColor * halo + vec3(1.0) * core * 0.8;
          finalColor += vGlow * vec3(0.2, 0.1, 0.3) * halo;

          gl_FragColor = vec4(finalColor, (halo + core * 0.5) * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(geometry, this.material);
    this.scene.add(this.points);
  }

  createCoreGlow() {
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

  /**
   * Instantly transitions the 75,000 particle stars into the gesture's 3D formation
   * @param {string} gesture - 'fist' | 'palm' | 'point' | 'two_fingers' | 'pinch' | 'both_open' | 'both_closed'
   */
  setGestureFormation(gesture) {
    const targetShape = this.getShape(gesture);
    if (!targetShape || this.activeGesture === gesture) return;

    const geom = this.points.geometry;
    const startAttr = geom.attributes.aStartPos;
    const endAttr = geom.attributes.aEndPos;

    // Snapshot current position buffer into start buffer
    const t = Math.min(1.0, this.morphProgress);
    const count3 = this.particleCount * 3;
    const sArr = startAttr.array;
    const eArr = endAttr.array;

    for (let i = 0; i < count3; i++) {
      sArr[i] = sArr[i] + (eArr[i] - sArr[i]) * t;
    }
    startAttr.needsUpdate = true;

    // Set target shape into end buffer
    endAttr.array.set(targetShape);
    endAttr.needsUpdate = true;

    // Set shape mode uniform for specialized shader dynamics
    let modeVal = 0.0;
    if (gesture === 'fist' || gesture === 'both_closed') modeVal = 1.0;
    else if (gesture === 'point') modeVal = 2.0;
    else if (gesture === 'two_fingers') modeVal = 3.0;
    else if (gesture === 'three_fingers') modeVal = 3.3;
    else if (gesture === 'four_fingers') modeVal = 3.6;
    else if (gesture === 'pinch') modeVal = 4.0;
    else if (gesture === 'portal') modeVal = 5.0;
    else if (gesture === 'supernova') modeVal = 6.0;
    else if (gesture === 'energy_ball') modeVal = 7.0;
    else if (['cube', 'pyramid', 'star', 'diamond', 'torus'].includes(gesture)) modeVal = 8.0;

    if (this.material) {
      this.material.uniforms.uShapeMode.value = modeVal;
      if (gesture !== 'supernova') {
        this.material.uniforms.uSupernovaProgress.value = 0.0;
      }
    }

    this.activeGesture = gesture;
    this.morphProgress = 0.0; // Trigger instant smooth GPU animation to new shape
  }

  setGravityField(mode = 0, center = { x: 0, y: 0, z: 0 }, strength = 1.0) {
    if (this.material) {
      this.material.uniforms.uGravityMode.value = mode;
      this.material.uniforms.uGravityCenter.value.set(center.x || 0, center.y || 0, center.z || 0);
      this.material.uniforms.uGravityStrength.value = strength;
    }
  }

  triggerSupernova() {
    this.setGestureFormation('supernova');
    if (this.material) {
      this.material.uniforms.uSupernovaProgress.value = 1.0;
    }
  }

  setTheme(themeKey) {
    if (!GALAXY_THEMES[themeKey]) return;
    this.currentTheme = themeKey;
    const theme = GALAXY_THEMES[themeKey];

    const colorsAttr = this.points.geometry.attributes.aColor;
    const pos = this.points.geometry.attributes.aEndPos.array;
    const colors = colorsAttr.array;
    const count = this.particleCount;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.hypot(pos[i3], pos[i3 + 2]);
      const normR = Math.min(r / 55.0, 1.0);

      const color = new THREE.Color();
      if (normR < 0.25) {
        color.copy(theme.coreColor).lerp(theme.innerColor, normR / 0.25);
      } else if (normR < 0.65) {
        color.copy(theme.innerColor).lerp(theme.midColor, (normR - 0.25) / 0.4);
      } else {
        color.copy(theme.midColor).lerp(theme.outerColor, (normR - 0.65) / 0.35);
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    colorsAttr.needsUpdate = true;
  }

  updateAudio(audioData) {
    if (this.material && audioData) {
      this.material.uniforms.uAudioBass.value = audioData.bass || 0;
      this.material.uniforms.uAudioIntensity.value = audioData.overall || 0;
    }
  }

  update(elapsedTime) {
    // Advance morphProgress at 60 FPS
    if (this.morphProgress < 1.0) {
      this.morphProgress += (1.0 - this.morphProgress) * this.morphSpeed + 0.015;
      if (this.morphProgress > 0.99) this.morphProgress = 1.0;
    }

    if (this.material) {
      this.material.uniforms.uTime.value = elapsedTime;
      this.material.uniforms.uMorphProgress.value = this.morphProgress;
      if (this.material.uniforms.uSupernovaProgress.value > 0) {
        this.material.uniforms.uSupernovaProgress.value = Math.max(0, this.material.uniforms.uSupernovaProgress.value - 0.008);
      }
    }

    if (this.coreSprite) {
      this.coreSprite.position.copy(this.points.position);
      const isSphere = this.activeGesture === 'fist' || this.activeGesture === 'both_closed';
      const pulse = 1.0 + Math.sin(elapsedTime * 6.0) * 0.15;
      const coreScale = (14.0 + (isSphere ? 16.0 : 0.0)) * pulse;
      this.coreSprite.scale.set(coreScale, coreScale, 1);
      this.coreSprite.material.opacity = isSphere ? 0.95 : 0.65;
    }
  }

  dispose() {
    if (this.points) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
      this.material.dispose();
    }
    if (this.coreSprite) {
      this.scene.remove(this.coreSprite);
      this.coreSprite.material.dispose();
    }
  }
}
