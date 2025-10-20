import * as THREE from 'three';

export class WaterCloud {
    constructor() {
        this.group = new THREE.Group();
        this.spheres = [];
        this.sphereOriginalPositions = []; // Store original positions
        this.rainDrops = [];
        this.isRaining = false;
        this.rainDuration = 2; // seconds
        this.rainTimer = 0;
        this.isMouseDown = false;
        this.dropSpawnTimer = 0;
        this.dropSpawnInterval = 0.1; // Spawn drops every 0.1 seconds
        
        // Raycasting for cloud clicking
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.createCloud();
    }
    
    createCloud() {
        const sphereRadius = 0.8;
        const sphereCount = 8;
        
        for (let i = 0; i < sphereCount; i++) {
            // Create fluffy cloud spheres
            const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 8, 6);
            const sphereMaterial = new THREE.MeshPhongMaterial({
                color: '#e6f3ff', // Light blue-white
                transparent: true,
                opacity: 0.8
            });
            
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            
            // Random organic positioning for natural cloud shape
            const baseX = (Math.random() - 0.5) * 2.5; // Random X within cloud area
            const baseZ = (Math.random() - 0.5) * 2.5; // Random Z within cloud area
            const baseY = 4.2 + (Math.random() - 0.5) * 0.8; // Random Y variation
            
            // Add some clustering by pulling spheres toward nearby ones
            if (i > 0) {
                const nearbyIndex = Math.floor(Math.random() * i);
                const nearby = this.spheres[nearbyIndex];
                const pullStrength = 0.3;
                sphere.position.x = baseX + (nearby.position.x - baseX) * pullStrength;
                sphere.position.z = baseZ + (nearby.position.z - baseZ) * pullStrength;
                sphere.position.y = baseY + (nearby.position.y - baseY) * pullStrength;
            } else {
                sphere.position.set(baseX, baseY, baseZ);
            }
            
            this.spheres.push(sphere);
            this.sphereOriginalPositions.push(sphere.position.clone()); // Store original position
            this.group.add(sphere);
        }
        
