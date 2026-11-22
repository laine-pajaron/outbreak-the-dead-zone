import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

console.log("OUTBREAK: THE DEAD ZONE");

// =====================================
// 1. PLAYER INFORMATION + MENUS
// =====================================

let playerUsername = "";
let selectedCharacter = "";

window.registerPlayer = function () {
    const usernameInput = document.getElementById("usernameInput");
    const message = document.getElementById("signupMessage");

    const username = usernameInput.value.trim();

    if (!username) {
        message.textContent = "Please enter a username.";
        return;
    }

    playerUsername = username;

    document.getElementById("signupScreen").hidden = true;
    document.getElementById("characterSelection").hidden = false;
};

window.selectCharacter = function (character) {
    selectedCharacter = character;

    document.getElementById("characterSelection").hidden = true;
    document.getElementById("mainMenu").hidden = false;

    document.getElementById("displayUsername").textContent = playerUsername;

    document.getElementById("selectedCharacterText").textContent =
        "Selected Character: " + character.toUpperCase();
};

// =====================================
// 2. GAME SETUP
// =====================================

const gameContainer = document.getElementById("game3D");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080e0b);
scene.fog = new THREE.Fog(0x080e0b, 35, 90);

const camera = new THREE.OrthographicCamera(-10, 10, 6, -6, 0.1, 100);

const CAMERA_Y = -1.5;
camera.position.set(0, CAMERA_Y, 25);
camera.lookAt(0, CAMERA_Y, 0);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.setSize(
    gameContainer.clientWidth || window.innerWidth,
    gameContainer.clientHeight || window.innerHeight
);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

gameContainer.appendChild(renderer.domElement);

// =====================================
// 3. LIGHTING AND ATMOSPHERE
// =====================================

scene.add(new THREE.AmbientLight(0x87958a, 0.75));

const moonLight = new THREE.DirectionalLight(0xa8b8a3, 1.2);

moonLight.position.set(-5, 9, 12);
moonLight.castShadow = true;

scene.add(moonLight);

const redLight = new THREE.PointLight(0x8d2020, 1.5, 15);

redLight.position.set(12, 2, 5);
scene.add(redLight);

const greenLight = new THREE.PointLight(0x294b35, 1.5, 20);

greenLight.position.set(30, 1, 5);
scene.add(greenLight);

// =====================================
// 4. MATERIALS
// =====================================

const mat = {
    ground: new THREE.MeshStandardMaterial({
        color: 0x252d28,
        roughness: 1
    }),

    wall: new THREE.MeshStandardMaterial({
        color: 0x151e19,
        roughness: 1
    }),

    platform: new THREE.MeshStandardMaterial({
        color: 0x3c4840
    }),

    crate: new THREE.MeshStandardMaterial({
        color: 0x514333
    }),

    metal: new THREE.MeshStandardMaterial({
        color: 0x424b46
    }),

    red: new THREE.MeshStandardMaterial({
        color: 0x762323
    }),

    bullet: new THREE.MeshBasicMaterial({
        color: 0xffd28a
    })
};

const textureLoader = new THREE.TextureLoader();

// =====================================
// 5. BACKGROUND IMAGE
// =====================================

let backgroundPlane;

textureLoader.load(
    "images/background.jpg",

    (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;

        texture.wrapS = THREE.MirroredRepeatWrapping;
        texture.repeat.set(140 / 32, 1);

        const backgroundMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            depthWrite: false,
            fog: false
        });

        const backgroundGeometry = new THREE.PlaneGeometry(140, 16);

        backgroundPlane = new THREE.Mesh(
            backgroundGeometry,
            backgroundMaterial
        );

        backgroundPlane.position.set(52.5, CAMERA_Y, -8);
        backgroundPlane.renderOrder = -10;

        scene.add(backgroundPlane);

        console.log("Forest background loaded!");
    },

    undefined,

    (error) => {
        console.error("Background image could not load:", error);
        console.log("Check if images/background.jpg exists.");
    }
);

// =====================================
// 6. WORLD OBJECT HELPERS
// =====================================

function makeBox(x, y, z, w, h, d, material) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);

    return mesh;
}

// =====================================
// 7. ENVIRONMENT
// =====================================

// Ground
makeBox(55, -5.9, 0, 130, 4, 4, mat.ground);

// Floor markings
for (let x = -10; x < 120; x += 8) {
    makeBox(x, -3.87, 0.1, 0.12, 0.04, 0.1, mat.metal);
}

// Platforms
const platforms = [];

function addPlatform(x, y, width) {
    makeBox(x, y, 0, width, 0.45, 2, mat.platform);

    platforms.push({
        x: x - width / 2,
        right: x + width / 2,
        top: y + 0.225
    });
}

addPlatform(9, -1.8, 3.5);
addPlatform(18, -0.7, 3);
addPlatform(30, -2, 4);
addPlatform(41, -1, 3.5);
addPlatform(54, -2, 4);

// Background pillars
for (let x = -5; x < 110; x += 15) {
    makeBox(x, 1, -2, 0.7, 10, 0.6, mat.wall);
}

// Warning lights
for (let x = 5; x < 110; x += 20) {
    const lamp = new THREE.PointLight(0x9d2929, 1.2, 7);

    lamp.position.set(x, 3, 3);
    scene.add(lamp);

    makeBox(x, 3.7, 0, 1.2, 0.12, 0.2, mat.red);
}

// Radio transmitter tower + defense zone marker (Mission 3)
const RADIO_ZONE_LEFT = 36;
const RADIO_ZONE_RIGHT = 56;

makeBox(43, -2.3, -0.5, 0.35, 3.2, 0.35, mat.metal);

const radioLamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.3, 0.3),
    new THREE.MeshBasicMaterial({ color: 0xaa2222 })
);

radioLamp.position.set(43, -0.55, -0.5);
scene.add(radioLamp);

const zoneStrip = new THREE.Mesh(
    new THREE.BoxGeometry(RADIO_ZONE_RIGHT - RADIO_ZONE_LEFT, 0.03, 0.6),
    new THREE.MeshBasicMaterial({
        color: 0x4cff88,
        transparent: true,
        opacity: 0.25,
        depthWrite: false
    })
);

zoneStrip.position.set((RADIO_ZONE_LEFT + RADIO_ZONE_RIGHT) / 2, -3.88, 1.2);
scene.add(zoneStrip);

// =====================================
// 8. HIDING CRATES
// =====================================

