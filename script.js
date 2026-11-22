import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

// ===== 1. SMALL HELPERS =====

const byId = (id) => document.getElementById(id);

function setText(id, text) {
    const el = byId(id);
    if (el) el.textContent = text;
}

const standardMat = (color, roughness = 1) => new THREE.MeshStandardMaterial({ color, roughness });
const basicMat = (color) => new THREE.MeshBasicMaterial({ color });

// ===== 2. PLAYER INFO + MENUS =====

let playerUsername = "";
let selectedCharacter = "";

window.registerPlayer = function () {
    const username = byId("usernameInput").value.trim();

    if (!username) {
        setText("signupMessage", "Please enter a username.");
        return;
    }

    playerUsername = username;
    byId("signupScreen").hidden = true;
    byId("characterSelection").hidden = false;
};

function selectCharacter(character) {
    selectedCharacter = character;

    byId("characterSelection").hidden = true;
    byId("mainMenu").hidden = false;

    setText("displayUsername", playerUsername);
    setText("selectedCharacterText", "Selected Character: " + character.toUpperCase());
}

// ===== 3. SCENE, CAMERA, RENDERER =====

const gameContainer = byId("game3D");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080e0b);
scene.fog = new THREE.Fog(0x080e0b, 35, 90);

const camera = new THREE.OrthographicCamera(-10, 10, 6, -6, 0.1, 100);
const CAMERA_Y = -1.5;
camera.position.set(0, CAMERA_Y, 25);
camera.lookAt(0, CAMERA_Y, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(gameContainer.clientWidth || window.innerWidth, gameContainer.clientHeight || window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
gameContainer.appendChild(renderer.domElement);

// ===== 4. LIGHTS =====

scene.add(new THREE.AmbientLight(0x87958a, 0.75));

const moonLight = new THREE.DirectionalLight(0xa8b8a3, 1.2);
moonLight.position.set(-5, 9, 12);
moonLight.castShadow = true;
scene.add(moonLight);

function addPointLight(color, intensity, distance, x, y, z) {
    const light = new THREE.PointLight(color, intensity, distance);
    light.position.set(x, y, z);
    scene.add(light);
}

addPointLight(0x8d2020, 1.5, 15, 12, 2, 5);
addPointLight(0x294b35, 1.5, 20, 30, 1, 5);

// ===== 5. MATERIALS + BACKGROUND =====

const mat = {
    ground: standardMat(0x252d28),
    wall: standardMat(0x151e19),
    platform: new THREE.MeshStandardMaterial({ color: 0x3c4840 }),
    crate: new THREE.MeshStandardMaterial({ color: 0x514333 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x424b46 }),
    red: new THREE.MeshStandardMaterial({ color: 0x762323 }),
    bullet: basicMat(0xffd28a)
};

const textureLoader = new THREE.TextureLoader();

textureLoader.load(
    "images/background.jpg",
    (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.MirroredRepeatWrapping;
        texture.repeat.set(140 / 32, 1);

        const background = new THREE.Mesh(
            new THREE.PlaneGeometry(140, 16),
            new THREE.MeshBasicMaterial({ map: texture, depthWrite: false, fog: false })
        );

        background.position.set(52.5, CAMERA_Y, -8);
        background.renderOrder = -10;
        scene.add(background);
    },
    undefined,
    (error) => console.error("Background image could not load (check images/background.jpg):", error)
);

// ===== 6. WORLD: GROUND, PLATFORMS, WALLS, LAMPS =====

function makeBox(x, y, z, w, h, d, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    return mesh;
}

makeBox(55, -5.9, 0, 130, 4, 4, mat.ground);

for (let x = -10; x < 120; x += 8) {
    makeBox(x, -3.87, 0.1, 0.12, 0.04, 0.1, mat.metal);
}

const platforms = [];

function addPlatform(x, y, width) {
    makeBox(x, y, 0, width, 0.45, 2, mat.platform);
    platforms.push({ x: x - width / 2, right: x + width / 2, top: y + 0.225 });
}

[[9, -1.8, 3.5], [18, -0.7, 3], [30, -2, 4], [41, -1, 3.5], [54, -2, 4]]
    .forEach(([x, y, width]) => addPlatform(x, y, width));

for (let x = -5; x < 110; x += 15) {
    makeBox(x, 1, -2, 0.7, 10, 0.6, mat.wall);
}

for (let x = 5; x < 110; x += 20) {
    addPointLight(0x9d2929, 1.2, 7, x, 3, 3);
    makeBox(x, 3.7, 0, 1.2, 0.12, 0.2, mat.red);
}

const RADIO_ZONE_LEFT = 36;
const RADIO_ZONE_RIGHT = 56;

makeBox(43, -2.3, -0.5, 0.35, 3.2, 0.35, mat.metal);

const radioLamp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.3), basicMat(0xaa2222));
radioLamp.position.set(43, -0.55, -0.5);
scene.add(radioLamp);

const zoneStrip = new THREE.Mesh(
    new THREE.BoxGeometry(RADIO_ZONE_RIGHT - RADIO_ZONE_LEFT, 0.03, 0.6),
    new THREE.MeshBasicMaterial({ color: 0x4cff88, transparent: true, opacity: 0.25, depthWrite: false })
);
zoneStrip.position.set((RADIO_ZONE_LEFT + RADIO_ZONE_RIGHT) / 2, -3.88, 1.2);
scene.add(zoneStrip);

// ===== 7. HIDING CRATES =====

const hidingSpots = [];

