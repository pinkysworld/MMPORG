import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.156.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.156.1/examples/jsm/controls/OrbitControls.js";

const worldEl = document.getElementById("world");
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
worldEl.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const dawnTint = new THREE.Color(0x8fb3cc);
scene.background = dawnTint.clone();
scene.fog = new THREE.Fog(dawnTint, 55, 260);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 600);
camera.position.set(28, 22, 44);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 6, 0);
controls.maxPolarAngle = Math.PI * 0.47;
controls.minDistance = 16;
controls.maxDistance = 180;
controls.enableDamping = true;

const clock = new THREE.Clock();

// --- Procedural terrain helpers -------------------------------------------------
const fract = (value) => value - Math.floor(value);
const smoothstep = (t) => t * t * (3 - 2 * t);

function hash(x, y) {
  return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
}

function noise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const topLeft = hash(xi, yi);
  const topRight = hash(xi + 1, yi);
  const bottomLeft = hash(xi, yi + 1);
  const bottomRight = hash(xi + 1, yi + 1);

  const u = smoothstep(xf);
  const v = smoothstep(yf);

  const top = topLeft + u * (topRight - topLeft);
  const bottom = bottomLeft + u * (bottomRight - bottomLeft);
  return top + v * (bottom - top);
}

function fbm(x, y, octaves = 5) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += noise(x * frequency, y * frequency) * amplitude;
    frequency *= 2.02;
    amplitude *= 0.53;
  }
  return value;
}

function terrainHeight(x, z) {
  const primary = fbm(x * 0.008, z * 0.008) - 0.5;
  const ridges = fbm((x + 120) * 0.02, (z - 80) * 0.02) - 0.5;
  const detail = fbm(x * 0.05, z * 0.05) - 0.5;
  const falloff = THREE.MathUtils.clamp(1 - Math.hypot(x, z) / 260, 0, 1);
  return primary * 16 + ridges * 8 + detail * 2 + falloff * 6;
}

const terrainSize = 520;
const terrainSegments = 320;
const groundGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
const positionAttr = groundGeometry.attributes.position;

for (let i = 0; i < positionAttr.count; i++) {
  const x = positionAttr.getX(i);
  const z = positionAttr.getY(i);
  const height = terrainHeight(x, z);
  positionAttr.setZ(i, height);
}
positionAttr.needsUpdate = true;
groundGeometry.computeVertexNormals();

const groundTextureCanvas = document.createElement("canvas");
groundTextureCanvas.width = 512;
groundTextureCanvas.height = 512;
const ctx = groundTextureCanvas.getContext("2d");
const grd = ctx.createLinearGradient(0, 0, 512, 512);
grd.addColorStop(0, "#6d8c5a");
grd.addColorStop(1, "#3f4f30");
ctx.fillStyle = grd;
ctx.fillRect(0, 0, 512, 512);
ctx.fillStyle = "rgba(255,255,255,0.08)";
for (let i = 0; i < 950; i++) {
  const x = Math.random() * 512;
  const y = Math.random() * 512;
  const r = Math.random() * 2 + 0.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
const groundTexture = new THREE.CanvasTexture(groundTextureCanvas);
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(40, 40);
groundTexture.anisotropy = 8;

const groundMaterial = new THREE.MeshStandardMaterial({
  map: groundTexture,
  roughness: 0.95,
  metalness: 0.03,
});

const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

function sampleHeight(x, z) {
  return terrainHeight(x, z);
}

// Water and wetland
const waterGeometry = new THREE.CircleGeometry(34, 56);
const waterMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x6faad6,
  opacity: 0.8,
  transparent: true,
  roughness: 0.12,
  metalness: 0.05,
  transmission: 0.4,
  clearcoat: 0.7,
});
const pond = new THREE.Mesh(waterGeometry, waterMaterial);
pond.rotation.x = -Math.PI / 2;
pond.position.set(-36, sampleHeight(-36, 24) + 0.25, 24);
pond.receiveShadow = true;
scene.add(pond);

