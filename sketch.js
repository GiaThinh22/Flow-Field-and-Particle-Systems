let cols = 80;
let rows = 80;
let gridSize = 10;

let terrain = [];
let noiseScale = 0.1;

let particles = [];
let numParticles = 400;

let gridInput;

function setup() {
  createCanvas(800, 800);

  gridInput = createInput(cols);
  gridInput.position(10, 10);
  gridInput.size(60);

  let button = createButton("Update Grid");
  button.position(80, 10);
  button.mousePressed(updateGrid);

  generateTerrain();

  for (let i = 0; i < numParticles; i++) {
    particles.push(new Particle());
  }

  // disable browser right-click menu
  document.oncontextmenu = () => false;
}

function generateTerrain() {
  terrain = [];
  gridSize = width / cols;

  for (let x = 0; x < cols; x++) {
    terrain[x] = [];
    for (let y = 0; y < rows; y++) {
      terrain[x][y] = noise(x * noiseScale, y * noiseScale);
    }
  }
}

function updateGrid() {
  cols = int(gridInput.value());
  rows = cols;
  generateTerrain();
}

function draw() {
  background(0);

  drawTerrain();

  for (let p of particles) {
    p.update();
    p.show();
  }
}

function drawTerrain() {
  noStroke();

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {

      let h = terrain[x][y] * 255;
      fill(255-h);

      rect(x * gridSize, y * gridSize, gridSize, gridSize);
    }
  }
}

function mousePressed() {
  modifyTerrain();
}

function mouseDragged() {
  modifyTerrain();
}

function modifyTerrain() {

  let gx = floor(mouseX / gridSize);
  let gy = floor(mouseY / gridSize);

  let radius = 4;

  for (let x = -radius; x <= radius; x++) {
    for (let y = -radius; y <= radius; y++) {

      let nx = gx + x;
      let ny = gy + y;

      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {

        let d = dist(0,0,x,y);
        if (d < radius) {

          let strength = 0.03 * (1 - d/radius);

          if (mouseButton === LEFT) {
            terrain[nx][ny] += strength;
          }

          if (mouseButton === RIGHT) {
            terrain[nx][ny] -= strength;
          }

          terrain[nx][ny] = constrain(terrain[nx][ny],0,1);
        }
      }
    }
  }
}

class Particle {

  constructor() {
    // spawn more toward bottom-right
    this.pos = createVector(random(width * 0.6, width * 0.9), random(height * 0.6, height * 0.9));
    this.vel = createVector(0, 0);
    this.maxSpeed = 2.5;
  }

  update() {

    let gx = floor(this.pos.x / gridSize);
    let gy = floor(this.pos.y / gridSize);

    if (gx >= 1 && gx < cols-1 && gy >= 1 && gy < rows-1) {

      let current = terrain[gx][gy];

      let lowest = current;
      let bestDir = createVector(0,0);

      // check neighbors for downhill direction
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {

          if (x == 0 && y == 0) continue;

          let nx = gx + x;
          let ny = gy + y;

          let h = terrain[nx][ny];

          if (h < lowest) {
            lowest = h;
            bestDir = createVector(x, y);
          }
        }
      }

      bestDir.normalize();

      // downhill strength depends on slope
      let slope = current - lowest;
      bestDir.mult(slope * 4);

      // global wind (bottom-right -> top-left)
      let wind = createVector(-0.3, -0.3);

      // high terrain resists movement
      let resistance = map(current, 0, 1, 1, 0.2);
      wind.mult(resistance);

      this.vel.add(bestDir);
      this.vel.add(wind);
      this.vel.limit(this.maxSpeed);
    }

    this.pos.add(this.vel);

    // respawn when reaching top-left area
    if (this.pos.x < 0){
      this.pos = createVector(height-this.pos.y,height);
    }
    else if (this.pos.y < 0) {
      this.pos = createVector(width,width-this.pos.x);
    }
  }

  show() {
    push();
    fill(0, 200, 255);
    noStroke();
    circle(this.pos.x, this.pos.y, 5);
    pop();
  }
}