[14, 34, 48, 65].forEach((x) => {
    makeBox(x, -2.95, 0.5, 1.8, 2.8, 1.5, mat.crate);
    makeBox(x, -2.9, 1.3, 1.65, 0.1, 0.08, mat.metal);
    hidingSpots.push({ x });
});

// ===== 8. PLAYER SPRITE =====

const player = new THREE.Group();
player.position.set(0, -3.9, 1.5);
scene.add(player);

let playerSprite = null;
let playerSpriteWidth = 1.5;
let playerSpriteHeight = 2.5;

function loadPlayerCharacter() {
    const path = selectedCharacter === "player1" ? "images/player1.png" : "images/player2.png";

    textureLoader.load(
        path,
        (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;

            if (playerSprite) {
                player.remove(playerSprite);
                playerSprite.material.dispose();
            }

            playerSpriteHeight = 2.5;
            playerSpriteWidth = playerSpriteHeight * (texture.image.width / texture.image.height);

            playerSprite = new THREE.Sprite(
                new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, fog: false })
            );

            playerSprite.renderOrder = 20;
            playerSprite.scale.set(playerSpriteWidth, playerSpriteHeight, 1);
            playerSprite.center.set(0.5, 0);
            playerSprite.position.set(0, 0, 1.5);

            player.add(playerSprite);
        },
        undefined,
        (error) => {
            console.error("Could not load character image:", error);
            alert("Character image not found. Check images/player1.png and images/player2.png.");
        }
    );
}

// ===== 9. GAME STATE =====

const MAG_SIZE = 12;
const START_RESERVE_AMMO = 36;
const SPRITE_FACES_RIGHT = false;

let health = 100;
let ammo = MAG_SIZE;
let reserveAmmo = START_RESERVE_AMMO;
let medkits = 2;

let bulletDamage = 20;
let weaponLevel = 1;

let collectedWeapon = false;
let radioCollected = false;
let bruteDefeated = false;

let isGrounded = true;
let isHidden = false;
let isCrouching = false;
let isRunning = false;
let facing = 1;
let velocityY = 0;

let lastDamageTime = 0;
let lastShotTime = 0;

let gameOver = false;
let gameStarted = false;
let gameWon = false;
let isPaused = false;
let pausedAt = 0;

const gravity = 0.012;
const jumpPower = 0.27;
const walkSpeed = 0.11;
const runSpeed = 0.17;

const keys = {};
const enemies = [];
const bullets = [];
const collectibles = [];

let nextMonsterTime = Infinity;

// ===== 10. SCORE =====

const HIGH_SCORE_KEY = "outbreakHighScore";
let score = 0;
let highScore = 0;

try {
    highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
} catch (e) {
    highScore = 0;
}

function addScore(points) {
    score += points;
    updateHUD();
}

function finalizeScore() {
    const isNewRecord = score > highScore;

    if (isNewRecord) {
        highScore = score;

        try {
            localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
        } catch (e) {}
    }

    setText("finalScore", score);
    setText("finalHighScore", highScore);
    byId("newRecordText").hidden = !isNewRecord;

    updateHUD();
}

function randomAmmo(min = 10, max = 30) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

// ===== 11. HUD =====

function updateHUD() {
    setText("health", health);
    setText("ammo", ammo + " / " + reserveAmmo);
    setText("medkits", medkits);
    setText("score", score);
    setText("highScore", highScore);
    setText("menuHighScore", highScore);
    setText("items", "LV. " + weaponLevel);
}

let pickupHideTimer = null;

function showPickupNotice(message) {
    let notice = byId("pickupNotice");

    if (!notice) {
        notice = document.createElement("div");
        notice.id = "pickupNotice";
        notice.className = "pickup-notice";
        byId("gameScreen").appendChild(notice);
    }

    notice.textContent = message;
    notice.style.opacity = "1";

    clearTimeout(pickupHideTimer);
    pickupHideTimer = setTimeout(() => {
        notice.style.opacity = "0";
    }, 1800);
}

// ===== 12. STORY + MISSIONS =====

const TOTAL_MISSIONS = 6;
const DEFEND_TIME_MS = 40000;

let storyTimer = null;
let introFinished = false;
let defeatedMonsters = 0;
let currentMission = 1;
let defendRemaining = DEFEND_TIME_MS;
let lastDefendSecs = -1;
let lastInZone = null;

function stopStoryTimer() {
    if (storyTimer) {
        clearInterval(storyTimer);
        storyTimer = null;
    }
}

function typeStory(text, callback) {
    const storyText = byId("story-text");

    stopStoryTimer();
    storyText.textContent = "";

    let index = 0;

    storyTimer = setInterval(() => {
        storyText.textContent += text.charAt(index);
        index++;

        byId("storyPanel").scrollTop = byId("storyPanel").scrollHeight;

        if (index >= text.length) {
            stopStoryTimer();
            if (callback) callback();
        }
    }, 30);
}

function updateMission(text) {
    setText("mission-text", "MISSION: " + text);
}

function isInRadioZone() {
    return player.position.x >= RADIO_ZONE_LEFT && player.position.x <= RADIO_ZONE_RIGHT;
}

function getMissionText() {
    switch (currentMission) {
        case 1:
            return "Eliminate 3 infected (" + Math.min(defeatedMonsters, 3) + "/3).";
        case 2:
            return "Find the radio part (blue box) near the crates ahead.";
        case 3: {
            const secs = Math.ceil(defendRemaining / 1000);

            return isInRadioZone()
                ? "Hold the radio zone. Signal ready in " + secs + "s."
                : "Return to the GREEN radio zone! Timer paused (" + secs + "s left).";
        }
        case 4:
            return "Find the weapon upgrade crate (green box) ahead.";
        case 5:
            return "Defeat the BRUTE. It's slow but hits very hard.";
        case 6:
            return "Reach the abandoned house at the end of the forest. Ambush!";
        default:
            return "";
    }
}

