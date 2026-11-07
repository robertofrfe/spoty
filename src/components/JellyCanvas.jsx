import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { audioEngine } from "../services/audioEngine";

export default function JellyCanvas({ theme = "berry", isExtreme = false }) {
  const mountRef = useRef(null);

  // Theme color mapping for jelly material & lighting
  const themeColors = {
    berry: {
      jelly: 0x9333ea,
      emissive: 0xdb2777,
      light1: 0xff007f,
      light2: 0x8b5cf6,
    },
    mint: {
      jelly: 0x059669,
      emissive: 0x10b981,
      light1: 0x34d399,
      light2: 0x06b6d4,
    },
    bubblegum: {
      jelly: 0xec4899,
      emissive: 0xf43f5e,
      light1: 0xfb7185,
      light2: 0xf472b6,
    },
    ocean: {
      jelly: 0x2563eb,
      emissive: 0x06b6d4,
      light1: 0x38bdf8,
      light2: 0x6366f1,
    },
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 380;
    const height = container.clientHeight || 240;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 2. Lighting for gelatinous translucency and glossy sheen
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const colors = themeColors[theme] || themeColors.berry;

    const pointLight1 = new THREE.PointLight(colors.light1, 4.5, 12);
    pointLight1.position.set(3, 3, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(colors.light2, 3.5, 12);
    pointLight2.position.set(-3, -2, 2);
    scene.add(pointLight2);

    const rimLight = new THREE.DirectionalLight(0xffffff, 2.5);
    rimLight.position.set(0, 4, -2);
    scene.add(rimLight);

    // 3. Jelly Geometry & Physical Translucent Material
    const geometry = new THREE.IcosahedronGeometry(1.65, 32);
    const originalPositions = geometry.attributes.position.clone();

    const jellyMaterial = new THREE.MeshPhysicalMaterial({
      color: colors.jelly,
      emissive: colors.emissive,
      emissiveIntensity: 0.25,
      roughness: 0.1,
      metalness: 0.05,
      transmission: 0.85,
      ior: 1.45,
      thickness: 2.2,
      specularIntensity: 1.2,
      specularColor: 0xffffff,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.95,
    });

    const jellyMesh = new THREE.Mesh(geometry, jellyMaterial);
    scene.add(jellyMesh);

    // Particles system for acoustic bursts
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = [];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = 0;
      particlePositions[i * 3 + 1] = 0;
      particlePositions[i * 3 + 2] = 0;
      particleVelocities.push({
        x: (Math.random() - 0.5) * 0.08,
        y: (Math.random() - 0.5) * 0.08,
        z: (Math.random() - 0.5) * 0.08,
        life: 0,
      });
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: colors.light1,
      size: 0.09,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 4. Interaction & Deformation Spring Physics
    let isDragging = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetDeform = { x: 0, y: 0, intensity: 0 };
    let currentDeform = { x: 0, y: 0, intensity: 0 };

    const onPointerDown = (e) => {
      isDragging = true;
      audioEngine.playJellyPop(340 + Math.random() * 200);
      targetDeform.intensity = isExtreme ? 2.2 : 1.4;

      // Burst particles
      for (let i = 0; i < particleCount; i++) {
        particleVelocities[i].x = (Math.random() - 0.5) * 0.15;
        particleVelocities[i].y = (Math.random() - 0.5) * 0.15;
        particleVelocities[i].z = (Math.random() - 0.5) * 0.15;
        particleVelocities[i].life = 1.0;
        particlePositions[i * 3] = (Math.random() - 0.5) * 0.5;
        particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      }
      particleGeo.attributes.position.needsUpdate = true;
    };

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouseX = x;
      mouseY = y;
      if (isDragging) {
        targetDeform.x = x * 1.5;
        targetDeform.y = y * 1.5;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
      targetDeform.x = 0;
      targetDeform.y = 0;
      targetDeform.intensity = 0;
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // 5. Animation loop
    let clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Audio reactive frequency analysis
      const freqData = audioEngine.getFrequencyData();
      let bass = 0;
      let mid = 0;
      for (let i = 0; i < 8; i++) bass += freqData[i] || 0;
      for (let i = 8; i < 32; i++) mid += freqData[i] || 0;
      bass = bass / (8 * 255); // 0 to 1
      mid = mid / (24 * 255);

      const audioScale = 1.0 + bass * (isExtreme ? 0.45 : 0.22);
      jellyMesh.scale.set(audioScale, audioScale, audioScale);

      // Spring deformation interpolation
      currentDeform.x += (targetDeform.x - currentDeform.x) * 0.12;
      currentDeform.y += (targetDeform.y - currentDeform.y) * 0.12;
      currentDeform.intensity += (targetDeform.intensity - currentDeform.intensity) * 0.08;

      // Jelly vertex wave ripple
      const posAttr = geometry.attributes.position;
      const origPos = originalPositions.array;
      const pos = posAttr.array;
      const wobbleFreq = isExtreme ? 4.5 : 2.5;

      for (let i = 0; i < pos.length; i += 3) {
        const ox = origPos[i];
        const oy = origPos[i + 1];
        const oz = origPos[i + 2];

        // Complex 3D fluid wave function
        const wave =
          Math.sin(ox * wobbleFreq + time * 3.5) *
          Math.cos(oy * wobbleFreq + time * 3.0) *
          Math.sin(oz * wobbleFreq + time * 2.5);

        const deformationAmount =
          (0.12 + currentDeform.intensity * 0.35 + mid * 0.25) * wave;

        pos[i] = ox * (1 + deformationAmount) + currentDeform.x * 0.2;
        pos[i + 1] = oy * (1 + deformationAmount) + currentDeform.y * 0.2;
        pos[i + 2] = oz * (1 + deformationAmount);
      }
      posAttr.needsUpdate = true;
      geometry.computeVertexNormals();

      // Gentle rotation
      jellyMesh.rotation.y = time * 0.35 + mouseX * 0.6;
      jellyMesh.rotation.x = Math.sin(time * 0.2) * 0.2 + mouseY * 0.4;

      // Particle physics update
      const pPositions = particleGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        if (particleVelocities[i].life > 0) {
          pPositions[i * 3] += particleVelocities[i].x;
          pPositions[i * 3 + 1] += particleVelocities[i].y;
          pPositions[i * 3 + 2] += particleVelocities[i].z;
          particleVelocities[i].life -= 0.02;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      geometry.dispose();
      jellyMaterial.dispose();
    };
  }, [theme, isExtreme]);

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden rounded-2xl">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs text-white/80">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
          〰️ Masa Gelatinosa 3D
        </span>
        <span className="text-[11px] text-pink-300/80 font-mono">Mueve / Haz Clic</span>
      </div>
    </div>
  );
}
