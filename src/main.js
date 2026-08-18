import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { LabComponents } from './labComponents.js';
import { DarkroomAudio } from './soundEffects.js';
import { applyAnalogGrainToCanvas } from './proceduralTextures.js';

// Setup Application State
const state = {
  powerOn: false,
  audioMuted: true, // starts muted, but will auto-unmute on first user light ignition
  activeSection: 'status',
  hoveredObject: null,
  selectedObject: null,
  selectedMesh: null,
  flickerActive: false
};

// Physics variables for the swinging hanging lamp
const lampPhysics = {
  anchorY: 2.5,         // Ceiling height anchor (pivot)
  length: 1.6,          // Length of the wire
  posX: 0.35,           // start slightly displaced so it visibly swings on load
  posZ: 0,              // rest hangs straight down (pivot is at the ceiling)
  velX: 0,              // Velocity
  velZ: 0,
  accX: 0,              // Acceleration
  accZ: 0,
  angleX: 0,            // Angle relative to vertical
  angleZ: 0,
  gravity: 9.8,
  damping: 0.991,       // slower decay so the swing lasts longer
  isDragging: false     // Mouse interaction state
};

// Core Three.js Variables
let scene, camera, renderer, labGroup, lampFixture, mainPointLight, mainSpotLight, safelight, flashlight;
let raycaster, mouse2D;
const clock = new THREE.Clock();

// Sound Instance
const audio = new DarkroomAudio();

// HTML Elements
const instructionsPanel = document.getElementById('instructions-panel');
const blueprintHud = document.getElementById('blueprint-hud');
const audioToggleBtn = document.getElementById('audio-toggle-btn');

// Interactive Object Specs
const LAB_SPECS = {
  tray_developer: {
    title: "WANNE 01: SW-ENTWICKLER (STEP 1)",
    text: "BILDWÄSSERUNG // Entwicklerbad. Reduziert die belichteten Silberhalogenidkristalle auf dem Fotopapier zu metallischem Silber, wodurch das latente Bild nach ca. 60 Sek. unter rotem Safelight sichtbar wird. Formel: Hydrochinon/Metol."
  },
  tray_stopbath: {
    title: "WANNE 02: STOPPBAD (STEP 2)",
    text: "REAKTIONSSTOPP // Saure Essigsäurelösung (3%). Neutralisiert die alkalischen Entwicklerreste augenblicklich und stoppt den Entwicklungsprozess auf die Sekunde genau, um Überbelichtung und Verschleppung zu verhindern."
  },
  tray_fixer: {
    title: "WANNE 03: FIXIERBAD (STEP 3)",
    text: "FIXIERUNG // Natriumthiosulfat-Lösung. Entfernt das unbelichtete Silberhalogenid, sodass das Foto lichtbeständig wird. Erst nach der Fixierung ist das Bild dauerhaft haltbar."
  },
  tray_wash: {
    title: "WANNE 04: SCHLUSSWÄSSERUNG (STEP 4)",
    text: "REINIGUNG // Fließendes Wässerungsbad. Entfernt verbliebene Thiosulfat- und Silberkomplexe vollständig aus den Papierfasern, um chemisches Ausbleichen oder Fleckenbildung über die Jahre zu verhindern."
  },
  chemical_jar_1: {
    title: "STECKFLASCHE 01: ENTWICKLERKONZENTRAT",
    text: "CHEMISCHE SUBSTANZ: R09 One Shot (Rodinal-Formel). Hochkonzentrierter flüssiger Negativ-Entwickler für maximale Kantenschärfe. Lichtempfindlich gelagert in Braunglas."
  },
  chemical_jar_2: {
    title: "STECKFLASCHE 02: STOPPBADKONZENTRAT",
    text: "CHEMISCHE SUBSTANZ: Indikator-Essigsäure. Wechselt die Farbe von Gelb zu Blau, wenn die Säure verbraucht ist. Riecht intensiv essigsauer."
  },
  chemical_jar_3: {
    title: "STECKFLASCHE 03: FIXIERBADKONZENTRAT",
    text: "CHEMISCHE SUBSTANZ: Saures Express-Fixierbad auf Ammoniumthiosulfat-Basis. Verkürzt die Fixierzeit bei PE-Papieren auf 30 Sekunden."
  },
  film_strip_1: { title: "FILMROLLE 01 (35MM)", text: "KODAK TRI-X 400 // Bildarchiv: Unterwerk Selnau Strukturstudien. Negativstreifen befindet sich in der Trocknungsphase. Silberdichte: Hoch." },
  film_strip_2: { title: "FILMROLLE 02 (35MM)", text: "ILFORD HP5 PLUS // Belichtet bei ISO 800. Handentwicklung in Rodinal. Aufnahmen zeigen die industriellen Turbinenhallen von Zürich." },
  film_strip_3: { title: "FILMROLLE 03 (120 ROLLFILM)", text: "FUJIFILM NEOPAN 100 ACROS II // Grossformatiges Negativ. Zeigt extreme Detailauflösung der Betonwände im Selnau-Untergeschoss." },
  film_strip_4: { title: "FILMROLLE 04 (35MM)", text: "KODAK PORTRA 400 // Farbnegativ-Prozess C-41. Kontrollstreifen für Farbbalance." },
  film_strip_5: { title: "FILMROLLE 05 (35MM)", text: "ROLLEI INFRARED // Infrarotfilm für surreale Schwarz-Weiß-Effekte im Aussenbereich." },
  film_strip_6: { title: "FILMROLLE 06 (120 ROLLFILM)", text: "KODAK TRI-X // Leerfilm zur Überprüfung der Wassertropfenbildung beim Trocknungsprozess." },
  photo_enlarger: {
    title: "VERGRÖSSERUNGSGERÄT: DURST LABORATOR 1200",
    text: "ANALOG-VERGRÖSSERER // Geeignet für Negative bis 4x5 Inch. Lichtkopf mit Opal-Glühbirne (150W). Rote Filterklappe vorgeschaltet für Arbeit unter Laborlicht. Projiziert Negative präzise auf Silbergelatine-Papier."
  },
  light_bulb: {
    title: "NAKTE GLÜHBIRNE: OSRAM 60W",
    text: "ROHE HALOGEN-LICHTQUELLE // Schwingt frei am Kabel. Erzeugt harte, kontrastreiche Schlagschatten im Raum. Kann durch direktes Ziehen angestossen werden, um die Lichtkegel tanzen zu lassen."
  }
};

