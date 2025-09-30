import * as THREE from 'https://unpkg.com/three@0.157.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.157.0/examples/jsm/controls/OrbitControls.js';

const TILE_SIZE = 6;
const TERRAIN_HEIGHT = {
  plain: 1,
  road: 0.6,
  forest: 1.2,
  mountain: 3.4,
  town: 1.1,
  ruin: 1.6
};

const TREE_PRESETS = [
  { trunkColor: 0x3e2b1f, leafColor: 0x214d24, height: 4 },
  { trunkColor: 0x422f1d, leafColor: 0x1e602a, height: 5 },
  { trunkColor: 0x2f1f15, leafColor: 0x1a5a3a, height: 4.6 }
];

const BUSH_PRESETS = [
  { color: 0x23563a, scale: 0.9 },
  { color: 0x2e6d42, scale: 1.1 },
  { color: 0x184a32, scale: 0.8 }
];

const BUILDING_PALETTES = {
  plaster: { base: 0xcab28d, roof: 0x6b3f25 },
  timber: { base: 0xaa7a4d, roof: 0x4b2b1c },
  stone: { base: 0x9e9c93, roof: 0x3b2f2c }
};

const HIGHLIGHT_COLOR = new THREE.Color(0xffe59a);

function toThreeColor(value) {
  if (typeof value === 'number') {
    return new THREE.Color(value);
  }
  return new THREE.Color(value.replace('#', '0x'));
}

export class Renderer3D {
  constructor(container) {
    this.container = container;
    this.container.classList.add('renderer-container');
    this.clock = new THREE.Clock();

    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch (error) {
      console.warn('WebGL renderer could not be created', error);
      this.showFallbackMessage();
      this.renderer = null;
      return;
    }

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06070f);
    this.scene.fog = new THREE.Fog(0x06070f, 40, 140);

    this.camera = new THREE.PerspectiveCamera(
      55,
      (container.clientWidth || 1) / Math.max(container.clientHeight || 1, 1),
      0.1,
      400
    );
    this.camera.position.set(30, 26, 30);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.minDistance = 14;
    this.controls.maxDistance = 80;
    this.controls.enablePan = false;

    this.scene.add(new THREE.AmbientLight(0x445566, 0.45));

    const sunLight = new THREE.DirectionalLight(0xfff4d2, 0.8);
    sunLight.position.set(20, 40, 12);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 120;
    sunLight.shadow.camera.left = -80;
    sunLight.shadow.camera.right = 80;
    sunLight.shadow.camera.top = 80;
    sunLight.shadow.camera.bottom = -80;
    this.scene.add(sunLight);

