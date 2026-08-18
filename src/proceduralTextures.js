import * as THREE from 'three';

/**
 * Procedural Texture Generator for STUDIO LUCE
 * Generates custom canvas-based textures to simulate dirty concrete, brushed steel, and rusted iron.
 */

// Helper to create a canvas of given size
function createTempCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  return { canvas, ctx };
}

/**
 * Generates a dirty industrial concrete texture (diffuse, bump, and roughness in one or separate)
 */
export function generateConcreteTexture(width = 512, height = 512) {
  const { canvas, ctx } = createTempCanvas(width, height);
  
  // Base dark concrete grey — not pitch black, so the bulb can actually reveal the texture
  ctx.fillStyle = '#3a382e';
  ctx.fillRect(0, 0, width, height);

  // 1. Layer of large soft concrete clouds (subtle, dark — no bright blobs)
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 100 + Math.random() * 200;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);

    // Concrete stains — both variants stay dark so the wall reads uniform, not mouldy
    const opacity = 0.06 + Math.random() * 0.09;
    const color = Math.random() > 0.5 ? `rgba(22, 21, 19, ${opacity})` : `rgba(58, 55, 50, ${opacity})`;
    
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Scratch/crack lines
  ctx.strokeStyle = 'rgba(60, 58, 55, 0.4)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    let cx = Math.random() * width;
    let cy = Math.random() * height;
    ctx.moveTo(cx, cy);
    for (let j = 0; j < 5; j++) {
      cx += (Math.random() - 0.5) * 40;
      cy += (Math.random() - 0.5) * 40;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  // 3. Fine grain/noise speckles
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 25;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
    data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise)); // G
    data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise)); // B
  }
  ctx.putImageData(imgData, 0, 0);

  // Return a ThreeJS texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Generates a roughness/bump map for concrete to make it look porous and dirty
 */
export function generateConcreteBumpMap(width = 512, height = 512) {
  const { canvas, ctx } = createTempCanvas(width, height);
  
  // Base mid-roughness (gray)
  ctx.fillStyle = '#888888';
  ctx.fillRect(0, 0, width, height);

  // Draw high frequency noise for bumpiness
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const val = 128 + Math.floor((Math.random() - 0.5) * 90);
    data[i] = val;
    data[i+1] = val;
    data[i+2] = val;
  }
  ctx.putImageData(imgData, 0, 0);

  // Draw some dark pits/holes
  ctx.fillStyle = '#222222';
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 1 + Math.random() * 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Generates a brushed/scratched raw metal texture
 */
export function generateBrushedMetalTexture(width = 512, height = 512) {
  const { canvas, ctx } = createTempCanvas(width, height);
  
  // Base metal gray
  ctx.fillStyle = '#6e7073';
  ctx.fillRect(0, 0, width, height);

  // Draw brushed horizontal lines
  for (let i = 0; i < 400; i++) {
    ctx.strokeStyle = `rgba(${100 + Math.random()*80}, ${100 + Math.random()*80}, ${100 + Math.random()*80}, ${0.1 + Math.random()*0.25})`;
    ctx.lineWidth = 0.5 + Math.random() * 2;
    const y = Math.random() * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y + (Math.random() - 0.5) * 5); // slightly skewed
    ctx.stroke();
  }

  // Add random darker industrial stains
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 40 + Math.random() * 65;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, 'rgba(40, 42, 45, 0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Generates a heavily rusted steel texture (diffuse, roughness and metalness maps)
 */
