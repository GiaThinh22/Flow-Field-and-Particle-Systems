let cols = 80;
let rows = 80;
let gridSize;
let terrain = [];
let vectors = [];
let particles = [];
let numParticles = 600;
let noiseScale = 0.08;
let gridInput;

function setup() {
  createCanvas(800, 800);
  gridSize = width / cols;
  
  gridInput = createInput(cols.toString());
  gridInput.position(10, 10);
  gridInput.size(40);

  let button = createButton("Update");
  button.position(60, 10);
  button.mousePressed(updateGrid);

  generateTerrain();
  generateFlowField();

  for (let i = 0; i < numParticles; i++) {
    particles.push(new Particle());
  }
  
  background(0);
  document.oncontextmenu = () => false;
}

function generateTerrain() {
  terrain = [];
  for (let x = 0; x < cols; x++) {
    terrain[x] = [];
    for (let y = 0; y < rows; y++) {
      terrain[x][y] = noise(x * noiseScale, y * noiseScale);
    }
  }
}

function generateFlowField() {
  vectors = [];
  for (let x = 0; x < cols; x++) {
    vectors[x] = [];
    for (let y = 0; y < rows; y++) {
      let x1 = x > 0 ? terrain[x - 1][y] : terrain[x][y];
      let x2 = x < cols - 1 ? terrain[x + 1][y] : terrain[x][y];
      let y1 = y > 0 ? terrain[x][y - 1] : terrain[x][y];
      let y2 = y < rows - 1 ? terrain[x][y + 1] : terrain[x][y];
      
      let v = createVector(x1 - x2, y1 - y2);
      v.normalize();
      vectors[x][y] = v;
    }
  }
}

function updateGrid() {
  cols = int(gridInput.value());
  rows = cols;
  gridSize = width / cols;
  generateTerrain();
  generateFlowField();
  background(0);
}

function draw() {
  fill(0, 25);
  rect(0, 0, width, height);

  drawGhostGrid();

  for (let p of particles) {
    p.update();
    p.show();
  }
}

function drawGhostGrid() {
  noStroke();
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      let val = terrain[x][y] * 255;
      fill(255 - val, 8); 
      rect(x * gridSize, y * gridSize, gridSize, gridSize);
    }
  }
}

function mouseDragged() {
  let gx = floor(mouseX / gridSize);
  let gy = floor(mouseY / gridSize);
  let radius = 5;

  for (let x = -radius; x <= radius; x++) {
    for (let y = -radius; y <= radius; y++) {
      let nx = gx + x;
      let ny = gy + y;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
        let d = dist(0, 0, x, y);
        if (d < radius) {
          let strength = 0.04 * (1 - d / radius);
          if (mouseIsPressed && mouseButton === LEFT) terrain[nx][ny] += strength;
          if (mouseIsPressed && mouseButton === RIGHT) terrain[nx][ny] -= strength;
          terrain[nx][ny] = constrain(terrain[nx][ny], 0, 1);
        }
      }
    }
  }
  generateFlowField();
}

class Particle {
  constructor() {
    this.init();
  }

  init() {
    this.pos = createVector(random(width), random(height));
    this.prevPos = this.pos.copy();
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = random(2, 4);
  }

  update() {
    let gx = floor(this.pos.x / gridSize);
    let gy = floor(this.pos.y / gridSize);

    if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) {
      let force = vectors[gx][gy].copy();
      let altitude = terrain[gx][gy];
      
      let wind = createVector(-0.25, -0.25);
      wind.mult(map(altitude, 0, 1, 1, 0.1));
      
      this.acc.add(force);
      this.acc.add(wind);
    }

    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);

    if (this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height) {
      this.init();
    }
  }

  show() {
    stroke(0, 180, 255, 180);
    strokeWeight(1.5);
    line(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);
    this.prevPos = this.pos.copy();
  }
}