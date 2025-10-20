export class UIManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.waterBar = document.getElementById('growthBar'); // Renamed from growthBar
        this.resetButton = document.getElementById('resetButton');
        this.currentWaterLevel = 100; // Start at 100% water
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.resetButton.addEventListener('click', () => {
            this.gameManager.resetPlantGrowth();
        });

        // Add click listener to water bar for watering
        this.waterBar.parentElement.addEventListener('click', () => {
            this.gameManager.waterPlant();
        });
    }

    updateWaterLevel(stemHealth) {
        // stemHealth is 0-1, convert to percentage
        const percentage = Math.round(stemHealth * 100);
        
        // Only update if there's a change (avoid unnecessary DOM updates)
        if (this.currentWaterLevel !== percentage) {
            this.currentWaterLevel = percentage;
            this.waterBar.style.width = `${percentage}%`;
        }
    }

    // Future methods for other UI elements can go here
    // updateLeafCount(count) { ... }
    // showMessage(text) { ... }
}