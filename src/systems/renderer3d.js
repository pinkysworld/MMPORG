const TILE_SIZE = 4;
export class Renderer3D {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'renderer-canvas';
    this.container.appendChild(this.canvas);

    this.gl = this.canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!this.gl) {
      this.showFallbackMessage();
      return;
    }

    this.program = createProgram(this.gl, vertexShaderSource, fragmentShaderSource);
    if (!this.program) {
      this.container.removeChild(this.canvas);
      this.showFallbackMessage();
      this.gl = null;
      return;
    }
    this.attribLocations = {
      position: this.gl.getAttribLocation(this.program, 'position'),
      color: this.gl.getAttribLocation(this.program, 'color')
    };
    this.uniformLocations = {
      projectionView: this.gl.getUniformLocation(this.program, 'uProjectionView'),
      offset: this.gl.getUniformLocation(this.program, 'uOffset')
    };

    this.positionBuffer = this.gl.createBuffer();
    this.colorBuffer = this.gl.createBuffer();

    this.tiles = [];
    this.tileColorArray = null;
    this.tileVertexCount = 0;
    this.markerInstances = [];
    this.lastMap = null;

    this.partyMarker = this.createPartyMarker();
    this.partyOffset = { x: 0, y: 0.8, z: 0 };
    this.highlightKey = null;

    this.cameraOffset = { x: 14, y: 20, z: 22 };

    this.projectionMatrix = createPerspectiveMatrix((55 * Math.PI) / 180, 1, 0.1, 1000);
    this.elapsed = 0;

    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.clearColor(0.04, 0.03, 0.07, 1);

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this.container);
    }
  }

  showFallbackMessage() {
    const message = document.createElement('div');
    message.textContent =
      'WebGL wird von diesem Browser oder Kontext nicht unterstützt. Die Karte kann nicht angezeigt werden.';
    message.style.padding = '1rem';
    message.style.textAlign = 'center';
    message.style.color = '#f0e6d2';
    this.container.appendChild(message);
  }

  buildWorld(map, terrainTypes) {
    if (!this.gl) return;

    this.tiles = [];
    this.markerInstances = [];

    const positions = [];
    const colors = [];

    map.layout.forEach((row, y) => {
      row.forEach((tileKey, x) => {
        const centerX = (x - map.width / 2) * TILE_SIZE;
        const centerZ = (y - map.height / 2) * TILE_SIZE;
        const half = TILE_SIZE / 2;
        const baseColor = hexToRgb(terrainTypes[tileKey].color);

        const corners = [
          [centerX - half, 0, centerZ - half],
          [centerX + half, 0, centerZ - half],
          [centerX + half, 0, centerZ + half],
          [centerX - half, 0, centerZ + half]
        ];
        const triangleOrder = [0, 1, 2, 0, 2, 3];
        const colorStart = colors.length;

        triangleOrder.forEach((index) => {
          const vertex = corners[index];
          positions.push(vertex[0], vertex[1], vertex[2]);
          colors.push(baseColor[0], baseColor[1], baseColor[2]);
        });

        const tile = {
          x,
          y,
          baseColor,
          colorOffset: colorStart,
          vertexCount: triangleOrder.length
        };
        this.tiles.push(tile);

        if (tileKey === 'town') {
          this.addMarker(createBoxGeometry(1.4, 2.5, 1.4, hexToRgb(0xc4a484)), {
            x: centerX,
            y: 0,
            z: centerZ
          });
        }
        if (tileKey === 'ruin') {
          this.addMarker(createBoxGeometry(1.8, 1.8, 1.8, hexToRgb(0x666688)), {
            x: centerX,
            y: 0,
            z: centerZ
          });
        }
      });
    });

    this.tileVertexCount = positions.length / 3;
    this.tileColorArray = new Float32Array(colors);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.tileColorArray, this.gl.DYNAMIC_DRAW);

    this.highlightKey = null;
    this.lastMap = map;
  }

  addMarker(geometry, offset) {
    const gl = this.gl;
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.colors, gl.STATIC_DRAW);

    this.markerInstances.push({
      positionBuffer,
      colorBuffer,
      vertexCount: geometry.vertexCount,
      offset
    });
  }

  createPartyMarker() {
    if (!this.gl) return null;
    const markerHeight = TILE_SIZE * 0.9;
    const base = TILE_SIZE * 0.35;
    const positions = [
      0, markerHeight, 0,
      -base, 0, -base,
      base, 0, -base,
      0, markerHeight, 0,
      base, 0, -base,
      base, 0, base,
      0, markerHeight, 0,
      base, 0, base,
      -base, 0, base,
      0, markerHeight, 0,
      -base, 0, base,
      -base, 0, -base
    ];
    const color = hexToRgb(0xffe066);
    const colors = new Array((positions.length / 3) * 3).fill(0);
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = color[0];
      colors[i + 1] = color[1];
      colors[i + 2] = color[2];
    }

    const gl = this.gl;
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return {
      positionBuffer,
      colorBuffer,
      vertexCount: positions.length / 3
    };
  }

  updatePartyPosition(position, map) {
    if (!this.gl) return;
    const x = (position.x - map.width / 2) * TILE_SIZE;
    const z = (position.y - map.height / 2) * TILE_SIZE;
    this.partyOffset.x = x;
    this.partyOffset.z = z;
  }

  highlightTile(position, map) {
    if (!this.gl || !this.tileColorArray) return;
    const key = `${position.x},${position.y}`;
    if (this.highlightKey === key && this.lastMap === map) return;

    this.tiles.forEach((tile) => {
      const isTarget = tile.x === position.x && tile.y === position.y;
      const color = isTarget ? brightenColor(tile.baseColor) : tile.baseColor;
      for (let i = 0; i < tile.vertexCount; i++) {
        const offset = tile.colorOffset + i * 3;
        this.tileColorArray[offset] = color[0];
        this.tileColorArray[offset + 1] = color[1];
        this.tileColorArray[offset + 2] = color[2];
      }
    });

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.tileColorArray);
    this.highlightKey = key;
    this.lastMap = map;
  }

  update() {
    if (!this.gl) return;
    const now = performance.now();
    if (!this.lastFrameTime) {
      this.lastFrameTime = now;
    }
    const delta = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    this.elapsed += delta;

    const bounce = Math.sin(this.elapsed * 3) * 0.25;
    const partyY = TILE_SIZE * 0.45 + bounce;

    const target = [this.partyOffset.x, 0, this.partyOffset.z];
    const cameraPosition = [
      target[0] + this.cameraOffset.x,
      target[1] + this.cameraOffset.y,
      target[2] + this.cameraOffset.z
    ];
    const viewMatrix = createLookAtMatrix(cameraPosition, target, [0, 1, 0]);
    const projectionView = multiplyMatrices(this.projectionMatrix, viewMatrix);

    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.uniformLocations.projectionView, false, projectionView);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(this.attribLocations.position);
    gl.vertexAttribPointer(this.attribLocations.position, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.enableVertexAttribArray(this.attribLocations.color);
    gl.vertexAttribPointer(this.attribLocations.color, 3, gl.FLOAT, false, 0, 0);

    gl.uniform3f(this.uniformLocations.offset, 0, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, this.tileVertexCount);

    this.markerInstances.forEach((marker) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, marker.positionBuffer);
      gl.vertexAttribPointer(this.attribLocations.position, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, marker.colorBuffer);
      gl.vertexAttribPointer(this.attribLocations.color, 3, gl.FLOAT, false, 0, 0);
      gl.uniform3f(this.uniformLocations.offset, marker.offset.x, marker.offset.y, marker.offset.z);
      gl.drawArrays(gl.TRIANGLES, 0, marker.vertexCount);
    });

    if (this.partyMarker) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.partyMarker.positionBuffer);
      gl.vertexAttribPointer(this.attribLocations.position, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.partyMarker.colorBuffer);
      gl.vertexAttribPointer(this.attribLocations.color, 3, gl.FLOAT, false, 0, 0);
      gl.uniform3f(this.uniformLocations.offset, this.partyOffset.x, partyY, this.partyOffset.z);
      gl.drawArrays(gl.TRIANGLES, 0, this.partyMarker.vertexCount);
    }
  }

  start() {
    if (!this.gl) return;
    const animate = () => {
      this.update();
      this.frameHandle = requestAnimationFrame(animate);
    };
    animate();
  }

  handleResize() {
    if (!this.gl) return;
    const bounds = this.container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(bounds.width));
    const height = Math.max(1, Math.floor(bounds.height));
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    const aspect = width / height;
    this.projectionMatrix = createPerspectiveMatrix((55 * Math.PI) / 180, aspect, 0.1, 1000);
  }
}