const hemiLight = new THREE.HemisphereLight(0xd0e9ff, 0x312016, 1.05);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xfff0d0, 1.35);
sun.position.set(90, 120, 60);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 20;
sun.shadow.camera.far = 420;
sun.shadow.camera.left = -180;
sun.shadow.camera.right = 180;
sun.shadow.camera.top = 180;
sun.shadow.camera.bottom = -180;
scene.add(sun);

const campfireLight = new THREE.PointLight(0xff9a5c, 2.6, 60, 2);
campfireLight.castShadow = true;
scene.add(campfireLight);

function createCampfire() {
  const campGroup = new THREE.Group();
  const baseHeight = sampleHeight(18, -14);

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x4b4843, roughness: 0.9 });
  for (let i = 0; i < 12; i++) {
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + Math.random() * 0.5), stoneMat);
    const angle = (i / 12) * Math.PI * 2;
    const radius = 2.4 + Math.random() * 0.4;
    stone.position.set(Math.cos(angle) * radius, 0.6, Math.sin(angle) * radius);
    stone.castShadow = true;
    stone.receiveShadow = true;
    campGroup.add(stone);
  }

  const logMaterial = new THREE.MeshStandardMaterial({ color: 0x7a5030, roughness: 0.8 });
  for (let i = 0; i < 5; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 5.8, 8), logMaterial);
    log.rotation.z = Math.PI / 2;
    log.position.set(Math.random() * 1 - 0.5, 0.65, Math.random() * 1 - 0.5);
    log.castShadow = true;
    campGroup.add(log);
  }

  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(1.2, 3.2, 8, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd8a6, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
  );
  flame.position.y = 2.3;
  campGroup.add(flame);

  campGroup.position.set(18, baseHeight, -14);
  campfireLight.position.set(18, baseHeight + 3, -14);
  return campGroup;
}

scene.add(createCampfire());

function createTree() {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 1.1, 9, 8),
    new THREE.MeshStandardMaterial({ color: 0x5e4125, roughness: 0.9 })
  );
  trunk.position.y = 4.5;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const canopyMaterial = new THREE.MeshStandardMaterial({ color: 0x355d38, roughness: 0.65 });
  const tiers = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < tiers; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(4.5 - i * 0.7, 5.2, 10), canopyMaterial);
    cone.position.y = 7.5 + i * 2.1;
    cone.castShadow = true;
    tree.add(cone);
  }

  return tree;
}

function scatterTrees() {
  const placements = [];
  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 40 + Math.random() * 120;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    placements.push([x, z]);
  }

  placements.forEach(([x, z]) => {
    const tree = createTree();
    const height = sampleHeight(x, z);
    tree.position.set(x, height, z);
    scene.add(tree);
  });
}

scatterTrees();

function createRockCluster(position) {
  const group = new THREE.Group();
  const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x7f7f83, roughness: 0.95 });
  const rocks = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < rocks; i++) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 + Math.random() * 2.4), rockMaterial);
    rock.position.set((Math.random() - 0.5) * 6, 0.6 + Math.random() * 0.4, (Math.random() - 0.5) * 6);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  }
  const height = sampleHeight(position.x, position.z);
  group.position.set(position.x, height, position.z);
  scene.add(group);
}

createRockCluster(new THREE.Vector3(-22, 0, -48));
createRockCluster(new THREE.Vector3(48, 0, 22));
createRockCluster(new THREE.Vector3(-64, 0, 48));
createRockCluster(new THREE.Vector3(34, 0, -32));

// Low-lying shrubs
function createShrub(position) {
  const shrub = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x4f7b45, roughness: 0.7 });
  const count = 4 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.9 + Math.random() * 0.6, 10, 10), mat);
    leaf.position.set((Math.random() - 0.5) * 2, 0.6 + Math.random() * 0.3, (Math.random() - 0.5) * 2);
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    shrub.add(leaf);
  }
  const height = sampleHeight(position.x, position.z);
  shrub.position.set(position.x, height, position.z);
  scene.add(shrub);
}