function getMissionLine() {
    return "MISSION " + currentMission + "/" + TOTAL_MISSIONS + ": " + getMissionText();
}

function refreshMissionText() {
    setText("mission-text", getMissionLine());
}

function advanceMission(next, story, bonus) {
    currentMission = next;
    lastDefendSecs = -1;
    lastInZone = null;

    if (bonus) {
        addScore(bonus);
        showPickupNotice("MISSION COMPLETE  +" + bonus);
    }

    refreshMissionText();
    typeStory(story);
}

function startStoryIntro() {
    introFinished = false;
    defeatedMonsters = 0;
    currentMission = 1;
    gameWon = false;

    updateMission("Explore the forest and stay alive.");
    setText("scene-title", "THE ABANDONED FOREST");
    setText("location", "FOREST ENTRANCE");

    typeStory(
        "The forest has been silent for hours. Your vehicle broke down near an abandoned house. With no signal and no way to contact anyone, you have no choice but to continue on foot. Then, somewhere between the trees, you hear something moving. You are not alone.",
        () => {
            introFinished = true;
            byId("story-text").textContent += "\n\n[ SOMETHING IS APPROACHING... ]";
            nextMonsterTime = Date.now() + 2500;
            refreshMissionText();
        }
    );
}

function checkMissionProgress(dt = 0) {
    if (gameOver || gameWon || !introFinished) return;

    switch (currentMission) {
        case 1:
            if (defeatedMonsters >= 3) {
                advanceMission(2, "The first wave is down, but the noise will bring more. Somewhere ahead, near the old crates, a radio part is lying in the dirt. Without it, there is no way to call for help.", 150);
            }
            break;

        case 2:
            if (radioCollected) {
                defendRemaining = DEFEND_TIME_MS;
                advanceMission(3, "You plug the radio part into the old transmitter. The signal needs 40 seconds to calibrate, and the infected can hear it. Stay inside the green zone and hold the line.", 150);
            }
            break;

        case 3: {
            const inZone = isInRadioZone();

            // Timer only counts down while the player is inside the zone
            if (inZone && dt > 0) {
                defendRemaining = Math.max(0, defendRemaining - dt);
            }

            const secs = Math.ceil(defendRemaining / 1000);

            if (inZone !== lastInZone || secs !== lastDefendSecs) {
                lastInZone = inZone;
                lastDefendSecs = secs;
                refreshMissionText();
            }

            if (defendRemaining <= 0) {
                radioLamp.material.color.set(0x37d67a);
                advanceMission(4, "The signal goes out. A distant voice crackles back: 'Hold on, we're coming.' Rescue is hours away. A weapon crate was left in the forest ahead, and you will need it.", 300);
            }
            break;
        }

        case 4:
            if (collectedWeapon) {
                advanceMission(5, "The upgraded weapon feels solid in your hands. Then the ground shakes. Something huge is crashing through the trees toward you. It's a BRUTE.", 200);
                spawnMonster("brute");
            }
            break;

        case 5:
            if (bruteDefeated) {
                advanceMission(6, "The Brute collapses with a thunderous crash. The abandoned house is just ahead, but the noise has woken everything in the forest. Run for it!", 500);
            }
            break;

        case 6:
            if (player.position.x >= 95) winGame();
            break;
    }
}

function winGame() {
    if (gameWon) return;

    gameWon = true;
    gameOver = true;
    gameStarted = false;

    updateMission("MISSION COMPLETE!");
    addScore(500 + health * 5);
    finalizeScore();

    setText("scene-title", "THE LAST SURVIVOR");
    setText("location", "ABANDONED HOUSE");

    typeStory("You finally reach the abandoned house. The infected are left behind in the darkness. You survived the night. But as you look through the window, you notice a light moving inside. Maybe you were never alone.");

    setTimeout(() => {
        setText("gameEndTitle", "MISSION COMPLETE");
        setText("gameEndMessage", "You survived the night. But the nightmare may not be over.");
        byId("gameEndScreen").hidden = false;
    }, 5000);
}

function endGame() {
    if (gameOver) return;

    gameOver = true;
    gameStarted = false;

    updateMission("MISSION FAILED");
    finalizeScore();

    setText("story-text", "You have been overrun. The infection has taken you. Restart to try again.");
    setText("location", "MISSION FAILED");
    setText("scene-title", "SURVIVOR LOST");
    setText("gameEndTitle", "GAME OVER");
    setText("gameEndMessage", "You have been overrun by the infected. Your survival journey has ended.");

    byId("gameEndScreen").hidden = false;
}

// ===== 13. PLAYER MOVEMENT =====

function jump() {
    if (gameStarted && isGrounded && !isHidden && !gameOver) {
        velocityY = jumpPower;
        isGrounded = false;
    }
}

