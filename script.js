import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

console.log("SCRIPT.JS IS RUNNING");

let playerUsername = "";
let selectedCharacter = "";

window.registerPlayer = function () {
    const usernameInput = document.getElementById("usernameInput");
    const signupMessage = document.getElementById("signupMessage");

    const username = usernameInput.value.trim();

    if (username === "") {
        signupMessage.textContent = "Please enter a username.";
        return;
    }

    playerUsername = username;

    document.getElementById("signupScreen").hidden = true;
    document.getElementById("characterSelection").hidden = false;

    console.log("Player registered:", playerUsername);
};

window.selectCharacter = function (character) {
    selectedCharacter = character;

    document.getElementById("characterSelection").hidden = true;
    document.getElementById("mainMenu").hidden = false;

    document.getElementById("displayUsername").textContent = playerUsername;

    document.getElementById("selectedCharacterText").textContent =
        "Selected Character: " + selectedCharacter.toUpperCase();

    console.log("Selected character:", selectedCharacter);
};

// =====================================
// 4. THREE.JS SCENE
// =====================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x101719);
scene.fog = new THREE.Fog(0x101719, 10, 35);

// =====================================
// 5. CAMERA
// =====================================

const camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

camera.position.set(0, 3, 7);
camera.lookAt(0, 1, 0);
camera.rotation.order = "YXZ";

// =====================================
// 6. RENDERER
// =====================================

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.getElementById("game3D").appendChild(renderer.domElement);

// =====================================
// 7. LIGHTING
// =====================================

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 2);
mainLight.position.set(4, 8, 5);
mainLight.castShadow = true;
scene.add(mainLight);

// =====================================
// 8. FLOOR
// =====================================

const floorGeometry = new THREE.PlaneGeometry(20, 30);

const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x394044,
    roughness: 0.9
});

const floor = new THREE.Mesh(floorGeometry, floorMaterial);

floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;

scene.add(floor);

// =====================================
// 9. WALLS
// =====================================

const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x697174,
    roughness: 0.85
});

function createWall(x, y, z, width, height, depth) {
    const geometry = new THREE.BoxGeometry(
        width,
        height,
        depth
    );

    const wall = new THREE.Mesh(
        geometry,
        wallMaterial
    );

    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;

    scene.add(wall);
}

// Laboratory walls

createWall(0, 2, -15, 20, 4, 0.5);
createWall(-10, 2, 0, 0.5, 4, 30);
createWall(10, 2, 0, 0.5, 4, 30);
createWall(0, 2, 15, 20, 4, 0.5);

// =====================================
// 10. CEILING LIGHTS
// =====================================

function createLight(x, z) {
    const light = new THREE.PointLight(
        0xc9e4dc,
        35,
        12
    );

    light.position.set(x, 3.5, z);
    scene.add(light);

    const bulb = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.08, 0.3),
        new THREE.MeshBasicMaterial({
            color: 0xd9fff2
        })
    );

    bulb.position.set(x, 3.8, z);
    scene.add(bulb);
}

createLight(0, -8);
createLight(0, 0);
createLight(0, 8);

// =====================================
// 11. PLAYER MOVEMENT VARIABLES
// =====================================

const movementKeys = {};

let isRunning = false;
const moveSpeed = 0.07;
const mouseSensitivity = 0.002;

// =====================================
// 12. PLAYER MOVEMENT
// =====================================

function updatePlayerMovement() {
    const speed = isRunning ? moveSpeed * 1.8 : moveSpeed;

    const forward = new THREE.Vector3();

    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();

    right.crossVectors(forward, camera.up).normalize();

    if (movementKeys["w"] || movementKeys["arrowup"]) {
        camera.position.addScaledVector(forward, speed);
    }

    if (movementKeys["s"] || movementKeys["arrowdown"]) {
        camera.position.addScaledVector(forward, -speed);
    }

    if (movementKeys["a"] || movementKeys["arrowleft"]) {
        camera.position.addScaledVector(right, -speed);
    }

    if (movementKeys["d"] || movementKeys["arrowright"]) {
        camera.position.addScaledVector(right, speed);
    }
}

// =====================================
// 13. KEYBOARD CONTROLS
// =====================================

document.addEventListener("keydown", (event) => {
    movementKeys[event.key.toLowerCase()] = true;

    if (event.key === "Shift") {
        isRunning = true;
    }
});

document.addEventListener("keyup", (event) => {
    movementKeys[event.key.toLowerCase()] = false;

    if (event.key === "Shift") {
        isRunning = false;
    }
});

// =====================================
// 14. MOUSE LOOK
// =====================================

renderer.domElement.addEventListener("click", () => {
    if (document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock();
    }
});

document.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement !== renderer.domElement) {
        return;
    }

    camera.rotation.y -= event.movementX * mouseSensitivity;
    camera.rotation.x -= event.movementY * mouseSensitivity;

    camera.rotation.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, camera.rotation.x)
    );
});

// =====================================
// 15. MOBILE CONTROLS
// =====================================

document.querySelectorAll("[data-move]").forEach((button) => {
    const keyMap = {
        forward: "w",
        backward: "s",
        left: "a",
        right: "d"
    };

    const action = button.dataset.move;

    button.addEventListener("pointerdown", (event) => {
        event.preventDefault();

        if (action === "interact") {
            document.dispatchEvent(
                new KeyboardEvent("keydown", { key: "e" })
            );
            return;
        }

        movementKeys[keyMap[action]] = true;
    });

    const stopMovement = () => {
        if (keyMap[action]) {
            movementKeys[keyMap[action]] = false;
        }
    };

    button.addEventListener("pointerup", stopMovement);
    button.addEventListener("pointerleave", stopMovement);
    button.addEventListener("pointercancel", stopMovement);
});

// =====================================
// 16. START GAME
// =====================================

window.beginGame = function () {
    const mainMenu = document.getElementById("mainMenu");
    const gameScreen = document.getElementById("gameScreen");
    const gameContainer = document.getElementById("game3D");

    mainMenu.hidden = true;
    gameScreen.hidden = false;

    camera.aspect =
        gameContainer.clientWidth / gameContainer.clientHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        gameContainer.clientWidth,
        gameContainer.clientHeight
    );

    // Request fullscreen after clicking Start Game
    if (gameScreen.requestFullscreen) {
        gameScreen.requestFullscreen().catch((error) => {
            console.log("Fullscreen unavailable:", error);
        });
    }

    console.log("Game started!");
};

// =====================================
// 17. RESTART GAME
// =====================================

window.restartGame = function () {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }

    window.location.reload();
};

// =====================================
// 18. RESPONSIVE RESIZE
// =====================================

window.addEventListener("resize", () => {
    const gameContainer = document.getElementById("game3D");

    if (!gameContainer.clientWidth || !gameContainer.clientHeight) {
        return;
    }

    camera.aspect =
        gameContainer.clientWidth / gameContainer.clientHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        gameContainer.clientWidth,
        gameContainer.clientHeight
    );
});

// =====================================
// 19. ANIMATION LOOP
// =====================================

function animate() {
    requestAnimationFrame(animate);

    updatePlayerMovement();

    renderer.render(scene, camera);
}

animate();

console.log("OUTBREAK GAME INITIALIZED");
