// ui.js
// Manages UI updates, screen transitions, and translations.

import * as state from './state.js';
import * as armory from './armory.js';
import * as main from './main.js';
import * as storage from './storage.js';
import * as gameLogic from './gameLogic.js';
import { translations } from './translations.js';
import { WEAPONS, formatTime, ACHIEVEMENTS } from './config.js';
import { manageMusicWAA, applyCurrentAudioSettingsWAA } from './audio.js';

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
export const leaderboardScreen = document.getElementById('leaderboard-screen');
export const confirmationModalEl = document.getElementById('confirmation-modal');
const confirmationTitleEl = document.getElementById('confirmation-title');
const confirmationMessageEl = document.getElementById('confirmation-message');
const confirmYesButton = document.getElementById('confirm-yes-button');
const confirmNoButton = document.getElementById('confirm-no-button');
const leaderboardContent = document.getElementById('leaderboard-content');
const leaderboardLoadingEl = document.getElementById('leaderboard-loading');
const leaderboardErrorEl = document.getElementById('leaderboard-error');
const leaderboardEntriesEl = document.getElementById('leaderboard-entries');
const leaderboardPlayerRankEl = document.getElementById('leaderboard-player-rank');
const playerRankValueEl = document.getElementById('player-rank-value');
const playerScoreValueEl = document.getElementById('player-score-value');
const achievementNotificationIconEl = achievementNotificationEl?.querySelector('.ach-icon');
const achievementNotificationNameEl = achievementNotificationEl?.querySelector('.ach-name');
const masterVolumeSlider = document.getElementById('master-volume');
const masterVolumeValueDisplay = document.getElementById('master-volume-value');
const musicVolumeSlider = document.getElementById('music-volume');
const musicVolumeValueDisplay = document.getElementById('music-volume-value');
const sfxVolumeSlider = document.getElementById('sfx-volume');
const sfxVolumeValueDisplay = document.getElementById('sfx-volume-value');
const muteAllButton = document.getElementById('mute-all-button');
const gameCompleteTitle = gameCompleteScreen?.querySelector('h2');
const gameCompleteText = gameCompleteScreen?.querySelector('p:nth-of-type(1)');
const leaderboardLocalHighScoreEl = document.getElementById('leaderboard-local-high-score');
const localHighScoreValueEl = document.getElementById('local-high-score-value');

let currentConfirmCallback = null;
let currentCancelCallback = null;

// Screen Transitions
export function showConfirmationModal(titleKey, messageKey, onConfirm, onCancel, messageParams) {
    if (!confirmationModalEl || !confirmationTitleEl || !confirmationMessageEl || !confirmYesButton || !confirmNoButton) {
        return;
    }

    confirmationTitleEl.textContent = getText(titleKey);
    confirmationMessageEl.textContent = getText(messageKey, messageParams);
    confirmYesButton.textContent = getText('confirm_button_yes');
    confirmNoButton.textContent = getText('confirm_button_no');

    currentConfirmCallback = onConfirm;
    currentCancelCallback = onCancel;

    confirmationModalEl.style.display = 'flex';

    confirmYesButton.onclick = () => {
        hideConfirmationModal();
        if (currentConfirmCallback) currentConfirmCallback();
    };

    confirmNoButton.onclick = () => {
        hideConfirmationModal();
        if (currentCancelCallback) currentCancelCallback();
    };
}

export function hideConfirmationModal() {
    if (confirmationModalEl) confirmationModalEl.style.display = 'none';
    gameLogic.startTimer();
}

export function showLeaderboardScreen() {
    mainMenuElement.style.display = 'none';
    gameWrapper.style.display = 'none';
    armoryScreen.style.display = 'none';
    achievementsScreen.style.display = 'none';
    howToPlayScreen.style.display = 'none';
    settingsScreen.style.display = 'none';
    modeSelectScreen.style.display = 'none';
    hideGameCompleteScreen();
    if (leaderboardScreen) leaderboardScreen.style.display = 'flex';
    manageMusicWAA('menu');
    setCursor('default');
    loadAndDisplayLeaderboard();
    updateLeaderboardLocalHighScore();
}