for (let i = 0; i < 35; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 30 + Math.random() * 160;
  createShrub(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
}

// Atmospheric mist near the water
const mistGeometry = new THREE.SphereGeometry(1, 6, 6);
const mistMaterial = new THREE.MeshStandardMaterial({
  color: 0xd0e9ff,
  transparent: true,
  opacity: 0.16,
  roughness: 1,
});
const mistClouds = [];
for (let i = 0; i < 12; i++) {
  const mist = new THREE.Mesh(mistGeometry, mistMaterial);
  const angle = Math.random() * Math.PI * 2;
  const radius = 18 + Math.random() * 14;
  const x = pond.position.x + Math.cos(angle) * radius;
  const z = pond.position.z + Math.sin(angle) * radius;
  mist.scale.setScalar(4 + Math.random() * 3);
  mist.position.set(x, sampleHeight(x, z) + 1.2 + Math.random() * 0.8, z);
  scene.add(mist);
  mistClouds.push(mist);
}

// Pathway boards
const pathCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-40, sampleHeight(-40, -30) + 0.02, -30),
  new THREE.Vector3(-10, sampleHeight(-10, -14) + 0.02, -16),
  new THREE.Vector3(12, sampleHeight(12, -10) + 0.02, -6),
  new THREE.Vector3(32, sampleHeight(32, 6) + 0.02, 12),
]);
const pathPoints = pathCurve.getPoints(30);
const boardMaterial = new THREE.MeshStandardMaterial({ color: 0x8c6542, roughness: 0.7 });
pathPoints.forEach((point, idx) => {
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.15, 1.2), boardMaterial);
  board.position.copy(point);
  board.rotation.y = Math.atan2(
    pathPoints[Math.min(pathPoints.length - 1, idx + 1)].z - point.z,
    pathPoints[Math.min(pathPoints.length - 1, idx + 1)].x - point.x
  );
  board.castShadow = true;
  board.receiveShadow = true;
  scene.add(board);
});

const clouds = [];
function createCloud() {
  const group = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0xf3f7ff });
  const fluff = 4 + Math.floor(Math.random() * 4);
  for (let i = 0; i < fluff; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(6 + Math.random() * 4, 16, 16), mat);
    puff.position.set((Math.random() - 0.5) * 12, Math.random() * 4, (Math.random() - 0.5) * 6);
    group.add(puff);
  }
  group.position.set(-140 + Math.random() * 280, 60 + Math.random() * 20, -120 + Math.random() * 200);
  scene.add(group);
  clouds.push(group);
}
for (let i = 0; i < 10; i++) {
  createCloud();
}

// --- Animals -------------------------------------------------------------------
const interactableMeshes = [];
const animals = [];