const hidingSpots = [];

function createCrate(x) {
    makeBox(x, -2.95, 0.5, 1.8, 2.8, 1.5, mat.crate);
    makeBox(x, -2.9, 1.3, 1.65, 0.1, 0.08, mat.metal);

    hidingSpots.push({
        x,
        left: x - 1.3,
        right: x + 1.3
    });
}

createCrate(14);
createCrate(34);
createCrate(48);
createCrate(65);

// =====================================
// 9. PLAYER CHARACTER SPRITE
// =====================================

const player = new THREE.Group();

scene.add(player);

let playerSprite = null;
let playerSpriteWidth = 1.5;
let playerSpriteHeight = 2.5;

function loadPlayerCharacter() {
    const characterPath =
        selectedCharacter === "player1"
            ? "images/player1.png"
            : "images/player2.png";

    textureLoader.load(
        characterPath,

        (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;

            if (playerSprite) {
                player.remove(playerSprite);
                playerSprite.material.dispose();
            }

            const aspect = texture.image.width / texture.image.height;

            playerSpriteHeight = 2.5;
            playerSpriteWidth = playerSpriteHeight * aspect;

            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthTest: false,
                fog: false
            });

            playerSprite = new THREE.Sprite(material);
            playerSprite.renderOrder = 20;

            playerSprite.scale.set(
                playerSpriteWidth,
                playerSpriteHeight,
                1
            );

            playerSprite.center.set(0.5, 0);
            playerSprite.position.set(0, 0, 1.5);

            player.add(playerSprite);
        },

        undefined,

        (error) => {
            console.error("Could not load character image:", error);

            alert(
                "Character image not found. Check images/player1.png and images/player2.png."
            );
        }
    );
}

player.position.set(0, -3.9, 1.5);

// =====================================
// 10. PLAYER STATS AND GAME VARIABLES
// =====================================

const MAG_SIZE = 12;

let health = 100;
let ammo = MAG_SIZE;
let reserveAmmo = 36;
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

// SCORE SYSTEM
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

    document.getElementById("finalScore").textContent = score;
    document.getElementById("finalHighScore").textContent = highScore;
    document.getElementById("newRecordText").hidden = !isNewRecord;

    updateHUD();
}

// If your player PNG faces LEFT, change this to false
const SPRITE_FACES_RIGHT = true;

// Random ammo box: 10 to 30 bullets
function randomAmmo(min = 10, max = 30) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

// =====================================
// 11. STORY, MISSIONS AND PROGRESSION
// =====================================

/*
   MISSION CHAIN (6 missions)
   1. First Contact   - Eliminate 3 infected
   2. Radio Part      - Find the radio part (blue box)
   3. Hold the Line   - Stay in the radio zone for 40 seconds while waves attack
   4. Armory          - Find the weapon upgrade crate
   5. The Brute       - Defeat the giant Brute
   6. Escape          - Reach the abandoned house (final ambush)
*/

const TOTAL_MISSIONS = 6;
const DEFEND_TIME_MS = 40000;

let storyTimer = null;
let introFinished = false;

let defeatedMonsters = 0;
let currentMission = 1;

let defendRemaining = DEFEND_TIME_MS;
let lastDefendSecs = -1;
let lastInZone = null;

function typeStory(text, callback) {
    const storyText = document.getElementById("story-text");

    if (!storyText) {
        if (callback) callback();
        return;
    }

    if (storyTimer) {
        clearInterval(storyTimer);
        storyTimer = null;
    }

    storyText.textContent = "";

    let index = 0;

    storyTimer = setInterval(() => {
        storyText.textContent += text.charAt(index);
        index++;

        const panel = document.getElementById("storyPanel");
        if (panel) panel.scrollTop = panel.scrollHeight;

        if (index >= text.length) {
            clearInterval(storyTimer);
            storyTimer = null;

            if (callback) callback();
        }
    }, 30);
}

function updateMission(text) {
    const missionText = document.getElementById("mission-text");

    if (missionText) {
        missionText.textContent = "MISSION: " + text;
    }
}

