import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { CameraControls } from './CameraControls.js';
import { PlantPot } from './PlantPot.js';
import { Plant } from './Plant.js';
import { UIManager } from './UIManager.js';
import { WaterCloud } from './WaterCloud.js';

export class GameManager {
    constructor() {
        this.clock = new THREE.Clock();
        this.init();
    }

    init() {
        // Initialize renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Initialize camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        // Initialize scene manager
        this.sceneManager = new SceneManager();

        // Initialize camera controls
        this.cameraControls = new CameraControls(this.camera, this.renderer);

        // Create plant pot, plant, and water cloud
        this.plantPot = new PlantPot();
        this.plant = new Plant();
        this.waterCloud = new WaterCloud();

        // Setup click handling for plant and cloud (pass camera and canvas)
        this.plant.setCamera(this.camera, this.renderer.domElement);
        this.waterCloud.setCamera(this.camera, this.renderer.domElement);

        // Initialize UI manager (after plant is created)
        this.uiManager = new UIManager(this);

        // Add objects to scene
        this.plantPot.addToScene(this.sceneManager.getScene());
        this.plantPot.addPlant(this.plant);
        this.waterCloud.addToScene(this.sceneManager.getScene());

        // Start animation loop
        this.animate();
    }

    animate = () => {
        const deltaTime = this.clock.getDelta();

        // Update plant growth
        this.plant.update(deltaTime);

        // Update water cloud (pass watering callback)
        this.waterCloud.update(deltaTime, (amount) => {
            this.plant.waterPlant(amount);
        });

        // Update UI with current stem health (water level)
        this.uiManager.updateWaterLevel(this.plant.getStemHealth());

        // Update controls
        this.cameraControls.update();

        // Render scene
        this.renderer.render(this.sceneManager.getScene(), this.camera);

        // Continue animation loop
        this.renderer.setAnimationLoop(this.animate);
    }

    resetPlantGrowth() {
        this.plant.reset();
    }

    waterPlant() {
        this.plant.waterPlant();
    }
}