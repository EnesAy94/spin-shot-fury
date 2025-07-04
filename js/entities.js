// entities.js
// Manages game entities (bottles, bullets, particles) including creation, movement, and collision detection.

import * as state from './state.js';
import * as main from './main.js';
import * as config from './config.js';
import * as ui from './ui.js';
import * as gameLogic from './gameLogic.js';
import { playSound } from './audio.js';
import { resetCombo, checkLevelComplete, gameOver, checkAndUnlockAchievement } from './gameLogic.js';

// Clears all bottles and bullets from the DOM and state.
export function clearEntities() {
    state.getBottles().forEach(bottle => bottle.element?.remove());
    ui.gameContainer?.querySelectorAll('.bullet').forEach(bullet => bullet.remove());
    state.clearBottles();
}

// Creates bottles for the current level based on the game mode.
export function createBottles() {
    if (!ui.gameContainer) {
        console.error('Game container not found.');
        return;
    }

    clearEntities();
    const currentLevel = state.getLevel();
    const levelIndex = currentLevel - 1;
    const gameMode = state.getCurrentGameMode();
    const angles = config.levelAngles[levelIndex];

    if (!angles || levelIndex < 0 || levelIndex >= config.levelAngles.length) {
        console.error(`Level ${currentLevel} angle configuration not found.`);
        ui.updateGameInfo(`Level: ${currentLevel} (No Layout!)`, 'red');
        return;
    }

    // Calculate responsive container dimensions and bottle placement.
    const { width: containerWidth, height: containerHeight } = ui.gameContainer.getBoundingClientRect();
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    const placementRadius = Math.min(containerWidth, containerHeight) * 0.40;
    const bottleWidth = Math.max(20, Math.min(40, containerWidth * 0.05));
    const bottleHeight = bottleWidth * 2.2;

    // Create bottles based on angles and game mode.
    const redIndices = getRedBottleIndices(gameMode, levelIndex, angles.length);
    const newBottles = angles.map((angleDeg, index) => {
        const angleRad = config.degreesToRadians(angleDeg);
        const bottleCenterX = centerX + Math.cos(angleRad) * placementRadius;
        const bottleCenterY = centerY + Math.sin(angleRad) * placementRadius;
        const left = bottleCenterX - bottleWidth / 2;
        const top = bottleCenterY - bottleHeight / 2;
        const bottleType = redIndices.includes(index) ? 'red' : 'green';

        const bottleEl = document.createElement('div');
        bottleEl.className = `bottle ${bottleType === 'red' ? 'red' : ''}`;
        bottleEl.style.width = `${bottleWidth}px`;
        bottleEl.style.height = `${bottleHeight}px`;
        bottleEl.style.left = `${left}px`;
        bottleEl.style.top = `${top}px`;
        ui.gameContainer.appendChild(bottleEl);

        return {
            element: bottleEl,
            left,
            top,
            right: left + bottleWidth,
            bottom: top + bottleHeight,
            width: bottleWidth,
            height: bottleHeight,
            hit: false,
            type: bottleType,
        };
    });

    state.setBottles(newBottles);
}

// Handles window resize by recreating bottles if any exist.
export function handleResize() {
    if (state.getBottles().length > 0) {
        createBottles();
    }
}

// Initializes bottles on load and sets up resize event listener.
window.addEventListener('load', () => {
    createBottles();
    window.addEventListener('resize', handleResize);
});

// Determines red bottle indices based on game mode.
function getRedBottleIndices(gameMode, levelIndex, totalPositions) {
    let redIndices = [];

    if (gameMode === 'normal') {
        const placement = config.redBottlePlacements.find(p => p.levelIndex === levelIndex);
        redIndices = placement?.redIndices || [];
    } else if (gameMode === 'random') {
        const redCount = Math.min(config.redBottleCountsForRandomMode[levelIndex] || 0, totalPositions);
        const indices = Array.from({ length: totalPositions }, (_, i) => i);
        for (let i = 0; i < redCount && indices.length; i++) {
            const randomIndex = Math.floor(Math.random() * indices.length);
            redIndices.push(indices.splice(randomIndex, 1)[0]);
        }
    }

    return redIndices;
}

