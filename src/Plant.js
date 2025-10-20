import * as THREE from 'three';
import { Leaf } from './Leaf.js';

// Plant configuration - easy to adjust
const PLANT_CONFIG = {
    leafCount: 15,
    leafSpawnDelayMin: 3,  // seconds
    leafSpawnDelayMax: 10,  // seconds
    stemGrowthSpeed: 0.1,  // scale per second
    stemRadius: 0.1,
    stemHeight: 4,
    stemColor: '#5a8a5a'
};

export class Plant {
    constructor() {
        this.group = new THREE.Group();
        this.growthStage = 0; // 0 to 1 (fully grown)
        this.isGrowing = true;
        this.leaves = [];
        this.leafSpawnTimers = []; // Array of spawn timers for each leaf
        this.leafSpawningStarted = false;
        
        // Stem decay system
        this.stemHealth = 1.0; // 1.0 = healthy green, 0.0 = fully decayed yellow
        this.stemDecayRate = 0.02; // Health lost per second (50 seconds to fully decay)
        this.stemMaterial = null; // Store reference to stem material
        
        // Raycasting for leaf clicking
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.pendingLeafSpawns = []; // Track delayed leaf spawns
        this.leavesBeingRemoved = []; // Track leaves with removal animations
        
        this.createStem();
        this.setupLeafSpawnTimers();
        this.setupClickHandler();
    }

    createStem() {
        // Create plant stem (green cylinder)
        const stemGeometry = new THREE.CylinderGeometry(PLANT_CONFIG.stemRadius, PLANT_CONFIG.stemRadius, PLANT_CONFIG.stemHeight, 8);
        this.stemMaterial = new THREE.MeshPhongMaterial({
            color: PLANT_CONFIG.stemColor,
            shininess: 10
        });

        this.stem = new THREE.Mesh(stemGeometry, this.stemMaterial);
        this.stemHeight = PLANT_CONFIG.stemHeight; // Store original height
        this.stemBaseY = 0.2; // Soil level position
        
        // Position so bottom of stem anchors to soil as it scales
        this.stem.position.y = this.stemBaseY + (this.stemHeight * 0.05) / 2;
        this.stem.scale.y = 0.05; // Start as tiny sprout (5% of full height)
        this.group.add(this.stem);
    }

    setupLeafSpawnTimers() {
        for (let i = 0; i < PLANT_CONFIG.leafCount; i++) {
            const randomDelay = PLANT_CONFIG.leafSpawnDelayMin + 
                               Math.random() * (PLANT_CONFIG.leafSpawnDelayMax - PLANT_CONFIG.leafSpawnDelayMin);
            this.leafSpawnTimers.push({
                delay: randomDelay,
                hasSpawned: false
            });
        }
    }

    update(deltaTime) {
        if (this.isGrowing) {
            this.grow(deltaTime);
        }
        
        // Update leaves
        this.leaves.forEach(leaf => {
            leaf.update(deltaTime);
        });
        
        // Update stem decay (only after growth is complete)
        if (this.growthStage >= 1.0) {
            this.updateStemDecay(deltaTime);
        }
        
        // Start leaf spawning timer when plant reaches 100% growth
        if (this.growthStage >= 1.0 && !this.leafSpawningStarted) {
            this.leafSpawningStarted = true;
            this.leafSpawnStartTime = 0; // Track time since spawning started
        }
        
        // Handle staggered leaf spawning
        if (this.leafSpawningStarted) {
            this.leafSpawnStartTime += deltaTime;
            this.checkLeafSpawns();
        }
        
        // Handle pending leaf spawns from removed leaves
        this.updatePendingLeafSpawns(deltaTime);
        
        // Handle leaf removal animations
        this.updateLeafRemovalAnimations(deltaTime);
    }

    grow(deltaTime) {
        // Scale-based growth: stem grows taller by scaling
        const maxScale = 1.0; // full size (100%)
        
        if (this.stem.scale.y < maxScale) {
            this.stem.scale.y += PLANT_CONFIG.stemGrowthSpeed * deltaTime;
            this.stem.scale.y = Math.min(maxScale, this.stem.scale.y); // Clamp to max
            
            // Adjust position so bottom stays anchored to soil level
            const currentHeight = this.stemHeight * this.stem.scale.y;
            this.stem.position.y = this.stemBaseY + currentHeight / 2;
            
            this.growthStage = this.stem.scale.y / maxScale; // 0 to 1
        } else {
            this.isGrowing = false; // Stop growing when fully grown
        }
    }