function getMissionText() {
    switch (currentMission) {
        case 1:
            return "Eliminate 3 infected (" +
                Math.min(defeatedMonsters, 3) + "/3).";

        case 2:
            return "Find the radio part (blue box) near the crates ahead.";

        case 3: {
            const inZone = isInRadioZone();
            const secs = Math.ceil(defendRemaining / 1000);

            return inZone
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

function refreshMissionText() {
    const missionText = document.getElementById("mission-text");

    if (missionText) {
        missionText.textContent =
            "MISSION " + currentMission + "/" + TOTAL_MISSIONS + ": " +
            getMissionText();
    }
}

function isInRadioZone() {
    return (
        player.position.x >= RADIO_ZONE_LEFT &&
        player.position.x <= RADIO_ZONE_RIGHT
    );
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

    const sceneTitle = document.getElementById("scene-title");
    const locationText = document.getElementById("location");

    if (sceneTitle) {
        sceneTitle.textContent = "THE ABANDONED FOREST";
    }

    if (locationText) {
        locationText.textContent = "FOREST ENTRANCE";
    }

    typeStory(
        "The forest has been silent for hours. Your vehicle broke down near an abandoned house. With no signal and no way to contact anyone, you have no choice but to continue on foot. Then, somewhere between the trees, you hear something moving. You are not alone.",

        () => {
            introFinished = true;

            const storyText = document.getElementById("story-text");

            if (storyText) {
                storyText.textContent +=
                    "\n\n[ SOMETHING IS APPROACHING... ]";
            }

            nextMonsterTime = Date.now() + 2500;

            refreshMissionText();
        }
    );
}

function checkMissionProgress(dt = 0) {
    if (gameOver || gameWon || !introFinished) return;

    switch (currentMission) {

        // MISSION 1: FIRST CONTACT
        case 1:
            if (defeatedMonsters >= 3) {
                advanceMission(
                    2,
                    "The first wave is down, but the noise will bring more. Somewhere ahead, near the old crates, a radio part is lying in the dirt. Without it, there is no way to call for help.",
                    150
                );
            }
            break;

        // MISSION 2: FIND THE RADIO PART
        case 2:
            if (radioCollected) {
                defendRemaining = DEFEND_TIME_MS;

                advanceMission(
                    3,
                    "You plug the radio part into the old transmitter. The signal needs 40 seconds to calibrate, and the infected can hear it. Stay inside the green zone and hold the line.",
                    150
                );
            }
            break;

        // MISSION 3: HOLD THE LINE
        case 3: {
            const inZone = isInRadioZone();

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

                advanceMission(
                    4,
                    "The signal goes out. A distant voice crackles back: 'Hold on, we're coming.' Rescue is hours away. A weapon crate was left in the forest ahead, and you will need it.",
                    300
                );
            }

            break;
        }

        // MISSION 4: WEAPON UPGRADE
        case 4:
            if (collectedWeapon) {
                advanceMission(
                    5,
                    "The upgraded weapon feels solid in your hands. Then the ground shakes. Something huge is crashing through the trees toward you. It's a BRUTE.",
                    200
                );

                spawnMonster("brute");
            }
            break;

        // MISSION 5: DEFEAT THE BRUTE
        case 5:
            if (bruteDefeated) {
                advanceMission(
                    6,
                    "The Brute collapses with a thunderous crash. The abandoned house is just ahead, but the noise has woken everything in the forest. Run for it!",
                    500
                );
            }
            break;

        // MISSION 6: ESCAPE
        case 6:
            if (player.position.x >= 95) {
                winGame();
            }
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

    const sceneTitle = document.getElementById("scene-title");
    const locationText = document.getElementById("location");

    if (sceneTitle) {
        sceneTitle.textContent = "THE LAST SURVIVOR";
    }

    if (locationText) {
        locationText.textContent = "ABANDONED HOUSE";
    }

    typeStory(
        "You finally reach the abandoned house. The infected are left behind in the darkness. You survived the night. But as you look through the window, you notice a light moving inside. Maybe you were never alone."
    );

    setTimeout(() => {
        document.getElementById("gameEndTitle").textContent =
            "MISSION COMPLETE";

        document.getElementById("gameEndMessage").textContent =
            "You survived the night. But the nightmare may not be over.";

        document.getElementById("gameEndScreen").hidden = false;
    }, 5000);
}

// =====================================
// 12. HUD UPDATE
// =====================================

function updateHUD() {
    const healthDisplay = document.getElementById("health");
    const ammoDisplay = document.getElementById("ammo");
    const medkitDisplay = document.getElementById("medkits");

    if (healthDisplay) {
        healthDisplay.textContent = health;
    }

    if (ammoDisplay) {
        ammoDisplay.textContent = ammo + " / " + reserveAmmo;
    }

    if (medkitDisplay) {
        medkitDisplay.textContent = medkits;
    }

    const scoreDisplay = document.getElementById("score");
    if (scoreDisplay) scoreDisplay.textContent = score;

    const highScoreDisplay = document.getElementById("highScore");
    if (highScoreDisplay) highScoreDisplay.textContent = highScore;

    const menuHigh = document.getElementById("menuHighScore");
    if (menuHigh) menuHigh.textContent = highScore;

    const items = document.getElementById("items");

    if (items) {
        items.textContent = "LV. " + weaponLevel;
    }
}

// =====================================
// 13. PLAYER MOVEMENT AND JUMP
// =====================================

function jump() {
    if (
        gameStarted &&
        isGrounded &&
        !isHidden &&
        !gameOver
    ) {
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

    player.position.x = Math.max(
        0,
        Math.min(105, player.position.x)
    );

    velocityY -= gravity;
    player.position.y += velocityY;

    const previousY = player.position.y - velocityY;

    let landed = false;

    // Ground collision
    if (player.position.y <= -3.9) {
        player.position.y = -3.9;
        velocityY = 0;
        isGrounded = true;
        landed = true;
    }

    // Platform collision
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

    if (!landed && player.position.y > -3.9) {
        isGrounded = false;
    }

    // When standing still, face the nearest infected
    const isMoving = !isHidden && (moveLeft || moveRight);

    if (!isMoving) {
        let nearest = null;
        let nearestDist = 12;

        for (const enemy of enemies) {
            if (!enemy.alive) continue;

            const d = Math.abs(
                enemy.mesh.position.x - player.position.x
            );

            if (d < nearestDist) {
                nearest = enemy;
                nearestDist = d;
            }
        }

        if (nearest) {
            facing =
                nearest.mesh.position.x > player.position.x ? 1 : -1;
        }
    }

    if (playerSprite) {
        const crouchHeight = 1.45;

        playerSprite.scale.y =
            isCrouching || isHidden
                ? crouchHeight
                : playerSpriteHeight;

        playerSprite.scale.x =
            playerSpriteWidth * facing * (SPRITE_FACES_RIGHT ? 1 : -1);

        // Slightly see-through while hiding
        playerSprite.material.opacity = isHidden ? 0.45 : 1;
    }
}

// =====================================
// 14. 3D MONSTER MODEL HELPERS
// =====================================

const enemies = [];

function makeEnemyPart(parent, geometry, material, x, y, z) {
    const part = new THREE.Mesh(geometry, material);

    part.position.set(x, y, z);
    part.castShadow = true;
    part.receiveShadow = true;

    parent.add(part);

    return part;
}

// =====================================
// 15. ZOMBIE HEALTH BAR
// =====================================

function createEnemyHealthBar(enemy) {
    const bar = new THREE.Group();

    const barWidth = 1.4;
    const barHeight = 0.12;

    const background = new THREE.Mesh(
        new THREE.PlaneGeometry(barWidth, barHeight),
        new THREE.MeshBasicMaterial({
            color: 0x241313,
            depthTest: false
        })
    );

    background.position.z = 0.8;
    background.renderOrder = 10;

    bar.add(background);

    const fill = new THREE.Mesh(
        new THREE.PlaneGeometry(barWidth, barHeight),
        new THREE.MeshBasicMaterial({
            color: 0xe32626,
            depthTest: false
        })
    );

    fill.position.z = 0.82;
    fill.renderOrder = 11;

    bar.add(fill);

    bar.position.set(0, 2.85, 0.7);

    enemy.mesh.add(bar);

    enemy.healthBar = bar;
    enemy.healthFill = fill;
    enemy.maxHealth = enemy.health;
}

function updateEnemyHealthBar(enemy) {
    if (!enemy.healthFill) return;

    const percentage = Math.max(
        0,
        enemy.health / enemy.maxHealth
    );

    const barWidth = 1.4;

    enemy.healthFill.scale.x = percentage;

    enemy.healthFill.position.x =
        -barWidth * (1 - percentage) / 2;
}

// =====================================
// 16. CREATE 3D MONSTERS (zombie / mutant / brute)
// =====================================

const ENEMY_TYPES = {
    zombie: {
        size: 1,
        health: 40,
        speed: 0.025,
        damage: 10,
        skin: 0x68785b,
        eye: 0xe6e4a0,
        points: 100,
        label: "INFECTED ELIMINATED"
    },

    mutant: {
        size: 1.25,
        health: 90,
        speed: 0.035,
        damage: 18,
        skin: 0x753d3d,
        eye: 0xff1616,
        points: 250,
        label: "MUTANT ELIMINATED"
    },

    brute: {
        size: 1.8,
        health: 200,
        speed: 0.017,
        damage: 30,
        skin: 0x4f3a33,
        eye: 0xff3b1a,
        points: 600,
        label: "THE BRUTE IS DOWN!"
    }
};

function createEnemy(x, type = "zombie") {
    const stats = ENEMY_TYPES[type] || ENEMY_TYPES.zombie;
    const isBig = type !== "zombie";
    const isMutant = type === "mutant";

    const enemy = new THREE.Group();

    const skinMaterial = new THREE.MeshStandardMaterial({
        color: stats.skin,
        roughness: 1
    });

    const darkMaterial = new THREE.MeshStandardMaterial({
        color: 0x201d1b,
        roughness: 1
    });

    const mouthMaterial = new THREE.MeshBasicMaterial({
        color: 0x080303
    });

    const eyeMaterial = new THREE.MeshBasicMaterial({
        color: stats.eye
    });

    const teethMaterial = new THREE.MeshStandardMaterial({
        color: 0xd5d0b7
    });

    const bodyWidth = isBig ? 0.95 : 0.72;
    const bodyHeight = isBig ? 1.3 : 1.05;

    // Body
    makeEnemyPart(
        enemy,
        new THREE.BoxGeometry(bodyWidth, bodyHeight, 0.45),
        skinMaterial,
        0,
        1.05,
        0
    );

    // Neck
    makeEnemyPart(
        enemy,
        new THREE.CylinderGeometry(0.16, 0.2, 0.25, 8),
        skinMaterial,
        0,
        1.78,
        0
    );

    // Head
    const head = makeEnemyPart(
        enemy,
        new THREE.SphereGeometry(isBig ? 0.43 : 0.34, 16, 12),
        skinMaterial,
        0,
        2.1,
        0.03
    );

    // Jaw
    makeEnemyPart(
        enemy,
        new THREE.BoxGeometry(0.42, 0.16, 0.35),
        darkMaterial,
        0,
        1.88,
        0.3
    );

    // Mouth
    makeEnemyPart(
        enemy,
        new THREE.BoxGeometry(0.25, 0.12, 0.035),
        mouthMaterial,
        0,
        1.95,
        0.47
    );

    // Eyes and eye sockets
    for (const eyeX of [-0.14, 0.14]) {
        makeEnemyPart(
            enemy,
            new THREE.SphereGeometry(0.095, 10, 8),
            darkMaterial,
            eyeX,
            2.19,
            0.30
        );

        makeEnemyPart(
            enemy,
            new THREE.SphereGeometry(0.045, 10, 8),
            eyeMaterial,
            eyeX,
            2.19,
            0.41
        );
    }

    // Teeth
    for (const toothX of [-0.08, 0, 0.08]) {
        makeEnemyPart(
            enemy,
            new THREE.BoxGeometry(0.035, 0.07, 0.035),
            teethMaterial,
            toothX,
            1.94,
            0.5
        );
    }

    // Left arm
    const leftArm = new THREE.Group();

    leftArm.position.set(-0.48, 1.55, 0);
    enemy.add(leftArm);

    makeEnemyPart(
        leftArm,
        new THREE.BoxGeometry(0.22, 0.9, 0.25),
        skinMaterial,
        0,
        -0.38,
        0
    );

    // Right arm
    const rightArm = new THREE.Group();

    rightArm.position.set(0.48, 1.55, 0);
    enemy.add(rightArm);

    makeEnemyPart(
        rightArm,
        new THREE.BoxGeometry(0.22, 0.9, 0.25),
        skinMaterial,
        0,
        -0.38,
        0
    );

    // Hands
    makeEnemyPart(
        leftArm,
        new THREE.SphereGeometry(0.14, 8, 8),
        skinMaterial,
        0,
        -0.85,
        0
    );

    makeEnemyPart(
        rightArm,
        new THREE.SphereGeometry(0.14, 8, 8),
        skinMaterial,
        0,
        -0.85,
        0
    );

    // Left leg
    const leftLeg = new THREE.Group();

    leftLeg.position.set(-0.2, 0.65, 0);
    enemy.add(leftLeg);

    makeEnemyPart(
        leftLeg,
        new THREE.BoxGeometry(0.25, 0.75, 0.3),
        skinMaterial,
        0,
        -0.3,
        0
    );

    // Right leg
    const rightLeg = new THREE.Group();

    rightLeg.position.set(0.2, 0.65, 0);
    enemy.add(rightLeg);

    makeEnemyPart(
        rightLeg,
        new THREE.BoxGeometry(0.25, 0.75, 0.3),
        skinMaterial,
        0,
        -0.3,
        0
    );

    // Extra details for mutant and brute
    if (isBig) {
        makeEnemyPart(
            enemy,
            new THREE.ConeGeometry(0.13, 0.4, 6),
            darkMaterial,
            -0.27,
            2.45,
            0
        );

        makeEnemyPart(
            enemy,
            new THREE.ConeGeometry(0.13, 0.4, 6),
            darkMaterial,
            0.27,
            2.45,
            0
        );

        makeEnemyPart(
            enemy,
            new THREE.SphereGeometry(0.16, 8, 8),
            darkMaterial,
            0,
            1.25,
            0.25
        );
    }

    // Brute gets shoulder spikes
    if (type === "brute") {
        for (const sx of [-0.62, 0.62]) {
            makeEnemyPart(
                enemy,
                new THREE.ConeGeometry(0.14, 0.45, 6),
                darkMaterial,
                sx,
                1.85,
                0
            );
        }
    }

    // Bigger enemies are scaled up from the ground
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
        head,
        leftLeg,
        rightLeg,
        leftArm,
        rightArm,
        walkOffset: Math.random() * 10
    };

    createEnemyHealthBar(enemyData);

    enemies.push(enemyData);

    console.log(type.toUpperCase() + " spawned!");
}

// =====================================
// 17. MONSTER SPAWNING
// =====================================

let nextMonsterTime = Infinity;

function spawnMonster(forcedType) {
    const cameraHalfWidth =
        (camera.right - camera.left) / 2;

    // Spawn outside the visible camera area
    const rightSpawnX =
        camera.position.x + cameraHalfWidth + 2;

    const leftSpawnX =
        camera.position.x - cameraHalfWidth - 2;

    let spawnX;

    if (rightSpawnX <= 103) {
        spawnX = rightSpawnX;
    } else if (leftSpawnX >= 2) {
        spawnX = leftSpawnX;
    } else {
        spawnX = Math.min(
            103,
            Math.max(2, player.position.x + cameraHalfWidth + 2)
        );
    }

    let type = forcedType;

    if (!type) {
        // More mutants in later missions
        const mutantChance = currentMission >= 5 ? 0.45 : 0.3;
        type = Math.random() < mutantChance ? "mutant" : "zombie";
    }

    createEnemy(spawnX, type);
}

// How fast and how many enemies spawn in each mission
function getSpawnSettings() {
    if (currentMission === 1) {
        return { min: 6000, rand: 2000, maxAlive: 3 };
    }

    if (currentMission === 3) {
        return { min: 3500, rand: 1500, maxAlive: 5 };
    }

    if (currentMission === 6) {
        return { min: 5000, rand: 2500, maxAlive: 5 };
    }

    return { min: 8000, rand: 3000, maxAlive: 4 };
}

function updateMonsterSpawning() {
    if (!gameStarted || gameOver || !introFinished) return;

    const now = Date.now();

    if (now < nextMonsterTime) return;

    // Clean up defeated enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (!enemies[i].alive) enemies.splice(i, 1);
    }

    const settings = getSpawnSettings();

    const aliveRegular = enemies.filter(
        enemy => enemy.alive && enemy.type !== "brute"
    ).length;

    if (aliveRegular < settings.maxAlive) {
        spawnMonster();
    }

    nextMonsterTime =
        now + settings.min + Math.random() * settings.rand;
}

// =====================================
// 18. ENEMY AI AND ATTACKS
// =====================================

function hasCrateBetween(enemyX, playerX) {
    return hidingSpots.some(spot => {
        return (
            spot.x > Math.min(enemyX, playerX) &&
            spot.x < Math.max(enemyX, playerX)
        );
    });
}

function updateEnemies() {
    const now = Date.now();

    enemies.forEach((enemy) => {
        if (!enemy.alive) return;

        const distance =
            player.position.x - enemy.mesh.position.x;

        const absoluteDistance = Math.abs(distance);

        const blocked = hasCrateBetween(
            enemy.mesh.position.x,
            player.position.x
        );

        // Move toward player
        if (absoluteDistance < 16 && !(isHidden && blocked)) {
            enemy.mesh.position.x +=
                Math.sign(distance) * enemy.speed;
        }

        // Face the player (slight side view)
        enemy.mesh.rotation.y = distance < 0 ? -1.2 : 1.2;

        if (enemy.healthBar) {
            enemy.healthBar.rotation.y = -enemy.mesh.rotation.y;
        }

        // Walking animation
        const walk =
            Math.sin(now * 0.006 + enemy.walkOffset) * 0.5;

        enemy.leftLeg.rotation.x = walk;
        enemy.rightLeg.rotation.x = -walk;

        enemy.leftArm.rotation.x = -0.8 - walk * 0.4;
        enemy.rightArm.rotation.x = -0.8 + walk * 0.4;

        // Head movement
        enemy.head.rotation.z =
            Math.sin(now * 0.002 + enemy.walkOffset) * 0.08;

        // Attack player
        if (
            absoluteDistance < enemy.attackRange &&
            !isHidden &&
            now - lastDamageTime > 1000
        ) {
            health = Math.max(0, health - enemy.damage);

            lastDamageTime = now;

            updateHUD();

            if (health <= 0) {
                endGame();
            }
        }
    });
}

// =====================================
// 19. SHOOTING AND BULLETS
// =====================================

const bullets = [];

function shoot() {
    if (
        !gameStarted ||
        gameOver ||
        isHidden
    ) {
        return;
    }

    if (ammo <= 0) {
        showPickupNotice(
            reserveAmmo > 0 ? "OUT OF AMMO - RELOAD!" : "NO AMMO LEFT!"
        );
        return;
    }

    const now = Date.now();

    if (now - lastShotTime < 300) return;

    lastShotTime = now;
    ammo--;

    const bullet = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 8, 8),
        mat.bullet
    );

    bullet.position.set(
        player.position.x + facing * 0.8,
        player.position.y + 1.25,
        2
    );

    scene.add(bullet);

    bullets.push({
        mesh: bullet,
        direction: facing,
        speed: 0.42,
        alive: true
    });

    updateHUD();
}

