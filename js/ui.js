// ui.js
// Manages UI updates, screen transitions, and translations.

import * as state from './state.js';
import * as storage from './storage.js';
import { translations } from './translations.js';
import { WEAPONS, formatTime, ACHIEVEMENTS } from './config.js';
import { manageMusic, applyCurrentAudioSettings } from './audio.js';

// DOM Elements
export const mainMenuElement = document.getElementById('main-menu');
export const gameWrapper = document.getElementById('game-wrapper');
export const gameContainer = document.getElementById('game-container');
export const gunContainer = document.getElementById('gun-container');
export const armoryScreen = document.getElementById('armory-screen');
export const armoryContent = document.getElementById('armory-content');
export const achievementsScreen = document.getElementById('achievements-screen');
export const achievementsListEl = document.getElementById('achievements-list');
export const howToPlayScreen = document.getElementById('how-to-play-screen');
export const settingsScreen = document.getElementById('settings-screen');
export const gameHighScoreDisplayEl = document.getElementById('game-high-score-display');
export const menuHighScoreDisplayEl = document.getElementById('menu-high-score-display');
export const achievementNotificationEl = document.getElementById('achievement-notification');
export const levelInfoEl = document.getElementById('level-info');
export const scoreEl = document.getElementById('score');
export const timerDisplayEl = document.getElementById('timer-display');
export const ammoDisplayEl = document.getElementById('ammo-display');
export const gameCompleteScreen = document.getElementById('game-complete-screen');
export const finalScoreEl = document.getElementById('final-score');
export const comboDisplayEl = document.getElementById('combo-display');
export const gunImageEl = document.getElementById('gun-image');
export const modeSelectScreen = document.getElementById('mode-select-screen');
const achievementNotificationIconEl = achievementNotificationEl?.querySelector('.ach-icon');
const achievementNotificationNameEl = achievementNotificationEl?.querySelector('.ach-name');
const masterVolumeSlider = document.getElementById('master-volume');
const masterVolumeValueDisplay = document.getElementById('master-volume-value');
const musicVolumeSlider = document.getElementById('music-volume');
const musicVolumeValueDisplay = document.getElementById('music-volume-value');
const sfxVolumeSlider = document.getElementById('sfx-volume');
const sfxVolumeValueDisplay = document.getElementById('sfx-volume-value');
const muteAllButton = document.getElementById('mute-all-button');
const langButtons = document.querySelectorAll('.language-buttons .lang-button');
const gameCompleteTitle = gameCompleteScreen?.querySelector('h2');
const gameCompleteText = gameCompleteScreen?.querySelector('p:nth-of-type(1)');

// Screen Transitions
export function showMainMenu() {
    mainMenuElement.style.display = 'flex';
    gameWrapper.style.display = 'none';
    armoryScreen.style.display = 'none';
    achievementsScreen.style.display = 'none';
    howToPlayScreen.style.display = 'none';
    settingsScreen.style.display = 'none';
    modeSelectScreen.style.display = 'none';
    state.resetLostGamePlayAgainCount();
    hideGameCompleteScreen();
    manageMusic('menu');
    setCursor('default');
    updateMenuHighScore();
}

export function hideMainMenuAndShowGame() {
    mainMenuElement.style.display = 'none';
    gameWrapper.style.display = 'flex';
    armoryScreen.style.display = 'none';
    achievementsScreen.style.display = 'none';
    modeSelectScreen.style.display = 'none';
    hideGameCompleteScreen();
    manageMusic('game');
    setCursor('crosshair');
}

export function showArmoryScreen() {
    mainMenuElement.style.display = 'none';
    gameWrapper.style.display = 'none';
    armoryScreen.style.display = 'flex';
    achievementsScreen.style.display = 'none';
    howToPlayScreen.style.display = 'none';
    settingsScreen.style.display = 'none';
    modeSelectScreen.style.display = 'none';
    hideGameCompleteScreen();
    updateArmoryDisplay();
    manageMusic('menu');
    setCursor('default');
}

export function showAchievementsScreen() {
    mainMenuElement.style.display = 'none';
    gameWrapper.style.display = 'none';
    armoryScreen.style.display = 'none';
    achievementsScreen.style.display = 'flex';
    howToPlayScreen.style.display = 'none';
    settingsScreen.style.display = 'none';
    modeSelectScreen.style.display = 'none';
    hideGameCompleteScreen();
    populateAchievementsList();
    manageMusic('menu');
    setCursor('default');
}

