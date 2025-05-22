// js/armory.js

import * as state from './state.js';
import * as ui from './ui.js';
import * as storage from './storage.js';
import { WEAPONS } from './config.js';
import { applyWeaponStats } from './playerAction.js';
import { checkAndUnlockAchievement } from './gameLogic.js';

/**
 * Initialize event listeners for the Armory screen
 */
export function setupArmoryListeners() {
    const prevBtn = document.getElementById('armory-prev-button');
    const nextBtn = document.getElementById('armory-next-button');
    const unlockBtn = document.getElementById('armory-unlock-button');
    const selectBtn = document.getElementById('armory-select-button');
    const backBtn = document.getElementById('armory-back-button');

    prevBtn?.addEventListener('click', navigatePrevWeapon);
    nextBtn?.addEventListener('click', navigateNextWeapon);
    unlockBtn?.addEventListener('click', handleUnlockWeapon);
    selectBtn?.addEventListener('click', handleSelectWeapon);
    backBtn?.addEventListener('click', ui.showMainMenu);
}

// --- Navigation between weapons ---
function navigatePrevWeapon() {
    const currentIndex = state.getCurrentArmoryIndex();
    if (currentIndex > 0) {
        state.setCurrentArmoryIndex(currentIndex - 1);
        ui.updateArmoryDisplay();
    }
}

function navigateNextWeapon() {
    const currentIndex = state.getCurrentArmoryIndex();
    if (currentIndex < WEAPONS.length - 1) {
        state.setCurrentArmoryIndex(currentIndex + 1);
        ui.updateArmoryDisplay();
    }
}

// --- Handle weapon unlocking ---
async function handleUnlockWeapon(event) {
    const weaponId = event.target.dataset.weaponId;
    if (!weaponId) return;

    const weaponData = WEAPONS.find(w => w.id === weaponId);
    if (!weaponData?.unlocksWith) return;

    const { weaponId: requiredId, winsNeeded } = weaponData.unlocksWith;
    const wins = state.getWinsForWeapon(requiredId);

    if (wins >= winsNeeded) {
        state.addUnlockedWeaponId(weaponId);
        await storage.saveUnlockedWeapons(state.getUnlockedWeaponIds());

        if (weaponId === 'glock17') {
            checkAndUnlockAchievement('unlock_weapon_2');
        } else if (weaponId === 'UMP45') {
            checkAndUnlockAchievement('unlock_weapon_3');
        }

        ui.updateArmoryDisplay();
    }
}

// --- Handle weapon selection ---
function handleSelectWeapon(event) {
    const weaponId = event.target.dataset.weaponId;
    if (!weaponId) return;

    if (state.getUnlockedWeaponIds().includes(weaponId)) {
        const success = state.setSelectedWeaponId(weaponId);
        if (success) {
            storage.saveSelectedWeapon(weaponId);
            applyWeaponStats();
            ui.updateArmoryDisplay();
        }
    }
}
