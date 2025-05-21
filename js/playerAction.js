// playerAction.js
// Manages player actions, including weapon stats, gun rotation, spinning, and firing.

import * as state from './state.js';
import * as ui from './ui.js';
import { playSound, ensureAudioContext } from './audio.js';
import { createBullet } from './entities.js';
import { spinDuration, WEAPONS } from './config.js';

// Applies stats for the selected weapon to state and UI.
export function applyWeaponStats() {
    const selectedId = state.getSelectedWeaponId();
    const weapon = WEAPONS.find(w => w.id === selectedId) || WEAPONS[0];

    if (!WEAPONS.find(w => w.id === selectedId)) {
        console.error(`Weapon "${selectedId}" not found. Using default.`);
        state.setSelectedWeaponId(WEAPONS[0].id);
    }

    state.setRotationSpeed(weapon.rotationSpeed);
    state.setAmmo(weapon.maxAmmo);
    ui.updateAmmoDisplay();
    ui.updateGunImage(weapon.imageSrc);

    if (ui.ammoDisplayEl) {
        ui.ammoDisplayEl.innerHTML = '';
        for (let i = 0; i < weapon.maxAmmo; i++) {
            const icon = document.createElement('img');
            icon.src = 'images/bullet_icon.png';
            icon.classList.add('ammo-icon');
            ui.ammoDisplayEl.appendChild(icon);
        }
        ui.updateAmmoDisplay();
    }
}

// Rotates the gun based on rotation speed.
export function rotateGun() {
    if (!state.isRotating() || state.isSpinning() || state.isGameOver() || state.isGameWon()) {
        state.setAnimationFrameId(requestAnimationFrame(rotateGun));
        return;
    }

    const newRotation = (state.getCurrentRotation() + state.getRotationSpeed()) % 360;
    state.setCurrentRotation(newRotation);
    ui.setGunRotation(newRotation);
    state.setAnimationFrameId(requestAnimationFrame(rotateGun));
}

// Performs a 360-degree spin animation for the gun.
export function performSpin() {
    if (state.isSpinning() || state.isGameOver() || state.isGameWon()) return;

    state.setSpinning(true);
    state.setRotating(false);
    const startAngle = state.getCurrentRotation();
    let startTime = performance.now();

    function animateSpin(currentTime) {
        if (state.isGameOver() || state.isGameWon()) {
            state.setSpinning(false);
            state.cancelSpinAnimationFrame();
            return;
        }

        const elapsedTime = currentTime - startTime;
        const spinProgress = Math.min((elapsedTime / spinDuration) * 360, 360);
        ui.setGunRotation(startAngle + spinProgress);

        if (spinProgress < 360) {
            state.setSpinAnimationFrameId(requestAnimationFrame(animateSpin));
        } else {
            state.setCurrentRotation((startAngle + 360) % 360);
            ui.setGunRotation(state.getCurrentRotation());
            state.setSpinning(false);
            state.setRotating(!(state.isGameOver() || state.isGameWon()));
            state.cancelSpinAnimationFrame();
        }
    }

    state.cancelSpinAnimationFrame();
    state.setSpinAnimationFrameId(requestAnimationFrame(animateSpin));
}

// Fires a bullet, triggers spin, and manages cooldown.
export function fire() {
    ensureAudioContext();

    if (state.getAmmoCount() <= 0 || !state.canFire() || state.isGameOver() || state.isSpinning() || state.isGameWon()) {
        return;
    }

    const fireAngle = state.getCurrentRotation();
    playSound('gunshot');
    createBullet(fireAngle);
    performSpin();

    state.decreaseAmmo();
    state.setCanFire(false);
    ui.updateAmmoDisplay();

    state.clearShotTimeout();
    state.setShotTimeout(setTimeout(() => {
        state.setCanFire(true);
    }, 500));
}