const animalDefinitions = [
  {
    name: "Aventurian Warhorse",
    variant: "equine",
    resource: "Warhorse Mane",
    cooldown: 9000,
    color: 0x6f4a2a,
    accent: 0xd8b090,
    greeting: "The destrier snorts, recalling Star Trail's caravan routes.",
    description:
      "A proud battle mount from the Middenrealm. Treat her kindly and she shares a braid of her mane for lance bindings.",
    loot: {
      id: "rondra_lance_tip",
      name: "Rondra-forged Lance Tip",
      icon: "🗡️",
      type: "Weapon",
      lore: "A gleaming spear point polished for the tournaments of Ferdok.",
    },
  },
  {
    name: "Firn Wolf",
    variant: "wolf",
    resource: "Firn Wolf Pelt",
    cooldown: 11000,
    color: 0xcfd5e6,
    accent: 0x8aa0c8,
    greeting: "A low howl echoes from the Svellt Valley glaciers.",
    description:
      "Legends from Sternenschweif speak of firn wolves guiding travelers through blizzards. Its pelt wards biting frost.",
    loot: {
      id: "firn_wolf_pelt",
      name: "Firn Wolf Mantle",
      icon: "🛡️",
      type: "Armor",
      lore: "Dense fur ready to line cloaks for glacier expeditions.",
    },
  },
  {
    name: "Swamp Shaman Toad",
    variant: "toad",
    resource: "Shamanic Balm",
    cooldown: 7000,
    color: 0x4f7f4b,
    accent: 0xf1ce63,
    greeting: "The toad croaks rhythmically like a healer's chant.",
    description:
      "Clever bog toads brew draughts for Thorwal's skalds. Patience grants a vial of restorative balm.",
    loot: {
      id: "tjala_elixir",
      name: "Tjala Healing Draught",
      icon: "🧪",
      type: "Potion",
      lore: "A fragrant salve favored by the Star Trail heroes for mending wounds.",
    },
  },
  {
    name: "Bornland Unicorn",
    variant: "unicorn",
    resource: "Horn Shard",
    cooldown: 13000,
    color: 0xe9edf6,
    accent: 0xf6f1d6,
    greeting: "A soft whinny and shimmer of stardust greets you.",
    description:
      "The elusive unicorn blesses noble-hearted travelers. Its horn shard pulses with protective magic.",
    loot: {
      id: "moon_horn_shard",
      name: "Moonlit Horn Shard",
      icon: "🪄",
      type: "Relic",
      lore: "Crystalline shard humming with protective Rondra-lit runes.",
    },
  },
  {
    name: "Meadow Lynx",
    variant: "lynx",
    resource: "Lynx Paw Charm",
    cooldown: 8000,
    color: 0xc69a6d,
    accent: 0x3c2a1a,
    greeting: "The lynx blinks slowly, trusting your Aventurian oath.",
    description:
      "Swift guardians of the Svellt woods, lynxes trade paw charms that grant uncanny perception.",
    loot: {
      id: "lynx_paw_charm",
      name: "Lynx Paw Charm",
      icon: "🧿",
      type: "Accessory",
      lore: "Braided talisman sharpening senses during Sternenschweif patrols.",
    },
  },
];

function createLeg(material, height = 2, radius = 0.35) {
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.9, height, 10), material);
  leg.castShadow = true;
  leg.position.y = height / 2;
  return leg;
}