// Initialize Application
function init() {
  // 1. Scene setup
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.16); // Dense black fog

  // 2. Camera setup
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 4.5);

  // 3. Renderer setup
  const canvas = document.getElementById('webgl-canvas');
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Cinematic ACES Filmic Tone Mapping and Exposure calibration
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0; 

  // Generate dynamic PMREM environment reflections map
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment(renderer);
  scene.environment = pmremGenerator.fromScene(roomEnv).texture;
  scene.environmentIntensity = 0.15; // Limit environment reflection lighting contribution
  roomEnv.dispose();
  pmremGenerator.dispose();

  // 4. Load Lab Geometry & Materials
  labGroup = new LabComponents(scene);

  // 5. Construct Hanging Lamp Fixture & Lights
  lampFixture = labGroup.createLampFixture();
  lampFixture.position.set(0, lampPhysics.anchorY - 0.06, -0.5); // pivot just under the ceiling
  scene.add(lampFixture);

  // Main bulb point light
  mainPointLight = new THREE.PointLight(0xeae09c, 0, 22, 1.35); // bright bulb, long reach into the room
  mainPointLight.position.set(0, -1.95, 0); // just BELOW the bulb, clear of the socket so it radiates freely
  mainPointLight.castShadow = true;
  mainPointLight.shadow.mapSize.width = 1024;
  mainPointLight.shadow.mapSize.height = 1024;
  mainPointLight.shadow.camera.near = 0.1;
  mainPointLight.shadow.camera.far = 10;
  mainPointLight.shadow.bias = -0.005;
  lampFixture.add(mainPointLight);

  // Spotlight pointing down
  mainSpotLight = new THREE.SpotLight(0xe6dc94, 0, 10, Math.PI / 3, 0.7, 1);
  mainSpotLight.position.set(0, -1.85, 0); // just below the bulb
  mainSpotLight.target.position.set(0, -5, 0);
  mainSpotLight.castShadow = true;
  mainSpotLight.shadow.mapSize.width = 1024;
  mainSpotLight.shadow.mapSize.height = 1024;
  mainSpotLight.shadow.bias = -0.003;
  lampFixture.add(mainSpotLight);
  lampFixture.add(mainSpotLight.target);

  // Red Safelight Pointlight (High Intensity Safelight Glow)
  safelight = new THREE.PointLight(0xff0505, 3.5, 14, 1.2);
  safelight.position.set(2.0, 2.3, -3.0); 
  safelight.castShadow = true;
  safelight.shadow.mapSize.width = 1024;
  safelight.shadow.mapSize.height = 1024;
  safelight.shadow.bias = -0.002;
  scene.add(safelight);

  // 6. Camera Flashlight (Disabled, safelight takes over complete darkroom visibility)
  flashlight = new THREE.SpotLight(0xffeed0, 0.0, 8, Math.PI / 10, 0.5, 1.5);
  flashlight.position.copy(camera.position);
  flashlight.target.position.set(0, 0, -2.5);
  scene.add(flashlight);
  scene.add(flashlight.target);

  // Initial lights configuration
  setLightPower(false);

  // 7. Raycasting & Mouse setup
  raycaster = new THREE.Raycaster();
  mouse2D = new THREE.Vector2(0, 0);

  // 8. Draw photo placeholder canvas grain elements
  applyAnalogGrainToCanvas('img-slot-1', 'underwerk');
  applyAnalogGrainToCanvas('img-slot-2', 'chemical');

  // 9. Attach Event Listeners
  setupEventListeners();

  // 10. Initialize the Embedded Archive Typewriter Terminal
  initArchiveTerminal();

  // 11. Start Animation Loop
  animate();

  // 12. Light is ON as soon as the page opens — the visitor can switch it off if they want.
  setTimeout(togglePower, 500);
}