function updatePlayer() {
    if (gameOver) return;

    const speed = isRunning ? runSpeed : walkSpeed;
    const moveLeft = keys.a || keys.arrowleft;
    const moveRight = keys.d || keys.arrowright;

    if (!isHidden) {
        if (moveLeft) {
            player.position.x -= speed;
            facing = -1;
        }

        if (moveRight) {
            player.position.x += speed;
            facing = 1;
        }
    }

    player.position.x = Math.max(0, Math.min(105, player.position.x));

    velocityY -= gravity;
    player.position.y += velocityY;

    const previousY = player.position.y - velocityY;
    let landed = false;

    if (player.position.y <= -3.9) {
        player.position.y = -3.9;
        velocityY = 0;
        isGrounded = true;
        landed = true;
    }

    if (velocityY <= 0 && !landed) {
        for (const platform of platforms) {
            const overlapsX =
                player.position.x + 0.35 > platform.x &&
                player.position.x - 0.35 < platform.right;

            const crossedPlatform =
                previousY >= platform.top - 0.1 &&
                player.position.y <= platform.top;

            if (overlapsX && crossedPlatform) {
                player.position.y = platform.top;
                velocityY = 0;
                isGrounded = true;
                landed = true;
                break;
            }
        }
    }

    if (!landed && player.position.y > -3.9) isGrounded = false;

    if (!isHidden && !moveLeft && !moveRight) {
        let nearest = null;
        let nearestDist = 12;

        for (const enemy of enemies) {
            if (!enemy.alive) continue;

            const d = Math.abs(enemy.mesh.position.x - player.position.x);

            if (d < nearestDist) {
                nearest = enemy;
                nearestDist = d;
            }
        }

        if (nearest) {
            facing = nearest.mesh.position.x > player.position.x ? 1 : -1;
        }
    }

    if (playerSprite) {
        playerSprite.scale.y = isCrouching || isHidden ? 1.45 : playerSpriteHeight;
        playerSprite.scale.x = playerSpriteWidth * facing * (SPRITE_FACES_RIGHT ? 1 : -1);
        playerSprite.material.opacity = isHidden ? 0.45 : 1;
    }
}

// ===== 14. ENEMY TYPES =====

const ENEMY_TYPES = {
    zombie: { size: 1,    health: 40,  speed: 0.025, damage: 10, skin: 0x68785b, eye: 0xe6e4a0, points: 100, label: "INFECTED ELIMINATED" },
    mutant: { size: 1.25, health: 90,  speed: 0.035, damage: 18, skin: 0x753d3d, eye: 0xff1616, points: 250, label: "MUTANT ELIMINATED" },
    brute:  { size: 1.8,  health: 200, speed: 0.017, damage: 30, skin: 0x4f3a33, eye: 0xff3b1a, points: 600, label: "THE BRUTE IS DOWN!" }
};

function makeEnemyPart(parent, geometry, material, x, y, z) {
    const part = new THREE.Mesh(geometry, material);

    part.position.set(x, y, z);
    part.castShadow = true;
    part.receiveShadow = true;
    parent.add(part);

    return part;
}

function makeLimb(parent, pivotX, pivotY, boxSize, boxY, material, hasHand) {
    const limb = new THREE.Group();
    limb.position.set(pivotX, pivotY, 0);
    parent.add(limb);

    makeEnemyPart(limb, new THREE.BoxGeometry(...boxSize), material, 0, boxY, 0);

    if (hasHand) {
        makeEnemyPart(limb, new THREE.SphereGeometry(0.14, 8, 8), material, 0, -0.85, 0);
    }

    return limb;
}

// ===== 15. ENEMY HEALTH BAR =====

const HEALTH_BAR_WIDTH = 1.4;

function createEnemyHealthBar(enemy) {
    const bar = new THREE.Group();

    const makePlane = (color, z, renderOrder) => {
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(HEALTH_BAR_WIDTH, 0.12),
            new THREE.MeshBasicMaterial({ color, depthTest: false })
        );

        plane.position.z = z;
        plane.renderOrder = renderOrder;
        bar.add(plane);

        return plane;
    };

    makePlane(0x241313, 0.8, 10);
    enemy.healthFill = makePlane(0xe32626, 0.82, 11);

    bar.position.set(0, 2.85, 0.7);
    enemy.mesh.add(bar);

    enemy.healthBar = bar;
    enemy.maxHealth = enemy.health;
}

function updateEnemyHealthBar(enemy) {
    const percentage = Math.max(0, enemy.health / enemy.maxHealth);

    enemy.healthFill.scale.x = percentage;
    enemy.healthFill.position.x = -HEALTH_BAR_WIDTH * (1 - percentage) / 2;
}

// ===== 16. CREATE 3D MONSTER =====