const vertexShaderSource = `
attribute vec3 position;
attribute vec3 color;
uniform mat4 uProjectionView;
uniform vec3 uOffset;
varying vec3 vColor;
void main() {
  vec3 worldPosition = position + uOffset;
  gl_Position = uProjectionView * vec4(worldPosition, 1.0);
  vColor = color;
}
`;

const fragmentShaderSource = `
precision mediump float;
varying vec3 vColor;
void main() {
  gl_FragColor = vec4(vColor, 1.0);
}
`;

function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('WebGL program failed to link', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('WebGL shader compile error', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function hexToRgb(hex) {
  const value = typeof hex === 'number' ? hex : parseInt(hex.replace('#', ''), 16);
  const r = ((value >> 16) & 0xff) / 255;
  const g = ((value >> 8) & 0xff) / 255;
  const b = (value & 0xff) / 255;
  return [r, g, b];
}

function createPerspectiveMatrix(fov, aspect, near, far) {
  const f = 1.0 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  const out = new Float32Array(16);
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;

  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;

  out[8] = 0;
  out[9] = 0;
  out[10] = (far + near) * nf;
  out[11] = -1;

  out[12] = 0;
  out[13] = 0;
  out[14] = 2 * far * near * nf;
  out[15] = 0;
  return out;
}

function createLookAtMatrix(eye, center, up) {
  const [ex, ey, ez] = eye;
  const [cx, cy, cz] = center;
  const [ux, uy, uz] = up;

  let zx = ex - cx;
  let zy = ey - cy;
  let zz = ez - cz;
  let len = Math.hypot(zx, zy, zz);
  if (len === 0) {
    zz = 1;
  } else {
    zx /= len;
    zy /= len;
    zz /= len;
  }

  let xx = uy * zz - uz * zy;
  let xy = uz * zx - ux * zz;
  let xz = ux * zy - uy * zx;
  len = Math.hypot(xx, xy, xz);
  if (len === 0) {
    xx = 0;
    xy = 0;
    xz = 0;
  } else {
    xx /= len;
    xy /= len;
    xz /= len;
  }

  let yx = zy * xz - zz * xy;
  let yy = zz * xx - zx * xz;
  let yz = zx * xy - zy * xx;
  len = Math.hypot(yx, yy, yz);
  if (len === 0) {
    yx = 0;
    yy = 0;
    yz = 0;
  } else {
    yx /= len;
    yy /= len;
    yz /= len;
  }

  const out = new Float32Array(16);
  out[0] = xx;
  out[1] = yx;
  out[2] = zx;
  out[3] = 0;
  out[4] = xy;
  out[5] = yy;
  out[6] = zy;
  out[7] = 0;
  out[8] = xz;
  out[9] = yz;
  out[10] = zz;
  out[11] = 0;
  out[12] = -(xx * ex + xy * ey + xz * ez);
  out[13] = -(yx * ex + yy * ey + yz * ez);
  out[14] = -(zx * ex + zy * ey + zz * ez);
  out[15] = 1;
  return out;
}

function multiplyMatrices(a, b) {
  const out = new Float32Array(16);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      out[i * 4 + j] =
        a[i * 4 + 0] * b[0 * 4 + j] +
        a[i * 4 + 1] * b[1 * 4 + j] +
        a[i * 4 + 2] * b[2 * 4 + j] +
        a[i * 4 + 3] * b[3 * 4 + j];
    }
  }
  return out;
}