function updateBullets() {
    bullets.forEach((bullet) => {
        if (!bullet.alive) return;

        bullet.mesh.position.x +=
            bullet.direction * bullet.speed;

        enemies.forEach((enemy) => {
            if (!enemy.alive || !bullet.alive) return;

            const distanceX = Math.abs(
                bullet.mesh.position.x - enemy.mesh.position.x
            );

            // Bigger enemies have bigger hitboxes
            const enemyTargetY =
                enemy.mesh.position.y + 1.2 * enemy.size;

            const distanceY = Math.abs(
                bullet.mesh.position.y - enemyTargetY
            );

            if (
                distanceX < 0.7 * enemy.size &&
                distanceY < 1.4 * enemy.size
            ) {
                enemy.health -= bulletDamage;

                bullet.alive = false;
                scene.remove(bullet.mesh);

                updateEnemyHealthBar(enemy);

                if (enemy.health <= 0) {
                    enemy.health = 0;
                    enemy.alive = false;

                    scene.remove(enemy.mesh);

                    defeatedMonsters++;

                    if (enemy.type === "brute") {
                        bruteDefeated = true;
                    }

                    addScore(enemy.points);

                    showPickupNotice(enemy.label);

                    if (currentMission === 1) {
                        refreshMissionText();
                    }

                    checkMissionProgress();
                }
            }
        });

        // Remove bullets that travel too far
        if (
            bullet.alive &&
            Math.abs(
                bullet.mesh.position.x - player.position.x
            ) > 18
        ) {
            bullet.alive = false;
            scene.remove(bullet.mesh);
        }
    });

    // Clean up inactive bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        if (!bullets[i].alive) {
            bullets.splice(i, 1);
        }
    }
}

