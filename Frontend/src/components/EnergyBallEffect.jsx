import * as THREE from 'three';

/**
 * Energy Ball Effect
 * Interactive glowing plasma orb generated between user's hands with dynamic electrical corona
 */
export class EnergyBallEffect {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.visible = false;
    this.targetOpacity = 0.0;
    this.opacity = 0.0;

    this.initCore();
    this.initElectricArcs();
    this.scene.add(this.group);
  }

  initCore() {
    // 1. Inner hot core
    const coreGeom = new THREE.SphereGeometry(3.5, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95
    });
    this.coreMesh = new THREE.Mesh(coreGeom, coreMat);
    this.group.add(this.coreMesh);

    // 2. Swirling plasma outer shell with custom Fresnel-like shader
    const plasmaGeom = new THREE.SphereGeometry(6.2, 32, 32);
    const plasmaMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1.0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float uTime;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          // Plasma ripple displacement
          float ripple = sin(position.x * 3.0 + uTime * 8.0) * cos(position.y * 3.0 + uTime * 6.0) * 0.35;
          vec3 newPos = position + normal * ripple;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float uTime;
        uniform float uIntensity;

        void main() {
          float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
          rim = pow(rim, 2.2);

          // Electric cyan & magenta plasma blend
          vec3 col1 = vec3(0.2, 0.85, 1.0);
          vec3 col2 = vec3(0.9, 0.3, 1.0);
          float blend = sin(vPosition.y * 4.0 + uTime * 10.0) * 0.5 + 0.5;
          vec3 color = mix(col1, col2, blend);

          gl_FragColor = vec4(color + vec3(1.0) * rim * 0.8, rim * 0.85 * uIntensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    this.plasmaMesh = new THREE.Mesh(plasmaGeom, plasmaMat);
    this.group.add(this.plasmaMesh);

    // 3. Radial Halo
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(56, 189, 248, 0.85)');
    grad.addColorStop(0.65, 'rgba(192, 132, 252, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.95
    });
    this.haloSprite = new THREE.Sprite(spriteMat);
    this.haloSprite.scale.set(24, 24, 1);
    this.group.add(this.haloSprite);
  }

  initElectricArcs() {
    const arcCount = 4;
    this.arcs = [];

    for (let a = 0; a < arcCount; a++) {
      const curve = new THREE.EllipseCurve(0, 0, 8.5, 8.5, 0, 2 * Math.PI, false, 0);
      const points = curve.getPoints(48);
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending
      });
      const line = new THREE.Line(geom, mat);
      line.rotation.x = Math.random() * Math.PI;
      line.rotation.y = Math.random() * Math.PI;
      this.group.add(line);
      this.arcs.push({
        line,
        rotSpeedX: 0.05 + Math.random() * 0.08,
        rotSpeedY: 0.05 + Math.random() * 0.08
      });
    }
  }

  setActive(active) {
    this.targetOpacity = active ? 1.0 : 0.0;
  }

  setPosition(pos) {
    if (pos) {
      this.group.position.set(pos.x || 0, pos.y || 0, pos.z || 0);
    }
  }

  update(delta, elapsed, intensity = 1.0) {
    this.opacity += (this.targetOpacity - this.opacity) * 0.12;
    this.group.visible = this.opacity > 0.01;
    if (!this.group.visible) return;

    // Pulse core
    const pulse = 1.0 + Math.sin(elapsed * 12.0) * 0.12 * intensity;
    this.coreMesh.scale.setScalar(pulse);
    this.plasmaMesh.scale.setScalar(pulse * 1.05);
    this.haloSprite.scale.set(24 * pulse, 24 * pulse, 1);

    if (this.plasmaMesh.material.uniforms) {
      this.plasmaMesh.material.uniforms.uTime.value = elapsed;
      this.plasmaMesh.material.uniforms.uIntensity.value = this.opacity * intensity;
    }

    this.coreMesh.material.opacity = 0.95 * this.opacity;
    this.haloSprite.material.opacity = 0.95 * this.opacity;

    // Rotate electric arcs
    this.arcs.forEach((arc) => {
      arc.line.rotation.x += arc.rotSpeedX;
      arc.line.rotation.y += arc.rotSpeedY;
      arc.line.material.opacity = 0.75 * this.opacity;
    });
  }

  dispose() {
    this.coreMesh.geometry.dispose();
    this.coreMesh.material.dispose();
    this.plasmaMesh.geometry.dispose();
    this.plasmaMesh.material.dispose();
    this.arcs.forEach((a) => {
      a.line.geometry.dispose();
      a.line.material.dispose();
    });
    this.scene.remove(this.group);
  }
}