export function showHowToPlayScreen() {
    mainMenuElement.style.display = 'none';
    gameWrapper.style.display = 'none';
    armoryScreen.style.display = 'none';
    achievementsScreen.style.display = 'none';
    howToPlayScreen.style.display = 'flex';
    settingsScreen.style.display = 'none';
    modeSelectScreen.style.display = 'none';
    hideGameCompleteScreen();
    manageMusic('menu');
    setCursor('default');
}

export function showSettingsScreen() {
    mainMenuElement.style.display = 'none';
    gameWrapper.style.display = 'none';
    armoryScreen.style.display = 'none';
    achievementsScreen.style.display = 'none';
    howToPlayScreen.style.display = 'none';
    settingsScreen.style.display = 'flex';
    modeSelectScreen.style.display = 'none';
    hideGameCompleteScreen();
    updateSettingsUI();
    updateAllTextsForLanguage();
    manageMusic('menu');
    setCursor('default');
}

export function showGameCompleteScreen(titleKey, textKey, finalScore, additionalTextParams = {}) {
    mainMenuElement.style.display = 'none';
    gameWrapper.style.display = 'none';
    armoryScreen.style.display = 'none';
    achievementsScreen.style.display = 'none';
    howToPlayScreen.style.display = 'none';
    settingsScreen.style.display = 'none';
    modeSelectScreen.style.display = 'none';
    gameCompleteScreen.style.display = 'flex';
    
    if (gameCompleteTitle) gameCompleteTitle.textContent = getText(titleKey);
    if (gameCompleteText) gameCompleteText.textContent = getText(textKey, additionalTextParams);
    if (finalScoreEl) finalScoreEl.textContent = finalScore;
    
    const playAgainBtn = document.getElementById('play-again-button');
    const exitBtn = document.getElementById('exit-button');
    if (playAgainBtn) playAgainBtn.textContent = getText('game_complete_play_again');
    if (exitBtn) exitBtn.textContent = getText('game_complete_exit');
    
    manageMusic('menu');
    setCursor('default');
}

export function hideGameCompleteScreen() {
    gameCompleteScreen.style.display = 'none';
}

export function showModeSelectScreen() {
    mainMenuElement.style.display = 'none';
    gameWrapper.style.display = 'none';
    armoryScreen.style.display = 'none';
    achievementsScreen.style.display = 'none';
    howToPlayScreen.style.display = 'none';
    settingsScreen.style.display = 'none';
    modeSelectScreen.style.display = 'flex';
    hideGameCompleteScreen();
    manageMusic('menu');
    setCursor('default');
}

export function hideModeSelectScreen() {
    modeSelectScreen.style.display = 'none';
}

// UI Updates
export function updateUI() {
    if (levelInfoEl) levelInfoEl.textContent = getText('level_info_text', { level: state.getLevel() });
    if (scoreEl) scoreEl.textContent = getText('score_text', { score: state.getScore() });
    if (gameHighScoreDisplayEl) gameHighScoreDisplayEl.textContent = getText('high_score_text', { score: state.getHighScore() });
}

export function updateMenuHighScore() {
    if (menuHighScoreDisplayEl) {
        menuHighScoreDisplayEl.textContent = getText('high_score_text', { score: state.getHighScore() });
    }
}

export function updateAmmoDisplay() {
    if (!ammoDisplayEl) return;
    const ammoIconEls = ammoDisplayEl.querySelectorAll('.ammo-icon');
    if (ammoIconEls.length === 0) return;

    const currentAmmo = state.getAmmoCount();
    ammoIconEls.forEach((icon, index) => {
        icon.classList.toggle('used', index >= currentAmmo);
    });
}

export function updateTimerDisplay() {
    if (timerDisplayEl) {
        timerDisplayEl.textContent = getText('timer_display_text', { time: formatTime(state.getTimeLeft()) });
    }
}

export function updateComboDisplay() {
    if (!comboDisplayEl) return;
    const multiplier = state.getComboMultiplier();
    comboDisplayEl.style.display = multiplier > 1 ? 'block' : 'none';
    if (multiplier > 1) {
        comboDisplayEl.textContent = `x${multiplier}`;
    }
}

export function updateGunImage(imageSrc) {
    if (gunImageEl) {
        gunImageEl.src = imageSrc;
    } else {
        console.error('Gun image element not found.');
    }
}

