import * as THREE from 'three';
import { 
  generateConcreteTexture, 
  generateConcreteBumpMap, 
  generateBrushedMetalTexture, 
  generateRustTexture 
} from './proceduralTextures.js';

export class LabComponents {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    
    // Track interactive objects
    this.interactiveObjects = [];
    
    // Initialize PBR Materials
    this.initMaterials();
    
    // Build the room structures
    this.buildRoom();
    
    // Build workbench with the 4 chemical trays
    this.buildWorkbench();
    
    // Build film line
    this.buildFilmLine();
    
    // Build photo enlarger silhouette
    this.buildEnlarger();

    // Add everything to scene
    this.scene.add(this.group);
  }

  initMaterials() {
    // 1. Concrete (Walls, Floor, Ceiling)
    const concreteColor = generateConcreteTexture(1024, 1024);
    const concreteBump = generateConcreteBumpMap(1024, 1024);
    
    concreteColor.repeat.set(3, 3);
    concreteBump.repeat.set(3, 3);

    this.concreteMaterial = new THREE.MeshStandardMaterial({
      map: concreteColor,
      bumpMap: concreteBump,
      bumpScale: 0.05,
      roughness: 0.95,
      metalness: 0.0,
      envMapIntensity: 0.0 // Completely dark, lit only by bulb!
    });

    // 2. Rusted Iron (Workbench structure)
    const rustAssets = generateRustTexture(512, 512);
    rustAssets.map.repeat.set(2, 2);
    rustAssets.roughnessMap.repeat.set(2, 2);
    rustAssets.metalnessMap.repeat.set(2, 2);

    this.rustMaterial = new THREE.MeshStandardMaterial({
      map: rustAssets.map,
      roughnessMap: rustAssets.roughnessMap,
      metalnessMap: rustAssets.metalnessMap,
      bumpMap: rustAssets.map, 
      bumpScale: 0.02,
      envMapIntensity: 0.15 // Gloss only, no ambient lighting
    });

    // 3. Brushed Steel (Trays, machinery parts)
    const steelColor = generateBrushedMetalTexture(512, 512);
    this.steelMaterial = new THREE.MeshStandardMaterial({
      map: steelColor,
      roughness: 0.35,
      metalness: 0.85,
      envMapIntensity: 0.4 // Keeps spec reflections on steel
    });

    // 4. Dirty White Plastic (Developing Trays)
    this.trayMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.6,
      metalness: 0.1,
      envMapIntensity: 0.15
    });

    // 5. Tray Fluid (Chemicals)
    this.fluidMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a4a2a, 
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.75,
      envMapIntensity: 0.3
    });

    // 6. Amber Glass (Chemical Jars)
    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x5a3e1a, 
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.9,
      thickness: 0.5,
      transparent: true,
      opacity: 0.85,
      envMapIntensity: 0.5
    });

    // 7. Glowing Lamp Bulb (Emissive)
    this.bulbMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0edc9,
      emissive: 0xe6da8e, // burnt-in "angel white" gone toxic-yellow after years of use
      emissiveIntensity: 0,
      roughness: 0.1
    });

    // 8. Matte Black Metal (Enlarger structure)
    this.darkMetalMaterial = new THREE.MeshStandardMaterial({
      color: 0x151515,
      roughness: 0.7,
      metalness: 0.8
    });

    // 9. Red Safelight Material
    this.safelightMaterial = new THREE.MeshStandardMaterial({
      color: 0xff1111,
      emissive: 0xaa0000,
      emissiveIntensity: 1.0,
      roughness: 0.1
    });
  }

  buildRoom() {
    const w = 10, h = 5, d = 10;

    // Floor
    const floorGeo = new THREE.PlaneGeometry(w, d);
    const floor = new THREE.Mesh(floorGeo, this.concreteMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -h / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Ceiling
    const ceilingGeo = new THREE.PlaneGeometry(w, d);
    const ceiling = new THREE.Mesh(ceilingGeo, this.concreteMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = h / 2;
    ceiling.receiveShadow = true;
    this.group.add(ceiling);

    // Back Wall
    const wallBackGeo = new THREE.PlaneGeometry(w, h);
    const wallBack = new THREE.Mesh(wallBackGeo, this.concreteMaterial);
    wallBack.position.set(0, 0, -d / 2);
    wallBack.receiveShadow = true;
    this.group.add(wallBack);

    // Left Wall
    const wallLeftGeo = new THREE.PlaneGeometry(d, h);
    const wallLeft = new THREE.Mesh(wallLeftGeo, this.concreteMaterial);
    wallLeft.rotation.y = Math.PI / 2;
    wallLeft.position.set(-w / 2, 0, 0);
    wallLeft.receiveShadow = true;
    this.group.add(wallLeft);

    // Right Wall
    const wallRightGeo = new THREE.PlaneGeometry(d, h);
    const wallRight = new THREE.Mesh(wallRightGeo, this.concreteMaterial);
    wallRight.rotation.y = -Math.PI / 2;
    wallRight.position.set(w / 2, 0, 0);
    wallRight.receiveShadow = true;
    this.group.add(wallRight);

    // Build Safelight bulb housing on ceiling
    const safelightFixture = new THREE.Group();
    safelightFixture.position.set(2.0, h / 2 - 0.1, -2.5);
    
    const baseGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12);
    const base = new THREE.Mesh(baseGeo, this.darkMetalMaterial);
    safelightFixture.add(base);

    const redBulbGeo = new THREE.SphereGeometry(0.07, 16, 16);
    const redBulb = new THREE.Mesh(redBulbGeo, this.safelightMaterial);
    redBulb.position.y = -0.06;
    redBulb.name = "safelight_fixture";
    safelightFixture.add(redBulb);
    this.group.add(safelightFixture);
  }

  buildWorkbench() {
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, -2.5, -2); 

    // Tabletop
    const topGeo = new THREE.BoxGeometry(4.6, 0.15, 1.8);
    const tableTop = new THREE.Mesh(topGeo, this.rustMaterial);
    tableTop.position.y = 1.0;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    // Table legs
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.0);
    const legPositions = [
      [-2.1, 0.5, -0.7],
      [2.1, 0.5, -0.7],
      [-2.1, 0.5, 0.7],
      [2.1, 0.5, 0.7]
    ];

    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, this.rustMaterial);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      leg.receiveShadow = true;
      tableGroup.add(leg);
    });

    // 4 Photographic Plastic Trays in a row
    const trayNames = ["tray_developer", "tray_stopbath", "tray_fixer", "tray_wash"];
    const trayColors = [0x222222, 0x1d1d1d, 0x191919, 0x242424];
    const fluidColors = [0x15351a, 0x102535, 0x3c301c, 0x1c2b30];

    for (let i = 0; i < 4; i++) {
      const trayGroup = new THREE.Group();
      trayGroup.position.set(-1.65 + i * 1.1, 1.1, 0);

      const trayBaseGeo = new THREE.BoxGeometry(0.85, 0.15, 0.65);
      const trayMat = new THREE.MeshStandardMaterial({
        color: trayColors[i],
        roughness: 0.6,
        metalness: 0.1,
        envMapIntensity: 0.15
      });
      const tray = new THREE.Mesh(trayBaseGeo, trayMat);
      tray.castShadow = true;
      tray.receiveShadow = true;
      trayGroup.add(tray);

      const fluidGeo = new THREE.PlaneGeometry(0.78, 0.58);
      const fMat = new THREE.MeshStandardMaterial({
        color: fluidColors[i],
        roughness: 0.1,
        metalness: 0.1,
        transparent: true,
        opacity: i === 3 ? 0.45 : 0.75,
        envMapIntensity: 0.3
      });
      const fluid = new THREE.Mesh(fluidGeo, fMat);
      fluid.rotation.x = -Math.PI / 2;
      fluid.position.y = 0.07;
      trayGroup.add(fluid);

      if (i === 0 || i === 2) {
        const tweezersGeo = new THREE.BoxGeometry(0.04, 0.01, 0.35);
        const tweezers = new THREE.Mesh(tweezersGeo, this.steelMaterial);
        tweezers.position.set(-0.23, 0.08, -0.1);
        tweezers.rotation.set(0.1, -0.4, 0.25);
        trayGroup.add(tweezers);
      }

      tray.name = trayNames[i];
      this.interactiveObjects.push(tray);
      tableGroup.add(trayGroup);
    }

    // 3 Chemical Jars
    const jarGroup = new THREE.Group();
    jarGroup.position.set(-1.65, 1.1, -0.65);

    const jarGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.5, 16);
    const jarNeckGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 16);

    for (let i = 0; i < 3; i++) {
      const singleJar = new THREE.Group();
      singleJar.position.x = i * 1.65; 

      const body = new THREE.Mesh(jarGeo, this.glassMaterial);
      body.castShadow = true;
      body.receiveShadow = true;
      body.position.y = 0.25;
      singleJar.add(body);

      const neck = new THREE.Mesh(jarNeckGeo, this.steelMaterial);
      neck.position.y = 0.55;
      neck.castShadow = true;
      singleJar.add(neck);

      body.name = `chemical_jar_${i+1}`;
      this.interactiveObjects.push(body);
      jarGroup.add(singleJar);
    }
    tableGroup.add(jarGroup);

    this.group.add(tableGroup);
  }

  buildFilmLine() {
    const filmGroup = new THREE.Group();
    filmGroup.position.set(0, 1.0, 1.5); 

    const wireGeo = new THREE.CylinderGeometry(0.005, 0.005, 9.8, 8);
    const wire = new THREE.Mesh(wireGeo, this.steelMaterial);
    wire.rotation.z = Math.PI / 2;
    filmGroup.add(wire);

    const filmGeom = new THREE.PlaneGeometry(0.25, 1.4);
    const filmMat = new THREE.MeshStandardMaterial({
      color: 0x221c15, 
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 6; i++) {
      const strip = new THREE.Mesh(filmGeom, filmMat);
      strip.position.set(-3.0 + i * 1.2 + (Math.random() - 0.5) * 0.15, -0.7, 0);
      strip.rotation.y = (Math.random() - 0.5) * 0.15;
      strip.castShadow = true;

      strip.name = `film_strip_${i+1}`;
      this.interactiveObjects.push(strip);
      filmGroup.add(strip);
    }

    this.group.add(filmGroup);
  }

  buildEnlarger() {
    const enlargerGroup = new THREE.Group();
    enlargerGroup.position.set(-3.5, -2.5, -3.5); 

    const baseboardGeo = new THREE.BoxGeometry(1.2, 0.08, 1.0);
    const baseboard = new THREE.Mesh(baseboardGeo, this.concreteMaterial);
    baseboard.position.y = 0.04;
    baseboard.receiveShadow = true;
    enlargerGroup.add(baseboard);

    const columnGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.0, 12);
    const column = new THREE.Mesh(columnGeo, this.steelMaterial);
    column.position.set(-0.4, 1.0, 0);
    column.castShadow = true;
    enlargerGroup.add(column);

    const armGeo = new THREE.BoxGeometry(0.5, 0.1, 0.1);
    const arm = new THREE.Mesh(armGeo, this.darkMetalMaterial);
    arm.position.set(-0.25, 1.3, 0);
    arm.castShadow = true;
    enlargerGroup.add(arm);

    const headGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.4, 16);
    const head = new THREE.Mesh(headGeo, this.darkMetalMaterial);
    head.position.set(0, 1.25, 0);
    head.castShadow = true;
    enlargerGroup.add(head);

    const lensGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.15, 12);
    const lens = new THREE.Mesh(lensGeo, this.steelMaterial);
    lens.position.set(0, 1.0, 0);
    head.add(lens);

    head.name = "photo_enlarger";
    this.interactiveObjects.push(head);

    this.group.add(enlargerGroup);
  }

  /**
   * Constructs hanging bare lamp fixture (No metal shade cover!)
   */
  createLampFixture() {
    const fixtureGroup = new THREE.Group();
    // Group origin = the ceiling pivot. Everything hangs BELOW it so the whole
    // fixture swings as one pendulum (cord included).
    const L = 1.6;

    // Cord/Wire — straight down from the pivot to the socket
    const cordGeo = new THREE.CylinderGeometry(0.012, 0.012, L, 8);
    const cord = new THREE.Mesh(cordGeo, this.darkMetalMaterial);
    cord.position.y = -L / 2;
    cord.castShadow = true;
    fixtureGroup.add(cord);

    // Bare brass/copper socket at the bottom of the cord
    const socketGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.15, 12);
    const socket = new THREE.Mesh(socketGeo, this.steelMaterial);
    socket.position.y = -L;
    socket.castShadow = true;
    socket.name = "light_bulb";
    fixtureGroup.add(socket);

    // Bare bulb just under the socket
    const bulbGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const bulb = new THREE.Mesh(bulbGeo, this.bulbMaterial);
    bulb.position.y = -L - 0.12;
    bulb.name = "light_bulb";
    fixtureGroup.add(bulb);

    // Visible glow halo around the bulb so it clearly reads as switched ON
    const gc = document.createElement('canvas'); gc.width = gc.height = 128;
    const gx = gc.getContext('2d');
    const gg = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gg.addColorStop(0.0, 'rgba(245,240,190,1)');
    gg.addColorStop(0.22, 'rgba(232,222,150,0.65)');
    gg.addColorStop(0.55, 'rgba(200,190,110,0.18)');
    gg.addColorStop(1.0, 'rgba(0,0,0,0)');
    gx.fillStyle = gg; gx.fillRect(0, 0, 128, 128);
    const glowTex = new THREE.CanvasTexture(gc); glowTex.colorSpace = THREE.SRGBColorSpace;
    this.bulbGlowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
    const glowSprite = new THREE.Sprite(this.bulbGlowMat);
    glowSprite.scale.set(1.3, 1.3, 1);
    glowSprite.position.y = -L - 0.12;
    fixtureGroup.add(glowSprite);

    // Register socket and bulb for clicks
    this.interactiveObjects.push(bulb);
    this.interactiveObjects.push(socket);

    return fixtureGroup;
  }
}
