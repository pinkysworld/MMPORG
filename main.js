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
scene.background = new THREE.Color(0x7f9ecb);
scene.fog = new THREE.FogExp2(0x7f9ecb, 0.0085);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
camera.position.set(26, 18, 32);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 4, 0);
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 12;
controls.maxDistance = 140;
controls.enableDamping = true;

const clock = new THREE.Clock();

function createGroundTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const grd = ctx.createLinearGradient(0, 0, size, size);
  grd.addColorStop(0, "#5a7a4d");
  grd.addColorStop(1, "#3f5a3a");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 2.2 + 0.4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

const groundTexture = createGroundTexture();
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(50, 50);

groundTexture.anisotropy = 8;

const groundMaterial = new THREE.MeshStandardMaterial({
  map: groundTexture,
  roughness: 0.95,
  metalness: 0.05,
});

const ground = new THREE.Mesh(new THREE.PlaneGeometry(480, 480), groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Water feature
const waterGeometry = new THREE.CircleGeometry(32, 48);
const waterMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x7bb5e8,
  opacity: 0.82,
  transparent: true,
  metalness: 0.1,
  roughness: 0.1,
  clearcoat: 0.8,
});
const pond = new THREE.Mesh(waterGeometry, waterMaterial);
pond.rotation.x = -Math.PI / 2;
pond.position.set(-28, 0.02, 18);
pond.receiveShadow = true;
scene.add(pond);

// Lighting setup
const hemiLight = new THREE.HemisphereLight(0xcbe4ff, 0x2f2618, 1.1);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xfff2d4, 1.35);
sun.position.set(60, 80, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -120;
sun.shadow.camera.right = 120;
sun.shadow.camera.top = 120;
sun.shadow.camera.bottom = -120;
sun.shadow.camera.far = 250;
scene.add(sun);

const campfireLight = new THREE.PointLight(0xffa060, 2.2, 50, 2.2);
campfireLight.castShadow = true;
campfireLight.position.set(10, 3, -6);
scene.add(campfireLight);

function createCampfire() {
  const campGroup = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x3c3c3c,
    roughness: 0.85,
  });
  for (let i = 0; i < 10; i++) {
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1 + Math.random() * 0.4),
      stoneMat
    );
    const angle = (i / 10) * Math.PI * 2;
    const radius = 2.6 + Math.random() * 0.4;
    stone.position.set(Math.cos(angle) * radius, 0.7, Math.sin(angle) * radius);
    stone.castShadow = true;
    stone.receiveShadow = true;
    campGroup.add(stone);
  }

  const logMaterial = new THREE.MeshStandardMaterial({ color: 0x6f4d31 });
  for (let i = 0; i < 5; i++) {
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 6, 8),
      logMaterial
    );
    log.rotation.z = Math.PI / 2;
    log.position.set(Math.random() * 1 - 0.5, 0.75, Math.random() * 1 - 0.5);
    log.castShadow = true;
    campGroup.add(log);
  }

  const flameGeometry = new THREE.ConeGeometry(1.2, 3, 8, 1, true);
  const flameMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd27f,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  const flame = new THREE.Mesh(flameGeometry, flameMaterial);
  flame.position.y = 2.4;
  campGroup.add(flame);

  campGroup.position.set(10, 0, -6);
  return campGroup;
}

scene.add(createCampfire());

function createTree() {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 1.2, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x5b3a1e, roughness: 0.9 })
  );
  trunk.position.y = 4;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const canopyMaterial = new THREE.MeshStandardMaterial({
    color: 0x2f5d36,
    roughness: 0.6,
  });
  const levels = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < levels; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(4 - i * 0.6, 6, 10),
      canopyMaterial
    );
    cone.position.y = 7 + i * 2.2;
    cone.castShadow = true;
    tree.add(cone);
  }
  return tree;
}

function scatterTrees() {
  const placements = [
    [-40, -35],
    [-60, 12],
    [-20, 46],
    [45, 35],
    [65, -10],
    [18, -45],
    [-80, -20],
    [30, 55],
  ];
  placements.forEach(([x, z]) => {
    const t = createTree();
    t.position.set(x, 0, z);
    scene.add(t);
  });
}

scatterTrees();

function createRockCluster(position) {
  const group = new THREE.Group();
  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x8d8e91,
    roughness: 0.95,
  });
  for (let i = 0; i < 6; i++) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.2 + Math.random() * 2.6, 1),
      rockMaterial
    );
    rock.position.set(
      (Math.random() - 0.5) * 6,
      1 + Math.random() * 0.3,
      (Math.random() - 0.5) * 6
    );
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  }
  group.position.copy(position);
  scene.add(group);
}