function createAnimalMesh(def) {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.6 });
  const accentMaterial = new THREE.MeshStandardMaterial({ color: def.accent || 0xffffff, roughness: 0.5 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.8, 2.4, 1, 1, 1), bodyMaterial);
  body.position.y = 2.6;
  group.add(body);

  const head = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.4), bodyMaterial);
  head.position.set(2.8, 3.6, 0);
  group.add(head);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.1), accentMaterial);
  snout.position.set(3.6, 3.4, 0);
  group.add(snout);

  const earMaterial = accentMaterial;
  const leftEar = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.9, 6), earMaterial);
  leftEar.position.set(2.5, 4.5, 0.6);
  leftEar.rotation.z = Math.PI;
  const rightEar = leftEar.clone();
  rightEar.position.z = -0.6;
  group.add(leftEar, rightEar);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 6), accentMaterial);
  tail.position.set(-2.3, 3.4, 0);
  tail.rotation.z = Math.PI;
  group.add(tail);

  let legHeight = 2.4;
  let bodyScale = new THREE.Vector3(1, 1, 1);

  switch (def.variant) {
    case "equine":
      bodyScale.set(1.4, 1.1, 1.2);
      head.scale.set(0.9, 0.9, 0.9);
      head.position.set(3.4, 3.8, 0);
      snout.scale.set(1.2, 0.8, 0.8);
      snout.position.set(4.4, 3.5, 0);
      tail.scale.set(0.9, 1.4, 0.9);
      tail.position.set(-2.8, 3.5, 0);
      legHeight = 3.1;
      break;
    case "wolf":
      bodyScale.set(1.2, 0.9, 0.9);
      head.scale.set(0.9, 0.9, 0.9);
      head.position.set(3.2, 3.3, 0);
      snout.scale.set(0.9, 0.7, 0.7);
      snout.position.set(4, 3.1, 0);
      tail.scale.set(0.9, 1.4, 0.9);
      tail.rotation.x = Math.PI / 5;
      legHeight = 2.2;
      break;
    case "toad":
      bodyScale.set(0.9, 0.8, 1.3);
      head.scale.set(0.8, 0.6, 0.8);
      head.position.set(2.4, 2.9, 0);
      snout.scale.set(0.7, 0.5, 1);
      snout.position.set(3, 2.6, 0);
      leftEar.visible = rightEar.visible = false;
      tail.visible = false;
      legHeight = 1.2;
      break;
    case "unicorn":
      bodyScale.set(1.35, 1.1, 1.1);
      head.scale.set(0.9, 0.9, 0.9);
      head.position.set(3.5, 3.9, 0);
      snout.scale.set(1, 0.7, 0.7);
      snout.position.set(4.2, 3.5, 0);
      legHeight = 3.2;
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.6, 12), accentMaterial);
      horn.position.set(3.2, 4.6, 0);
      horn.rotation.x = Math.PI / 10;
      group.add(horn);
      break;
    case "lynx":
      bodyScale.set(1.1, 0.9, 1);
      head.scale.set(0.9, 0.9, 0.9);
      head.position.set(3, 3.4, 0);
      snout.scale.set(0.8, 0.7, 0.7);
      snout.position.set(3.8, 3.2, 0);
      leftEar.scale.set(0.7, 1.2, 0.7);
      rightEar.scale.set(0.7, 1.2, 0.7);
      legHeight = 2.1;
      break;
  }

  body.scale.copy(bodyScale);

  const legOffsets = [
    [1.4, 0.9],
    [-1.4, 0.9],
    [1.4, -0.9],
    [-1.4, -0.9],
  ];
  legOffsets.forEach(([x, z]) => {
    const leg = createLeg(bodyMaterial, legHeight, def.variant === "toad" ? 0.45 : 0.35);
    leg.position.set(x, legHeight / 2, z);
    group.add(leg);
  });

  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x080808 });
  const eyeGeometry = new THREE.SphereGeometry(0.14, 8, 8);
  const eyeLeft = new THREE.Mesh(eyeGeometry, eyeMaterial);
  eyeLeft.position.set(3.0, 3.7, 0.45);
  const eyeRight = eyeLeft.clone();
  eyeRight.position.z = -0.45;
  group.add(eyeLeft, eyeRight);

  const idleOffset = Math.random() * Math.PI * 2;
  group.userData = {
    type: "animal",
    definition: def,
    lastCollected: 0,
    tail,
    head,
    idleOffset,
  };

  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

function placeAnimals() {
  const locations = [
    new THREE.Vector3(-28, 0, 18),
    new THREE.Vector3(12, 0, -8),
    new THREE.Vector3(32, 0, 22),
    new THREE.Vector3(-6, 0, 36),
    new THREE.Vector3(-48, 0, -12),
  ];

  animalDefinitions.forEach((def, index) => {
    const animal = createAnimalMesh(def);
    const anchor = locations[index % locations.length];
    const jitterX = (Math.random() - 0.5) * 8;
    const jitterZ = (Math.random() - 0.5) * 8;
    const x = anchor.x + jitterX;
    const z = anchor.z + jitterZ;
    const y = sampleHeight(x, z) + 0.05;
    animal.position.set(x, y, z);
    scene.add(animal);
    animals.push(animal);
    interactableMeshes.push(animal);
  });
}

placeAnimals();

// --- Player proxy --------------------------------------------------------------
const player = new THREE.Mesh(
  new THREE.CapsuleGeometry(1.2, 2.6, 8, 16),
  new THREE.MeshStandardMaterial({ color: 0x2e4ebd, roughness: 0.4 })
);
const playerHeight = sampleHeight(6, 8);
player.position.set(6, playerHeight + 2, 8);
player.castShadow = true;
scene.add(player);