        // Position cloud above plant
        this.group.position.set(0, 2, 0);
    }
    
    setCamera(camera, canvas) {
        this.camera = camera;
        this.canvas = canvas;
        
        // Store bound functions for easy removal
        this.boundMouseDownHandler = this.onMouseDown.bind(this);
        this.boundMouseUpHandler = this.onMouseUp.bind(this);
        
        if (canvas) {
            canvas.addEventListener('mousedown', this.boundMouseDownHandler);
            canvas.addEventListener('mouseup', this.boundMouseUpHandler);
            // Also stop rain when mouse leaves canvas
            canvas.addEventListener('mouseleave', this.boundMouseUpHandler);
        }
    }
    
    onMouseDown(event) {
        if (!this.camera || !this.canvas) return;

        // Calculate mouse position in normalized device coordinates
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update the raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Check for intersections with cloud spheres
        const intersects = this.raycaster.intersectObjects(this.spheres);

        if (intersects.length > 0) {
            this.isMouseDown = true;
            this.startRain();
        }
    }

    onMouseUp(event) {
        this.isMouseDown = false;
        this.stopRain();
    }
    
    startRain() {
        if (this.isRaining) return;
        
        this.isRaining = true;
        this.rainTimer = 0;
        this.dropSpawnTimer = 0;
        
        console.log('Rain started! 🌧️');
    }
    
    createRainDrops() {
        const dropCount = 50;
        
        for (let i = 0; i < dropCount; i++) {
            // Create small blue spheres for rain drops
            const dropGeometry = new THREE.SphereGeometry(0.02, 5, 3);
            const dropMaterial = new THREE.MeshPhongMaterial({
                color: '#4a90e2', // Blue rain drop
                transparent: true,
                opacity: 0.7
            });
            
            const drop = new THREE.Mesh(dropGeometry, dropMaterial);
            
            // Position drops to start from within the cloud area (world coordinates)
            drop.position.x = (Math.random() - 0.5) * 1.5; // Cloud width
            drop.position.y = 5 + Math.random() * 1.0;   // From cloud bottom (5) to cloud top (6)
            drop.position.z = (Math.random() - 0.5) * 1.5; // Cloud depth
            
            // Add falling velocity
            drop.velocity = -3 - Math.random() * 2; // Fall speed
            
            this.rainDrops.push(drop);
            // Add drops directly to scene, not cloud group, so they use world coordinates
            if (this.scene) {
                this.scene.add(drop);
            }
        }
    }

    spawnDropBatch(count) {
        for (let i = 0; i < count; i++) {
            // Create small blue spheres for rain drops
            const dropGeometry = new THREE.SphereGeometry(0.02, 4, 3);
            const dropMaterial = new THREE.MeshPhongMaterial({
                color: '#4a90e2', // Blue rain drop
                transparent: true,
                opacity: 0.7
            });
            
            const drop = new THREE.Mesh(dropGeometry, dropMaterial);
            
            // Position drops to start from within the cloud area (world coordinates)
            drop.position.x = (Math.random() - 0.5) * 1.5; // Cloud width
            drop.position.y = 3.8 + Math.random() * 1.0;   // From cloud bottom to cloud top
            drop.position.z = (Math.random() - 0.5) * 1.5; // Cloud depth
            
            // Add falling velocity
            drop.velocity = -3 - Math.random() * 2; // Fall speed
            
            this.rainDrops.push(drop);
            // Add drops directly to scene, not cloud group, so they use world coordinates
            if (this.scene) {
                this.scene.add(drop);
            }
        }
    }
    
    update(deltaTime, onWaterPlant) {
        // Spawn new drops only while mouse is held down
        if (this.isRaining && this.isMouseDown) {
            this.rainTimer += deltaTime;
            this.dropSpawnTimer += deltaTime;
            
            // Spawn new drops continuously while holding mouse
            if (this.dropSpawnTimer >= this.dropSpawnInterval) {
                this.spawnDropBatch(5); // Spawn 5 drops at a time
                this.dropSpawnTimer = 0;
            }
        }
        
        // Always update existing rain drops (even after mouse release)
        if (this.rainDrops.length > 0) {
            for (let i = this.rainDrops.length - 1; i >= 0; i--) {
                const drop = this.rainDrops[i];
                drop.position.y += drop.velocity * deltaTime;
                
                // Water the plant when drop actually hits soil surface 
                if (drop.position.y <= 0.1 && !drop.hasWatered) {
                    drop.hasWatered = true; // Mark as watered to avoid double-watering
                    // Only water if drop lands inside the pot (smaller radius)
                    if (Math.abs(drop.position.x) < 0.6 && Math.abs(drop.position.z) < 0.6) {
                        onWaterPlant(0.003); // Smaller amount per drop for better balance
                    }
                }
                
                // Remove drops when they fall below ground
                if (drop.position.y <= -0.2) {
                    if (this.scene) {
                        this.scene.remove(drop);
                    }
                    this.rainDrops.splice(i, 1);
                }
            }
            
        }
        
        // Update rain state - stop spawning new drops when mouse released
        if (this.isRaining && !this.isMouseDown) {
            this.isRaining = false;
            console.log('Rain stopped spawning, existing drops will finish falling! 🌤️');
        }
        
        // Gentle floating animation for cloud spheres - relative to original positions
        this.spheres.forEach((sphere, index) => {
            const originalPos = this.sphereOriginalPositions[index];
            const floatOffset = Math.sin(Date.now() * 0.001 + index) * 0.1; // Smaller, controlled movement
            sphere.position.y = originalPos.y + floatOffset;
        });
    }
    
    stopRain() {
        this.isRaining = false;
        // Don't remove existing drops - let them finish falling naturally
        console.log('Stopped spawning new rain drops! 🌤️');
    }
    
    addToScene(scene) {
        this.scene = scene; // Store scene reference for rain drops
        scene.add(this.group);
    }
    
    dispose() {
        // Clean up event listeners
        if (this.canvas) {
            if (this.boundMouseDownHandler) {
                this.canvas.removeEventListener('mousedown', this.boundMouseDownHandler);
            }
            if (this.boundMouseUpHandler) {
                this.canvas.removeEventListener('mouseup', this.boundMouseUpHandler);
                this.canvas.removeEventListener('mouseleave', this.boundMouseUpHandler);
            }
        }
    }
}