// Creates and animates a bullet based on the firing angle.
export function createBullet(fireAngle) {
    if (!ui.gameContainer) return;

    const { width: containerWidth, height: containerHeight } = ui.gameContainer.getBoundingClientRect();
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    const bulletWidth = Math.max(5, Math.min(8, containerWidth * 0.015));
    const bulletHeight = bulletWidth;

    // Create bullet element.
    const bullet = document.createElement('div');
    bullet.className = 'bullet';
    bullet.style.width = `${bulletWidth}px`;
    bullet.style.height = `${bulletHeight}px`;

    let x = centerX;
    let y = centerY;
    bullet.style.left = `${x - bulletWidth / 2}px`;
    bullet.style.top = `${y - bulletHeight / 2}px`;

    const angleRad = config.degreesToRadians(fireAngle - 90);
    const velocityX = Math.cos(angleRad) * config.bulletSpeed;
    const velocityY = Math.sin(angleRad) * config.bulletSpeed;
    ui.gameContainer.appendChild(bullet);

    // Animate bullet movement.
    function animate() {
        if (state.isGameOver() || state.isGameWon()) {
            bullet.remove();
            return;
        }

        x += velocityX;
        y += velocityY;
        bullet.style.left = `${x - bulletWidth / 2}px`;
        bullet.style.top = `${y - bulletHeight / 2}px`;

        const isOutOfBounds = x < -bulletWidth || x > containerWidth + bulletWidth ||
                              y < -bulletHeight || y > containerHeight + bulletHeight;
        const hit = checkBulletCollision(x, y);

        if (hit || isOutOfBounds) {
            bullet.remove();
            if (!hit) {
                resetCombo();
                state.setHasMissedShotInSession(true);
            }

            // Handle ammo depletion and ad-based ammo reward.
            if (state.getAmmoCount() <= 0 && !state.isGameOver() && !state.isGameWon()) {
                const greenBottlesLeft = state.getBottles().some(b => b.type === 'green' && !b.hit);
                if (greenBottlesLeft) {
                    if (!state.hasUsedAmmoRewardThisGame()) {
                        gameLogic.pauseGameForAd();
                        ui.showConfirmationModal(
                            'confirm_ammo_reward_title',
                            'confirm_ammo_reward_message',
                            () => {
                                main.showRewardedVideoAd(
                                    () => {
                                        state.setAmmo(state.getAmmoCount() + 3);
                                        state.setUsedAmmoRewardThisGame(true);
                                        ui.updateAmmoDisplay();
                                        gameLogic.resumeGameAfterAd(true);
                                    },
                                    wasShown => {
                                        const rewarded = state.hasUsedAmmoRewardThisGame();
                                        if (!rewarded && state.getAmmoCount() <= 0 && state.getBottles().some(b => b.type === 'green' && !b.hit)) {
                                            gameOver('no_ammo');
                                        } else if (rewarded || state.getAmmoCount() > 0) {
                                            gameLogic.resumeGameAfterAd(rewarded);
                                        }
                                    },
                                    error => {
                                        console.error("Ammo reward ad error:", error);
                                        if (state.getAmmoCount() <= 0 && state.getBottles().some(b => b.type === 'green' && !b.hit)) {
                                            gameOver('no_ammo');
                                        } else {
                                            gameLogic.resumeGameAfterAd(false);
                                        }
                                    }
                                );
                            },
                            () => gameOver('no_ammo')
                        );
                    } else {
                        setTimeout(() => {
                            if (!state.isGameOver() && !state.isGameWon()) {
                                gameOver('no_ammo');
                            }
                        }, 10);
                    }
                }
            }
            return;
        }

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

// Creates particle effects at the bottle's center upon hit.
function createAndAddParticles(bottleElement, numParticles = 5) {
    if (!bottleElement || !ui.gameContainer) return;

    const { left, top, width, height } = getComputedStyle(bottleElement);
    const startX = parseFloat(left) + parseFloat(width) / 2;
    const startY = parseFloat(top) + parseFloat(height) / 2;

    if (isNaN(startX) || isNaN(startY)) {
        console.error('Invalid bottle dimensions for particles.');
        return;
    }

    const animations = ['particle-explode-1', 'particle-explode-2', 'particle-explode-3', 'particle-explode-4', 'particle-explode-5'];
    const baseDuration = 700;
    const particleSize = 8;

    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.width = `${particleSize}px`;
        particle.style.height = `${particleSize}px`;
        particle.style.left = `${startX - particleSize / 2}px`;
        particle.style.top = `${startY - particleSize / 2}px`;

        const animName = animations[i % animations.length];
        const duration = baseDuration * (0.8 + Math.random() * 0.4);
        const delay = Math.random() * 100;

        particle.style.animation = `${animName} ${duration / 1000}s ${delay / 1000}s cubic-bezier(0.25, 0.1, 0.25, 1) forwards`;
        ui.gameContainer.appendChild(particle);
        setTimeout(() => particle.remove(), duration + delay + 100);
    }
}

// Checks for collisions between a bullet and bottles.
function checkBulletCollision(bulletX, bulletY) {
    const bulletLeft = bulletX - config.bottleWidth / 2;
    const bulletRight = bulletX + config.bottleWidth / 2;
    const bulletTop = bulletY - config.bottleHeight / 2;
    const bulletBottom = bulletY + config.bottleHeight / 2;
    const padding = 5;

    for (const bottle of state.getBottles()) {
        if (bottle.hit) continue;

        const hitboxLeft = bottle.left + padding;
        const hitboxRight = bottle.right - padding;
        const hitboxTop = bottle.top + padding;
        const hitboxBottom = bottle.bottom - padding;

        if (
            bulletLeft < hitboxRight &&
            bulletRight > hitboxLeft &&
            bulletTop < hitboxBottom &&
            bulletBottom > hitboxTop
        ) {
            bottle.hit = true;
            bottle.element.classList.add('hit');
            playSound('break');
            createAndAddParticles(bottle.element, 5);

            if (bottle.type === 'red') {
                checkAndUnlockAchievement('first_red_bottle');
                resetCombo();
                if (!state.hasUsedRedBottleRewardThisGame()) {
                    gameLogic.pauseGameForAd();
                    ui.showConfirmationModal(
                        'confirm_red_bottle_title',
                        'confirm_red_bottle_message',
                        () => {
                            main.showRewardedVideoAd(
                                () => {
                                    state.setUsedRedBottleRewardThisGame(true);
                                    gameLogic.resumeGameAfterAd(true);
                                },
                                wasShown => {
                                    if (!state.hasUsedRedBottleRewardThisGame()) {
                                        gameOver('red_bottle');
                                    } else {
                                        gameLogic.resumeGameAfterAd(true);
                                    }
                                },
                                error => {
                                    console.error("Red bottle ad error:", error);
                                    gameLogic.resumeGameAfterAd(false);
                                    gameOver('red_bottle');
                                }
                            );
                        },
                        () => gameOver('red_bottle')
                    );
                } else {
                    gameOver('red_bottle');
                }
            } else {
                state.increaseCombo();
                const multiplier = Math.min(Math.floor(state.getCurrentCombo() / 2) + 1, 5);
                state.setComboMultiplier(multiplier);
                if (multiplier >= 5) {
                    checkAndUnlockAchievement('combo_master_x5');
                }
                const points = config.getBasePointsForLevel(state.getLevel()) * multiplier;
                state.increaseScore(points);
                ui.updateComboDisplay();
                ui.updateUI();
                checkLevelComplete();
            }
            return true;
        }
    }
    return false;
}