function setupEventListeners() {
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', onClick);
  window.addEventListener('scroll', onWindowScroll);
  
  // Audio toggle
  audioToggleBtn.addEventListener('click', toggleAudio);

  // Keypress SPACE to toggle power
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      togglePower();
    }
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  applyAnalogGrainToCanvas('img-slot-1', 'underwerk');
  applyAnalogGrainToCanvas('img-slot-2', 'chemical');
}

// Fade out audio and UI elements when scrolling down
function onWindowScroll() {
  if (window.scrollY > 300) {
    instructionsPanel?.classList.add('scrolled-out');
    audioToggleBtn.classList.add('scrolled-out');

    audio.fadeHumVolume(0.0, 0.5);
    clearBlueprintHUD();
  } else {
    instructionsPanel?.classList.remove('scrolled-out');
    audioToggleBtn.classList.remove('scrolled-out');
    
    if (state.powerOn && !state.audioMuted) {
      audio.fadeHumVolume(0.22, 0.8);
    }
  }
}

// Track mouse position
function onMouseMove(event) {
  mouse2D.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse2D.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const targetRotationY = -mouse2D.x * 0.15;
  const targetRotationX = mouse2D.y * 0.12;
  
  camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, targetRotationY, 0.05);
  camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, targetRotationX, 0.05);

  if (!state.powerOn) {
    const targetX = mouse2D.x * 3.5;
    const targetY = mouse2D.y * 2.2;
    flashlight.target.position.set(targetX, targetY, -2.5);
  }
}

function onClick(event) {
  if (window.scrollY > 300) return;

  raycaster.setFromCamera(mouse2D, camera);
  const intersects = raycaster.intersectObjects(labGroup.interactiveObjects, true);

  if (intersects.length > 0) {
    const clickedObj = intersects[0].object;
    
    let name = clickedObj.name;
    let parent = clickedObj.parent;
    while (!name && parent && parent !== scene) {
      name = parent.name;
      parent = parent.parent;
    }

    if (name) {
      if (name === 'light_bulb') {
        lampPhysics.velX += (Math.random() - 0.5) * 5;
        lampPhysics.velZ += (Math.random() - 0.5) * 5;
        togglePower();
        return;
      }

      if (LAB_SPECS[name]) {
        showBlueprintLabel(clickedObj, name);
      }
    }
  } else {
    clearBlueprintHUD();
  }
}

