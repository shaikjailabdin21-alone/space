import * as THREE from 'three';

/**
 * Supernova Manager
 * Manages cinematic thermonuclear explosion, expanding shockwave ring and core flash
 */
export class SupernovaManager {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.isExploding = false;
    this.progress = 0.0;
    this.duration = 2.4; // seconds

    this.initShockwaveRing();
    this.initFlashCore();
    this.scene.add(this.group);
  }

  initShockwaveRing() {
    const ringGeom = new THREE.RingGeometry(0.5, 3.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });
    this.shockwave = new THREE.Mesh(ringGeom, ringMat);
    this.shockwave.rotation.x = Math.PI * 0.5;
    this.group.add(this.shockwave);
  }

  initFlashCore() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(254, 240, 138, 0.9)');
    grad.addColorStop(0.7, 'rgba(249, 115, 22, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const flashMat = new THREE.SpriteMaterial({
      map: texture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.0
    });
    this.flashSprite = new THREE.Sprite(flashMat);
    this.flashSprite.scale.set(1, 1, 1);
    this.group.add(this.flashSprite);
  }

  trigger() {
    this.isExploding = true;
    this.progress = 0.0;
  }

  update(delta) {
    if (!this.isExploding) return;

    this.progress += delta / this.duration;

    if (this.progress >= 1.0) {
      this.isExploding = false;
      this.progress = 0.0;
      this.shockwave.material.opacity = 0.0;
      this.flashSprite.material.opacity = 0.0;
      return;
    }

    const t = this.progress;

    // Expanding shockwave ring (scales up from 1 to 35)
    const ringScale = Math.pow(t, 0.6) * 36.0;
    this.shockwave.scale.set(ringScale, ringScale, 1);
    this.shockwave.material.opacity = Math.sin(t * Math.PI) * 0.95;

    // Blinding core flash (rapid burst in first 30%, then decay)
    let flashScale, flashAlpha;
    if (t < 0.25) {
      flashScale = (t / 0.25) * 55.0;
      flashAlpha = 1.0;
    } else {
      flashScale = 55.0 + (t - 0.25) * 20.0;
      flashAlpha = Math.max(0.0, 1.0 - (t - 0.25) / 0.75);
    }

    this.flashSprite.scale.set(flashScale, flashScale, 1);
    this.flashSprite.material.opacity = flashAlpha;
  }

  dispose() {
    this.shockwave.geometry.dispose();
    this.shockwave.material.dispose();
    this.flashSprite.material.dispose();
    this.scene.remove(this.group);
  }
}