function createEnemy(x, type = "zombie") {
    const stats = ENEMY_TYPES[type] || ENEMY_TYPES.zombie;
    const isBig = type !== "zombie";

    const enemy = new THREE.Group();

    const skin = standardMat(stats.skin);
    const dark = standardMat(0x201d1b);
    const teeth = new THREE.MeshStandardMaterial({ color: 0xd5d0b7 });
    const mouth = basicMat(0x080303);
    const eye = basicMat(stats.eye);

    makeEnemyPart(enemy, new THREE.BoxGeometry(isBig ? 0.95 : 0.72, isBig ? 1.3 : 1.05, 0.45), skin, 0, 1.05, 0);
    makeEnemyPart(enemy, new THREE.CylinderGeometry(0.16, 0.2, 0.25, 8), skin, 0, 1.78, 0);

    const head = makeEnemyPart(enemy, new THREE.SphereGeometry(isBig ? 0.43 : 0.34, 16, 12), skin, 0, 2.1, 0.03);

    makeEnemyPart(enemy, new THREE.BoxGeometry(0.42, 0.16, 0.35), dark, 0, 1.88, 0.3);
    makeEnemyPart(enemy, new THREE.BoxGeometry(0.25, 0.12, 0.035), mouth, 0, 1.95, 0.47);

    for (const eyeX of [-0.14, 0.14]) {
        makeEnemyPart(enemy, new THREE.SphereGeometry(0.095, 10, 8), dark, eyeX, 2.19, 0.30);
        makeEnemyPart(enemy, new THREE.SphereGeometry(0.045, 10, 8), eye, eyeX, 2.19, 0.41);
    }

    for (const toothX of [-0.08, 0, 0.08]) {
        makeEnemyPart(enemy, new THREE.BoxGeometry(0.035, 0.07, 0.035), teeth, toothX, 1.94, 0.5);
    }

    const leftArm = makeLimb(enemy, -0.48, 1.55, [0.22, 0.9, 0.25], -0.38, skin, true);
    const rightArm = makeLimb(enemy, 0.48, 1.55, [0.22, 0.9, 0.25], -0.38, skin, true);
    const leftLeg = makeLimb(enemy, -0.2, 0.65, [0.25, 0.75, 0.3], -0.3, skin, false);
    const rightLeg = makeLimb(enemy, 0.2, 0.65, [0.25, 0.75, 0.3], -0.3, skin, false);

    if (isBig) {
        for (const hornX of [-0.27, 0.27]) {
            makeEnemyPart(enemy, new THREE.ConeGeometry(0.13, 0.4, 6), dark, hornX, 2.45, 0);
        }

        makeEnemyPart(enemy, new THREE.SphereGeometry(0.16, 8, 8), dark, 0, 1.25, 0.25);
    }

    if (type === "brute") {
        for (const spikeX of [-0.62, 0.62]) {
            makeEnemyPart(enemy, new THREE.ConeGeometry(0.14, 0.45, 6), dark, spikeX, 1.85, 0);
        }
    }

    enemy.scale.setScalar(stats.size);
    enemy.position.set(x, -3.9, 1.5);
    scene.add(enemy);

    const enemyData = {
        mesh: enemy,
        type,
        size: stats.size,
        health: stats.health,
        speed: stats.speed,
        damage: stats.damage,
        points: stats.points,
        label: stats.label,
        attackRange: 1.25 * stats.size,
        alive: true,
        head, leftLeg, rightLeg, leftArm, rightArm,
        walkOffset: Math.random() * 10
    };

    createEnemyHealthBar(enemyData);
    enemies.push(enemyData);
}

// ===== 17. MONSTER SPAWNING =====

function spawnMonster(forcedType) {
    const halfWidth = (camera.right - camera.left) / 2;

    const rightSpawnX = camera.position.x + halfWidth + 2;
    const leftSpawnX = camera.position.x - halfWidth - 2;

    let spawnX;

    if (rightSpawnX <= 103) {
        spawnX = rightSpawnX;
    } else if (leftSpawnX >= 2) {
        spawnX = leftSpawnX;
    } else {
        spawnX = Math.min(103, Math.max(2, player.position.x + halfWidth + 2));
    }

    let type = forcedType;

    if (!type) {
        const mutantChance = currentMission >= 5 ? 0.45 : 0.3;
        type = Math.random() < mutantChance ? "mutant" : "zombie";
    }

    createEnemy(spawnX, type);
}

function getSpawnSettings() {
    if (currentMission === 1) return { min: 6000, rand: 2000, maxAlive: 3 };
    if (currentMission === 3) return { min: 3500, rand: 1500, maxAlive: 5 };
    if (currentMission === 6) return { min: 5000, rand: 2500, maxAlive: 5 };
    return { min: 8000, rand: 3000, maxAlive: 4 };
}

function updateMonsterSpawning() {
    if (!gameStarted || gameOver || !introFinished) return;

    const now = Date.now();
    if (now < nextMonsterTime) return;

    for (let i = enemies.length - 1; i >= 0; i--) {
        if (!enemies[i].alive) enemies.splice(i, 1);
    }

    const settings = getSpawnSettings();
    const aliveRegular = enemies.filter(e => e.alive && e.type !== "brute").length;

    if (aliveRegular < settings.maxAlive) spawnMonster();

    nextMonsterTime = now + settings.min + Math.random() * settings.rand;
}

// ===== 18. ENEMY + ATTACKS =====

function hasCrateBetween(enemyX, playerX) {
    return hidingSpots.some(spot =>
        spot.x > Math.min(enemyX, playerX) && spot.x < Math.max(enemyX, playerX)
    );
}

function updateEnemies() {
    const now = Date.now();

    enemies.forEach((enemy) => {
        if (!enemy.alive) return;

        const distance = player.position.x - enemy.mesh.position.x;
        const absoluteDistance = Math.abs(distance);
        const lostPlayer = isHidden && hasCrateBetween(enemy.mesh.position.x, player.position.x);

        if (absoluteDistance < 16 && !lostPlayer) {
            enemy.mesh.position.x += Math.sign(distance) * enemy.speed;
        }

        enemy.mesh.rotation.y = distance < 0 ? -1.2 : 1.2;
        enemy.healthBar.rotation.y = -enemy.mesh.rotation.y;

        const walk = Math.sin(now * 0.006 + enemy.walkOffset) * 0.5;

        enemy.leftLeg.rotation.x = walk;
        enemy.rightLeg.rotation.x = -walk;
        enemy.leftArm.rotation.x = -0.8 - walk * 0.4;
        enemy.rightArm.rotation.x = -0.8 + walk * 0.4;
        enemy.head.rotation.z = Math.sin(now * 0.002 + enemy.walkOffset) * 0.08;

        if (absoluteDistance < enemy.attackRange && !isHidden && now - lastDamageTime > 1000) {
            health = Math.max(0, health - enemy.damage);
            lastDamageTime = now;
            updateHUD();

            if (health <= 0) endGame();
        }
    });
}