function showBlueprintLabel(mesh, objName) {
  state.selectedObject = objName;
  state.selectedMesh = mesh;

  blueprintHud.innerHTML = `
    <div id="blueprint-node" class="blueprint-node">
      <div class="blueprint-anchor"></div>
      <svg style="position:absolute; overflow:visible; pointer-events:none; top:0; left:0; width:1px; height:1px;">
        <line class="blueprint-line" x1="0" y1="0" x2="0" y2="0"></line>
      </svg>
      <div class="blueprint-label" id="blueprint-label">
        <div class="hud-title">${LAB_SPECS[objName].title}</div>
        <div class="hud-text">${LAB_SPECS[objName].text}</div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const label = document.getElementById('blueprint-label');
    if (label) label.classList.add('visible');
  }, 30);

  if (objName.startsWith('tray_')) {
    audio.playTraySlosh();
  } else {
    audio.playFlickerSpark();
  }
}

function clearBlueprintHUD() {
  const label = document.getElementById('blueprint-label');
  if (label) {
    label.classList.remove('visible');
    setTimeout(() => {
      blueprintHud.innerHTML = '';
      state.selectedObject = null;
      state.selectedMesh = null;
    }, 300);
  }
}

function togglePower() {
  state.powerOn = !state.powerOn;
  audio.playBreakerSwitch();

  if (state.powerOn) {
    state.flickerActive = true;
    let flickerCount = 0;
    
    document.body.className = "booting";

    const flickerInterval = setInterval(() => {
      const lit = Math.random() > 0.35;
      setLightPower(lit);
      
      if (lit) audio.playFlickerSpark();
      
      flickerCount++;
      if (flickerCount > 10) {
        clearInterval(flickerInterval);
        state.flickerActive = false;
        setLightPower(true); 

        document.body.className = "lit";

        if (state.audioMuted) {
          state.audioMuted = false;
          audio.setMute(false);
          audioToggleBtn.innerText = "[AUDIO: ON]";
          audioToggleBtn.classList.add('active');
        }

        if (window.resetArchiveTerminal) {
          window.resetArchiveTerminal();
        }
      }
    }, 70 + Math.random() * 80);
    
    flashlight.intensity = 0.0;
    
  } else {
    setLightPower(false);
    document.body.className = "off";
    
    clearBlueprintHUD();

    flashlight.intensity = 0.0; // Flashlight fully disabled, safelight handles visibility
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function setLightPower(on) {
  // Sync the audio hum pitch & filter frequency to lighting state
  audio.setLightState(on);

  if (on) {
    mainPointLight.intensity = 9.0; // much brighter naked bulb — lights the whole room from the source
    mainSpotLight.intensity = 3.0;
    labGroup.bulbMaterial.emissiveIntensity = 5.0;
    if (labGroup.bulbGlowMat) labGroup.bulbGlowMat.opacity = 0.95; // halo visible = clearly ON

    safelight.intensity = 0.0;
    labGroup.safelightMaterial.emissiveIntensity = 0.1;
  } else {
    mainPointLight.intensity = 0;
    mainSpotLight.intensity = 0;
    labGroup.bulbMaterial.emissiveIntensity = 0;
    if (labGroup.bulbGlowMat) labGroup.bulbGlowMat.opacity = 0; // halo off

    safelight.intensity = 3.5; // Intense saturated red safelight glow
    labGroup.safelightMaterial.emissiveIntensity = 3.0;
  }
}

function toggleAudio() {
  state.audioMuted = !state.audioMuted;
  audio.setMute(state.audioMuted);

  if (state.audioMuted) {
    audioToggleBtn.innerText = "[AUDIO: OFF]";
    audioToggleBtn.classList.remove('active');
  } else {
    audioToggleBtn.innerText = "[AUDIO: ON]";
    audioToggleBtn.classList.add('active');
    audio.playBreakerSwitch();
  }
}

function updateLampPhysics(dt) {
  const delta = Math.min(dt, 0.05);

  if (!lampPhysics.isDragging) {
    // simple pendulum restoring force toward rest (straight down)
    const accX = -(lampPhysics.gravity / lampPhysics.length) * (lampPhysics.posX / lampPhysics.length);
    const accZ = -(lampPhysics.gravity / lampPhysics.length) * (lampPhysics.posZ / lampPhysics.length);

    lampPhysics.velX += accX * delta;
    lampPhysics.velZ += accZ * delta;
    lampPhysics.velX *= lampPhysics.damping;
    lampPhysics.velZ *= lampPhysics.damping;
    lampPhysics.posX += lampPhysics.velX * delta;
    lampPhysics.posZ += lampPhysics.velZ * delta;
  }

  // The whole fixture pivots at the ceiling: it only ROTATES, so the cord + bulb
  // swing on an arc like a real pendulum (no vertical yo-yo, position stays fixed).
  lampFixture.rotation.z = -lampPhysics.posX / lampPhysics.length;
  lampFixture.rotation.x =  lampPhysics.posZ / lampPhysics.length;

  audio.updateHumPanning(lampPhysics.posX / lampPhysics.length);
}

function updateInteractiveHovers() {
  if (window.scrollY > 300) return;

  raycaster.setFromCamera(mouse2D, camera);
  const intersects = raycaster.intersectObjects(labGroup.interactiveObjects, true);

  if (intersects.length > 0) {
    const obj = intersects[0].object;
    
    let name = obj.name;
    let parent = obj.parent;
    while (!name && parent && parent !== scene) {
      name = parent.name;
      parent = parent.parent;
    }

    if (name) {
      if (state.hoveredObject !== obj) {
        if (state.hoveredObject && state.hoveredObject.material) {
          state.hoveredObject.material.emissive.setHex(0x000000);
        }
        
        state.hoveredObject = obj;
        
        if (obj.material) {
          if (state.powerOn) {
            obj.material.emissive.setHex(0x134017); 
          } else {
            obj.material.emissive.setHex(0x401010); 
          }
        }
      }
      document.body.style.cursor = 'pointer';
    }
  } else {
    if (state.hoveredObject) {
      if (state.hoveredObject.material) {
        state.hoveredObject.material.emissive.setHex(0x000000);
      }
      state.hoveredObject = null;
    }
    document.body.style.cursor = 'default';
  }
}

function updateBlueprintHUDProjection() {
  if (!state.selectedMesh || !state.selectedObject) return;

  const tempV = new THREE.Vector3();
  state.selectedMesh.getWorldPosition(tempV);

  const name = state.selectedMesh.name || state.selectedMesh.parent.name;
  if (name && name.startsWith('film_strip')) {
    tempV.y -= 0.45;
  } else if (name && name.startsWith('tray_')) {
    tempV.y += 0.05;
  } else if (name === 'light_bulb') {
    tempV.y -= 0.1;
  } else if (name === 'photo_enlarger') {
    tempV.y += 0.4;
  }

  tempV.project(camera);

  const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
  const y = (tempV.y * -0.5 + 0.5) * window.innerHeight;

  const node = document.getElementById('blueprint-node');
  if (node) {
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;

    const line = node.querySelector('.blueprint-line');
    if (line) {
      line.setAttribute('x1', '0');
      line.setAttribute('y1', '0');
      line.setAttribute('x2', '45');
      line.setAttribute('y2', '0');
    }
  }
}

function initArchiveTerminal() {
  const lines = [
    "$ svetlo mount /negatives",
    "  scanning darkroom trays … 36 frames found",
    "  hashing negatives … [OK] integrity verified",
    "$ svetlo ingest --roll HP5-0426",
    "  frame 12/36  develop 6:30 @ 20.0°C",
    "  frame 24/36  fix … wash … dry",
    "  [OK] 36 frames archived → selnau.index",
    "$ status",
    "  archive: 1.284 negatives · 41 rolls · online",
    "$ _"
  ];
  const termEl = document.getElementById('term-log');
  if (!termEl) return;
  
  let li = 0, ci = 0, out = "";
  let started = false;
  
  function type() {
    if (!state.powerOn) {
      termEl.innerHTML = "";
      started = false;
      return;
    }
    
    if (li >= lines.length) {
      termEl.innerHTML = out + '<span class="cursor"></span>';
      return;
    }
    
    const line = lines[li];
    if (ci <= line.length) {
      const shown = out + line.substring(0, ci);
      const html = shown.replace(/\[OK\]/g, '<span class="ok">[OK]</span>');
      termEl.innerHTML = html + '<span class="cursor"></span>';
      ci++;
      
      if (!state.audioMuted && Math.random() > 0.35) {
        audio.playFlickerSpark();
      }
      
      setTimeout(type, line.charAt(ci - 1) === ' ' ? 15 : 20 + Math.random() * 25);
    } else {
      out += line + "\n";
      li++;
      ci = 0;
      setTimeout(type, 450);
    }
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && !started && state.powerOn) {
        started = true;
        type();
      }
    });
  }, { threshold: 0.3 });
  
  obs.observe(termEl);
  
  window.resetArchiveTerminal = () => {
    termEl.innerHTML = "";
    out = "";
    li = 0;
    ci = 0;
    started = false;
    
    const rect = termEl.getBoundingClientRect();
    const inView = (rect.top >= 0 && rect.bottom <= window.innerHeight);
    if (inView && state.powerOn) {
      started = true;
      type();
    }
  };
}

function animate() {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();

  updateLampPhysics(dt);
  updateInteractiveHovers();
  updateBlueprintHUDProjection(); 
  
  renderer.render(scene, camera);
}

init();

// The editorial content's CSS reveal-fade gets reset by the render loop and stays
// semi-transparent for several seconds (room bleeds through the photos). Force it solid.
requestAnimationFrame(() => {
  document.querySelector('.content-container')?.style.setProperty('opacity', '1', 'important');
});