export function setCursor(cursorType) {
    if (gameContainer) gameContainer.style.cursor = cursorType;
}

export function updateGameInfo(text, color = 'white') {
    const gameInfo = document.getElementById('game-info');
    if (gameInfo) {
        gameInfo.textContent = text;
        gameInfo.style.color = color;
    }
}

export function setGunRotation(angle) {
    if (gunContainer) gunContainer.style.transform = `rotate(${angle}deg)`;
}

export function updateArmoryDisplay() {
    if (!armoryScreen || armoryScreen.style.display === 'none') return;

    const currentWeaponIndex = state.getCurrentArmoryIndex();
    const selectedWeaponId = state.getSelectedWeaponId();
    const unlockedIds = state.getUnlockedWeaponIds();
    const weaponData = WEAPONS[currentWeaponIndex];

    if (!weaponData) {
        console.error('Invalid weapon index:', currentWeaponIndex);
        return;
    }

    const armoryTitleEl = armoryContent.querySelector('h2');
    const imgEl = document.getElementById('armory-weapon-image');
    const nameEl = document.getElementById('armory-weapon-name');
    const statsEl = document.getElementById('armory-weapon-stats');
    const descEl = document.getElementById('armory-weapon-desc');
    const lockIconEl = document.getElementById('armory-lock-icon');
    const unlockBtnEl = document.getElementById('armory-unlock-button');
    const selectBtnEl = document.getElementById('armory-select-button');
    const backBtnEl = document.getElementById('armory-back-button');
    const progressInfoEl = document.getElementById('armory-progress-info');

    if (!imgEl || !nameEl || !statsEl || !descEl || !lockIconEl || !unlockBtnEl || !selectBtnEl || !progressInfoEl || !armoryTitleEl || !backBtnEl) {
        console.error('Armory UI elements missing.');
        return;
    }

    armoryTitleEl.textContent = getText('armory_title');
    backBtnEl.textContent = getText('armory_back_button_text');
    nameEl.textContent = getText(`weapon_${weaponData.id}_name`, {}, weaponData.name);
    descEl.textContent = getText(`weapon_${weaponData.id}_desc`, {}, weaponData.description);
    statsEl.textContent = getText('armory_stats_label', { speed: weaponData.rotationSpeed, ammo: weaponData.maxAmmo });
    imgEl.src = weaponData.imageSrc;
    imgEl.alt = nameEl.textContent;

    let isUnlocked = unlockedIds.includes(weaponData.id);
    let canUnlockThisWeapon = false;
    let progressText = '';

    if (weaponData.id === 'awm') {
        if (isUnlocked) {
            progressText = getText('armory_awm_unlocked_text');
        } else {
            const allMasterableAchievements = ACHIEVEMENTS.filter(ach => ach.id !== 'achievement_master' && !ach.isHidden);
            const unlockedMasterableCount = state.getUnlockedAchievementIds().filter(id => allMasterableAchievements.some(ach => ach.id === id)).length;
            const totalMasterable = allMasterableAchievements.length;
            const remainingAchievements = totalMasterable - unlockedMasterableCount;

            if (totalMasterable === 0) {
                progressText = getText('armory_awm_no_req_text');
            } else if (remainingAchievements === 1) {
                progressText = getText('armory_awm_remaining_one', { unlocked: unlockedMasterableCount, total: totalMasterable });
            } else if (remainingAchievements > 1) {
                progressText = getText('armory_awm_remaining_many', { remaining: remainingAchievements, unlocked: unlockedMasterableCount, total: totalMasterable });
            } else {
                progressText = getText('armory_awm_locked_text', { unlocked: unlockedMasterableCount, total: totalMasterable });
            }
        }
    } else if (isUnlocked) {
        progressText = getText('armory_wins_with_weapon', { wins: state.getWinsForWeapon(weaponData.id) });
    } else {
        if (weaponData.unlocksWith) {
            const requiredWeaponId = weaponData.unlocksWith.weaponId;
            const winsNeeded = weaponData.unlocksWith.winsNeeded;
            const winsWithRequiredWeapon = state.getWinsForWeapon(requiredWeaponId);
            const requiredWeaponData = WEAPONS.find(w => w.id === requiredWeaponId);
            const requiredWeaponName = requiredWeaponData ? getText(`weapon_${requiredWeaponData.id}_name`, {}, requiredWeaponData.name) : requiredWeaponId;

            progressText = getText('armory_unlock_requirement', {
                needed: winsNeeded,
                weapon: requiredWeaponName,
                current: winsWithRequiredWeapon
            });
            canUnlockThisWeapon = winsWithRequiredWeapon >= winsNeeded;
        } else {
            progressText = getText('armory_default_available');
        }
    }

    progressInfoEl.textContent = progressText;
    imgEl.classList.toggle('locked', !isUnlocked);
    lockIconEl.style.display = isUnlocked ? 'none' : 'inline';
    unlockBtnEl.style.display = canUnlockThisWeapon ? 'block' : 'none';
    if (canUnlockThisWeapon) {
        unlockBtnEl.dataset.weaponId = weaponData.id;
        unlockBtnEl.textContent = getText('armory_unlock_button_text');
    }

    selectBtnEl.style.display = isUnlocked ? 'block' : 'none';
    if (isUnlocked) {
        const isSelected = weaponData.id === selectedWeaponId;
        selectBtnEl.disabled = isSelected;
        selectBtnEl.textContent = isSelected ? getText('armory_selected_button_text') : getText('armory_select_button_text');
        selectBtnEl.dataset.weaponId = weaponData.id;
    }

    const prevBtn = document.getElementById('armory-prev-button');
    const nextBtn = document.getElementById('armory-next-button');
    if (prevBtn) prevBtn.disabled = currentWeaponIndex === 0;
    if (nextBtn) nextBtn.disabled = currentWeaponIndex === WEAPONS.length - 1;
}