export function generateRustTexture(width = 512, height = 512) {
  const { canvas, ctx } = createTempCanvas(width, height);
  
  // Base steel dark gray
  ctx.fillStyle = '#181a1d';
  ctx.fillRect(0, 0, width, height);

  // Brushed steel base lines
  ctx.lineWidth = 1;
  for (let i = 0; i < 80; i++) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 + Math.random()*0.1})`;
    const y = Math.random() * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw rust patches (rough, textured splotches)
  // Rust colors: dark brown, reddish brown, orange-ish
  const rustColors = [
    'rgba(90, 35, 21, 0.95)',   // dark rust
    'rgba(139, 58, 36, 0.9)',   // medium rust
    'rgba(160, 82, 45, 0.85)',  // sienna
    'rgba(196, 98, 59, 0.75)'   // light orange rust
  ];

  for (let i = 0; i < 15; i++) {
    let rx = Math.random() * width;
    let ry = Math.random() * height;
    let size = 30 + Math.random() * 80;
    
    // Draw an irregular rust patch using overlapping circles
    ctx.fillStyle = rustColors[Math.floor(Math.random() * rustColors.length)];
    ctx.beginPath();
    ctx.arc(rx, ry, size, 0, Math.PI * 2);
    ctx.fill();

    for (let j = 0; j < 5; j++) {
      const offsetX = (Math.random() - 0.5) * size;
      const offsetY = (Math.random() - 0.5) * size;
      const subSize = size * (0.4 + Math.random() * 0.4);
      ctx.fillStyle = rustColors[Math.floor(Math.random() * rustColors.length)];
      ctx.beginPath();
      ctx.arc(rx + offsetX, ry + offsetY, subSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Add dirty speckles over everything
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Rust is non-conductive, so we'll use this data pattern to derive metalness and roughness
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    
    // If it has a strong reddish component relative to blue, it's rust!
    const isRust = (r > g + 10) && (r > b + 15);
    
    const noise = (Math.random() - 0.5) * 15;
    if (isRust) {
      // Add extra grain to rust
      data[i] = Math.max(0, Math.min(255, r + noise));
      data[i+1] = Math.max(0, Math.min(255, g + noise - 5));
      data[i+2] = Math.max(0, Math.min(255, b + noise - 10));
    } else {
      data[i] = Math.max(0, Math.min(255, r + noise));
      data[i+1] = Math.max(0, Math.min(255, g + noise));
      data[i+2] = Math.max(0, Math.min(255, b + noise));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  // Let's also create the roughness and metalness maps using separate canvases based on the color content!
  const roughnessCanvas = document.createElement('canvas');
  roughnessCanvas.width = width;
  roughnessCanvas.height = height;
  const rCtx = roughnessCanvas.getContext('2d');
  
  const metalnessCanvas = document.createElement('canvas');
  metalnessCanvas.width = width;
  metalnessCanvas.height = height;
  const mCtx = metalnessCanvas.getContext('2d');

  const rData = rCtx.createImageData(width, height);
  const mData = mCtx.createImageData(width, height);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    const isRust = (r > g + 15) && (r > b + 20);

    if (isRust) {
      // Rust is very rough (white/light grey in roughness map)
      const roughVal = 180 + Math.floor(Math.random() * 75);
      rData.data[i] = roughVal;
      rData.data[i+1] = roughVal;
      rData.data[i+2] = roughVal;
      rData.data[i+3] = 255;

      // Rust is non-metallic (black/dark in metalness map)
      mData.data[i] = 10;
      mData.data[i+1] = 10;
      mData.data[i+2] = 10;
      mData.data[i+3] = 255;
    } else {
      // Clean steel is shiny (dark grey in roughness map)
      const roughVal = 70 + Math.floor(Math.random() * 50);
      rData.data[i] = roughVal;
      rData.data[i+1] = roughVal;
      rData.data[i+2] = roughVal;
      rData.data[i+3] = 255;

      // Clean steel is metallic (white/light grey in metalness map)
      const metalVal = 210 + Math.floor(Math.random() * 45);
      mData.data[i] = metalVal;
      mData.data[i+1] = metalVal;
      mData.data[i+2] = metalVal;
      mData.data[i+3] = 255;
    }
  }

  rCtx.putImageData(rData, 0, 0);
  mCtx.putImageData(mData, 0, 0);

  const roughnessMap = new THREE.CanvasTexture(roughnessCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;

  const metalnessMap = new THREE.CanvasTexture(metalnessCanvas);
  metalnessMap.wrapS = THREE.RepeatWrapping;
  metalnessMap.wrapT = THREE.RepeatWrapping;

  return {
    map: texture,
    roughnessMap,
    metalnessMap
  };
}

/**
 * Creates a high-contrast film-grained image and applies it to a UI canvas element
 * to simulate high contrast black and white analog prints.
 */
export function applyAnalogGrainToCanvas(canvasId, imageType) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.clientWidth || 300;
  const h = canvas.clientHeight || 120;
  canvas.width = w;
  canvas.height = h;

  // Draw background
  ctx.fillStyle = '#081c0f';
  ctx.fillRect(0, 0, w, h);

  // Generate high-contrast photo outline
  ctx.strokeStyle = '#2bf753';
  ctx.lineWidth = 1.5;
  ctx.fillStyle = '#06160b';

  if (imageType === 'underwerk') {
    // Draw abstract Selnau concrete structure outline
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.9);
    ctx.lineTo(w * 0.1, h * 0.4);
    ctx.lineTo(w * 0.35, h * 0.2);
    ctx.lineTo(w * 0.55, h * 0.6);
    ctx.lineTo(w * 0.9, h * 0.1);
    ctx.lineTo(w * 0.9, h * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Perspective lines (beams / columns)
    ctx.beginPath();
    ctx.moveTo(w * 0.35, h * 0.2);
    ctx.lineTo(w * 0.35, h * 0.9);
    ctx.moveTo(w * 0.55, h * 0.6);
    ctx.lineTo(w * 0.55, h * 0.9);
    ctx.stroke();

    // Draw circular generator/turbine outline
    ctx.beginPath();
    ctx.arc(w * 0.7, h * 0.65, h * 0.2, 0, Math.PI * 2);
    ctx.stroke();
  } else if (imageType === 'chemical') {
    // Draw developer chemical trays stacked in 2D perspective
    ctx.beginPath();
    ctx.rect(w * 0.15, h * 0.5, w * 0.7, h * 0.35);
    ctx.stroke();
    // Liquidy ripples
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.68, w * 0.25, h * 0.1, 0, 0, Math.PI * 2);
    ctx.stroke();
    // A pair of laboratory tongs
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h * 0.45);
    ctx.lineTo(w * 0.4, h * 0.6);
    ctx.moveTo(w * 0.23, h * 0.42);
    ctx.lineTo(w * 0.42, h * 0.57);
    ctx.stroke();
  }

  // Draw retro CRT overlay inside the canvas image
  // Apply heavy film grain noise
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 60;
    // Apply contrast filter to green channel
    data[i+1] = Math.max(0, Math.min(255, data[i+1] + grain));
    // Green phosphor tint
    data[i] = data[i+1] * 0.1;
    data[i+2] = data[i+1] * 0.15;
  }
  ctx.putImageData(imgData, 0, 0);

  // Scanline overlay for photo
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1);
  }
}
