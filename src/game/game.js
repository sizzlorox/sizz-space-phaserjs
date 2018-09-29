require('phaser');

let player;
let greenEnemies;

let starfield;
let cursors;
let bank;
let shipTrail;
let bullets;
let fireButton;
let bulletTimer = 0;
let explosions;
let enemyTrailParticles;

// ANIMATIONS
let explosionAnim;

// ENUMS
const ACCELERATION = 600;
const DRAG = 400;
const MAXSPEED = 400;
const MIN_ENEMY_SPACING = 300;
const MAX_ENEMY_SPACING = 3000;

const config = {
  type: Phaser.AUTO,
  parent: 'phaser-test',
  width: (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) - 16,
  height: (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) - 16,
  physics: {
    default: 'arcade',
    arcade: {
      debug: true
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
    render: render
  }
};
console.log(config.width, config.height);
const game = new Phaser.Game(config);

function preload() {
  this.load.image('starfield', 'assets/starfield.png');
  this.load.image('ship', 'assets/player.png');
  this.load.image('bullet', 'assets/bullet.png');
  this.load.image('enemy-green', 'assets/enemy-green.png');
  this.load.spritesheet('explosion', 'assets/explode.png', { frameWidth: 128, frameHeight: 128 });
}

function create() {
  starfield = this.add.tileSprite(0, 0, config.width * 2, config.height * 2, 'starfield');

  bullets = this.physics.add.group({ defaultKey: 'bullet', maxSize: 30 });

  player = this.physics.add.sprite(config.width / 2, config.height - 100, 'ship');
  player.body.maxVelocity.setTo(MAXSPEED, MAXSPEED);
  player.body.drag.setTo(DRAG, DRAG);

  enemyTrailParticles = game.scene.scenes[0].add.particles('explosion');

  greenEnemies = this.physics.add.group({ defaultKey: 'enemy-green', maxSize: 15, runChildUpdate: true });

  launchGreenEnemy();

  this.input.mouse.disableContextMenu();
  fireButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

  const trailParticles = this.add.particles('bullet');
  shipTrail = trailParticles.createEmitter({
    angle: { min: -260, max: -280 },
    lifespan: { min: 250, max: 400 },
    speed: { min: 180, max: 200 },
    alpha: { start: 1, end: 0.01, ease: 'Expo.easeOut' },
    scale: { min: 0.04, max: 0.4 },
    blendMode: 'ADD'
  });
  shipTrail.setPosition(player.x, player.y + 10);

  explosions = this.physics.add.group({ defaultKey: 'explosion' });
  explosionAnim = this.anims.create({
    key: 'explosion',
    frames: this.anims.generateFrameNumbers('explosion'),
    frameRate: 6,
    repeat: -1
  });
}

function update() {
  starfield.tilePositionY -= 2;
  player.body.acceleration.x = 0;

  if (player.x > config.width - 50) {
    player.x = config.width - 50;
    player.body.acceleration.x = 0;
  }
  if (player.x < 50) {
    player.x = 50;
    player.body.acceleration.x = 0;
  }

  if (fireButton.isDown || this.input.activePointer.isDown) {
    fireBullet(this);
  }
  cleanUpBullets();
  updateEnemies();

  if (this.input.x < config.width - 20 &&
    this.input.x > 20 &&
    this.input.y > 20 &&
    this.input.y < config.height - 20) {
    const minDist = 200;
    const dist = this.input.x - player.x;

    player.body.velocity.x = MAXSPEED * Phaser.Math.Clamp(dist / minDist, -1, 1);
  }

  bank = player.body.velocity.x / MAXSPEED;
  player.scaleX = 1 - Math.abs(bank) / 2;
  player.angle = bank * 30;

  shipTrail.setPosition(player.x, player.y + 10);

  this.physics.overlap(player, greenEnemies, shipCollide, (player, enemy) => enemy.active, this);
  this.physics.overlap(greenEnemies, bullets, hitEnemy, (bullet, enemy) => enemy.active, this);
}

function render() {

}

function fireBullet(game) {
  if (game.time.now > bulletTimer) {
    const BULLET_SPEED = 400;
    const BULLET_SPACING = 250;
    let bullet = bullets.get();
    if (bullet) {
      const bulletOffset = 20 * Math.sin(Phaser.Math.DegToRad(player.angle));
      bullet.body.reset(player.x + bulletOffset, player.y);
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.angle = player.angle;
      game.physics.velocityFromAngle(bullet.angle - 90, BULLET_SPEED, bullet.body.velocity);
      bullet.body.velocity.x += player.body.velocity.x;

      bulletTimer = game.time.now + BULLET_SPACING;
    }
  }
}

function cleanUpBullets() {
  const bulletList = bullets.getChildren();
  for (let i = 0; i < bulletList.length; i++) {
    if (bulletList[i] && bulletList[i].x > config.width || bulletList[i] && bulletList[i].x < 0) {
      bulletList[i].destroy();
    }
    if (bulletList[i] && bulletList[i].y > config.height || bulletList[i] && bulletList[i].y < 0) {
      bulletList[i].destroy();
    }
  }
}

function launchGreenEnemy() {
  const ENEMY_SPEED = 300;
  const RAN_TIMER = Phaser.Math.RND.integerInRange(MIN_ENEMY_SPACING, MAX_ENEMY_SPACING);
  console.log(`Release the Kraken! ${RAN_TIMER}`);

  enemy = greenEnemies.getFirst(false, true);
  if (enemy) {
    enemy.active = true;
    enemy.setScale(0.5, 0.5);
    enemy.body.reset(Phaser.Math.RND.integerInRange(0, config.width), -20);
    enemy.body.setSize(enemy.width * 3 / 4, enemy.height * 3 / 4)
    enemy.enableBody = true;
    if (!enemy.trail) {
      const enemyTrail = enemyTrailParticles.createEmitter({
        angle: { min: -260, max: -280 },
        lifespan: { min: 250, max: 400 },
        speed: { min: 180, max: 200 },
        alpha: { start: 0.4, end: 0.01, ease: 'Expo.easeOut' },
        scale: { min: 0.04, max: 0.08 },
        blendMode: 'ADD'
      });
      enemyTrail.setPosition(enemy.x, enemy.y);
      enemy.trail = enemyTrail;
    }
    enemy.body.velocity.x = Phaser.Math.RND.integerInRange(-300, 300);
    enemy.body.velocity.y = ENEMY_SPEED;
    enemy.body.drag.x = 100;
  }

  game.scene.scenes[0].time.addEvent({
    delay: RAN_TIMER,
    callback: launchGreenEnemy
  });
}

function updateEnemies() {
  const enemies = greenEnemies.getChildren();
  for (let i = 0; i < enemies.length; i++) {
    enemies[i].angle = 180 - Phaser.Math.RadToDeg(Math.atan2(enemies[i].body.velocity.x, enemies[i].body.velocity.y));
    enemies[i].trail.setPosition(enemies[i].x, enemies[i].y - 10);
    if (enemies[i].y > config.height) {
      enemies[i].trail.killAll();
      greenEnemies.kill(enemies[i]);
    }
  }
}

function shipCollide(player, enemy) {
  explosion = explosions.getFirst(false, true);
  enemy.trail.killAll();
  greenEnemies.kill(enemy);
  if (explosion) {
    if (!explosion.anims) {
      explosion.anims.add('explosion', explosionAnim);
    }
    explosion.body.reset(enemy.body.x + enemy.body.halfWidth, enemy.body.y + enemy.body.halfHeight);
    explosion.body.velocity.x = enemy.body.velocity.x;
    explosion.body.velocity.y = enemy.body.velocity.y;
    explosion.alpha = 0.7;
    explosion.play('explosion');
  }
}

function hitEnemy(enemy, bullet) {
  explosion = explosions.getFirst(false, true);
  enemy.trail.killAll();
  greenEnemies.kill(enemy);
  bullets.kill(bullet);
  if (explosion) {
    if (!explosion.anims) {
      explosion.anims.add('explosion', explosionAnim);
    }
    explosion.body.reset(enemy.body.x + enemy.body.halfWidth, enemy.body.y + enemy.body.halfHeight);
    explosion.body.velocity.x = enemy.body.velocity.x;
    explosion.body.velocity.y = enemy.body.velocity.y;
    explosion.alpha = 0.7;
    explosion.play('explosion');
  }
}
