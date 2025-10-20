import * as THREE from 'three';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.setupBackground();
        this.setupLighting();
    }

    setupBackground() {
        // Create gradient background
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 512;

        // Create gradient from pastel blue to pastel pink/magenta
        const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#7895d3ff'); // Pastel blue
        gradient.addColorStop(1, '#d471abff'); // Pastel pink/magenta

        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        const texture = new THREE.CanvasTexture(canvas);
        this.scene.background = texture;
    }

    setupLighting() {
        // Ambient light for overall illumination - increased to show true colors
        const ambientLight = new THREE.AmbientLight(0x808080, 1.8);
        this.scene.add(ambientLight);

        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.4);
        mainLight.position.set(5, 5, 5);
        this.scene.add(mainLight);

        // Side light for left/right face differentiation
        const sideLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sideLight.position.set(-5, 0, 2);
        this.scene.add(sideLight);

        // Back light for front/back face separation
        const backLight = new THREE.DirectionalLight(0xffffff, 0.7);
        backLight.position.set(0, 3, -5);
        this.scene.add(backLight);

        // Bottom light for top/bottom face distinction
        const bottomLight = new THREE.DirectionalLight(0xffffff, 0.6);
        bottomLight.position.set(2, -5, 2);
        this.scene.add(bottomLight);
    }

    add(object) {
        this.scene.add(object);
    }

    getScene() {
        return this.scene;
    }
}