const playerHead = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf1d4b5 }));
playerHead.position.set(0, 2.4, 0);
player.add(playerHead);

// --- Interaction state ---------------------------------------------------------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let activeAnimal = null;

const interactionPanel = document.getElementById("interaction-panel");
const interactionTitle = document.getElementById("interaction-title");
const interactionGreeting = document.getElementById("interaction-greeting");
const interactionDescription = document.getElementById("interaction-description");
const collectButton = document.getElementById("collect-button");
const lootPreview = document.getElementById("loot-preview");
const lootIcon = document.getElementById("loot-icon");
const lootName = document.getElementById("loot-name");
const lootType = document.getElementById("loot-type");
const lootLore = document.getElementById("loot-lore");
const inventoryGrid = document.getElementById("inventory-grid");
const helpOverlay = document.getElementById("help-overlay");
const closeHelpBtn = document.getElementById("close-help");
const helpToggleBtn = document.getElementById("help-toggle");
const musicToggleBtn = document.getElementById("music-toggle");
const bgMusic = document.getElementById("bg-music");

const inventorySlots = Array.from({ length: 12 }, () => null);

function buildInventoryUI() {
  inventoryGrid.innerHTML = "";
  inventorySlots.forEach((_, index) => {
    const slot = document.createElement("li");
    slot.className = "slot";
    slot.dataset.index = index.toString();
    slot.dataset.type = "Empty";

    const icon = document.createElement("span");
    icon.className = "slot-icon";
    icon.textContent = "";

    const label = document.createElement("span");
    label.className = "slot-label";
    label.textContent = "Empty";

    const qty = document.createElement("span");
    qty.className = "slot-qty";
    qty.textContent = "";

    slot.append(icon, label, qty);
    inventoryGrid.appendChild(slot);
  });
}

buildInventoryUI();

function updateInventoryUI() {
  const slots = inventoryGrid.querySelectorAll(".slot");
  slots.forEach((slotEl) => {
    const index = Number(slotEl.dataset.index);
    const data = inventorySlots[index];
    const iconEl = slotEl.querySelector(".slot-icon");
    const labelEl = slotEl.querySelector(".slot-label");
    const qtyEl = slotEl.querySelector(".slot-qty");

    if (!data) {
      slotEl.classList.remove("filled");
      slotEl.dataset.type = "Empty";
      slotEl.title = "This slot is free for new Aventurian gear.";
      iconEl.textContent = "";
      labelEl.textContent = "Empty";
      qtyEl.textContent = "";
      return;
    }

    slotEl.classList.add("filled");
    slotEl.dataset.type = data.type;
    slotEl.title = data.lore;
    iconEl.textContent = data.icon;
    labelEl.textContent = data.name;
    qtyEl.textContent = `×${data.qty}`;
  });
}

updateInventoryUI();

function showInteraction(animal) {
  activeAnimal = animal;
  const { definition } = animal.userData;
  interactionTitle.textContent = definition.name;
  interactionGreeting.textContent = definition.greeting;
  interactionDescription.textContent = definition.description;
  lootPreview.classList.remove("hidden");
  lootIcon.textContent = definition.loot.icon;
  lootName.textContent = definition.loot.name;
  lootType.textContent = definition.loot.type;
  lootLore.textContent = definition.loot.lore;
  interactionPanel.classList.remove("hidden");
  interactionPanel.classList.add("visible");
}

function hideInteraction() {
  activeAnimal = null;
  interactionPanel.classList.add("hidden");
  interactionPanel.classList.remove("visible");
}

function grantLoot(definition) {
  const loot = definition.loot;
  let slotIndex = inventorySlots.findIndex((slot) => slot && slot.id === loot.id);
  if (slotIndex === -1) {
    slotIndex = inventorySlots.findIndex((slot) => slot === null);
  }
  if (slotIndex === -1) {
    return false;
  }

  const slot = inventorySlots[slotIndex];
  if (slot) {
    slot.qty += 1;
  } else {
    inventorySlots[slotIndex] = { ...loot, qty: 1 };
  }
  updateInventoryUI();
  return true;
}