export function populateAchievementsList() {
    if (!achievementsListEl) {
        console.error('Achievements list element not found.');
        return;
    }

    achievementsListEl.innerHTML = '';
    const unlockedAchievementIds = state.getUnlockedAchievementIds();
    const currentPerfectWins = state.getPerfectGameStreakCount();

    ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = unlockedAchievementIds.includes(ach.id);
        const card = document.createElement('div');
        card.className = `achievement-card ${isUnlocked ? 'unlocked' : ''}`;

        const iconSpan = document.createElement('span');
        iconSpan.className = 'achievement-icon';
        iconSpan.textContent = ach.icon;

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'achievement-details';

        const nameP = document.createElement('p');
        nameP.className = 'achievement-name';
        nameP.textContent = getText(`ach_${ach.id}_name`, {}, ach.name);

        const descP = document.createElement('p');
        descP.className = 'achievement-description';
        descP.textContent = getText(`ach_${ach.id}_desc`, {}, ach.description);

        detailsDiv.appendChild(nameP);
        detailsDiv.appendChild(descP);

        if (ach.id === 'ten_perfect_games') {
            const progressP = document.createElement('p');
            progressP.className = 'achievement-progress-text';
            const winsToShow = isUnlocked ? 10 : currentPerfectWins;
            progressP.textContent = `Perfect Wins: ${winsToShow} / 10`;
            detailsDiv.appendChild(progressP);
        }

        card.appendChild(iconSpan);
        card.appendChild(detailsDiv);
        achievementsListEl.appendChild(card);
    });
}

export function setupSettingsListeners() {
    if (!masterVolumeSlider) {
        console.warn('Settings UI elements not found.');
        return;
    }

    const saveAudioSettings = async () => await storage.saveAudioSettings({
        masterVolume: state.getMasterVolume(),
        musicVolume: state.getMusicVolume(),
        sfxVolume: state.getSfxVolume(),
        isMuted: state.getIsMuted()
    });

    masterVolumeSlider.addEventListener('input', (event) => {
        const newVolume = event.target.value;
        state.setMasterVolume(newVolume);
        masterVolumeValueDisplay.textContent = `${Math.round(newVolume * 100)}%`;
        applyCurrentAudioSettings();
    });
    masterVolumeSlider.addEventListener('change', saveAudioSettings);

    musicVolumeSlider.addEventListener('input', (event) => {
        const newVolume = event.target.value;
        state.setMusicVolume(newVolume);
        musicVolumeValueDisplay.textContent = `${Math.round(newVolume * 100)}%`;
        applyCurrentAudioSettings();
    });
    musicVolumeSlider.addEventListener('change', saveAudioSettings);

    sfxVolumeSlider.addEventListener('input', (event) => {
        const newVolume = event.target.value;
        state.setSfxVolume(newVolume);
        sfxVolumeValueDisplay.textContent = `${Math.round(newVolume * 100)}%`;
        applyCurrentAudioSettings();
    });
    sfxVolumeSlider.addEventListener('change', saveAudioSettings);

    muteAllButton.addEventListener('click', () => {
        const newMuteState = !state.getIsMuted();
        state.setIsMuted(newMuteState);
        muteAllButton.textContent = getText(newMuteState ? 'settings_unmute_button' : 'settings_mute_button');
        applyCurrentAudioSettings();
        saveAudioSettings();
    });

    langButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const selectedLang = event.target.dataset.lang;
            if (selectedLang && selectedLang !== state.getCurrentLanguage()) {
                state.setCurrentLanguage(selectedLang);
                await storage.saveLanguage(selectedLang);
                updateAllTextsForLanguage();
            }
        });
    });
}

