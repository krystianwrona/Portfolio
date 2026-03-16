"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

export default function GenerateGLB() {
  const [status, setStatus] = useState("Przygotowuję wronę...");

  useEffect(() => {
    const img = new window.Image();
    img.src = "/crow-particles.png"; // Twoja grafika z folderu public
    img.onload = () => {
      setStatus("Przetwarzam piksele...");
      const W = 800; // Wysoka rozdzielczość siatki
      const H = 400;
      
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      ctx.drawImage(img, 0, 0, W, H);
      const data = ctx.getImageData(0, 0, W, H).data;

      const pts = [];
      const meshW = 2.0; // Proporcje
      const meshH = 1.0;

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          const lum = 0.299 * (data[i] / 255) + 0.587 * (data[i + 1] / 255) + 0.114 * (data[i + 2] / 255);
          
          // Jeśli piksel jest ciemny, tworzymy z niego punkt 3D
          if (lum < 0.45) {
            pts.push((x / W - 0.5) * meshW, -(y / H - 0.5) * meshH, 0);
          }
        }
      }

      setStatus(`Znalazłem ${pts.length / 3} punktów! Generuję plik .glb...`);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      
      // Tworzymy obiekt Points
      const material = new THREE.PointsMaterial({ color: 0x111111 });
      const pointCloud = new THREE.Points(geometry, material);

      // Eksportujemy do GLB
      const exporter = new GLTFExporter();
      exporter.parse(
        pointCloud,
        (gltf) => {
          const blob = new Blob([gltf as ArrayBuffer], { type: "application/octet-stream" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "crow-model.glb";
          a.click();
          setStatus("Gotowe! Plik crow-model.glb został pobrany.");
        },
        (error) => {
          console.error(error);
          setStatus("Wystąpił błąd.");
        },
        { binary: true } // Ustawienie na true daje plik .glb
      );
    };
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-black text-white font-mono">
      <h1>{status}</h1>
    </div>
  );
} 