// ===== 19. SHOOTING + BULLETS =====

function shoot() {
    if (!gameStarted || gameOver || isHidden) return;

    if (ammo <= 0) {
        showPickupNotice(reserveAmmo > 0 ? "OUT OF AMMO - RELOAD!" : "NO AMMO LEFT!");
        return;
    }

    const now = Date.now();
    if (now - lastShotTime < 300) return;

    lastShotTime = now;
    ammo--;

    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), mat.bullet);
    mesh.position.set(player.position.x + facing * 0.8, player.position.y + 1.25, 2);
    scene.add(mesh);

    bullets.push({ mesh, direction: facing, speed: 0.42, alive: true });

    updateHUD();
}

function killEnemy(enemy) {
    enemy.health = 0;
    enemy.alive = false;
    scene.remove(enemy.mesh);

    defeatedMonsters++;
    if (enemy.type === "brute") bruteDefeated = true;

    addScore(enemy.points);
    showPickupNotice(enemy.label);

    if (currentMission === 1) refreshMissionText();
    checkMissionProgress();
}

function updateBullets() {
    bullets.forEach((bullet) => {
        if (!bullet.alive) return;

        bullet.mesh.position.x += bullet.direction * bullet.speed;

        enemies.forEach((enemy) => {
            if (!enemy.alive || !bullet.alive) return;

            const distanceX = Math.abs(bullet.mesh.position.x - enemy.mesh.position.x);
            const enemyTargetY = enemy.mesh.position.y + 1.2 * enemy.size;
            const distanceY = Math.abs(bullet.mesh.position.y - enemyTargetY);

            if (distanceX < 0.7 * enemy.size && distanceY < 1.4 * enemy.size) {
                enemy.health -= bulletDamage;

                bullet.alive = false;
                scene.remove(bullet.mesh);

                updateEnemyHealthBar(enemy);

                if (enemy.health <= 0) killEnemy(enemy);
            }
        });

        if (bullet.alive && Math.abs(bullet.mesh.position.x - player.position.x) > 18) {
            bullet.alive = false;
            scene.remove(bullet.mesh);
        }
    });

    for (let i = bullets.length - 1; i >= 0; i--) {
        if (!bullets[i].alive) bullets.splice(i, 1);
    }
}

// ===== 20. RELOAD + MEDKIT =====

function reload() {
    if (!gameStarted || gameOver || ammo === MAG_SIZE) return;

    if (reserveAmmo <= 0) {
        showPickupNotice("NO RESERVE AMMO");
        return;
    }

    const amount = Math.min(MAG_SIZE - ammo, reserveAmmo);

    ammo += amount;
    reserveAmmo -= amount;

    updateHUD();
}

function useMedkit() {
    if (!gameStarted || gameOver) return;

    if (medkits <= 0) {
        showPickupNotice("NO MEDKITS LEFT");
        return;
    }

    if (health >= 100) {
        showPickupNotice("HEALTH ALREADY FULL");
        return;
    }

    health = Math.min(100, health + 35);
    medkits--;

    showPickupNotice("+35 HEALTH");
    updateHUD();
}

// ===== 21. HIDE + CROUCH =====

function toggleHide() {
    if (!gameStarted || gameOver) return;

    const nearbyCrate = hidingSpots.find(spot => Math.abs(player.position.x - spot.x) < 1.7);

    if (nearbyCrate) {
        isHidden = !isHidden;
        isCrouching = isHidden;

        showPickupNotice(isHidden ? "HIDING" : "LEFT HIDING SPOT");
        updateHUD();
    } else {
        isCrouching = !isCrouching;
    }
}

// ===== 22. PAUSE + QUIT =====

function setPauseScreen(visible) {
    byId("pauseScreen").hidden = !visible;
}

function pauseGame() {
    if (!gameStarted || gameOver || isPaused) return;

    isPaused = true;
    gameStarted = false;
    pausedAt = Date.now();

    Object.keys(keys).forEach(key => { keys[key] = false; });

    isRunning = false;
    isCrouching = isHidden;

    setText("pauseScore", score);
    setText("pauseMission", getMissionLine());

    setPauseScreen(true);
}

function resumeGame() {
    if (!isPaused) return;

    const pausedFor = Date.now() - pausedAt;

    isPaused = false;
    gameStarted = true;

    if (nextMonsterTime !== Infinity) nextMonsterTime += pausedFor;
    lastDamageTime += pausedFor;

    setPauseScreen(false);
}

function quitToMenu() {
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(error => console.log("Could not exit fullscreen:", error));
    }

    isPaused = false;
    gameOver = false;
    gameStarted = false;

    setPauseScreen(false);
    byId("gameEndScreen").hidden = true;
    byId("gameScreen").hidden = true;
    byId("mainMenu").hidden = false;

    updateHUD();
}

// ===== 23. COLLECTIBLES =====

const COLLECTIBLE_COLORS = {
    medkit: 0xe5e5dc,
    ammo: 0xb58a3c,
    weapon: 0x526b55,
    radio: 0x3b6ea5,
    supply: 0x65513b
};