renderer.domElement.addEventListener("pointerdown", (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(interactableMeshes, true);
  if (intersects.length > 0) {
    let candidate = intersects[0].object;
    while (candidate && candidate.userData?.type !== "animal") {
      candidate = candidate.parent;
    }
    if (candidate?.userData?.type === "animal") {
      showInteraction(candidate);
      startMusic();
      return;
    }
  }
  hideInteraction();
  startMusic();
});

collectButton.addEventListener("click", () => {
  if (!activeAnimal) return;
  const { definition, lastCollected } = activeAnimal.userData;
  const now = performance.now();
  const cooldownMs = definition.cooldown;
  const ready = now - lastCollected >= cooldownMs;
  if (!ready) {
    const seconds = Math.ceil((cooldownMs - (now - lastCollected)) / 1000);
    interactionDescription.textContent = `Give ${definition.name} ${seconds}s to recover before another tribute.`;
    return;
  }

  const stored = grantLoot(definition);
  if (!stored) {
    interactionDescription.textContent = "Your backpack is full. Stash gear before seeking more tribute.";
    return;
  }

  activeAnimal.userData.lastCollected = now;
  interactionDescription.textContent = `You carefully store ${definition.loot.name.toLowerCase()} inside your travel backpack.`;
});

const toggleHelp = () => helpOverlay.classList.toggle("hidden");
helpToggleBtn.addEventListener("click", () => {
  toggleHelp();
  startMusic();
});
closeHelpBtn.addEventListener("click", () => helpOverlay.classList.add("hidden"));

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "h") {
    toggleHelp();
  }
});

window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

// --- Music handling ------------------------------------------------------------
let musicStarted = false;
function startMusic() {
  if (musicStarted) return;
  if (!bgMusic) return;
  bgMusic.volume = 0.45;
  const playPromise = bgMusic.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        musicStarted = true;
        musicToggleBtn.textContent = "Pause Ballad";
      })
      .catch(() => {
        // Autoplay prevented, keep button available.
      });
  }
}

musicToggleBtn.addEventListener("click", () => {
  if (!musicStarted) {
    startMusic();
    return;
  }
  if (bgMusic.paused) {
    bgMusic.play();
    musicToggleBtn.textContent = "Pause Ballad";
  } else {
    bgMusic.pause();
    musicToggleBtn.textContent = "Play Ballad";
  }
});

window.addEventListener("pointerdown", startMusic, { once: true });

// --- Animation loop ------------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;

  controls.update();

  clouds.forEach((cloud, idx) => {
    cloud.position.x += 0.35 * delta * (idx % 2 === 0 ? 1 : -0.7);
    if (cloud.position.x > 160) cloud.position.x = -160;
    if (cloud.position.x < -160) cloud.position.x = 160;
  });

  mistClouds.forEach((mist, idx) => {
    mist.position.y += Math.sin(elapsed * 0.5 + idx) * 0.0015;
    mist.position.x += Math.cos(elapsed * 0.2 + idx) * 0.008;
  });

  campfireLight.intensity = 2.4 + Math.sin(elapsed * 6) * 0.3;
  campfireLight.position.y = sampleHeight(18, -14) + 3 + Math.sin(elapsed * 3) * 0.25;

  animals.forEach((animal) => {
    const { tail, head, idleOffset } = animal.userData;
    const baseHeight = sampleHeight(animal.position.x, animal.position.z);
    animal.position.y = baseHeight + Math.sin(elapsed * 0.6 + idleOffset) * 0.1;
    if (tail) {
      tail.rotation.y = Math.sin(elapsed * 3 + idleOffset) * 0.35;
    }
    if (head) {
      head.rotation.z = Math.sin(elapsed * 0.45 + idleOffset) * 0.05;
    }
  });

  renderer.render(scene, camera);
}

animate();
