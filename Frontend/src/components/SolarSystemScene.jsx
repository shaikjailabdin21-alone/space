import * as THREE from 'three';

/**
 * Solar System Mode
 * Real 3D Sun with glowing corona flare, 8 orbiting planetary bodies, and orbital path rings
 */
export class SolarSystemScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.planets = [];
    this.orbitLines = [];
    this.visible = false;
    this.opacity = 0.0;
    this.targetOpacity = 0.0;

    this.initSun();
    this.initPlanets();
    this.scene.add(this.group);
  }

  initSun() {
    // Sun sphere core
    const sunGeom = new THREE.SphereGeometry(7.5, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95
    });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.group.add(this.sunMesh);

    // Corona flare sprite
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.25, 'rgba(251, 191, 36, 0.85)');
    grad.addColorStop(0.6, 'rgba(249, 115, 22, 0.4)');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const coronaMat = new THREE.SpriteMaterial({
      map: texture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.95
    });
    this.sunCorona = new THREE.Sprite(coronaMat);
    this.sunCorona.scale.set(38, 38, 1);
    this.group.add(this.sunCorona);
  }

  initPlanets() {
    const planetData = [
      { name: 'Mercury', r: 1.0, orbit: 16, speed: 1.8, color: 0x94a3b8 },
      { name: 'Venus',   r: 1.6, orbit: 24, speed: 1.3, color: 0xfde047 },
      { name: 'Earth',   r: 1.8, orbit: 33, speed: 1.0, color: 0x38bdf8, hasMoon: true },
      { name: 'Mars',    r: 1.2, orbit: 43, speed: 0.8, color: 0xf87171 },
      { name: 'Jupiter', r: 4.2, orbit: 57, speed: 0.45, color: 0xfbbf24 },
      { name: 'Saturn',  r: 3.5, orbit: 73, speed: 0.32, color: 0xfef08a, hasRings: true },
      { name: 'Uranus',  r: 2.5, orbit: 89, speed: 0.22, color: 0x67e8f9 },
      { name: 'Neptune', r: 2.4, orbit: 105, speed: 0.16, color: 0x60a5fa }
    ];

    planetData.forEach((data) => {
      // 1. Orbital Path Ring
      const orbitPoints = [];
      const segments = 96;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(Math.cos(theta) * data.orbit, 0, Math.sin(theta) * data.orbit));
      }
      const orbitGeom = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending
      });
      const orbitLine = new THREE.Line(orbitGeom, orbitMat);
      this.group.add(orbitLine);
      this.orbitLines.push(orbitLine);

      // 2. Planet Sphere Mesh
      const geom = new THREE.SphereGeometry(data.r, 24, 24);
      const mat = new THREE.MeshBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.95
      });
      const planetMesh = new THREE.Mesh(geom, mat);

      // Planet container for orbit rotation
      const pivot = new THREE.Group();
      pivot.add(planetMesh);
      planetMesh.position.set(data.orbit, 0, 0);

      // Saturn Rings
      if (data.hasRings) {
        const ringGeom = new THREE.RingGeometry(data.r * 1.5, data.r * 2.8, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xfde047,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.65,
          blending: THREE.AdditiveBlending
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.rotation.x = Math.PI * 0.4;
        planetMesh.add(ringMesh);
      }

      // Earth Moon
      if (data.hasMoon) {
        const moonGeom = new THREE.SphereGeometry(0.4, 12, 12);
        const moonMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const moonMesh = new THREE.Mesh(moonGeom, moonMat);
        moonMesh.position.set(3.2, 0, 0);
        const moonPivot = new THREE.Group();
        moonPivot.add(moonMesh);
        planetMesh.add(moonPivot);
        data.moonPivot = moonPivot;
      }

      this.group.add(pivot);
      this.planets.push({
        pivot,
        mesh: planetMesh,
        speed: data.speed,
        rotSpeed: 0.02 + Math.random() * 0.03,
        moonPivot: data.moonPivot
      });
    });
  }

  setVisible(active) {
    this.targetOpacity = active ? 1.0 : 0.0;
  }

  update(delta, elapsed) {
    // Smooth transition
    this.opacity += (this.targetOpacity - this.opacity) * 0.1;
    this.group.visible = this.opacity > 0.01;
    if (!this.group.visible) return;

    // Pulse Sun
    if (this.sunCorona) {
      const pulse = 1.0 + Math.sin(elapsed * 4.0) * 0.08;
      this.sunCorona.scale.set(38 * pulse, 38 * pulse, 1);
      this.sunCorona.material.opacity = 0.95 * this.opacity;
    }
    if (this.sunMesh) {
      this.sunMesh.material.opacity = 0.95 * this.opacity;
    }

    // Orbit lines opacity
    this.orbitLines.forEach((line) => {
      line.material.opacity = 0.25 * this.opacity;
    });

    // Orbit planets
    this.planets.forEach((p) => {
      p.pivot.rotation.y += p.speed * delta * 0.6;
      p.mesh.rotation.y += p.rotSpeed;
      p.mesh.material.opacity = 0.95 * this.opacity;
      if (p.moonPivot) {
        p.moonPivot.rotation.y += delta * 2.5;
      }
    });
  }

  dispose() {
    this.orbitLines.forEach((l) => {
      l.geometry.dispose();
      l.material.dispose();
    });
    this.planets.forEach((p) => {
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    });
    if (this.sunMesh) {
      this.sunMesh.geometry.dispose();
      this.sunMesh.material.dispose();
    }
    this.scene.remove(this.group);
  }
}
