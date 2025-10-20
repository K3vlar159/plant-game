import * as THREE from 'three';

export class PlantPot {
    constructor() {
        this.group = new THREE.Group();
        this.createPot();
        this.createSoil();
        this.createRim();
    }

    createPot() {
        // Create plant pot (frustum using cylinder with different radii)
        const potGeometry = new THREE.CylinderGeometry(
            0.8,  // radiusTop (smaller - top of pot)
            0.5,  // radiusBottom (larger - bottom of pot)  
            1.3,  // height
            16    // radialSegments (smoother than 8)
        );

        const potMaterial = new THREE.MeshPhongMaterial({
            color: '#ce6e41', // Saddle brown
            shininess: 10
        });

        this.pot = new THREE.Mesh(potGeometry, potMaterial);
        this.pot.position.y = -0.55; // Position pot bottom
        this.group.add(this.pot);
    }

    createSoil() {
        // Create soil (brown cylinder)
        const soilGeometry = new THREE.CylinderGeometry(0.72, 0.65, 0.2, 16);
        const soilMaterial = new THREE.MeshPhongMaterial({
            color: '#4A2C2A', // Dark brown
            shininess: 5
        });

        this.soil = new THREE.Mesh(soilGeometry, soilMaterial);
        this.soil.position.y = 0.1; // Position soil at top of pot
        this.group.add(this.soil);
    }

    createRim() {
        // Create pot rim (torus ring)
        const rimGeometry = new THREE.TorusGeometry(0.8, 0.12, 8, 16);
        const rimMaterial = new THREE.MeshPhongMaterial({
            color: '#ce6e41', // Sienna brown
            shininess: 15
        });

        this.rim = new THREE.Mesh(rimGeometry, rimMaterial);
        this.rim.position.y = 0.2; // Position rim at top
        this.rim.rotation.x = THREE.MathUtils.degToRad(90); // Rotate rim by 90 degrees
        this.group.add(this.rim);
    }

    addToScene(scene) {
        scene.add(this.group);
    }

    addPlant(plant) {
        this.group.add(plant.group);
    }
}