// =====================================
// 20. RELOAD AND MEDKITS
// =====================================

function reload() {
    if (
        !gameStarted ||
        gameOver ||
        ammo === MAG_SIZE
    ) {
        return;
    }

    if (reserveAmmo <= 0) {
        showPickupNotice("NO RESERVE AMMO");
        return;
    }

    const needed = MAG_SIZE - ammo;
    const amount = Math.min(needed, reserveAmmo);

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

// =====================================
// 21. HIDE AND CROUCH
// =====================================

function toggleHide() {
    if (!gameStarted || gameOver) return;

    const nearbyCrate = hidingSpots.find(spot =>
        Math.abs(player.position.x - spot.x) < 1.7
    );

    if (nearbyCrate) {
        isHidden = !isHidden;
        isCrouching = isHidden;

        showPickupNotice(isHidden ? "HIDING" : "LEFT HIDING SPOT");

        updateHUD();
    } else {
        isCrouching = !isCrouching;
    }
}

// =====================================
// 21B. PAUSE MENU
// =====================================

function pauseGame() {
    if (!gameStarted || gameOver || isPaused) return;

    isPaused = true;
    gameStarted = false;
    pausedAt = Date.now();

    // Release any held buttons or keys
    Object.keys(keys).forEach(key => {
        keys[key] = false;
    });

    isRunning = false;
    isCrouching = isHidden;

    const pauseScore = document.getElementById("pauseScore");
    const pauseMission = document.getElementById("pauseMission");

    if (pauseScore) pauseScore.textContent = score;

    if (pauseMission) {
        pauseMission.textContent =
            "MISSION " + currentMission + "/" + TOTAL_MISSIONS + ": " +
            getMissionText();
    }

    document.getElementById("pauseScreen").hidden = false;
}

function resumeGame() {
    if (!isPaused) return;

    const pausedFor = Date.now() - pausedAt;

    isPaused = false;
    gameStarted = true;

    // Don't let timers run while the game was paused
    if (nextMonsterTime !== Infinity) {
        nextMonsterTime += pausedFor;
    }

    lastDamageTime += pausedFor;

    document.getElementById("pauseScreen").hidden = true;
}

function quitToMenu() {
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(error => {
            console.log("Could not exit fullscreen:", error);
        });
    }

    isPaused = false;

    document.getElementById("pauseScreen").hidden = true;
    document.getElementById("gameEndScreen").hidden = true;
    document.getElementById("gameScreen").hidden = true;
    document.getElementById("mainMenu").hidden = false;

    gameOver = false;
    gameStarted = false;

    updateHUD();
}