export function showMainMenu() {
    mainMenuElement.style.display = 'flex';
    gameWrapper.style.display = 'none';
    armoryScreen.style.display = 'none';
    achievementsScreen.style.display = 'none';
    howToPlayScreen.style.display = 'none';
    settingsScreen.style.display = 'none';
    modeSelectScreen.style.display = 'none';
    leaderboardScreen.style.display = 'none';
    state.resetLostGamePlayAgainCount();
    hideGameCompleteScreen();
    manageMusicWAA('menu');
    setCursor('default');
}

export function hideMainMenuAndShowGame() {
    mainMenuElement.style.display = 'none';
    gameWrapper.style.display = 'flex';
    armoryScreen.style.display = 'none';
    achievementsScreen.style.display = 'none';
    modeSelectScreen.style.display = 'none';
    hideGameCompleteScreen();
    manageMusicWAA('game');
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
    manageMusicWAA('menu');
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
    manageMusicWAA('menu');
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
    manageMusicWAA('menu');
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
    updateAdsButtonVisibility();
    updateAllTextsForLanguage();
    manageMusicWAA('menu');
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

    manageMusicWAA('menu');
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
    manageMusicWAA('menu');
    setCursor('default');
}

export function hideModeSelectScreen() {
    modeSelectScreen.style.display = 'none';
}

