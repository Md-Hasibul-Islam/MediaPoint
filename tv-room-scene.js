// Import necessary Three.js modules
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Create a scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;
camera.position.y = 1;
//camera.position.z = 4.5;
//camera.position.y = 1.5;
//camera.position.x = -4.5;

// Create a renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Create controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0); // Focus on the center of the scene
controls.update();

// create an AudioListener and add it to the camera
const listener = new THREE.AudioListener();
camera.add( listener );

// create a global audio source
const sound = new THREE.Audio( listener );

// List of audio files
const audioSources = [
    'music/tv-room-background-music1.mp3',
    'music/tv-room-background-music2.mp3',
    'music/tv-room-background-music3.mp3',
    'music/tv-room-background-music4.mp3',
    'music/tv-room-background-music5.mp3'
];
let currentAudioIndex = 0;

// load a sound and set it as the Audio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load( audioSources[currentAudioIndex], function( buffer ) {
	sound.setBuffer( buffer );
	sound.setLoop( true );
	sound.setVolume( 0.5 );
	sound.play();
    sound.autoplay = true;
});

// Function to switch audio
function switchAudio() {
    currentAudioIndex = (currentAudioIndex + 1) % audioSources.length;
    audioLoader.load(audioSources[currentAudioIndex], function(buffer) {
        sound.stop(); // Stop the current sound
        sound.setBuffer(buffer);
        sound.play(); // Play the new sound
    });
}

// Create room
const roomGeometry = new THREE.BoxGeometry(10, 6, 10);

const wallTexture1 = new THREE.TextureLoader().load('texture/wall-texture1.jpg');
const wallTexture2 = new THREE.TextureLoader().load('texture/wall-texture1.jpg');
const wallTexture3 = new THREE.TextureLoader().load('texture/wall-texture2.jpg');
const wallTexture4 = new THREE.TextureLoader().load('texture/wall-texture2.jpg');
const floorTexture = new THREE.TextureLoader().load('texture/floor-texture.jpg');
const ceilingTexture = new THREE.TextureLoader().load('texture/ceiling-texture.jpg');

const roomMaterials = [
    new THREE.MeshStandardMaterial({ map: wallTexture1, side: THREE.BackSide }), // Right face
    new THREE.MeshStandardMaterial({ map: wallTexture2, side: THREE.BackSide }), // Left face
    new THREE.MeshStandardMaterial({ map: ceilingTexture, side: THREE.BackSide }), // Top face (ceiling)
    new THREE.MeshStandardMaterial({ map: floorTexture, side: THREE.BackSide }), // Bottom face (floor)
    new THREE.MeshStandardMaterial({ map: wallTexture3, side: THREE.BackSide }), // Front face
    new THREE.MeshStandardMaterial({ map: wallTexture4, side: THREE.BackSide })  // Back face
];
const room = new THREE.Mesh(roomGeometry, roomMaterials);
room.position.set(0, 1, 0);
room.receiveShadow = true;
scene.add(room);

// Load GLTF models
const loader = new GLTFLoader();