// =====================================
// 22. SURVIVAL SUPPLIES AND COLLECTIBLES
// =====================================

const collectibles = [];

let lastLockedHint = 0;

function showPickupNotice(message) {
    let notice = document.getElementById("pickupNotice");

    if (!notice) {
        notice = document.createElement("div");
        notice.id = "pickupNotice";
        notice.className = "pickup-notice";

        document.getElementById("gameScreen").appendChild(notice);
    }

    notice.textContent = message;
    notice.style.opacity = "1";

    clearTimeout(notice.hideTimer);

    notice.hideTimer = setTimeout(() => {
        notice.style.opacity = "0";
    }, 1800);
}

function createCollectible(x, type) {
    const item = new THREE.Group();

    const boxMaterial = new THREE.MeshStandardMaterial({
        color:
            type === "medkit" ? 0xe5e5dc :
            type === "ammo" ? 0xb58a3c :
            type === "weapon" ? 0x526b55 :
            type === "radio" ? 0x3b6ea5 :
            0x65513b,
        roughness: 0.8
    });

    const mainBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.5, 0.45),
        boxMaterial
    );

    item.add(mainBox);

    if (type === "medkit") {
        const crossMaterial = new THREE.MeshBasicMaterial({
            color: 0xc92727
        });

        const vertical = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.34, 0.04),
            crossMaterial
        );

        const horizontal = new THREE.Mesh(
            new THREE.BoxGeometry(0.34, 0.12, 0.04),
            crossMaterial
        );

        vertical.position.z = 0.25;
        horizontal.position.z = 0.25;

        item.add(vertical, horizontal);
    }

    if (type === "ammo") {
        const stripe = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.52, 0.05),
            new THREE.MeshBasicMaterial({
                color: 0xe8c66d
            })
        );

        stripe.position.z = 0.25;

        item.add(stripe);
    }

    if (type === "weapon") {
        const weaponPart = new THREE.Mesh(
            new THREE.BoxGeometry(0.85, 0.12, 0.12),
            new THREE.MeshStandardMaterial({
                color: 0x1d2420,
                metalness: 0.6,
                roughness: 0.4
            })
        );

        weaponPart.position.set(0, 0.05, 0.3);

        item.add(weaponPart);
    }

    if (type === "radio") {
        const antenna = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.5, 0.06),
            new THREE.MeshBasicMaterial({
                color: 0x9fd0ff
            })
        );

        antenna.position.set(0.2, 0.45, 0.2);

        item.add(antenna);
    }

    if (type === "supply") {
        const lid = new THREE.Mesh(
            new THREE.BoxGeometry(0.72, 0.1, 0.5),
            new THREE.MeshStandardMaterial({
                color: 0x8a7049
            })
        );

        lid.position.y = 0.28;

        item.add(lid);
    }

    item.position.set(x, -3.45, 2);

    scene.add(item);

    collectibles.push({
        mesh: item,
        type,
        x,
        collected: false,
        baseY: -3.45,
        phase: Math.random() * Math.PI * 2
    });
}

function createWorldCollectibles() {
    createCollectible(11, "medkit");
    createCollectible(25, "ammo");
    createCollectible(39, "medkit");
    createCollectible(46, "radio");
    createCollectible(53, "ammo");
    createCollectible(58, "medkit");
    createCollectible(64, "ammo");
    createCollectible(70, "weapon");
    createCollectible(80, "ammo");
    createCollectible(86, "supply");
}