    this.sunLight = sunLight;

    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);

    this.decorationGroup = new THREE.Group();
    this.scene.add(this.decorationGroup);

    this.tileLookup = new Map();
    this.highlighted = null;
    this.tempVector = new THREE.Vector3();

    this.partyMarker = this.createPartyMarker();
    this.scene.add(this.partyMarker);
    this.partyMarker.position.set(0, 1, 0);
    this.partyTarget = new THREE.Vector3();
    this.controlsTarget = new THREE.Vector3();
    this.walkCycle = 0;

    this.resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this.container);
    }
    window.addEventListener('resize', () => this.handleResize());

    this.running = false;
  }

  showFallbackMessage() {
    const message = document.createElement('div');
    message.textContent =
      'WebGL wird von diesem Browser oder Gerät nicht unterstützt. Die Weltkarte kann nicht angezeigt werden.';
    message.className = 'renderer-fallback';
    this.container.appendChild(message);
  }

  clearWorld() {
    this.tileLookup.clear();
    while (this.worldGroup.children.length > 0) {
      const child = this.worldGroup.children.pop();
      this.worldGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
    while (this.decorationGroup.children.length > 0) {
      const child = this.decorationGroup.children.pop();
      this.decorationGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  }

  buildWorld(map, terrainTypes) {
    if (!this.renderer) return;

    this.clearWorld();

    const offsetX = ((map.width - 1) * TILE_SIZE) / 2;
    const offsetZ = ((map.height - 1) * TILE_SIZE) / 2;

    map.layout.forEach((row, y) => {
      row.forEach((tileKey, x) => {
        const terrain = terrainTypes[tileKey];
        const height = TERRAIN_HEIGHT[tileKey] ?? 1;
        const color = toThreeColor(terrain.color);
        const mesh = this.createTileMesh(height, color);
        const worldX = x * TILE_SIZE - offsetX;
        const worldZ = y * TILE_SIZE - offsetZ;

        mesh.position.set(worldX, 0, worldZ);
        mesh.receiveShadow = true;
        mesh.castShadow = false;
        this.worldGroup.add(mesh);

        const record = {
          mesh,
          material: mesh.material,
          baseColor: color.clone(),
          key: tileKey,
          height,
          position: new THREE.Vector3(worldX, height, worldZ)
        };
        this.tileLookup.set(`${x},${y}`, record);

        if (tileKey === 'forest') {
          this.scatterTrees(record.position, height);
        } else if (tileKey === 'mountain') {
          this.addMountainRidge(record.position, height);
        } else if (tileKey === 'town') {
          this.addTown(record.position);
        } else if (tileKey === 'ruin') {
          this.addRuin(record.position);
        } else if (tileKey === 'plain') {
          this.decoratePlain(record.position, height);
        } else if (tileKey === 'road') {
          this.decorateRoad(record.position, height);
        }
      });
    });

    this.updateSunShadow(map);
    this.controlsTarget.copy(this.partyTarget);
    this.controls.target.copy(this.controlsTarget);
  }

  createTileMesh(height, color) {
    const geometry = new THREE.BoxGeometry(TILE_SIZE, height, TILE_SIZE, 1, 1, 1);
    geometry.translate(0, height / 2, 0);

    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
      metalness: 0.05,
      emissive: 0x000000,
      emissiveIntensity: 0
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    return mesh;
  }

  scatterTrees(position, tileHeight) {
    const treeCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < treeCount; i++) {
      const preset = TREE_PRESETS[Math.floor(Math.random() * TREE_PRESETS.length)];
      const tree = this.createTree(preset.height, preset.trunkColor, preset.leafColor);
      const spread = TILE_SIZE * 0.35;
      const randomX = position.x + (Math.random() - 0.5) * spread * 2;
      const randomZ = position.z + (Math.random() - 0.5) * spread * 2;
      tree.position.set(randomX, tileHeight + 0.02, randomZ);
      tree.rotation.y = Math.random() * Math.PI;
      this.decorationGroup.add(tree);
    }

    const bushCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < bushCount; i++) {
      const bush = this.createBush();
      const spread = TILE_SIZE * 0.35;
      const randomX = position.x + (Math.random() - 0.5) * spread * 2;
      const randomZ = position.z + (Math.random() - 0.5) * spread * 2;
      bush.position.set(randomX, tileHeight + 0.05, randomZ);
      this.decorationGroup.add(bush);
    }
  }

  addMountainRidge(position, tileHeight) {
    const rock = this.createRockCluster(tileHeight);
    rock.position.set(position.x, tileHeight, position.z);
    this.decorationGroup.add(rock);
  }

  addTown(position) {
    const town = new THREE.Group();

    const plaza = new THREE.Mesh(
      new THREE.CylinderGeometry(3.1, 3.2, 0.12, 24),
      new THREE.MeshStandardMaterial({ color: 0x8d6b47, roughness: 0.9 })
    );
    plaza.position.y = 0.06;
    plaza.receiveShadow = true;
    town.add(plaza);

    const tavern = this.createTavern();
    tavern.position.set(-0.6, 0, -1.6);
    town.add(tavern);

    const longhouse = this.createHouse({ width: 2.2, depth: 2.4, height: 1.6, roofHeight: 1.4, palette: BUILDING_PALETTES.timber, chimney: true });
    longhouse.position.set(2.1, 0, 0.4);
    longhouse.rotation.y = Math.PI / 2.5;
    town.add(longhouse);

    const cottage = this.createHouse({ width: 1.8, depth: 1.6, height: 1.3, roofHeight: 1.1, palette: BUILDING_PALETTES.plaster });
    cottage.position.set(-2.1, 0, 0.8);
    cottage.rotation.y = -Math.PI / 3;
    town.add(cottage);

    const marketStall = this.createMarketStall();
    marketStall.position.set(0.8, 0, 1.3);
    town.add(marketStall);

    const well = this.createWell();
    well.position.set(-0.2, 0, 0.2);
    town.add(well);

    const lanternA = this.createLanternPost();
    lanternA.position.set(2.4, 0, -1.7);
    town.add(lanternA);

    const lanternB = this.createLanternPost();
    lanternB.position.set(-2.6, 0, -0.8);
    town.add(lanternB);

    const palisade = this.createTownPalisade();
    town.add(palisade);

    town.position.copy(position);
    town.position.y += 0.04;
    this.decorationGroup.add(town);
  }

  addRuin(position) {
    const ruin = new THREE.Group();
    const columnMaterial = new THREE.MeshStandardMaterial({ color: 0x696b82, roughness: 0.95 });
    const columnGeometry = new THREE.CylinderGeometry(0.35, 0.35, 2.2, 8);

    for (let i = 0; i < 4; i++) {
      const column = new THREE.Mesh(columnGeometry, columnMaterial.clone());
      column.castShadow = true;
      column.receiveShadow = true;
      const angle = (Math.PI / 2) * i;
      const radius = 1.2;
      column.position.set(Math.cos(angle) * radius, 1.1, Math.sin(angle) * radius);
      column.rotation.z = (Math.random() - 0.5) * 0.2;
      ruin.add(column);
    }

    const altarGeometry = new THREE.BoxGeometry(1.8, 0.6, 1.2);
    const altar = new THREE.Mesh(altarGeometry, columnMaterial.clone());
    altar.position.y = 0.35;
    altar.receiveShadow = true;
    ruin.add(altar);

    const shardGeometry = new THREE.ConeGeometry(0.3, 1.2, 5);
    const shardMaterial = new THREE.MeshStandardMaterial({ color: 0xb1baf7, emissive: 0x3948d7, emissiveIntensity: 0.6 });
    const shard = new THREE.Mesh(shardGeometry, shardMaterial);
    shard.position.set(0, 1.2, 0);
    shard.castShadow = true;
    ruin.add(shard);

    ruin.position.copy(position);
    ruin.position.y += 0.1;
    this.decorationGroup.add(ruin);
  }

  decoratePlain(position, tileHeight) {
    const group = new THREE.Group();

    if (Math.random() < 0.55) {
      const farmland = this.createFarmlandPatch();
      farmland.position.set(0.2, 0, -0.1);
      group.add(farmland);

      if (Math.random() < 0.7) {
        const farmhouse = this.createHouse({ width: 1.9, depth: 1.6, height: 1.3, roofHeight: 1.1, palette: BUILDING_PALETTES.plaster, chimney: true });
        farmhouse.position.set(-2.2, 0, 1.5);
        farmhouse.rotation.y = Math.PI / 4;
        group.add(farmhouse);

        const hayBale = this.createHayBale();
        hayBale.position.set(1.8, 0.4, 1.4);
        group.add(hayBale);
      }
    } else {
      const meadow = this.createMeadow();
      group.add(meadow);
    }

    const shrubs = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < shrubs; i++) {
      const bush = this.createBush();
      bush.position.set((Math.random() - 0.5) * TILE_SIZE * 0.6, 0, (Math.random() - 0.5) * TILE_SIZE * 0.6);
      group.add(bush);
    }

    group.position.copy(position);
    group.position.y = tileHeight + 0.02;
    this.decorationGroup.add(group);
  }

  decorateRoad(position, tileHeight) {
    const group = new THREE.Group();

    const packedDirt = new THREE.Mesh(
      new THREE.BoxGeometry(TILE_SIZE * 0.9, 0.05, TILE_SIZE * 0.9),
      new THREE.MeshStandardMaterial({ color: 0x6e4f31, roughness: 0.95 })
    );
    packedDirt.position.y = 0.025;
    packedDirt.receiveShadow = true;
    group.add(packedDirt);

    const trackOverlay = new THREE.Mesh(
      new THREE.PlaneGeometry(TILE_SIZE * 0.85, TILE_SIZE * 0.85, 1, 1),
      new THREE.MeshStandardMaterial({
        color: 0x917049,
        roughness: 0.85,
        transparent: true,
        opacity: 0.7
      })
    );
    trackOverlay.rotation.x = -Math.PI / 2;
    group.add(trackOverlay);

    if (Math.random() < 0.6) {
      const signpost = this.createSignpost();
      signpost.position.set(-TILE_SIZE * 0.35, 0, (Math.random() - 0.5) * TILE_SIZE * 0.4);
      group.add(signpost);
    }

    const lantern = this.createLanternPost();
    lantern.position.set(TILE_SIZE * 0.35, 0, (Math.random() - 0.5) * TILE_SIZE * 0.4);
    group.add(lantern);

    group.position.copy(position);
    group.position.y = tileHeight + 0.01;
    this.decorationGroup.add(group);
  }

  createTree(height, trunkColor, leafColor) {
    const group = new THREE.Group();
    const trunkGeometry = new THREE.CylinderGeometry(0.25, 0.35, height * 0.35, 6);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: trunkColor, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    trunk.position.y = (height * 0.35) / 2;
    group.add(trunk);

    const foliageGeometry = new THREE.ConeGeometry(height * 0.4, height * 0.75, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.7 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    foliage.position.y = height * 0.75;
    group.add(foliage);

    return group;
  }

  createBush() {
    const preset = BUSH_PRESETS[Math.floor(Math.random() * BUSH_PRESETS.length)];
    const group = new THREE.Group();
    const geometry = new THREE.IcosahedronGeometry(0.45 * preset.scale, 1);
    const material = new THREE.MeshStandardMaterial({ color: preset.color, roughness: 0.8 });
    const bush = new THREE.Mesh(geometry, material);
    bush.castShadow = true;
    bush.receiveShadow = true;
    bush.scale.set(1.2, 0.8, 1.1);
    bush.position.y = 0.4 * preset.scale;
    group.add(bush);
    return group;
  }

  createRockCluster(tileHeight) {
    const group = new THREE.Group();
    const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x7c7c83, roughness: 1 });
    const rockCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < rockCount; i++) {
      const size = tileHeight * (0.3 + Math.random() * 0.6);
      const geometry = new THREE.DodecahedronGeometry(size * 0.4);
      const rock = new THREE.Mesh(geometry, rockMaterial.clone());
      rock.castShadow = true;
      rock.receiveShadow = true;
      rock.position.set((Math.random() - 0.5) * 1.6, size * 0.4, (Math.random() - 0.5) * 1.6);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      group.add(rock);
    }
    return group;
  }

  createHouse({ width = 2.2, depth = 2, height = 1.4, roofHeight = 1.2, palette = BUILDING_PALETTES.plaster, chimney = false } = {}) {
    const group = new THREE.Group();

    const baseMaterial = new THREE.MeshStandardMaterial({ color: palette.base, roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), baseMaterial);
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const roofMaterial = new THREE.MeshStandardMaterial({ color: palette.roof, roughness: 0.55 });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, depth) * 0.75, roofHeight, 4), roofMaterial);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = height + roofHeight / 2;
    roof.castShadow = true;
    group.add(roof);

    for (let i = 0; i < 3; i++) {
      const windowGeometry = new THREE.BoxGeometry(0.35, 0.35, 0.05);
      const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0xf2e5a2,
        emissive: 0xfff2b7,
        emissiveIntensity: 0.4,
        roughness: 0.4
      });
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set((i - 1) * (width * 0.35), height * 0.6, depth / 2 + 0.03);
      window.castShadow = false;
      group.add(window);

      const windowBack = window.clone();
      windowBack.position.z = -depth / 2 - 0.03;
      windowBack.rotation.y = Math.PI;
      group.add(windowBack);
    }

    if (chimney) {
      const chimneyGeometry = new THREE.BoxGeometry(width * 0.2, height * 0.8, depth * 0.2);
      const chimney = new THREE.Mesh(chimneyGeometry, new THREE.MeshStandardMaterial({ color: 0x6f4d3c, roughness: 0.9 }));
      chimney.position.set(width * 0.3, height + roofHeight * 0.4, 0);
      chimney.castShadow = true;
      chimney.receiveShadow = true;
      group.add(chimney);
    }

    return group;
  }

  createTavern() {
    const group = new THREE.Group();
    const palette = BUILDING_PALETTES.timber;

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 2, 2.8),
      new THREE.MeshStandardMaterial({ color: palette.base, roughness: 0.68 })
    );
    base.position.y = 1;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.5, 6), new THREE.MeshStandardMaterial({ color: palette.roof, roughness: 0.5 }));
    roof.position.y = 2.4;
    roof.castShadow = true;
    group.add(roof);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1.1, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x432417, roughness: 0.6 })
    );
    door.position.set(0, 0.55, 1.4);
    group.add(door);

    const signPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 1.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x6f4d30, roughness: 0.8 })
    );
    signPost.position.set(1.9, 0.7, 1.2);
    signPost.castShadow = true;
    signPost.receiveShadow = true;
    group.add(signPost);

    const signBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xe1c37e, emissive: 0x5c3a1f, emissiveIntensity: 0.3, side: THREE.DoubleSide })
    );
    signBoard.position.set(1.9, 1.1, 1.7);
    signBoard.rotation.y = Math.PI / 2;
    group.add(signBoard);

    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff1c2,
      emissive: 0xffe7a1,
      emissiveIntensity: 0.5,
      roughness: 0.35
    });
    for (let i = -1; i <= 1; i++) {
      const window = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.08), windowMaterial);
      window.position.set(i * 1.1, 1.1, -1.4);
      group.add(window);
    }

    return group;
  }

  createMarketStall() {
    const group = new THREE.Group();
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.6, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x8f5b2e, roughness: 0.8 })
    );
    counter.position.y = 0.3;
    counter.castShadow = true;
    counter.receiveShadow = true;
    group.add(counter);

    const canopy = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 1.4, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xc1502e, roughness: 0.6, side: THREE.DoubleSide })
    );
    canopy.position.y = 1.25;
    canopy.rotation.x = -Math.PI / 6;
    group.add(canopy);

    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x6b4523, roughness: 0.8 });
    for (let i = 0; i < 2; i++) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 6), poleMaterial);
      pole.position.set((i === 0 ? -0.7 : 0.7), 0.7, 0.45);
      pole.castShadow = true;
      pole.receiveShadow = true;
      group.add(pole);
    }

    return group;
  }

  createWell() {
    const group = new THREE.Group();
    const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x7a7b83, roughness: 0.9 });
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.65, 0.8, 12, 1, true), stoneMaterial);
    wall.position.y = 0.4;
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.9, 6), new THREE.MeshStandardMaterial({ color: 0x5e3b1c, roughness: 0.7 }));
    roof.position.y = 1.25;
    roof.castShadow = true;
    group.add(roof);

    const bucket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.15, 0.25, 6),
      new THREE.MeshStandardMaterial({ color: 0x8d673c, roughness: 0.8 })
    );
    bucket.position.y = 0.4;
    group.add(bucket);

    return group;
  }

  createLanternPost() {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.12, 1.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a3b2a, roughness: 0.8 })
    );
    pole.position.y = 0.9;
    pole.castShadow = true;
    pole.receiveShadow = true;
    group.add(pole);

    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xfff5c6, emissive: 0xffd377, emissiveIntensity: 0.8 })
    );
    lantern.position.y = 1.8;
    lantern.castShadow = true;
    group.add(lantern);

    return group;
  }

  createTownPalisade() {
    const group = new THREE.Group();
    const segmentMaterial = new THREE.MeshStandardMaterial({ color: 0x5d4025, roughness: 0.9 });
    const segments = 10;
    for (let i = 0; i < segments; i++) {
      const post = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.4, 6), segmentMaterial);
      post.castShadow = true;
      post.receiveShadow = true;
      const angle = (i / segments) * Math.PI * 2;
      const radius = 3.3;
      post.position.set(Math.cos(angle) * radius, 0.7, Math.sin(angle) * radius);
      group.add(post);
    }
    return group;
  }

  createFarmlandPatch() {
    const group = new THREE.Group();

    const soil = new THREE.Mesh(
      new THREE.BoxGeometry(TILE_SIZE * 0.7, 0.08, TILE_SIZE * 0.7),
      new THREE.MeshStandardMaterial({ color: 0x6e4c25, roughness: 1 })
    );
    soil.position.y = 0.04;
    soil.receiveShadow = true;
    group.add(soil);

    const furrows = new THREE.Mesh(
      new THREE.PlaneGeometry(TILE_SIZE * 0.68, TILE_SIZE * 0.68, 5, 5),
      new THREE.MeshStandardMaterial({ color: 0x906233, roughness: 0.9, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
    );
    furrows.rotation.x = -Math.PI / 2;
    furrows.position.y = 0.081;
    group.add(furrows);

    const fenceMaterial = new THREE.MeshStandardMaterial({ color: 0x8a5a2c, roughness: 0.9 });
    const fences = [
      { x: 0, z: TILE_SIZE * 0.35, rotation: 0 },
      { x: 0, z: -TILE_SIZE * 0.35, rotation: 0 },
      { x: TILE_SIZE * 0.35, z: 0, rotation: Math.PI / 2 },
      { x: -TILE_SIZE * 0.35, z: 0, rotation: Math.PI / 2 }
    ];
    fences.forEach((fence) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE * 0.7, 0.05, 0.1), fenceMaterial);
      rail.position.set(fence.x, 0.4, fence.z);
      rail.rotation.y = fence.rotation;
      rail.castShadow = true;
      rail.receiveShadow = true;
      group.add(rail);

      const railUpper = rail.clone();
      railUpper.position.y = 0.6;
      group.add(railUpper);
    });

    const postGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.7, 6);
    const postOffsets = [
      [TILE_SIZE * 0.35, TILE_SIZE * 0.35],
      [-TILE_SIZE * 0.35, TILE_SIZE * 0.35],
      [TILE_SIZE * 0.35, -TILE_SIZE * 0.35],
      [-TILE_SIZE * 0.35, -TILE_SIZE * 0.35]
    ];
    postOffsets.forEach(([x, z]) => {
      const post = new THREE.Mesh(postGeometry, fenceMaterial);
      post.position.set(x, 0.35, z);
      post.castShadow = true;
      post.receiveShadow = true;
      group.add(post);
    });

    return group;
  }

  createHayBale() {
    const hay = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.9, 12),
      new THREE.MeshStandardMaterial({ color: 0xd9b75c, roughness: 0.8 })
    );
    hay.rotation.z = Math.PI / 2;
    hay.castShadow = true;
    hay.receiveShadow = true;
    return hay;
  }

  createMeadow() {
    const group = new THREE.Group();
    const meadow = new THREE.Mesh(
      new THREE.PlaneGeometry(TILE_SIZE * 0.8, TILE_SIZE * 0.8, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0x3f8a42, roughness: 0.8, side: THREE.DoubleSide })
    );
    meadow.rotation.x = -Math.PI / 2;
    meadow.position.y = 0.01;
    group.add(meadow);

    for (let i = 0; i < 6; i++) {
      const flower = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.2, 6),
        new THREE.MeshStandardMaterial({ color: 0xf7d66b, roughness: 0.6 })
      );
      flower.position.set((Math.random() - 0.5) * TILE_SIZE * 0.6, 0.1, (Math.random() - 0.5) * TILE_SIZE * 0.6);
      group.add(flower);
    }

    return group;
  }

  createSignpost() {
    const group = new THREE.Group();
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 1.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x7b5a38, roughness: 0.85 })
    );
    post.position.y = 0.7;
    post.castShadow = true;
    post.receiveShadow = true;
    group.add(post);

    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.1, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xc49d62, roughness: 0.8 })
    );
    arm.position.set(0.45, 1.1, 0);
    arm.castShadow = true;
    arm.receiveShadow = true;
    group.add(arm);

    return group;
  }

  createPartyMarker() {
    const group = new THREE.Group();

    const cloakGeometry = new THREE.ConeGeometry(0.8, 1.4, 16);
    const cloakMaterial = new THREE.MeshStandardMaterial({ color: 0xe8c15d, roughness: 0.45, metalness: 0.15 });
    const cloak = new THREE.Mesh(cloakGeometry, cloakMaterial);
    cloak.castShadow = true;
    cloak.receiveShadow = true;
    cloak.position.y = 0.7;
    group.add(cloak);

    const orbGeometry = new THREE.SphereGeometry(0.28, 16, 16);
    const orbMaterial = new THREE.MeshStandardMaterial({ color: 0xffef9e, emissive: 0xffd777, emissiveIntensity: 0.8 });
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    orb.position.y = 1.4;
    orb.castShadow = true;
    group.add(orb);

    const baseGeometry = new THREE.CircleGeometry(0.6, 24);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x1f1f28, roughness: 1 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.rotation.x = -Math.PI / 2;
    base.receiveShadow = true;
    group.add(base);

    group.castShadow = true;
    return group;
  }

  updatePartyPosition(position, map) {
    if (!this.renderer) return;
    const key = `${position.x},${position.y}`;
    const tile = this.tileLookup.get(key);
    const offsetX = ((map.width - 1) * TILE_SIZE) / 2;
    const offsetZ = ((map.height - 1) * TILE_SIZE) / 2;
    const targetX = position.x * TILE_SIZE - offsetX;
    const targetZ = position.y * TILE_SIZE - offsetZ;
    const targetY = tile ? tile.height + 0.2 : 1;
    this.partyTarget.set(targetX, targetY, targetZ);
  }

  highlightTile(position) {
    if (!this.renderer) return;
    const key = `${position.x},${position.y}`;
    if (this.highlighted) {
      const previous = this.tileLookup.get(this.highlighted);
      if (previous) {
        previous.material.emissive.setRGB(0, 0, 0);
        previous.material.emissiveIntensity = 0;
        previous.material.color.copy(previous.baseColor);
      }
      this.highlighted = null;
    }

    const current = this.tileLookup.get(key);
    if (!current) return;
    current.material.color.copy(current.baseColor);
    current.material.color.lerp(HIGHLIGHT_COLOR, 0.35);
    current.material.emissive.set(0x302010);
    current.material.emissiveIntensity = 0.65;
    this.highlighted = key;
  }

  updateSunShadow(map) {
    const spanX = map.width * TILE_SIZE;
    const spanZ = map.height * TILE_SIZE;
    const maxSpan = Math.max(spanX, spanZ) * 0.65;
    this.sunLight.shadow.camera.left = -maxSpan;
    this.sunLight.shadow.camera.right = maxSpan;
    this.sunLight.shadow.camera.top = maxSpan;
    this.sunLight.shadow.camera.bottom = -maxSpan;
  }

  update() {
    if (!this.renderer) return;
    const delta = this.clock.getDelta();
    this.walkCycle += delta * 4.2;

    const bounce = Math.sin(this.walkCycle * Math.PI * 2) * 0.12;
    const lerpFactor = 1 - Math.pow(0.001, delta * 60);

    this.tempVector.copy(this.partyTarget);
    this.tempVector.y += bounce;
    this.partyMarker.position.lerp(this.tempVector, lerpFactor);

    this.controlsTarget.lerp(this.partyTarget, lerpFactor * 0.7);
    this.controls.target.copy(this.controlsTarget);
    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  }

  start() {
    if (!this.renderer || this.running) return;
    this.running = true;
    const animate = () => {
      if (!this.running) return;
      this.update();
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  handleResize() {
    if (!this.renderer) return;
    const width = this.container.clientWidth || 1;
    const height = this.container.clientHeight || 1;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