// Custom shader material for TV frame, stand, and pole
const customShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTexture: { value: new THREE.TextureLoader().load('texture/tv-body-texture.png') },
        lightPosition: { value: new THREE.Vector3(0, 3, 5) },
        ambientLightColor: { value: new THREE.Color(0xffffff) }
    },
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D uTexture;
        uniform vec3 lightPosition;
        uniform vec3 ambientLightColor;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            vec3 texColor = texture2D(uTexture, vUv).rgb;
            vec3 lightDir = normalize(lightPosition - vPosition);
            float diff = max(dot(vNormal, lightDir), 0.0);
            vec3 ambient = ambientLightColor * 0.2;
            gl_FragColor = vec4(texColor * (diff + ambient), 1.0);
        }
    `
});

// Group TV elements
const tvGroup = new THREE.Group();
var tvSetupGroup = new THREE.Group();

// Create TV screen with video texture
const video = document.createElement('video');
const videoSources = [
    'texture/screen-animation-video1.mp4',
    'texture/screen-animation-video2.mp4',
    'texture/screen-animation-video3.mp4'
];
let currentVideoIndex = 0;

video.src = videoSources[currentVideoIndex];
video.crossOrigin = 'anonymous';
video.loop = true;
video.muted = true;
video.autoplay = true;
video.style.display = 'none';   // Hide the video element
document.body.appendChild(video); // Append video element to DOM to ensure it's loaded

const videoTexture = new THREE.VideoTexture(video);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.format = THREE.RGBAFormat; // Ensure correct format
videoTexture.generateMipmaps = false;

const tvScreenGeometry = new THREE.PlaneGeometry(4.6, 2.6);
const tvScreenMaterial = new THREE.MeshBasicMaterial({ map: videoTexture }); // Default to video texture
const tvScreen = new THREE.Mesh(tvScreenGeometry, tvScreenMaterial);
tvScreen.position.set(0, 2, 0.11); // Position the screen in front of the frame
tvGroup.add(tvScreen);

// Play the video when everything is set up
video.play().catch(error => {
    console.error('Video playback failed:', error);
});

// Function to switch video
function switchVideo() {
    currentVideoIndex = (currentVideoIndex + 1) % videoSources.length;
    video.src = videoSources[currentVideoIndex];
    video.play().catch(error => {
        console.error('Video playback failed:', error);
    });
}

// Create TV screen with image textures
const imagePaths = [
    'texture/screen-texture1.jpg',
    'texture/screen-texture2.jpg',
    'texture/screen-texture3.jpg',
    'texture/screen-texture4.jpg',
    'texture/screen-texture5.jpg'
];

const textures = imagePaths.map(path => new THREE.TextureLoader().load(path));
let currentTextureIndex = 0;

const imageScreenMaterial = new THREE.MeshBasicMaterial({ map: textures[currentTextureIndex] });
const imageScreen = new THREE.Mesh(tvScreenGeometry, imageScreenMaterial);
imageScreen.position.set(0, 2, 0.11); // Position the screen in front of the frame


// Interval for switching image textures
let textureInterval;

// Function to switch image texture
function startTextureInterval() {
    if (textureInterval) clearInterval(textureInterval);
    textureInterval = setInterval(() => {
        currentTextureIndex = (currentTextureIndex + 1) % textures.length;
        imageScreenMaterial.map = textures[currentTextureIndex];
        imageScreenMaterial.needsUpdate = true;
    }, 1000); // Change texture every second
}

// Functions to switch between video and image textures
function switchToVideo() {
    if (textureInterval) clearInterval(textureInterval);
    tvGroup.remove(imageScreen);
    tvGroup.add(tvScreen);
    video.play();
}

function switchToImage() {
    video.pause();
    tvGroup.remove(tvScreen);
    tvGroup.add(imageScreen);
    startTextureInterval();
}

// Load TV Stand model
var tvTable = null;
loader.load('model/tv-table/scene.gltf', function(gltf) {
    tvTable = gltf.scene;
    var scale = 0.23;
    tvTable.scale.set(scale, scale, scale);
    tvTable.position.set(0, -1.5, 0);
    tvTable.rotation.y = -Math.PI / 2; // Rotate -90 degrees around the Y axis

    // Create TV frame
    const tvFrameGeometry = new THREE.BoxGeometry(5, 3, 0.2);
    const tvFrame = new THREE.Mesh(tvFrameGeometry, customShaderMaterial);
    tvFrame.position.set(0, 2, 0);
    tvGroup.add(tvFrame);

    // Create TV stand base
    const standBaseGeometry = new THREE.BoxGeometry(2.5, 0.1, 0.8);
    const standBase = new THREE.Mesh(standBaseGeometry, customShaderMaterial);
    standBase.position.set(0, 0, 0);
    tvGroup.add(standBase);

    // Create TV stand pole
    const standPoleGeometry = new THREE.BoxGeometry(0.5, 2, 0.1);
    const standPole = new THREE.Mesh(standPoleGeometry, customShaderMaterial);
    standPole.position.set(0, 1, 0);
    tvGroup.add(standPole);

    // Create stand foot
    const standFootGeometry = new THREE.BoxGeometry(1, 0.1, 0.3);
    const standFootLeft = new THREE.Mesh(standFootGeometry, customShaderMaterial);
    const standFootRight = new THREE.Mesh(standFootGeometry, customShaderMaterial);

    standFootLeft.position.set(-0.6, -0.05, 0);
    standFootRight.position.set(0.6, -0.05, 0);
    tvGroup.add(standFootLeft);
    tvGroup.add(standFootRight);

    tvGroup.position.set(0, -0.23, 0.5);
    tvGroup.scale.set(0.6, 0.6, 0.6);

    // Group full TV setup (TV and Table)
    //const tvSetupGroup = new THREE.Group();
    tvSetupGroup.add(tvTable, tvGroup);
    tvSetupGroup.position.set(0, -0.6, -4.5);
    tvSetupGroup.traverse(function(child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    scene.add(tvSetupGroup);

}, undefined, function(error) {
    console.error('Error loading TV-Table model:', error);
});

// Load and add lamps
var lamp1 = null;
var lamp2 = null;
loader.load('model/floor-lamp/scene.gltf', function(gltf) {
    lamp1 = gltf.scene;
    var lampScale = 0.3;
    lamp1.scale.set(lampScale, lampScale, lampScale);
    lamp1.position.set(-3.5, 0.15, -4.13);
    lamp1.rotation.y = Math.PI / 4;
    scene.add(lamp1);

    const lamp1Light = new THREE.PointLight(0xffcc99, 3, 9);
    lamp1Light.position.set(-3.5, 0.5, -4.13);
    scene.add(lamp1Light);

    lamp2 = gltf.scene.clone();
    lamp2.scale.set(lampScale, lampScale, lampScale);
    lamp2.position.set(3.5, 0.15, -4.13);
    lamp2.rotation.y = Math.PI / 2;
    scene.add(lamp2);

    const lamp2Light = new THREE.PointLight(0xffcc99, 3, 9);
    lamp2Light.position.set(3.5, 0.5, -4.13);
    scene.add(lamp2Light);

}, undefined, function(error) {
    console.error('Error loading Lamp model:', error);
});

// Load Sofa model
var sofa = null;
loader.load('model/sofa/scene.gltf', function(gltf) {
    sofa = gltf.scene;
    var sofaScale = 0.02;
    sofa.scale.set(sofaScale, sofaScale, sofaScale);
    sofa.position.set(-0.25, -2.0, 2.5); // Adjust the position to place the sofa in front of the TV
    sofa.rotation.y = Math.PI; // Rotate 180 degrees to face the TV
    sofa.traverse(function(child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    scene.add(sofa);

}, undefined, function(error) {
    console.error('Error loading Sofa model:', error);
});

// Load and add door
var door = null;
loader.load('model/door/scene.gltf', function(gltf) {
    door = gltf.scene;
    var doorScale = 0.025;
    door.scale.set(doorScale, doorScale, doorScale);
    door.position.set(4.9, 0.5, 3.0); // Position the door on the right wall
    door.rotation.y = Math.PI;
    scene.add(door);

}, undefined, function(error) {
    console.error('Error loading Door model:', error);
});

// Load and add window
var windowModel = null;
loader.load('model/sliding-window/scene.gltf', function(gltf) {
    windowModel = gltf.scene;
    //var windowScale = 0.015;
    //windowModel.scale.set(windowScale, windowScale, windowScale);
    windowModel.scale.set(0.02, 0.015, 0.01);
    windowModel.position.set(-5.05, 1, 0); // Position the window on the left wall
    windowModel.rotation.y = Math.PI / 2;
    scene.add(windowModel);

}, undefined, function(error) {
    console.error('Error loading Window model:', error);
});

// Load and add fan on ceiling
var fan = null;
loader.load('model/ceiling-fan/scene.gltf', function(gltf) {
    fan = gltf.scene;
    var fanScale = 0.3;
    fan.scale.set(fanScale, fanScale, fanScale);
    fan.position.set(0, -0.7, 0); // Position the fan under the ceiling
    scene.add(fan);

    // Add fan animation
    function rotateFan() {
        fan.rotation.y += 0.3;
        requestAnimationFrame(rotateFan);
    }
    rotateFan();

}, undefined, function(error) {
    console.error('Error loading Fan model:', error);
});

// Load and add photo frame
var photoFrame = null;
loader.load('model/photo-frame/scene.gltf', function(gltf) {
    photoFrame = gltf.scene;
    var photoFrameScale = 1.0;
    photoFrame.scale.set(photoFrameScale, photoFrameScale, photoFrameScale);
    photoFrame.position.set(4.93, 1.5, -2.5); // Position the photo frame on the right wall
    photoFrame.rotation.y = Math.PI * 1.5;
    scene.add(photoFrame);
    
}, undefined, function(error) {
    console.error('Error loading Photo Frame model:', error);
});

// Load and add air conditioner
var ac = null;
loader.load('model/air-conditioner/scene.gltf', function(gltf) {
    ac = gltf.scene;
    var acScale = 0.5;
    ac.scale.set(acScale, acScale, acScale);
    ac.position.set(0, 0.8, 4.8); // Position the air conditioner on the back wall
    ac.rotation.y = Math.PI / 2;
    scene.add(ac);

}, undefined, function(error) {
    console.error('Error loading Air Conditioner model:', error);
});

// Load and add tubelight
var tubelight = null;
loader.load('model/tubelight/scene.gltf', function(gltf) {
    tubelight = gltf.scene;
    var tubelightScale = 3.0;
    tubelight.scale.set(tubelightScale, tubelightScale, tubelightScale);
    tubelight.position.set(4.9, 3.3, -1.1); // Position the tubelight on the right wall
    tubelight.rotation.x = Math.PI / 2;
    tubelight.rotation.z = Math.PI / 2;
    scene.add(tubelight);

    // Traverse through all the child objects of tubelight and add emissive material
    tubelight.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
                map: child.material.map, // Use the same texture
                emissive: 0xfafafa, // Set emissive color
                emissiveIntensity: 1.5 
            });
        }
    });

    scene.add(tubelight);

    // Add spot light to simulate light emission from the tubelight
    const tubelightSpotLight = new THREE.SpotLight(0xffffff, 30, 100, Math.PI / 2, 1, 2);
    tubelightSpotLight.position.set(4.9, 3.3, -0.5); // Position of the tubelight
    tubelightSpotLight.castShadow = true;
    tubelightSpotLight.shadow.mapSize.width = 1024;
    tubelightSpotLight.shadow.mapSize.height = 1024;
    tubelightSpotLight.shadow.camera.near = 0.5;
    tubelightSpotLight.shadow.camera.far = 500;

    // Set the direction of the spotlight
    tubelightSpotLight.target.position.set(0, 0, 0); 
    scene.add(tubelightSpotLight);
    scene.add(tubelightSpotLight.target); // Add the target to the scene

}, undefined, function(error) {
    console.error('Error loading Tubelight model:', error);
});

// Load and add electrical switch
var electricalSwitch = null;
loader.load('model/electrical-switch/scene.gltf', function(gltf) {
    electricalSwitch = gltf.scene;
    var electricalSwitchScale = 2.5;
    electricalSwitch.scale.set(electricalSwitchScale, electricalSwitchScale, electricalSwitchScale);
    electricalSwitch.position.set(5.0, 1.1, 1.0); // Position the electrical switch on the right wall
    electricalSwitch.rotation.y = Math.PI * 1.5;
    scene.add(electricalSwitch);

}, undefined, function(error) {
    console.error('Error loading Electrical Switch model:', error);
});

// Load and add tv remote
var tvRemote = null;
loader.load('model/tv-remote/scene.gltf', function(gltf) {
    tvRemote = gltf.scene;
    var tvRemoteScale = 0.004;
    tvRemote.scale.set(tvRemoteScale, tvRemoteScale, tvRemoteScale);
    tvRemote.position.set(-1.7, -1.2, 2.6); // Position the tv remote on the sofa
    tvRemote.rotation.x = Math.PI * 1.39;
    tvRemote.rotation.z = Math.PI * 1.35;
    scene.add(tvRemote);

}, undefined, function(error) {
    console.error('Error loading TV Remote model:', error);
});

// Create a light source
const ambientLight = new THREE.AmbientLight(0xffffff, 0.01); // Reduce ambient light to make the room darker
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 2, 50);
pointLight.position.set(0, 3, 5);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
pointLight.shadow.camera.near = 0.5;
pointLight.shadow.camera.far = 500;
scene.add(pointLight);

// Camera boundaries
const minX = -5, maxX = 5;
const minY = -2, maxY = 5;
const minZ = -5, maxZ = 5;

// Handle keyboard interaction
document.onkeydown = function(event) {
    const moveDistance = 0.1; // distance to move per key press
    //const rotateAngle = Math.PI / 180; // angle to rotate per key press (1 degree)
    const volumeLevel = 0.1; // volume level for increase/decrease

    if (event.key === 'ArrowRight') {
        camera.position.x = Math.min(camera.position.x + moveDistance, maxX); // Move right
    } else if (event.key === 'ArrowLeft') {
        camera.position.x = Math.max(camera.position.x - moveDistance, minX); // Move left
    } else if (event.key === 'ArrowUp') {
        camera.position.z = Math.max(camera.position.z - moveDistance, minZ); // Move forward
    } else if (event.key === 'ArrowDown') {
        camera.position.z = Math.min(camera.position.z + moveDistance, maxZ); // Move backward
    } else if (event.key === '1') {
        camera.position.y = Math.min(camera.position.y + moveDistance, maxY); // Move upward
    } else if (event.key === '0') {
        camera.position.y = Math.max(camera.position.y - moveDistance, minY); // Move downward
    } else if (event.key === 'p' || event.key === 'P') {
        if (video.paused) {
            video.play();   // TV screen video play 
        } else {
            video.pause();  // TV screen video pause
        }
    } else if (event.key === 'c' || event.key === 'C') {
        switchVideo(); // Switch video
    } else if (event.key === 'v' || event.key === 'V') {
        switchToVideo(); // Switch to video texture
    } else if (event.key === 'i' || event.key === 'I') {
        switchToImage(); // Switch to image texture
    } else if (event.key === 'm' || event.key === 'M') {
        if (sound.isPlaying) {
            sound.pause();  // Background music mute
        } else {
            sound.play();   // Background music unmute
        }
    } else if (event.key === '+') {
        sound.setVolume(Math.min(sound.getVolume() + volumeLevel, 1)); // Increase volume
    } else if (event.key === '-') {
        sound.setVolume(Math.max(sound.getVolume() - volumeLevel, 0)); // Decrease volume
    } else if (event.key === 'b' || event.key === 'B') {
        switchAudio(); // Switch background music
    }
    /* 
    else if (event.key === 'd' || event.key === 'D') {
        camera.rotation.y -= rotateAngle; // Rotate right
    } else if (event.key === 'a' || event.key === 'A') {
        camera.rotation.y += rotateAngle; // Rotate left
    } else if (event.key === 'w' || event.key === 'W') {
        camera.rotation.x -= rotateAngle; // Rotate up
    } else if (event.key === 's' || event.key === 'S') {
        camera.rotation.x += rotateAngle; // Rotate down
    }
    */

    // Ensure the camera's y position stays within the room's boundaries
    //camera.position.y = Math.max(Math.min(camera.position.y, maxY), minY);
};

// Handle mouse interaction
renderer.domElement.onmousemove = function(event) {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Calculate the angle based on mouse position
    const angle = mouseX * Math.PI; // Adjust the multiplier to control the rotation speed
    const radius = 2; // Radius of the circular path around the TV
    pointLight.position.x = tvSetupGroup.position.x + radius * Math.sin(angle);
    pointLight.position.z = tvSetupGroup.position.z + radius * Math.cos(angle);
    pointLight.position.y = tvSetupGroup.position.y + mouseY; // Adjust height based on mouse Y position
};

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});