function createBoxGeometry(width, height, depth, color) {
  const w = width / 2;
  const h = height;
  const d = depth / 2;
  const positions = new Float32Array([
    -w, 0, d,
    w, 0, d,
    w, h, d,
    -w, 0, d,
    w, h, d,
    -w, h, d,

    -w, 0, -d,
    -w, h, -d,
    w, h, -d,
    -w, 0, -d,
    w, h, -d,
    w, 0, -d,

    -w, 0, -d,
    -w, 0, d,
    -w, h, d,
    -w, 0, -d,
    -w, h, d,
    -w, h, -d,

    w, 0, -d,
    w, h, -d,
    w, h, d,
    w, 0, -d,
    w, h, d,
    w, 0, d,

    -w, h, -d,
    -w, h, d,
    w, h, d,
    -w, h, -d,
    w, h, d,
    w, h, -d,

    -w, 0, -d,
    w, 0, -d,
    w, 0, d,
    -w, 0, -d,
    w, 0, d,
    -w, 0, d
  ]);

  const colors = new Float32Array((positions.length / 3) * 3);
  for (let i = 0; i < colors.length; i += 3) {
    colors[i] = color[0];
    colors[i + 1] = color[1];
    colors[i + 2] = color[2];
  }
  return { positions, colors, vertexCount: positions.length / 3 };
}

function brightenColor(color, amount = 0.25) {
  return [
    Math.min(color[0] + amount, 1),
    Math.min(color[1] + amount, 1),
    Math.min(color[2] + amount, 1)
  ];
}
