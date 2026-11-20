import * as THREE from 'three';

export class ShootingStarsManager {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.stars = [];
    this.maxStars = 6;
    this.spawnTimer = 0;

    this.createStarPool();
    this.scene.add(this.group);
  }

  createStarPool() {
    for (let i = 0; i < this.maxStars; i++) {
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array(6); // 2 points (head and tail)
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });

      const line = new THREE.Line(geom, mat);
      this.group.add(line);

      this.stars.push({
        line,
        active: false,
        head: new THREE.Vector3(),
        tail: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1.2
      });
    }
  }

  spawnStar() {
    const star = this.stars.find((s) => !s.active);
    if (!star) return;

    // Random start point in distant celestial hemisphere
    const angle = Math.random() * Math.PI * 2;
    const startX = Math.cos(angle) * (80 + Math.random() * 40);
    const startY = 30 + Math.random() * 30;
    const startZ = Math.sin(angle) * (80 + Math.random() * 40);

    star.head.set(startX, startY, startZ);
    star.tail.copy(star.head);

    // Velocity shooting downward & across space
    star.velocity.set(
      (-startX * 0.5 + (Math.random() - 0.5) * 50) * 1.5,
      (-startY * 0.8 - 20) * 1.5,
      (-startZ * 0.5 + (Math.random() - 0.5) * 50) * 1.5
    );

    star.life = 0;
    star.maxLife = 0.8 + Math.random() * 0.6;
    star.active = true;
    star.line.material.opacity = 1.0;
  }

  update(delta) {
    this.spawnTimer += delta;
    if (this.spawnTimer > 1.8) {
      this.spawnTimer = 0;
      if (Math.random() < 0.7) {
        this.spawnStar();
      }
    }

    this.stars.forEach((star) => {
      if (!star.active) return;

      star.life += delta;
      const progress = star.life / star.maxLife;

      if (progress >= 1.0) {
        star.active = false;
        star.line.material.opacity = 0;
        return;
      }

      // Advance head
      star.head.addScaledVector(star.velocity, delta);

      // Tail follows behind head
      const trailLength = 12.0;
      const dir = star.velocity.clone().normalize().negate();
      star.tail.copy(star.head).addScaledVector(dir, trailLength);

      const posAttr = star.line.geometry.attributes.position;
      posAttr.setXYZ(0, star.head.x, star.head.y, star.head.z);
      posAttr.setXYZ(1, star.tail.x, star.tail.y, star.tail.z);
      posAttr.needsUpdate = true;

      // Opacity fade curve (quick fade in, then trail fade out)
      const opacity = Math.sin(progress * Math.PI);
      star.line.material.opacity = opacity * 0.9;
    });
  }

  dispose() {
    this.scene.remove(this.group);
  }
}
