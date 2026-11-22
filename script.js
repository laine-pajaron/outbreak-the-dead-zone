import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

console.log("OUTBREAK: THE DEAD ZONE");

// =====================================
// 1. PLAYER INFORMATION
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
makeBox(55, -4.4, 0, 130, 1, 4, mat.ground);

// Floor markings
for (let x = -10; x < 120; x += 8) {
    makeBox(x, -3.87, 0.1, 0.12, 0.04, 0.1, mat.metal);
}

// Platforms
const platforms = [];

function addPlatform(x, y, width) {
    makeBox(55, -5.9, 0, 130, 4, 4, mat.ground);

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

    // FIX: Match the character IDs in index.html
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

let health = 100;
let ammo = 12;
let reserveAmmo = 48;
let medkits = 3;

let bulletDamage = 20;
let weaponLevel = 1;

let collectedMedkits = 0;
let collectedAmmo = 0;
let collectedWeapon = false;

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

const gravity = 0.012;
const jumpPower = 0.27;
const walkSpeed = 0.11;
const runSpeed = 0.17;

const keys = {};

// =====================================
// 11. STORY, MISSIONS AND PROGRESSION
// =====================================

let storyTimer = null;
let introFinished = false;

let defeatedMonsters = 0;
let currentMission = 1;

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
    }, 35);
}

function updateMission(text) {
    const missionText = document.getElementById("mission-text");

    if (missionText) {
        missionText.textContent = "MISSION: " + text;
    }
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

            firstMonsterTime = Date.now() + 2500;
            monsterSpawned = false;

            updateMission("Defeat the first infected.");
        }
    );
}

function checkMissionProgress() {
    if (gameOver || gameWon || !introFinished) return;

    // MISSION 1: DEFEAT FIRST INFECTED
    if (currentMission === 1 && defeatedMonsters >= 1) {
        currentMission = 2;

        updateMission("Collect 2 medkits and 1 ammo supply.");

        typeStory(
            "The infected falls to the ground. You notice a few abandoned supplies nearby. Collect them before moving deeper into the forest."
        );
    }

    // MISSION 2: COLLECT SUPPLIES
    if (
        currentMission === 2 &&
        collectedMedkits >= 2 &&
        collectedAmmo >= 1
    ) {
        currentMission = 3;

        updateMission("Find and collect the weapon upgrade.");

        typeStory(
            "You have gathered enough medical supplies and ammunition. As you continue exploring, you notice a weapon left behind near the abandoned structures. It might give you a better chance of surviving."
        );
    }

    // MISSION 3: WEAPON UPGRADE
    if (currentMission === 3 && collectedWeapon) {
        currentMission = 4;

        updateMission(
            "Defeat 3 infected in total and reach the abandoned house."
        );

        typeStory(
            "You pick up the weapon and check its condition. It is still usable. More infected are approaching. Clear the area and reach the abandoned house."
        );
    }

    // MISSION 4: FINAL OBJECTIVE
    if (
        currentMission === 4 &&
        defeatedMonsters >= 3 &&
        player.position.x >= 95
    ) {
        winGame();
    }
}

