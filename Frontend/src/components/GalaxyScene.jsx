import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ParticleSystem } from './ParticleSystem';
import { ShootingStarsManager } from './ShootingStars';
import { DynamicNebula } from './DynamicNebula';

export const GalaxyScene = ({
  gesture    = 'palm',
  handOffset = { x: 0, y: 0, z: 1.0 },
}) => {
  const mountRef = useRef(null);

  // Stable refs — updated each render without re-triggering the setup effect
  const gestureRef    = useRef(gesture);
  const handOffsetRef = useRef(handOffset);

  useEffect(() => { gestureRef.current    = gesture;    }, [gesture]);
  useEffect(() => { handOffsetRef.current = handOffset; }, [handOffset]);

  // Reactive: update particle formation whenever gesture changes
  const particlesRef = useRef(null);
  useEffect(() => {
    particlesRef.current?.setGestureFormation(gesture);
  }, [gesture]);

  // One-time Three.js scene setup
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    // ── Scene ──────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog   = new THREE.FogExp2(0x030712, 0.004);

    // ── Camera ─────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 2000);
    camera.position.set(0, 35, 80);
    camera.lookAt(0, 0, 0);

    // ── Renderer ───────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x030712, 1);
    mount.appendChild(renderer.domElement);

    // ── Deep Background Stars (5 000) ──────────────
    const bgCount  = 5000;
    const bgGeom   = new THREE.BufferGeometry();
    const bgPos    = new Float32Array(bgCount * 3);
    const bgCol    = new Float32Array(bgCount * 3);
    const palette  = [
      new THREE.Color(0x94a3b8),
      new THREE.Color(0x38bdf8),
      new THREE.Color(0xc084fc),
      new THREE.Color(0xffffff),
    ];
    for (let i = 0; i < bgCount; i++) {
      const i3  = i * 3;
      const r   = 300 + Math.random() * 600;
      const th  = Math.random() * Math.PI * 2;
      const ph  = Math.acos(2 * Math.random() - 1);
      bgPos[i3]     = r * Math.sin(ph) * Math.cos(th);
      bgPos[i3 + 1] = r * Math.sin(ph) * Math.sin(th);
      bgPos[i3 + 2] = r * Math.cos(ph);
      const c = palette[Math.floor(Math.random() * palette.length)];
      bgCol[i3] = c.r; bgCol[i3 + 1] = c.g; bgCol[i3 + 2] = c.b;
    }
    bgGeom.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
    bgGeom.setAttribute('color',    new THREE.BufferAttribute(bgCol, 3));
    const bgMat  = new THREE.PointsMaterial({ size: 1.8, vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
    const bgStars = new THREE.Points(bgGeom, bgMat);
    scene.add(bgStars);

    // ── Particle Galaxy (75 000 stars) ─────────────
    const particles = new ParticleSystem(scene, 75000);
    particles.setGestureFormation('palm');
    particlesRef.current = particles;


    // ── Shooting Stars ─────────────────────────────
    const shootingStars = new ShootingStarsManager(scene);

    // ── Dynamic Nebula Clouds ──────────────────────
    const nebula = new DynamicNebula(scene);

    // ── Smooth motion state ────────────────────────
    const smoothOffset = new THREE.Vector3(0, 0, 0);
    const smoothRot    = new THREE.Vector2(0, 0);
    let   smoothZoom   = 1.0;

    // ── Resize Handler ─────────────────────────────
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      if (particles?.material?.uniforms?.uPointSizeScale)
        particles.material.uniforms.uPointSizeScale.value = h * 0.85;
    };
    window.addEventListener('resize', onResize);

    // ── Render Loop ────────────────────────────────
    const clock = new THREE.Clock();
    let   animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const delta   = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      const hOff = handOffsetRef.current || { x: 0, y: 0, z: 1.0 };
      const rawX = hOff.x || 0;
      const rawY = hOff.y || 0;
      const rawZ = hOff.z || 1.0;

      // Target position from hand
      const tgtX    = rawX * 80.0;
      const tgtY    = rawY * 55.0;
      const tgtZoom = THREE.MathUtils.clamp(rawZ, 0.4, 2.6);

      // Smooth lerp — prevents jitter
      smoothOffset.x  += (tgtX    - smoothOffset.x)  * 0.16;
      smoothOffset.y  += (tgtY    - smoothOffset.y)   * 0.16;
      smoothRot.y     += (rawX * 1.2  - smoothRot.y)  * 0.16;
      smoothRot.x     += (-rawY * 0.9 - smoothRot.x)  * 0.16;
      smoothZoom      += (tgtZoom  - smoothZoom)       * 0.12;

      // Move & rotate particle mesh
      const mesh = particles.points;
      mesh.position.x = smoothOffset.x;
      mesh.position.y = smoothOffset.y;

      const g = gestureRef.current;
      if (g === 'point') {
        mesh.rotation.y = smoothRot.y * 1.8;
        mesh.rotation.x = smoothRot.x * 1.8;
      } else {
        const spin = Math.abs(rawX) > 0.18 ? rawX * delta * 1.1 : 0;
        mesh.rotation.y += smoothRot.y * 0.045 + spin + delta * 0.24;
        mesh.rotation.x  = smoothRot.x + 0.32;
      }

      particles.update(elapsed);
      shootingStars.update(delta);
      nebula.update(elapsed);

      // Slow background star drift
      bgStars.rotation.y = elapsed * 0.0025;

      // Parallax camera
      const camZ = 80.0 / smoothZoom;
      camera.position.z += (camZ            - camera.position.z) * 0.09;
      camera.position.x += (rawX * 28.0     - camera.position.x) * 0.11;
      camera.position.y += (35.0 + rawY * 18.0 - camera.position.y) * 0.11;
      camera.lookAt(smoothOffset.x * 0.55, smoothOffset.y * 0.55, 0);

      renderer.render(scene, camera);
    };

    animate();

    // ── Cleanup ────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      particles.dispose();
      shootingStars.dispose();
      nebula.dispose();
      particlesRef.current = null;
      if (mount && renderer.domElement.parentNode === mount)
        mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []); // runs once

  return <div id="canvas-container" ref={mountRef} />;
};

export default GalaxyScene;
