import * as THREE from 'three';

export class Leaf {
    constructor(stemPosition, stemHeight) {
        this.group = new THREE.Group();
        this.isGrowing = true;
        this.growthStage = 0;
        this.age = 0; // All start fresh green
        this.maxAge = 15 + Math.random() * 20; // How long leaf stays green (15-35 seconds)
        this.decayDuration = 5; // How long the color change takes (5 seconds)
        this.isDecaying = false;
        this.material = null;
        
        this.createLeaf();
        this.positionLeaf(stemPosition, stemHeight);
    }

    createLeaf() {
        // Create stick to visualize direction clearly
        const leafGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.6); // long, thin stick
        this.material = new THREE.MeshPhongMaterial({
            color: '#62a062', // Forest green
            shininess: 10
        });

        this.leafMesh = new THREE.Mesh(leafGeometry, this.material);
        
        // Start tiny and will scale up
        this.leafMesh.scale.set(0.1, 0.1, 0.1);
        
        // Position leaf horizontally extending outward
        this.leafMesh.position.set(0, -0.27, 0.18);
        this.leafMesh.rotation.x = THREE.MathUtils.degToRad(55);
        
        // Create connection ball (darker green)
        const ballGeometry = new THREE.SphereGeometry(0.04, 8, 6); // small sphere
        const ballMaterial = new THREE.MeshPhongMaterial({
            color: '#3e5f3e', // Darker green
            shininess: 15
        });

        this.ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
        
        // Start tiny and will scale up
        this.ballMesh.scale.set(0.1, 0.1, 0.1);
        
        // Ball stays at origin (0,0,0) - this will be the stem connection point
        this.ballMesh.position.set(0, 0, 0);
        
        this.group.add(this.leafMesh);
        this.group.add(this.ballMesh);
    }

    positionLeaf(stemPosition, stemHeight) {
        // Random position around stem
        const angle = Math.random() * Math.PI * 2; // Random angle around stem
        // Calculate height range based on actual visible stem with bottom offset
        const bottomOffset = stemHeight * 0.2; // Keep leaves away from bottom 20%
        const stemBottom = stemPosition.y - stemHeight * 0.5 + bottomOffset; // Bottom of visible stem + offset
        const stemTop = stemPosition.y + stemHeight * 0.5;    // Top of visible stem  
        const height = stemBottom + Math.random() * (stemTop - stemBottom); // Random height along stem
        // Position leaves at stem edge (stem radius is 0.1, leaf thickness is 0.05)
        const stemRadius = 0.1;
        const leafHalfThickness = 0.025; // Half of leaf thickness (0.05/2)
        const distance = stemRadius + leafHalfThickness; // Just outside stem surface

        // Position first at stem edge
        const z = Math.cos(angle) * distance;
        const x = Math.sin(angle) * distance;
        this.group.position.set(x, height, z);
        
        // Then rotate the leaf mesh directly to point outward from stem center
        this.group.rotation.y = angle;
    }

    update(deltaTime) {
        if (this.isGrowing) {
            this.grow(deltaTime);
        }
        
        // Age the leaf
        this.age += deltaTime;
        
        // Check if leaf should start decaying
        if (!this.isDecaying && this.age >= this.maxAge) {
            this.isDecaying = true;
            this.decayStartTime = this.age;
        }
        
        this.updateColor();
    }

    grow(deltaTime) {
        const growthSpeed = 1.5; // Scale per second
        const maxScale = 1.0;
        
        if (this.growthStage < maxScale) {
            this.growthStage += growthSpeed * deltaTime;
            this.growthStage = Math.min(maxScale, this.growthStage);
            
            // Scale both leaf and connection ball as they grow
            const currentScale = 0.1 + (this.growthStage * 0.9);
            this.leafMesh.scale.setScalar(currentScale);
            this.ballMesh.scale.setScalar(currentScale);
        } else {
            this.isGrowing = false;
        }
    }

    updateColor() {
        if (!this.isDecaying) {
            // Stay fresh green during entire maxAge period
            const greenColor = '#286828';
            const green = this.hexToRgb(greenColor);
            this.material.color.setRGB(green.r/255, green.g/255, green.b/255);
            return;
        }
        
        // Calculate decay progress (0 = just started decaying, 1 = fully brown)
        const decayProgress = Math.min((this.age - this.decayStartTime) / this.decayDuration, 1.0);
        
        // Multi-stage color transition during decay: green → yellow → orange → brown
        const greenColor = '#286828';  // Fresh green
        const yellowColor = '#6d9e3f'; // Yellow stage
        const orangeColor = '#dcdf59'; // Orange stage  
        const brownColor = '#31271f';  // Final brown
        
        let finalColor;
        
        if (decayProgress < 0.33) {
            // Green to Yellow (0-33%)
            const progress = decayProgress / 0.33;
            finalColor = this.interpolateColors(greenColor, yellowColor, progress);
        } else if (decayProgress < 0.66) {
            // Yellow to Orange (33-66%)
            const progress = (decayProgress - 0.33) / 0.33;
            finalColor = this.interpolateColors(yellowColor, orangeColor, progress);
        } else {
            // Orange to Brown (66-100%)
            const progress = (decayProgress - 0.66) / 0.34;
            finalColor = this.interpolateColors(orangeColor, brownColor, progress);
        }
        
        this.material.color.setRGB(finalColor.r/255, finalColor.g/255, finalColor.b/255);
    }

    interpolateColors(color1, color2, progress) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        return {
            r: c1.r + (c2.r - c1.r) * progress,
            g: c1.g + (c2.g - c1.g) * progress,
            b: c1.b + (c2.b - c1.b) * progress
        };
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    isBrown() {
        return this.isDecaying && (this.age - this.decayStartTime) >= this.decayDuration;
    }
}