    checkLeafSpawns() {
        for (let i = 0; i < this.leafSpawnTimers.length; i++) {
            const timer = this.leafSpawnTimers[i];
            if (!timer.hasSpawned && this.leafSpawnStartTime >= timer.delay) {
                this.spawnSingleLeaf();
                timer.hasSpawned = true;
            }
        }
    }

    updateStemDecay(deltaTime) {
        // Decrease stem health over time
        this.stemHealth -= this.stemDecayRate * deltaTime;
        this.stemHealth = Math.max(0, this.stemHealth); // Don't go below 0
        
        // Update stem color based on health
        this.updateStemColor();
    }

    updateStemColor() {
        // Avoid muddy interpolation - use cleaner color path
        if (this.stemHealth >= 1.0) {
            // Perfect health - use original color
            this.stemMaterial.color.set('#5a8a5a');
        } else if (this.stemHealth >= 0.7) {
            // Still healthy - keep original green
            this.stemMaterial.color.set('#5a8a5a');
        } else if (this.stemHealth >= 0.4) {
            // Starting to decay - shift toward yellow-green
            this.stemMaterial.color.set('#7a9a4a');
        } else if (this.stemHealth >= 0.1) {
            // More decay - yellower
            this.stemMaterial.color.set('#9aaa3a');
        } else {
            // Very sick - pale yellow
            this.stemMaterial.color.set('#e4d65d');
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    getStemHealth() {
        return this.stemHealth;
    }

    waterPlant(amount = 0.3) {
        // Restore stem health when watered
        this.stemHealth = Math.min(1.0, this.stemHealth + amount);
        this.updateStemColor();
    }

    updateLeafRemovalAnimations(deltaTime) {
        // Update removal animations
        for (let i = this.leavesBeingRemoved.length - 1; i >= 0; i--) {
            const removal = this.leavesBeingRemoved[i];
            removal.animationTime += deltaTime;
            
            // Calculate fall progress (0 = just started, 1 = hit ground)
            const progress = Math.min(removal.animationTime / removal.animationDuration, 1.0);
            
            // Physics-based falling motion
            const gravity = -9.8; // m/s²
            const time = removal.animationTime;
            
            // Calculate new position
            const newPosition = removal.originalPosition.clone();
            newPosition.x += removal.fallVelocity.x * time;
            newPosition.z += removal.fallVelocity.z * time;
            newPosition.y += 0.5 * gravity * time * time; // Gravity fall
            
            removal.leaf.group.position.copy(newPosition);
            
            // Add spinning rotation as it falls
            const newRotation = removal.originalRotation.clone();
            newRotation.x += removal.rotationVelocity.x * time;
            newRotation.y += removal.rotationVelocity.y * time;
            newRotation.z += removal.rotationVelocity.z * time;
            
            removal.leaf.group.rotation.copy(newRotation);
            
            // Fade out as it falls
            const opacity = 1 - progress * 0.7; // Don't fade completely, just dim
            removal.leaf.material.opacity = opacity;
            removal.leaf.material.transparent = true;
            
            // When animation is complete or leaf falls below ground, remove it
            if (progress >= 1.0 || newPosition.y < -2) {
                // Remove from scene
                this.group.remove(removal.leaf.group);
                
                // Remove from leaves array
                const leafIndex = this.leaves.indexOf(removal.leaf);
                if (leafIndex !== -1) {
                    this.leaves.splice(leafIndex, 1);
                }
                
                // Remove from removal animations array
                this.leavesBeingRemoved.splice(i, 1);
                
                console.log(`Leaf fell to the ground! ${this.leaves.length} leaves remaining.`);
            }
        }
    }

    updatePendingLeafSpawns(deltaTime) {
        // Update pending spawn timers
        for (let i = this.pendingLeafSpawns.length - 1; i >= 0; i--) {
            this.pendingLeafSpawns[i].timeRemaining -= deltaTime;
            
            // Spawn leaf when timer expires
            if (this.pendingLeafSpawns[i].timeRemaining <= 0) {
                this.spawnSingleLeaf();
                this.pendingLeafSpawns.splice(i, 1); // Remove expired timer
                console.log(`New leaf sprouted! ${this.leaves.length} leaves total.`);
            }
        }
    }

    spawnSingleLeaf() {
        const currentStemHeight = this.stemHeight * this.stem.scale.y;
        const leaf = new Leaf(this.stem.position, currentStemHeight);
        this.leaves.push(leaf);
        this.group.add(leaf.group);
    }

    reset() {
        // Remove all existing leaves
        this.leaves.forEach(leaf => {
            this.group.remove(leaf.group);
        });
        this.leaves = [];
        this.leafSpawningStarted = false;
        this.leafSpawnStartTime = 0;
        
        // Reset all spawn timers
        this.leafSpawnTimers.forEach(timer => {
            timer.hasSpawned = false;
        });
        
        // Reset plant to initial state
        this.growthStage = 0;
        this.isGrowing = true;
        this.stem.scale.y = 0.05; // Back to tiny sprout
        
        // Reset stem health
        this.stemHealth = 1.0;
        this.updateStemColor();
        
        // Reset position to initial state
        const currentHeight = this.stemHeight * this.stem.scale.y;
        this.stem.position.y = this.stemBaseY + currentHeight / 2;
    }

    setupClickHandler() {
        // We'll need the camera and canvas to be passed in for raycasting
        this.camera = null;
        this.canvas = null;
        
        // Store bound function for easy removal
        this.boundClickHandler = this.onCanvasClick.bind(this);
    }

    setCamera(camera, canvas) {
        this.camera = camera;
        this.canvas = canvas;
        
        // Add click listener
        if (canvas) {
            canvas.addEventListener('click', this.boundClickHandler);
        }
    }

    onCanvasClick(event) {
        if (!this.camera || !this.canvas) return;

        // Calculate mouse position in normalized device coordinates
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update the raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Get all leaf meshes that are in decay phase
        const decayingLeafMeshes = [];
        this.leaves.forEach((leaf, index) => {
            if (leaf.isDecaying) {
                // Add both the leaf mesh and ball mesh as clickable
                decayingLeafMeshes.push({mesh: leaf.leafMesh, leafIndex: index});
                decayingLeafMeshes.push({mesh: leaf.ballMesh, leafIndex: index});
            }
        });

        // Check for intersections
        const meshes = decayingLeafMeshes.map(item => item.mesh);
        const intersects = this.raycaster.intersectObjects(meshes);

        if (intersects.length > 0) {
            // Find which leaf was clicked
            const clickedMesh = intersects[0].object;
            const leafItem = decayingLeafMeshes.find(item => item.mesh === clickedMesh);
            
            if (leafItem) {
                this.removeLeaf(leafItem.leafIndex);
            }
        }
    }

    removeLeaf(leafIndex) {
        if (leafIndex >= 0 && leafIndex < this.leaves.length) {
            const leaf = this.leaves[leafIndex];
            
            // Start removal animation instead of immediate removal
            this.leavesBeingRemoved.push({
                leaf: leaf,
                leafIndex: leafIndex,
                animationTime: 0,
                animationDuration: 2.0, // 2 seconds for falling animation
                originalPosition: leaf.group.position.clone(),
                originalRotation: leaf.group.rotation.clone(),
                fallVelocity: {x: (Math.random() - 0.5) * 2, y: 0, z: (Math.random() - 0.5) * 2}, // Random horizontal drift
                rotationVelocity: {x: Math.random() * 4, y: Math.random() * 4, z: Math.random() * 4} // Random spinning
            });
            
            // Schedule a new leaf to spawn after animation + delay
            const spawnDelay = 2.0 + 1 + Math.random() * 2; // animation time + extra delay
            this.pendingLeafSpawns.push({
                timeRemaining: spawnDelay
            });
            
            console.log(`Leaf is falling! New leaf will spawn in ${spawnDelay.toFixed(1)}s.`);
        }
    }

    dispose() {
        // Clean up event listener
        if (this.canvas && this.boundClickHandler) {
            this.canvas.removeEventListener('click', this.boundClickHandler);
        }
    }

    addToScene(scene) {
        scene.add(this.group);
    }
}