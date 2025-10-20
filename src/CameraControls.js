import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class CameraControls {
    constructor(camera, renderer) {
        this.camera = camera;
        this.renderer = renderer;
        this.setupControls();
        this.setupCamera();
        this.setupResponsiveResize();
    }

    setupCamera() {
        // Position camera
        this.camera.position.set(0, 0, 3);
    }

    setupControls() {
        // Setup orbit controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 2.2, 0); // Center on plant middle (stem base + half height)
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Set zoom boundaries
        this.controls.minDistance = 1.5; // Minimum zoom in distance
        this.controls.maxDistance = 10;  // Maximum zoom out distance

        this.controls.update();
    }

    setupResponsiveResize() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    update() {
        this.controls.update();
    }
}