createRockCluster(new THREE.Vector3(-12, 0, -28));
createRockCluster(new THREE.Vector3(28, 0, 22));
createRockCluster(new THREE.Vector3(-36, 0, 34));

const clouds = [];
function createCloud() {
  const group = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0xf1f7ff });
  for (let i = 0; i < 4 + Math.floor(Math.random() * 4); i++) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(6 + Math.random() * 4, 16, 16),
      mat
    );
    puff.position.set(
      (Math.random() - 0.5) * 12,
      Math.random() * 4,
      (Math.random() - 0.5) * 6
    );
    group.add(puff);
  }
  group.position.set(
    -120 + Math.random() * 240,
    45 + Math.random() * 20,
    -80 + Math.random() * 160
  );
  scene.add(group);
  clouds.push(group);
}

for (let i = 0; i < 8; i++) {
  createCloud();
}

const interactableMeshes = [];
const animals = [];

const animalDefinitions = [
  {
    name: "Highland Cow",
    resource: "Creamy Milk",
    cooldown: 9000,
    color: 0x9a5d32,
    description:
      "A gentle cow acclimated to the valley's rolling hills. Her milk is perfect for crafting hearty stews.",
  },
  {
    name: "Misty Sheep",
    resource: "Soft Wool",
    cooldown: 7000,
    color: 0xe4dfd2,
    description:
      "This sheep's fleece stays warm even in the damp valley nights. Traders adore its fine fibers.",
  },
  {
    name: "Silver Fox",
    resource: "Shimmering Hide",
    cooldown: 11000,
    color: 0xc0c6d6,
    description:
      "Curious and clever, the fox shares a few glistening strands when treated kindly.",
  },
  {
    name: "River Duck",
    resource: "Fresh Feathers",
    cooldown: 6000,
    color: 0x295ea6,
    accent: 0xf2ce63,
    description:
      "Ducks skim across the pond and happily offer feathers for decorative crafts.",
  },
];

function createLeg(material, height = 2, radius = 0.3) {
  const leg = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 8),
    material
  );
  leg.castShadow = true;
  leg.position.y = height / 2;
  return leg;
}

function createAnimalMesh(def) {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: def.color,
    roughness: 0.6,
  });
  const accentMaterial = new THREE.MeshStandardMaterial({ color: def.accent || 0xffffff });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(4, 2.6, 2.2, 1, 1, 1),
    bodyMaterial
  );
  body.position.y = 3;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.4, 1.6),
    bodyMaterial
  );
  head.position.set(2.6, 3.4, 0);
  head.castShadow = true;
  group.add(head);

  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.8, 1.2),
    accentMaterial
  );
  snout.position.set(3.4, 3.2, 0);
  group.add(snout);

  const earGeo = new THREE.ConeGeometry(0.3, 0.7, 6);
  const earLeft = new THREE.Mesh(earGeo, bodyMaterial);
  earLeft.position.set(2.4, 4.3, 0.7);
  earLeft.rotation.z = Math.PI * 0.15;
  const earRight = earLeft.clone();
  earRight.position.z = -0.7;
  earRight.rotation.z = -Math.PI * 0.15;
  group.add(earLeft, earRight);

  const legOffsets = [
    [-1.2, -0.8],
    [1.2, -0.8],
    [-1.2, 0.8],
    [1.2, 0.8],
  ];
  legOffsets.forEach(([x, z]) => {
    const leg = createLeg(bodyMaterial, def.name === "River Duck" ? 1.2 : 2.2, 0.28);
    leg.position.set(x, def.name === "River Duck" ? 0.6 : 1.1, z);
    group.add(leg);
  });

  if (def.name === "River Duck") {
    const bill = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.9, 10), accentMaterial);
    bill.rotation.z = Math.PI / 2;
    bill.position.set(3.1, 3.1, 0);
    group.add(bill);
    body.scale.set(0.7, 0.7, 1.3);
    head.position.y = 3.1;
    head.scale.set(0.7, 0.7, 0.7);
    snout.scale.set(0.5, 0.4, 0.7);
    snout.position.set(3.2, 2.9, 0);
  }

  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x080808 });
  const eyeGeo = new THREE.SphereGeometry(0.12, 8, 8);
  const eyeLeft = new THREE.Mesh(eyeGeo, eyeMaterial);
  eyeLeft.position.set(3.0, 3.5, 0.45);
  const eyeRight = eyeLeft.clone();
  eyeRight.position.z = -0.45;
  group.add(eyeLeft, eyeRight);

  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(def.name === "River Duck" ? 0.4 : 0.7, 1.4, 6),
    accentMaterial
  );
  tail.position.set(-2.2, 3.2, 0);
  tail.rotation.z = Math.PI;
  group.add(tail);

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
  const positions = [
    new THREE.Vector3(-12, 0, 12),
    new THREE.Vector3(8, 0, 18),
    new THREE.Vector3(-18, 0, -14),
    new THREE.Vector3(-30, 0, 18),
  ];
  animalDefinitions.forEach((def, index) => {
    const animal = createAnimalMesh(def);
    const pos = positions[index % positions.length].clone();
    pos.x += Math.random() * 6 - 3;
    pos.z += Math.random() * 6 - 3;
    animal.position.copy(pos);
    scene.add(animal);
    animals.push(animal);
    interactableMeshes.push(animal);
  });
}