const achievementQueue = [];
let isNotificationShowing = false;
let currentAchievementTimeoutId = null;

export function showAchievementNotification(name, icon = '🏆', duration = 3000) {
    if (!achievementNotificationEl || !achievementNotificationNameEl || !achievementNotificationIconEl) {
        console.error('Achievement notification UI elements not found.');
        return;
    }

    achievementQueue.push({ name, icon, duration });
    if (!isNotificationShowing) {
        processAchievementQueue();
    }
}

function processAchievementQueue() {
    if (achievementQueue.length === 0 || isNotificationShowing) return;

    isNotificationShowing = true;
    const { name, icon, duration } = achievementQueue.shift();

    if (currentAchievementTimeoutId) {
        clearTimeout(currentAchievementTimeoutId);
    }

    achievementNotificationEl.classList.remove('show');
    achievementNotificationIconEl.textContent = icon;
    achievementNotificationNameEl.textContent = name;
    achievementNotificationEl.style.display = 'flex';

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            achievementNotificationEl.classList.add('show');
        });
    });

    currentAchievementTimeoutId = setTimeout(() => {
        achievementNotificationEl.classList.remove('show');
        setTimeout(() => {
            if (achievementNotificationEl.style.display === 'flex' && !achievementNotificationEl.classList.contains('show')) {
                achievementNotificationEl.style.display = 'none';
            }
            isNotificationShowing = false;
            currentAchievementTimeoutId = null;
            processAchievementQueue();
        }, 500);
    }, duration);
}

function updateSettingsUI() {
    if (!masterVolumeSlider) return;

    masterVolumeSlider.value = state.getMasterVolume();
    masterVolumeValueDisplay.textContent = `${Math.round(state.getMasterVolume() * 100)}%`;

    musicVolumeSlider.value = state.getMusicVolume();
    musicVolumeValueDisplay.textContent = `${Math.round(state.getMusicVolume() * 100)}%`;

    sfxVolumeSlider.value = state.getSfxVolume();
    sfxVolumeValueDisplay.textContent = `${Math.round(state.getSfxVolume() * 100)}%`;

    muteAllButton.textContent = getText(state.getIsMuted() ? 'settings_unmute_button' : 'settings_mute_button');
}

function getText(key, replacements = {}) {
    const currentLang = state.getCurrentLanguage();
    let text = translations[currentLang]?.[key] || translations.en?.[key] || key;

    for (const placeholder in replacements) {
        if (Object.prototype.hasOwnProperty.call(replacements, placeholder)) {
            text = text.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), replacements[placeholder]);
        }
    }
    return text;
}

export function updateAllTextsForLanguage() {
    const currentLang = state.getCurrentLanguage();

    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.dataset.translate;
        const translatedText = getText(key);
        if (key.startsWith('htp_line')) {
            element.innerHTML = translatedText;
        } else {
            element.textContent = translatedText;
        }
    });

    document.title = getText('app_title');
    updateMenuHighScore();
    updateUI();
    updateTimerDisplay();
    if (muteAllButton) {
        muteAllButton.textContent = getText(state.getIsMuted() ? 'settings_unmute_button' : 'settings_mute_button');
    }

    langButtons.forEach(button => {
        button.classList.toggle('active-lang', button.dataset.lang === currentLang);
    });

    if (achievementsScreen?.style.display === 'flex') {
        populateAchievementsList();
    }
    if (armoryScreen?.style.display === 'flex') {
        updateArmoryDisplay();
    }
}