function collectItem(item) {
    if (item.collected) return;

    item.collected = true;

    scene.remove(item.mesh);

    if (item.type === "medkit") {
        addScore(25);
        medkits++;

        showPickupNotice("+1 MEDKIT COLLECTED");
    }

    else if (item.type === "ammo") {
        const amount = randomAmmo(10, 30);

        addScore(25);
        reserveAmmo += amount;

        showPickupNotice("+" + amount + " AMMO COLLECTED");
    }

    else if (item.type === "radio") {
        addScore(100);
        radioCollected = true;

        showPickupNotice("RADIO PART FOUND!");
    }

    else if (item.type === "weapon") {
        addScore(100);
        collectedWeapon = true;
        weaponLevel = 2;
        bulletDamage = 30;

        showPickupNotice("WEAPON UPGRADE ACQUIRED!");
    }

    else if (item.type === "supply") {
        const amount = randomAmmo(10, 20);

        addScore(50);
        medkits++;
        reserveAmmo += amount;

        showPickupNotice("SUPPLY CRATE: +1 MEDKIT, +" + amount + " AMMO");
    }

    updateHUD();
    checkMissionProgress();
}

function updateCollectibles() {
    const now = Date.now();

    collectibles.forEach(item => {
        if (item.collected) return;

        // Floating animation
        item.mesh.position.y =
            item.baseY +
            Math.sin(now * 0.003 + item.phase) * 0.12;

        item.mesh.rotation.y += 0.01;

        const distance = Math.abs(
            player.position.x - item.x
        );

        const verticalDistance = Math.abs(
            player.position.y - (-3.9)
        );

        if (distance < 1.1 && verticalDistance < 1.5) {

            // Mission items can only be picked up during their mission
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
        }
    });
}

// =====================================
// 23. KEYBOARD CONTROLS
// =====================================

document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    // Pause / resume with P or Escape
    if ((key === "p" || key === "escape") && !event.repeat) {
        if (isPaused) {
            resumeGame();
        } else {
            pauseGame();
        }

        return;
    }

    if (
        [" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)
    ) {
        event.preventDefault();
    }

    if (!gameStarted || gameOver) return;

    keys[key] = true;

    // Prevent repeated actions while holding a key
    if (event.repeat) return;

    if (
        key === " " ||
        key === "w" ||
        key === "arrowup"
    ) {
        jump();
    }

    if (key === "shift") {
        isRunning = true;
    }

    if (key === "j") shoot();
    if (key === "r") reload();
    if (key === "h") useMedkit();
    if (key === "e") toggleHide();

    if (key === "s") {
        isCrouching = true;
    }
});

document.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();

    keys[key] = false;

    if (key === "shift") {
        isRunning = false;
    }

    if (key === "s" && !isHidden) {
        isCrouching = false;
    }
});

// =====================================
// 24. CAMERA FOLLOW
// =====================================

function updateCamera() {
    const targetX = player.position.x + 2;

    camera.position.x +=
        (targetX - camera.position.x) * 0.08;

    camera.position.y = CAMERA_Y;

    camera.lookAt(camera.position.x, CAMERA_Y, 0);
}

// =====================================
// 25. GAME OVER
// =====================================

function endGame() {
    if (gameOver) return;

    gameOver = true;
    gameStarted = false;

    updateMission("MISSION FAILED");
    finalizeScore();

    const storyText = document.getElementById("story-text");
    const locationText = document.getElementById("location");
    const title = document.getElementById("scene-title");

    if (storyText) {
        storyText.textContent =
            "You have been overrun. The infection has taken you. Restart to try again.";
    }

    if (locationText) {
        locationText.textContent = "MISSION FAILED";
    }

    if (title) {
        title.textContent = "SURVIVOR LOST";
    }

    document.getElementById("gameEndTitle").textContent =
        "GAME OVER";

    document.getElementById("gameEndMessage").textContent =
        "You have been overrun by the infected. Your survival journey has ended.";

    document.getElementById("gameEndScreen").hidden = false;
}

// =====================================
// 26. START GAME AND CONTROLS TUTORIAL
// =====================================

window.beginGame = function () {
    document.getElementById("mainMenu").hidden = true;

    const gameScreen = document.getElementById("gameScreen");
    const controlsOverlay = document.getElementById("controlsOverlay");

    gameScreen.hidden = false;

    isPaused = false;
    document.getElementById("pauseScreen").hidden = true;

    loadPlayerCharacter();

    // Reset player stats
    score = 0;
    document.getElementById("newRecordText").hidden = true;

    health = 100;
    ammo = MAG_SIZE;
    reserveAmmo = 36;
    medkits = 2;

    bulletDamage = 20;
    weaponLevel = 1;

    collectedWeapon = false;
    radioCollected = false;
    bruteDefeated = false;

    // Reset mission state
    defeatedMonsters = 0;
    currentMission = 1;
    defendRemaining = DEFEND_TIME_MS;
    lastDefendSecs = -1;
    lastInZone = null;
    radioLamp.material.color.set(0xaa2222);

    // Reset player position and movement
    player.position.set(0, -3.9, 1.5);

    velocityY = 0;
    facing = 1;

    isGrounded = true;
    isHidden = false;
    isCrouching = false;
    isRunning = false;

    // Reset game state
    gameOver = false;
    gameWon = false;
    gameStarted = false;
    introFinished = false;

    // Clear pressed keys
    Object.keys(keys).forEach(key => {
        keys[key] = false;
    });

    // Reset timers
    lastDamageTime = 0;
    lastShotTime = 0;
    nextMonsterTime = Infinity;

    // Stop previous story animation
    if (storyTimer) {
        clearInterval(storyTimer);
        storyTimer = null;
    }

    // Remove old monsters
    enemies.forEach(enemy => {
        scene.remove(enemy.mesh);
    });

    enemies.length = 0;

    // Remove old bullets
    bullets.forEach(bullet => {
        scene.remove(bullet.mesh);
    });

    bullets.length = 0;

    // Remove old collectibles
    collectibles.forEach(item => {
        scene.remove(item.mesh);
    });

    collectibles.length = 0;

    // Create fresh collectibles
    createWorldCollectibles();

    // Reset camera
    camera.position.set(0, CAMERA_Y, 25);
    camera.lookAt(0, CAMERA_Y, 0);

    requestAnimationFrame(() => {
        resizeGame();

        requestAnimationFrame(() => {
            resizeGame();
        });
    });

    // Reset story panel
    const sceneTitle = document.getElementById("scene-title");
    const locationText = document.getElementById("location");
    const storyText = document.getElementById("story-text");

    if (sceneTitle) {
        sceneTitle.textContent = "THE ABANDONED FOREST";
    }

    if (locationText) {
        locationText.textContent = "FOREST ENTRANCE";
    }

    if (storyText) {
        storyText.textContent = "";
    }

    updateMission("Prepare to survive.");
    updateHUD();
    resizeGame();

    if (controlsOverlay) {
        controlsOverlay.hidden = false;
    } else {
        gameStarted = true;
        startStoryIntro();
    }

    // Request fullscreen and attempt landscape orientation
    if (gameScreen.requestFullscreen) {
        gameScreen.requestFullscreen()
            .then(() => {
                resizeGame();

                if (screen.orientation && screen.orientation.lock) {
                    screen.orientation.lock("landscape")
                        .catch(error => {
                            console.log(
                                "Landscape lock unavailable:",
                                error
                            );
                        });
                }
            })
            .catch(error => {
                console.log("Fullscreen unavailable:", error);
                resizeGame();
            });
    } else {
        resizeGame();
    }
};