// UI Updates
async function loadAndDisplayLeaderboard() {
    if (!leaderboardEntriesEl || !leaderboardLoadingEl || !leaderboardErrorEl || !leaderboardPlayerRankEl) {
        console.warn("Leaderboard UI elements not found.");
        return;
    }

    leaderboardLoadingEl.style.display = 'block';
    leaderboardErrorEl.style.display = 'none';
    leaderboardEntriesEl.innerHTML = '';
    leaderboardPlayerRankEl.style.display = 'none';

    const ysdk = storage.getYSDKInstance();
    console.log("YSK Instance in loadAndDisplayLeaderboard:", ysdk);

    if (!ysdk || !ysdk.leaderboards) {
        console.error("Yandex SDK or leaderboards module not available.");
        leaderboardLoadingEl.style.display = 'none';
        leaderboardErrorEl.style.display = 'block';
        leaderboardErrorEl.textContent = getText('leaderboard_error_text');
        return;
    }
    console.log("YSK Leaderboards Object:", ysdk.leaderboards); // Kontrol 2
    const leaderboardsManager = ysdk.leaderboards;
    console.log("Leaderboards Manager Object:", leaderboardsManager); // Kontrol 3


    try {
        const leaderboardName = 'highScoresTable';
        console.log("Does leaderboardsManager have getLeaderboardEntries?:", typeof leaderboardsManager.getEntries);

        const res = await leaderboardsManager.getEntries(leaderboardName, {
            includeUser: true,
            quantityAround: 2,
            quantityTop: 50
        });

        leaderboardLoadingEl.style.display = 'none';

        if (res?.entries?.length > 0) {
            leaderboardEntriesEl.innerHTML = '';
            res.entries.forEach(entry => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${entry.rank}</td>
                    <td>${entry.player.publicName || getText('leaderboard_player') + ' ' + entry.rank}</td>
                    <td>${entry.score}</td>
                `;
                leaderboardEntriesEl.appendChild(tr);
            });
        } else {
            leaderboardEntriesEl.innerHTML = `<tr><td colspan="3">${getText('leaderboard_error_text')} (No entries)</td></tr>`;
        }

        const userEntry = res.userRank ? res.entries.find(e => e.rank === res.userRank) : null;
        if (res.userRank && userEntry) {
            playerRankValueEl.textContent = res.userRank;
            playerScoreValueEl.textContent = userEntry.score;
            leaderboardPlayerRankEl.style.display = 'block';
        } else {
            const localHighScore = state.getHighScore();
            if (localHighScore > 0) {
                playerRankValueEl.textContent = getText('N/A');
                playerScoreValueEl.textContent = localHighScore;
                leaderboardPlayerRankEl.style.display = 'block';
            } else {
                leaderboardPlayerRankEl.style.display = 'none';
            }
        }
    } catch (error) {
        console.error("Error loading or displaying leaderboard:", error);
        leaderboardLoadingEl.style.display = 'none';
        leaderboardErrorEl.style.display = 'block';
        leaderboardErrorEl.textContent = getText('leaderboard_error_text');
    }
    finally {
        updateLeaderboardLocalHighScore();
    }
}

export function updateUI() {
    if (levelInfoEl) levelInfoEl.textContent = getText('level_info_text', { level: state.getLevel() });
    if (scoreEl) scoreEl.textContent = getText('score_text', { score: state.getScore() });
    if (gameHighScoreDisplayEl) gameHighScoreDisplayEl.textContent = getText('high_score_text', { score: state.getHighScore() });
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
    const tryWeaponBtnEl = document.getElementById('armory-try-weapon-button');

    if (!imgEl || !nameEl || !statsEl || !descEl || !lockIconEl || !unlockBtnEl || !selectBtnEl || !progressInfoEl || !armoryTitleEl || !backBtnEl) {
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

    const weaponOnCooldownId = state.getWeaponOnAdTrialCooldownId();
    const isTrialActiveForThisWeapon = state.isTrialWeaponActive() && state.getTrialWeaponId() === weaponData.id;

    selectBtnEl.style.display = isUnlocked || isTrialActiveForThisWeapon ? 'block' : 'none';
    if (isUnlocked || isTrialActiveForThisWeapon) {
        selectBtnEl.style.display = 'block';
        const isSelected = weaponData.id === selectedWeaponId;
        selectBtnEl.disabled = isSelected;
        selectBtnEl.textContent = isSelected ? getText('armory_selected_button_text') : getText('armory_select_button_text');
        selectBtnEl.dataset.weaponId = weaponData.id;
    } else {
        selectBtnEl.style.display = 'none';
    }

    const prevBtn = document.getElementById('armory-prev-button');
    const nextBtn = document.getElementById('armory-next-button');
    if (prevBtn) prevBtn.disabled = currentWeaponIndex === 0;
    if (nextBtn) nextBtn.disabled = currentWeaponIndex === WEAPONS.length - 1;

    const isAwm = weaponData.id === 'awm';
    const isDefaultWeapon = weaponData.unlockWins === 0 && !weaponData.unlocksWith;

    if (!isUnlocked && !isAwm && !isDefaultWeapon) {
        // Eğer bu silah için bir deneme zaten aktifse (yani reklam izlenmiş ve o oyun için geçerliyse)
        // VEYA reklam izlenmiş ve bir oyunluk cooldown'daysa, "Reklam İzle ve Dene" butonunu gizle.
        if (isTrialActiveForThisWeapon || weaponData.id === weaponOnCooldownId) {
            tryWeaponBtnEl.style.display = 'none'; // Butonu tamamen gizle
        } else {
            // Silah kilitli, deneme aktif değil ve cooldown'da değil. Normal "Dene" butonunu göster.
            tryWeaponBtnEl.style.display = 'block';
            tryWeaponBtnEl.disabled = false;
            tryWeaponBtnEl.textContent = getText('armory_try_weapon_button');
            tryWeaponBtnEl.dataset.weaponId = weaponData.id;
            tryWeaponBtnEl.dataset.weaponName = nameEl.textContent; // nameEl.textContent yukarıda tanımlanmış olmalı.
            tryWeaponBtnEl.onclick = () => armory.handleTryWeaponWithAd(tryWeaponBtnEl.dataset.weaponId, tryWeaponBtnEl.dataset.weaponName);
        }
    } else {
        // Silah kilitli değilse (unlocked), AWM ise veya varsayılan ise "Dene" butonunu gizle.
        tryWeaponBtnEl.style.display = 'none';
    }
}

export function populateAchievementsList() {
    if (!achievementsListEl) {
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
            progressP.textContent = getText('ach_ten_perfect_games_progress', { current: winsToShow, total: 10 });
            detailsDiv.appendChild(progressP);
        }

        card.appendChild(iconSpan);
        card.appendChild(detailsDiv);
        achievementsListEl.appendChild(card);
    });
}

export function setupSettingsListeners() {
    if (!masterVolumeSlider) {
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
        applyCurrentAudioSettingsWAA();
    });
    masterVolumeSlider.addEventListener('change', saveAudioSettings);

    musicVolumeSlider.addEventListener('input', (event) => {
        const newVolume = event.target.value;
        state.setMusicVolume(newVolume);
        musicVolumeValueDisplay.textContent = `${Math.round(newVolume * 100)}%`;
        applyCurrentAudioSettingsWAA();
    });
    musicVolumeSlider.addEventListener('change', saveAudioSettings);

    sfxVolumeSlider.addEventListener('input', (event) => {
        const newVolume = event.target.value;
        state.setSfxVolume(newVolume);
        sfxVolumeValueDisplay.textContent = `${Math.round(newVolume * 100)}%`;
        applyCurrentAudioSettingsWAA();
    });
    sfxVolumeSlider.addEventListener('change', saveAudioSettings);

    muteAllButton.addEventListener('click', () => {
        const newMuteState = !state.getIsMuted();
        state.setIsMuted(newMuteState);
        muteAllButton.textContent = getText(newMuteState ? 'settings_unmute_button' : 'settings_mute_button');
        applyCurrentAudioSettingsWAA();
        saveAudioSettings();
    });
}

/**
 * @param {string} messageKey 
 * @param {'success' | 'pending' | 'error' | 'cancelled' | ''} type 
 * @param {boolean} isKey 
 */

const achievementQueue = [];
let isNotificationShowing = false;
let currentAchievementTimeoutId = null;

export function showAchievementNotification(achievementId, achievementNameFromConfig, achievementIcon = '🏆', duration = 3000) {
    if (!achievementNotificationEl || !achievementNotificationNameEl || !achievementNotificationIconEl) {
        return;
    }
    achievementQueue.push({ id: achievementId, name: achievementNameFromConfig, icon: achievementIcon, duration });
    if (!isNotificationShowing) {
        processAchievementQueue();
    }
}

function processAchievementQueue() {
    if (achievementQueue.length === 0 || isNotificationShowing) return;

    isNotificationShowing = true;

    const achievementData = achievementQueue.shift();

    if (currentAchievementTimeoutId) {
        clearTimeout(currentAchievementTimeoutId);
    }

    achievementNotificationEl.classList.remove('show');
    achievementNotificationIconEl.textContent = achievementData.icon;

    const achievementNameKey = `ach_${achievementData.id}_name`;
    const translatedAchievementName = getText(achievementNameKey, {}, achievementData.name);
    achievementNotificationNameEl.textContent = translatedAchievementName;

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
    }, achievementData.duration || 3000);
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

function updateLeaderboardLocalHighScore() {
    if (leaderboardLocalHighScoreEl && localHighScoreValueEl) {
        const highScore = state.getHighScore();
        if (highScore > 0) {
            // Span içindeki metni data-translate ile almak yerine doğrudan getText ile set edelim
            const labelSpan = leaderboardLocalHighScoreEl.querySelector('span[data-translate="your_local_high_score_is"]');
            if (labelSpan) {
                labelSpan.textContent = getText('your_local_high_score_is');
            }
            localHighScoreValueEl.textContent = highScore;
            leaderboardLocalHighScoreEl.style.display = 'block'; // Görünür yap
        } else {
            leaderboardLocalHighScoreEl.style.display = 'none'; // Skor yoksa gizle
        }
    }
}

export function getText(key, replacements = {}) {
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
    updateUI();
    updateTimerDisplay();
    if (muteAllButton) {
        muteAllButton.textContent = getText(state.getIsMuted() ? 'settings_unmute_button' : 'settings_mute_button');
    }

    if (achievementsScreen?.style.display === 'flex') {
        populateAchievementsList();
    }
    if (armoryScreen?.style.display === 'flex') {
        updateArmoryDisplay();
    }
    if (leaderboardScreen?.style.display === 'flex') {
        updateLeaderboardLocalHighScore();
    }
}