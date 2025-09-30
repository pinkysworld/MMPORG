import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155/build/three.module.js';

const TILE_SIZE = 4;

export class Renderer3D {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080506);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
    this.camera.position.set(10, 24, 24);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);

    this.tileGroup = new THREE.Group();
    this.scene.add(this.tileGroup);

    this.partyMarker = null;
    this.clock = new THREE.Clock();

    this.setupLights();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this.container);
    }
  }

  setupLights() {
    const ambient = new THREE.AmbientLight(0x777777);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xfff0d1, 0.8);
    dirLight.position.set(20, 30, 20);
    this.scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x4060ff, 0.4);
    backLight.position.set(-25, 20, -15);
    this.scene.add(backLight);
  }

  buildWorld(map, terrainTypes) {
    while (this.tileGroup.children.length) {
      this.tileGroup.remove(this.tileGroup.children[0]);
    }

    const geometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
    geometry.rotateX(-Math.PI / 2);

    map.layout.forEach((row, y) => {
      row.forEach((tileKey, x) => {
        const data = terrainTypes[tileKey];
        const material = new THREE.MeshLambertMaterial({ color: data.color, emissive: 0x000000 });
        const mesh = new THREE.Mesh(geometry.clone(), material);
        mesh.position.set((x - map.width / 2) * TILE_SIZE, 0, (y - map.height / 2) * TILE_SIZE);
        mesh.userData = { tileKey, highlight: false };
        this.tileGroup.add(mesh);

        if (tileKey === 'town') {
          this.addTownMarker(mesh.position.clone());
        }
        if (tileKey === 'ruin') {
          this.addRuinMarker(mesh.position.clone());
        }
      });
    });

    if (!this.partyMarker) {
      const cone = new THREE.ConeGeometry(TILE_SIZE * 0.3, TILE_SIZE * 0.8, 16);
      const material = new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0x222200 });
      this.partyMarker = new THREE.Mesh(cone, material);
      this.partyMarker.rotation.x = Math.PI;
      this.scene.add(this.partyMarker);
    }
  }

  addTownMarker(position) {
    const geometry = new THREE.CylinderGeometry(0.7, 0.7, 2.2, 12);
    const material = new THREE.MeshStandardMaterial({ color: 0xc4a484, metalness: 0.1, roughness: 0.6 });
    const tower = new THREE.Mesh(geometry, material);
    tower.position.copy(position);
    tower.position.y = 1.1;
    this.scene.add(tower);
  }

  addRuinMarker(position) {
    const geometry = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    const material = new THREE.MeshStandardMaterial({ color: 0x666688, roughness: 0.9 });
    const ruin = new THREE.Mesh(geometry, material);
    ruin.position.copy(position);
    ruin.position.y = 0.9;
    this.scene.add(ruin);
  }

  updatePartyPosition(position, map) {
    if (!this.partyMarker) return;
    const x = (position.x - map.width / 2) * TILE_SIZE;
    const z = (position.y - map.height / 2) * TILE_SIZE;
    this.partyMarker.position.set(x, TILE_SIZE * 0.4, z);
  }

  highlightTile(position, map) {
    const targetX = (position.x - map.width / 2) * TILE_SIZE;
    const targetZ = (position.y - map.height / 2) * TILE_SIZE;
    this.tileGroup.children.forEach((tile) => {
      const isTarget = Math.abs(tile.position.x - targetX) < 0.01 && Math.abs(tile.position.z - targetZ) < 0.01;
      if (tile.material.emissive) {
        tile.material.emissive.setHex(isTarget ? 0x222244 : 0x000000);
      }
    });
  }

  update() {
    if (this.partyMarker) {
      const elapsed = this.clock.getElapsedTime();
      const bounce = Math.sin(elapsed * 3) * 0.1;
      this.partyMarker.position.y = TILE_SIZE * 0.4 + bounce;
    }
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.clock.getDelta();
      this.update();
    };
    animate();
  }

  handleResize() {
    if (!this.container || !this.renderer) return;
    const bounds = this.container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(bounds.width));
    const height = Math.max(1, Math.floor(bounds.height));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