window.continueGame = function () {
    const controlsOverlay = document.getElementById("controlsOverlay");

    if (controlsOverlay) {
        controlsOverlay.hidden = true;
    }

    gameStarted = true;

    startStoryIntro();
};

// =====================================
// 27. RESTART GAME
// =====================================

window.restartGame = function () {
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(error => {
            console.log("Could not exit fullscreen:", error);
        });
    }

    window.location.reload();
};

// =====================================
// 28. TOUCH CONTROLS (CIRCLE PAD + ACTION BUTTONS)
// =====================================

document.querySelectorAll("[data-move]").forEach(button => {
    const action = button.dataset.move;

    // Stop the long-press menu on phones
    button.addEventListener("contextmenu", event => {
        event.preventDefault();
    });

    button.addEventListener("pointerdown", event => {
        event.preventDefault();

        if (!gameStarted || gameOver) return;

        if (action === "left") keys.a = true;
        if (action === "right") keys.d = true;

        if (action === "jump") jump();
        if (action === "shoot") shoot();
        if (action === "hide") toggleHide();
        if (action === "medkit") useMedkit();
        if (action === "reload") reload();

        if (action === "run") isRunning = true;
        if (action === "crouch") isCrouching = true;
    });

    const stop = () => {
        if (action === "left") keys.a = false;
        if (action === "right") keys.d = false;

        if (action === "run") isRunning = false;

        if (action === "crouch" && !isHidden) {
            isCrouching = false;
        }
    };

    button.addEventListener("pointerup", stop);
    button.addEventListener("pointerleave", stop);
    button.addEventListener("pointercancel", stop);
});

// =====================================
// 29. RESIZE
// =====================================

function resizeGame() {
    const width = Math.max(
        1,
        gameContainer.clientWidth || window.innerWidth
    );

    const height = Math.max(
        1,
        gameContainer.clientHeight || window.innerHeight
    );

    // Keep the same vertical world view.
    const viewHeight = 12;
    const aspect = width / height;

    camera.left = -(viewHeight * aspect) / 2;
    camera.right = (viewHeight * aspect) / 2;

    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;

    camera.position.y = CAMERA_Y;
    camera.lookAt(camera.position.x, CAMERA_Y, 0);

    camera.updateProjectionMatrix();

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 2)
    );

    renderer.setSize(width, height, false);
}

window.addEventListener("resize", resizeGame);

window.addEventListener("orientationchange", () => {
    requestAnimationFrame(() => {
        resizeGame();
        requestAnimationFrame(resizeGame);
    });
});

if ("ResizeObserver" in window) {
    const gameResizeObserver = new ResizeObserver(() => {
        resizeGame();
    });

    gameResizeObserver.observe(gameContainer);
}

document.addEventListener("fullscreenchange", () => {
    requestAnimationFrame(() => {
        resizeGame();
    });
});

// =====================================
// 30. GAME LOOP
// =====================================

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

// =====================================
// 31. CONNECT HTML BUTTONS
// =====================================

// Character selection buttons
document.querySelectorAll(".character-option").forEach(button => {
    button.addEventListener("click", () => {
        window.selectCharacter(button.dataset.character);
    });
});

// Start Game button
const startGameButton = document.getElementById("startGameButton");

if (startGameButton) {
    startGameButton.addEventListener("click", () => {
        window.beginGame();
    });
}

// How To Play (main menu): copy the instructions from the in-game overlay
const instructionsBody = document.getElementById("instructionsBody");
const menuInstructions = document.getElementById("menuInstructions");

if (instructionsBody && menuInstructions) {
    menuInstructions.innerHTML = instructionsBody.innerHTML;
}

const howToButton = document.getElementById("howToButton");
const howToBackButton = document.getElementById("howToBackButton");

if (howToButton) {
    howToButton.addEventListener("click", () => {
        document.getElementById("mainMenu").hidden = true;
        document.getElementById("howToScreen").hidden = false;
    });
}

if (howToBackButton) {
    howToBackButton.addEventListener("click", () => {
        document.getElementById("howToScreen").hidden = true;
        document.getElementById("mainMenu").hidden = false;
    });
}

// Continue button in controls tutorial
const continueButton = document.getElementById("continueButton");

if (continueButton) {
    continueButton.addEventListener("click", () => {
        window.continueGame();
    });
}

// Restart Game button (goes straight back into the game)
const restartButton = document.getElementById("restartButton");

if (restartButton) {
    restartButton.addEventListener("click", () => {
        document.getElementById("gameEndScreen").hidden = true;
        window.beginGame();
    });
}

// Quit Game button
const quitButton = document.getElementById("quitButton");

if (quitButton) {
    quitButton.addEventListener("click", quitToMenu);
}

// Pause menu buttons
const pauseButton = document.getElementById("pauseButton");
const resumeButton = document.getElementById("resumeButton");
const pauseRestartButton = document.getElementById("pauseRestartButton");
const pauseQuitButton = document.getElementById("pauseQuitButton");

if (pauseButton) {
    pauseButton.addEventListener("click", pauseGame);
}

if (resumeButton) {
    resumeButton.addEventListener("click", resumeGame);
}

if (pauseRestartButton) {
    pauseRestartButton.addEventListener("click", () => {
        document.getElementById("pauseScreen").hidden = true;
        window.beginGame();
    });
}

if (pauseQuitButton) {
    pauseQuitButton.addEventListener("click", quitToMenu);
}

// Auto-pause when the player switches tabs or apps
document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseGame();
});

// =====================================
// 32. INITIALIZE GAME
// =====================================

updateHUD();
animate();

console.log("OUTBREAK GAME INITIALIZED");