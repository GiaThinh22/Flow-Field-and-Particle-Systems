let cols = 80, rows = 80;
let gridSize;
let terrain = [], vectors = [], particles = [];
let numParticles = 800;
let noiseScale = 0.08;
let gridInput, speedSlider, sizeSlider, windSlider;

function setup() {
  createCanvas(800, 800);
  gridSize = width / cols;

  gridInput = createInput(cols.toString());
  gridInput.position(10, 10);
  gridInput.size(40);

  let button = createButton("Update Grid");
  button.position(60, 10);
  button.mousePressed(updateGrid);

  createP('Max Speed').position(10, 35).style('color', '#fff');
  speedSlider = createSlider(1, 10, 4, 0.5);
  speedSlider.position(10, 65);

  createP('Particle Size').position(10, 80).style('color', '#fff');
  sizeSlider = createSlider(1, 15, 2, 0.5);
  sizeSlider.position(10, 110);

  createP('Wind Strength').position(10, 125).style('color', '#fff');
  windSlider = createSlider(0, 1, 0.15, 0.01);
  windSlider.position(10, 155);

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
      let x1, x2, y1, y2;
      if (x > 0) {
        x1 = terrain[x - 1][y];
      } 
      else {
        x1 = terrain[x][y];
      }

      if (x < cols - 1) {
        x2 = terrain[x + 1][y];
      } 
      else {
        x2 = terrain[x][y];
      }

      if (y > 0) {
        y1 = terrain[x][y - 1];
      } 
      else {
        y1 = terrain[x][y];
      }

      if (y < rows - 1) {
        y2 = terrain[x][y + 1];
      } 
      else {
        y2 = terrain[x][y];
      }

      let v = createVector(x1-x2, y1-y2);
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
  fill(0, 20);
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
      let val = terrain[x][y];
      fill(255 * (1 - val), 12);
      rect(x * gridSize, y * gridSize, gridSize, gridSize);
    }
  }
}

function mouseDragged() {
  let gx = floor(mouseX / gridSize);
  let gy = floor(mouseY / gridSize);
  let radius = 6;
  for (let x = -radius; x <= radius; x++) {
    for (let y = -radius; y <= radius; y++) {
      let nx = gx + x;
      let ny = gy + y;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
        let d = dist(0, 0, x, y);
        if (d < radius) {
          let strength = 0.05 * (1 - d / radius);
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
    this.pos = createVector(random(width), random(height));
    this.prevPos = this.pos.copy();
    this.vel = createVector(random(-1, 1), random(-1, 1));
    this.acc = createVector(0, 0);
  }

  update() {
    let gx = floor(this.pos.x / gridSize);
    let gy = floor(this.pos.y / gridSize);
    if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) {
      let force = vectors[gx][gy].copy();
      let altitude = terrain[gx][gy];

      let wind = createVector(-windSlider.value(), -windSlider.value());
      wind.mult(map(altitude, 0, 1, 1, 0.05));

      this.acc.add(force);
      this.acc.add(wind);
    }
    this.vel.add(this.acc);
    this.vel.limit(speedSlider.value());
    this.pos.add(this.vel);
    this.acc.mult(0);
    if (this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height) {
      this.pos = createVector(random(width), random(height));
      this.prevPos = this.pos.copy();
      this.vel = createVector(random(-1, 1), random(-1, 1));
      this.acc = createVector(0, 0);
    }
  }

  show() {
    stroke(0, 160, 255, 200);
    strokeWeight(sizeSlider.value());
    line(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);
    this.prevPos = this.pos.copy();
  }
}