function decorateCollectible(item, type) {
    const addDetail = (geometry, material, x, y, z) => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        item.add(mesh);
    };

    if (type === "medkit") {
        const cross = basicMat(0xc92727);
        addDetail(new THREE.BoxGeometry(0.12, 0.34, 0.04), cross, 0, 0, 0.25);
        addDetail(new THREE.BoxGeometry(0.34, 0.12, 0.04), cross, 0, 0, 0.25);
    }

    if (type === "ammo") {
        addDetail(new THREE.BoxGeometry(0.12, 0.52, 0.05), basicMat(0xe8c66d), 0, 0, 0.25);
    }

    if (type === "weapon") {
        const gun = new THREE.MeshStandardMaterial({ color: 0x1d2420, metalness: 0.6, roughness: 0.4 });
        addDetail(new THREE.BoxGeometry(0.85, 0.12, 0.12), gun, 0, 0.05, 0.3);
    }

    if (type === "radio") {
        addDetail(new THREE.BoxGeometry(0.06, 0.5, 0.06), basicMat(0x9fd0ff), 0.2, 0.45, 0.2);
    }

    if (type === "supply") {
        addDetail(new THREE.BoxGeometry(0.72, 0.1, 0.5), new THREE.MeshStandardMaterial({ color: 0x8a7049 }), 0, 0.28, 0);
    }
}

function createCollectible(x, type) {
    const item = new THREE.Group();

    item.add(new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.5, 0.45),
        standardMat(COLLECTIBLE_COLORS[type], 0.8)
    ));

    decorateCollectible(item, type);

    item.position.set(x, -3.45, 2);
    scene.add(item);

    collectibles.push({ mesh: item, type, x, collected: false, baseY: -3.45, phase: Math.random() * Math.PI * 2 });
}

function createWorldCollectibles() {
    [
        [11, "medkit"], [25, "ammo"], [39, "medkit"], [46, "radio"], [53, "ammo"],
        [58, "medkit"], [64, "ammo"], [70, "weapon"], [80, "ammo"], [86, "supply"]
    ].forEach(([x, type]) => createCollectible(x, type));
}

function collectItem(item) {
    if (item.collected) return;

    item.collected = true;
    scene.remove(item.mesh);

    if (item.type === "medkit") {
        addScore(25);
        medkits++;
        showPickupNotice("+1 MEDKIT COLLECTED");
    } else if (item.type === "ammo") {
        const amount = randomAmmo(10, 30);
        addScore(25);
        reserveAmmo += amount;
        showPickupNotice("+" + amount + " AMMO COLLECTED");
    } else if (item.type === "radio") {
        addScore(100);
        radioCollected = true;
        showPickupNotice("RADIO PART FOUND!");
    } else if (item.type === "weapon") {
        addScore(100);
        collectedWeapon = true;
        weaponLevel = 2;
        bulletDamage = 30;
        showPickupNotice("WEAPON UPGRADE ACQUIRED!");
    } else if (item.type === "supply") {
        const amount = randomAmmo(10, 20);
        addScore(50);
        medkits++;
        reserveAmmo += amount;
        showPickupNotice("SUPPLY CRATE: +1 MEDKIT, +" + amount + " AMMO");
    }

    updateHUD();
    checkMissionProgress();
}

let lastLockedHint = 0;

function updateCollectibles() {
    const now = Date.now();

    collectibles.forEach(item => {
        if (item.collected) return;

        item.mesh.position.y = item.baseY + Math.sin(now * 0.003 + item.phase) * 0.12;
        item.mesh.rotation.y += 0.01;

        const closeEnough =
            Math.abs(player.position.x - item.x) < 1.1 &&
            Math.abs(player.position.y + 3.9) < 1.5;

        if (!closeEnough) return;

        const locked =
            (item.type === "radio" && currentMission !== 2) ||
            (item.type === "weapon" && currentMission !== 4);

        if (locked) {
            if (now - lastLockedHint > 2500) {
                lastLockedHint = now;
                showPickupNotice("FINISH YOUR CURRENT MISSION FIRST");
            }
            return;
        }

        collectItem(item);
    });
}

// ===== 24. KEYBOARD CONTROLS =====

document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if ((key === "p" || key === "escape") && !event.repeat) {
        if (isPaused) resumeGame();
        else pauseGame();
        return;
    }

    if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        event.preventDefault();
    }

    if (!gameStarted || gameOver) return;

    keys[key] = true;

    if (event.repeat) return;

    if (key === " " || key === "w" || key === "arrowup") jump();
    if (key === "shift") isRunning = true;
    if (key === "j") shoot();
    if (key === "r") reload();
    if (key === "h") useMedkit();
    if (key === "e") toggleHide();
    if (key === "s") isCrouching = true;
});

document.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();

    keys[key] = false;

    if (key === "shift") isRunning = false;
    if (key === "s" && !isHidden) isCrouching = false;
});

// ===== 25. TOUCH CONTROLS =====

document.querySelectorAll("[data-move]").forEach(button => {
    const action = button.dataset.move;

    button.addEventListener("contextmenu", event => event.preventDefault());

    button.addEventListener("pointerdown", event => {
        event.preventDefault();

        if (!gameStarted || gameOver) return;

        if (action === "left") keys.a = true;
        if (action === "right") keys.d = true;
        if (action === "run") isRunning = true;
        if (action === "crouch") isCrouching = true;

        if (action === "jump") jump();
        if (action === "shoot") shoot();
        if (action === "hide") toggleHide();
        if (action === "medkit") useMedkit();
        if (action === "reload") reload();
    });

    const stop = () => {
        if (action === "left") keys.a = false;
        if (action === "right") keys.d = false;
        if (action === "run") isRunning = false;
        if (action === "crouch" && !isHidden) isCrouching = false;
    };

    button.addEventListener("pointerup", stop);
    button.addEventListener("pointerleave", stop);
    button.addEventListener("pointercancel", stop);
});