placeAnimals();

const player = new THREE.Mesh(
  new THREE.CapsuleGeometry(1.2, 2.4, 6, 12),
  new THREE.MeshStandardMaterial({ color: 0x3655ff, roughness: 0.35 })
);
player.position.set(6, 2, 4);
player.castShadow = true;
scene.add(player);

const playerHead = new THREE.Mesh(
  new THREE.SphereGeometry(0.9, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xf1d4b5 })
);
playerHead.position.set(0, 2.2, 0);
player.add(playerHead);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let activeAnimal = null;

const interactionPanel = document.getElementById("interaction-panel");
const interactionTitle = document.getElementById("interaction-title");
const interactionDescription = document.getElementById("interaction-description");
const collectButton = document.getElementById("collect-button");
const inventoryList = document.getElementById("inventory-list");
const helpOverlay = document.getElementById("help-overlay");
const closeHelpBtn = document.getElementById("close-help");

const inventory = new Map();

function updateInventoryUI() {
  inventoryList.innerHTML = "";
  if (inventory.size === 0) {
    const empty = document.createElement("li");
    empty.textContent = "Inventory Empty";
    inventoryList.appendChild(empty);
    return;
  }

  for (const [item, count] of inventory.entries()) {
    const li = document.createElement("li");
    const nameSpan = document.createElement("span");
    nameSpan.textContent = item;
    const qtySpan = document.createElement("span");
    qtySpan.textContent = `×${count}`;
    li.append(nameSpan, qtySpan);
    inventoryList.appendChild(li);
  }
}

updateInventoryUI();

function showInteraction(animal) {
  activeAnimal = animal;
  interactionTitle.textContent = animal.userData.definition.name;
  interactionDescription.textContent = animal.userData.definition.description;
  interactionPanel.classList.remove("hidden");
  interactionPanel.classList.add("visible");
}

function hideInteraction() {
  activeAnimal = null;
  interactionPanel.classList.add("hidden");
  interactionPanel.classList.remove("visible");
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
      return;
    }
  }
  hideInteraction();
});

collectButton.addEventListener("click", () => {
  if (!activeAnimal) return;
  const { definition, lastCollected } = activeAnimal.userData;
  const now = performance.now();
  const cooldownMs = definition.cooldown;
  const ready = now - lastCollected >= cooldownMs;
  if (!ready) {
    const seconds = Math.ceil((cooldownMs - (now - lastCollected)) / 1000);
    interactionDescription.textContent = `Give ${seconds}s for ${definition.name} to rest.`;
    return;
  }
  activeAnimal.userData.lastCollected = now;
  const current = inventory.get(definition.resource) ?? 0;
  inventory.set(definition.resource, current + 1);
  interactionDescription.textContent = `You gently gather ${definition.resource.toLowerCase()} from ${definition.name}.`;
  updateInventoryUI();
});

closeHelpBtn.addEventListener("click", () => helpOverlay.classList.add("hidden"));
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "h") {
    helpOverlay.classList.toggle("hidden");
  }
});

window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;

  controls.update();

  clouds.forEach((cloud, idx) => {
    cloud.position.x += 0.4 * delta * (idx % 2 === 0 ? 1 : -0.6);
    if (cloud.position.x > 130) cloud.position.x = -130;
    if (cloud.position.x < -130) cloud.position.x = 130;
  });

  campfireLight.intensity = 2.1 + Math.sin(elapsed * 6) * 0.2;
  campfireLight.position.y = 3 + Math.sin(elapsed * 3) * 0.2;

  animals.forEach((animal) => {
    const { tail, head, idleOffset } = animal.userData;
    animal.position.y = Math.sin(elapsed * 0.6 + idleOffset) * 0.1;
    if (tail) {
      tail.rotation.y = Math.sin(elapsed * 3 + idleOffset) * 0.4;
    }
    if (head) {
      head.rotation.z = Math.sin(elapsed * 0.5 + idleOffset) * 0.05;
    }
  });

  renderer.render(scene, camera);
}

animate();