function winGame() {
    if (gameWon) return;

    gameWon = true;
    gameOver = true;
    gameStarted = false;

    updateMission("MISSION COMPLETE!");

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

    const items = document.getElementById("items");

    if (items) {
        items.textContent = isHidden
            ? "HIDDEN"
            : "SURVIVING | WEAPON LV. " + weaponLevel;
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

    if (!isHidden) {
        if (keys.a || keys.arrowleft) {
            player.position.x -= speed;
            facing = -1;
        }

        if (keys.d || keys.arrowright) {
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

    if (playerSprite) {
        const crouchHeight = 1.45;

        playerSprite.scale.y =
            isCrouching || isHidden
                ? crouchHeight
                : playerSpriteHeight;

        playerSprite.scale.x = playerSpriteWidth * facing;
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
// 16. CREATE 3D MONSTERS
// =====================================

function createEnemy(x, type = "zombie") {
    const isMutant = type === "mutant";

    const enemy = new THREE.Group();

    const skinMaterial = new THREE.MeshStandardMaterial({
        color: isMutant ? 0x753d3d : 0x68785b,
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
        color: isMutant ? 0xff1616 : 0xe6e4a0
    });

    const teethMaterial = new THREE.MeshStandardMaterial({
        color: 0xd5d0b7
    });

    const bodyWidth = isMutant ? 0.95 : 0.72;
    const bodyHeight = isMutant ? 1.3 : 1.05;

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
        new THREE.SphereGeometry(isMutant ? 0.43 : 0.34, 16, 12),
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

    // Extra mutant details
    if (isMutant) {
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

    enemy.position.set(x, -3.9, 1.5);

    scene.add(enemy);

    const enemyData = {
        mesh: enemy,
        type,
        health: isMutant ? 80 : 40,
        speed: isMutant ? 0.035 : 0.025,
        damage: isMutant ? 18 : 10,
        attackRange: 1.25,
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

let firstMonsterTime = Infinity;
let nextMonsterTime = 0;
let monsterSpawned = false;

function spawnMonster() {
    const cameraHalfWidth =
        (camera.right - camera.left) / 2;

    // Spawn outside the visible camera area
    const rightSpawnX =
        camera.position.x + cameraHalfWidth + 2;

    const leftSpawnX =
        camera.position.x - cameraHalfWidth - 2;

    let spawnX;

    // Choose a valid side of the player
    if (rightSpawnX <= 103) {
        spawnX = rightSpawnX;
    } else if (leftSpawnX >= 2) {
        spawnX = leftSpawnX;
    } else {
        // Fallback for very wide screens
        spawnX = Math.min(
            103,
            Math.max(2, player.position.x + cameraHalfWidth + 2)
        );
    }

    const type = Math.random() < 0.7 ? "zombie" : "mutant";

    createEnemy(spawnX, type);

    monsterSpawned = true;
}

function updateMonsterSpawning() {
    if (!gameStarted || gameOver || !introFinished) return;

    const now = Date.now();

    if (!monsterSpawned && now >= firstMonsterTime) {
        spawnMonster();

        nextMonsterTime = now + 9000;
        return;
    }

    if (monsterSpawned && now >= nextMonsterTime) {
        const aliveEnemies = enemies.filter(
            enemy => enemy.alive
        ).length;

        if (aliveEnemies < 4) {
            spawnMonster();
        }

        nextMonsterTime = now + 9000 + Math.random() * 4000;
    }
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

        // Face player
        enemy.mesh.rotation.y = distance < 0 ? Math.PI : 0;

        // Walking animation
        const walk =
            Math.sin(now * 0.006 + enemy.walkOffset) * 0.35;

        enemy.leftLeg.rotation.z = walk;
        enemy.rightLeg.rotation.z = -walk;

        enemy.leftArm.rotation.z = -walk * 0.8;
        enemy.rightArm.rotation.z = walk * 0.8;

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
        ammo <= 0 ||
        isHidden
    ) {
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

            const enemyTargetY = enemy.mesh.position.y + 1.2;

            const distanceY = Math.abs(
                bullet.mesh.position.y - enemyTargetY
            );

            if (distanceX < 0.7 && distanceY < 1.4) {
                enemy.health -= bulletDamage;

                bullet.alive = false;
                scene.remove(bullet.mesh);

                updateEnemyHealthBar(enemy);

                if (enemy.health <= 0) {
                    enemy.health = 0;
                    enemy.alive = false;

                    scene.remove(enemy.mesh);

                    defeatedMonsters++;

                    showPickupNotice("INFECTED ELIMINATED");

                    console.log(
                        "Monster defeated! Total:",
                        defeatedMonsters
                    );

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
        ammo === 12 ||
        reserveAmmo <= 0
    ) {
        return;
    }

    const needed = 12 - ammo;
    const amount = Math.min(needed, reserveAmmo);

    ammo += amount;
    reserveAmmo -= amount;

    updateHUD();
}

function useMedkit() {
    if (
        !gameStarted ||
        gameOver ||
        medkits <= 0 ||
        health >= 100
    ) {
        return;
    }

    health = Math.min(100, health + 35);
    medkits--;

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

        updateHUD();
    } else {
        isCrouching = !isCrouching;
    }
}

// =====================================
// 22. SURVIVAL SUPPLIES AND COLLECTIBLES
// =====================================

const collectibles = [];

function showPickupNotice(message) {
    let notice = document.getElementById("pickupNotice");

    if (!notice) {
        notice = document.createElement("div");
        notice.id = "pickupNotice";

        Object.assign(notice.style, {
            position: "absolute",
            top: "42%",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 22px",
            background: "rgba(12, 20, 15, 0.92)",
            border: "1px solid #8b332d",
            color: "#f0e5d8",
            fontSize: "14px",
            fontWeight: "bold",
            letterSpacing: "2px",
            textAlign: "center",
            zIndex: "50",
            pointerEvents: "none",
            opacity: "0",
            transition: "opacity 0.2s"
        });

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
    createCollectible(53, "ammo");
    createCollectible(70, "weapon");
    createCollectible(84, "supply");
}

function collectItem(item) {
    if (item.collected) return;

    item.collected = true;

    scene.remove(item.mesh);

    if (item.type === "medkit") {
        medkits++;
        collectedMedkits++;

        showPickupNotice("+1 MEDKIT COLLECTED");
    }

    else if (item.type === "ammo") {
        reserveAmmo += 24;
        collectedAmmo++;

        showPickupNotice("+24 AMMO COLLECTED");
    }

    else if (item.type === "weapon") {
        collectedWeapon = true;
        weaponLevel = 2;
        bulletDamage = 30;

        showPickupNotice("WEAPON UPGRADE ACQUIRED!");
    }

    else if (item.type === "supply") {
        medkits++;
        reserveAmmo += 12;

        showPickupNotice("SUPPLY CRATE: +1 MEDKIT, +12 AMMO");
    }

    updateHUD();
    checkMissionProgress();
}

function updateCollectibles() {
    collectibles.forEach(item => {
        if (item.collected) return;

        // Floating animation
        item.mesh.position.y =
            item.baseY +
            Math.sin(Date.now() * 0.003 + item.phase) * 0.12;

        item.mesh.rotation.y += 0.01;

        const distance = Math.abs(
            player.position.x - item.x
        );

        const verticalDistance = Math.abs(
            player.position.y - (-3.9)
        );

        if (distance < 1.1 && verticalDistance < 1.5) {
            collectItem(item);
        }
    });
}

// =====================================
// 23. KEYBOARD CONTROLS
// =====================================

document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

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

    loadPlayerCharacter();

    // Reset player stats
    health = 100;
    ammo = 12;
    reserveAmmo = 48;
    medkits = 3;

    bulletDamage = 20;
    weaponLevel = 1;

    collectedMedkits = 0;
    collectedAmmo = 0;
    collectedWeapon = false;

    isRunning = false;
    isHidden = false;
    isCrouching = false;

    // Reset player position
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

    defeatedMonsters = 0;
    currentMission = 1;

    // Clear pressed keys
    Object.keys(keys).forEach(key => {
        keys[key] = false;
    });

    // Reset timers
    lastDamageTime = 0;
    lastShotTime = 0;

    firstMonsterTime = Infinity;
    nextMonsterTime = 0;
    monsterSpawned = false;

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

// Recalculate camera based on the current screen size
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

    // Request fullscreen
 // Request fullscreen and attempt landscape orientation
if (gameScreen.requestFullscreen) {
    gameScreen.requestFullscreen()
        .then(() => {
            resizeGame();

            // Attempt to lock the phone in landscape
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
// 28. MOBILE CONTROLS
// =====================================

document.querySelectorAll("[data-move]").forEach(button => {
    const action = button.dataset.move;

    button.addEventListener("pointerdown", event => {
        event.preventDefault();

        if (!gameStarted || gameOver) return;

        if (action === "left") {
            keys.a = true;
        }

        if (action === "right") {
            keys.d = true;
        }

        if (action === "jump") jump();
        if (action === "shoot") shoot();

        // FIX: HTML uses data-move="hide"
        if (action === "hide") toggleHide();

        if (action === "medkit") useMedkit();
        if (action === "reload") reload();

        if (action === "run") {
            isRunning = true;
        }

        if (action === "crouch") {
            isCrouching = true;
        }
    });

    const stop = () => {
        if (action === "left") {
            keys.a = false;
        }

        if (action === "right") {
            keys.d = false;
        }

        if (action === "run") {
            isRunning = false;
        }

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
    // Landscape screens automatically show more horizontal space.
    const viewHeight = 12;
    const aspect = width / height;

    camera.left = -(viewHeight * aspect) / 2;
    camera.right = (viewHeight * aspect) / 2;

    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;

    camera.updateProjectionMatrix();

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 2)
    );

    renderer.setSize(width, height, false);
}

// Browser window resize
window.addEventListener("resize", resizeGame);

// Phone orientation change
window.addEventListener("orientationchange", () => {
    requestAnimationFrame(() => {
        resizeGame();

        // Resize again after the browser finishes changing layout
        requestAnimationFrame(resizeGame);
    });
});

// Detect changes in the actual game container
if ("ResizeObserver" in window) {
    const gameResizeObserver = new ResizeObserver(() => {
        resizeGame();
    });

    gameResizeObserver.observe(gameContainer);
}

// Fullscreen changes can also change the game dimensions
document.addEventListener("fullscreenchange", () => {
    requestAnimationFrame(() => {
        resizeGame();
    });
});

// =====================================
// 30. GAME LOOP
// =====================================

function animate() {
    requestAnimationFrame(animate);

    if (gameStarted && !gameOver) {
        updatePlayer();
        updateMonsterSpawning();
        updateEnemies();
        updateBullets();
        updateCollectibles();
        updateCamera();

        checkMissionProgress();
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

// Continue button in controls tutorial
const continueButton = document.getElementById("continueButton");

if (continueButton) {
    continueButton.addEventListener("click", () => {
        window.continueGame();
    });
}

// Restart Game Button
const restartButton = document.getElementById("restartButton");

if (restartButton) {
    restartButton.addEventListener("click", () => {
        window.location.reload();
    });
}

// Quit Game Button
const quitButton = document.getElementById("quitButton");

if (quitButton) {
    quitButton.addEventListener("click", () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(error => {
                console.log("Could not exit fullscreen:", error);
            });
        }

        document.getElementById("gameEndScreen").hidden = true;
        document.getElementById("gameScreen").hidden = true;
        document.getElementById("mainMenu").hidden = false;

        gameOver = false;
        gameStarted = false;
    });
}

// =====================================
// 32. INITIALIZE GAME
// =====================================

updateHUD();
animate();

console.log("OUTBREAK GAME INITIALIZED");