// ===== 26. CAMERA + RESIZE =====

function updateCamera() {
    camera.position.x += (player.position.x + 2 - camera.position.x) * 0.08;
    camera.position.y = CAMERA_Y;
    camera.lookAt(camera.position.x, CAMERA_Y, 0);
}

function resizeGame() {
    const width = Math.max(1, gameContainer.clientWidth || window.innerWidth);
    const height = Math.max(1, gameContainer.clientHeight || window.innerHeight);

    const viewHeight = 12;
    const aspect = width / height;

    camera.left = -(viewHeight * aspect) / 2;
    camera.right = (viewHeight * aspect) / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;

    camera.position.y = CAMERA_Y;
    camera.lookAt(camera.position.x, CAMERA_Y, 0);
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
}

function resizeSoon() {
    requestAnimationFrame(() => {
        resizeGame();
        requestAnimationFrame(resizeGame);
    });
}

window.addEventListener("resize", resizeGame);
window.addEventListener("orientationchange", resizeSoon);
document.addEventListener("fullscreenchange", () => requestAnimationFrame(resizeGame));

if ("ResizeObserver" in window) {
    new ResizeObserver(resizeGame).observe(gameContainer);
}

// ===== 27. START / CONTINUE GAME =====

function removeAll(list) {
    list.forEach(entry => scene.remove(entry.mesh));
    list.length = 0;
}

function resetGameState() {
    score = 0;
    health = 100;
    ammo = MAG_SIZE;
    reserveAmmo = START_RESERVE_AMMO;
    medkits = 2;

    bulletDamage = 20;
    weaponLevel = 1;

    collectedWeapon = false;
    radioCollected = false;
    bruteDefeated = false;

    defeatedMonsters = 0;
    currentMission = 1;
    defendRemaining = DEFEND_TIME_MS;
    lastDefendSecs = -1;
    lastInZone = null;
    radioLamp.material.color.set(0xaa2222);

    player.position.set(0, -3.9, 1.5);
    velocityY = 0;
    facing = 1;

    isGrounded = true;
    isHidden = false;
    isCrouching = false;
    isRunning = false;

    gameOver = false;
    gameWon = false;
    gameStarted = false;
    introFinished = false;

    Object.keys(keys).forEach(key => { keys[key] = false; });

    lastDamageTime = 0;
    lastShotTime = 0;
    nextMonsterTime = Infinity;

    stopStoryTimer();
    removeAll(enemies);
    removeAll(bullets);
    removeAll(collectibles);
    createWorldCollectibles();

    camera.position.set(0, CAMERA_Y, 25);
    camera.lookAt(0, CAMERA_Y, 0);
}

function enterFullscreen(element) {
    if (!element.requestFullscreen) {
        resizeGame();
        return;
    }

    element.requestFullscreen()
        .then(() => {
            resizeGame();

            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock("landscape")
                    .catch(error => console.log("Landscape lock unavailable:", error));
            }
        })
        .catch(error => {
            console.log("Fullscreen unavailable:", error);
            resizeGame();
        });
}

function beginGame() {
    byId("mainMenu").hidden = true;
    byId("gameScreen").hidden = false;

    isPaused = false;
    setPauseScreen(false);
    byId("newRecordText").hidden = true;

    loadPlayerCharacter();
    resetGameState();

    setText("scene-title", "THE ABANDONED FOREST");
    setText("location", "FOREST ENTRANCE");
    setText("story-text", "");
    updateMission("Prepare to survive.");
    updateHUD();

    resizeSoon();
    resizeGame();

    byId("controlsOverlay").hidden = false;

    enterFullscreen(byId("gameScreen"));
}

function continueGame() {
    byId("controlsOverlay").hidden = true;
    gameStarted = true;
    startStoryIntro();
}

// ===== 28. CONNECT HTML BUTTONS =====

document.querySelectorAll(".character-option").forEach(button => {
    button.addEventListener("click", () => selectCharacter(button.dataset.character));
});

byId("menuInstructions").innerHTML = byId("instructionsBody").innerHTML;

byId("startGameButton").addEventListener("click", beginGame);
byId("continueButton").addEventListener("click", continueGame);

byId("howToButton").addEventListener("click", () => {
    byId("mainMenu").hidden = true;
    byId("howToScreen").hidden = false;
});

byId("howToBackButton").addEventListener("click", () => {
    byId("howToScreen").hidden = true;
    byId("mainMenu").hidden = false;
});

byId("restartButton").addEventListener("click", () => {
    byId("gameEndScreen").hidden = true;
    beginGame();
});

byId("pauseRestartButton").addEventListener("click", () => {
    setPauseScreen(false);
    beginGame();
});

byId("quitButton").addEventListener("click", quitToMenu);
byId("pauseQuitButton").addEventListener("click", quitToMenu);
byId("pauseButton").addEventListener("click", pauseGame);
byId("resumeButton").addEventListener("click", resumeGame);

document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseGame();
});

// ===== 29. GAME LOOP =====

let lastFrameTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    const nowTime = performance.now();
    const dt = Math.min(100, nowTime - lastFrameTime);
    lastFrameTime = nowTime;

    if (gameStarted && !gameOver) {
        updatePlayer();
        updateMonsterSpawning();
        updateEnemies();
        updateBullets();
        updateCollectibles();
        updateCamera();
        checkMissionProgress(dt);
    }

    renderer.render(scene, camera);
}

updateHUD();
animate();