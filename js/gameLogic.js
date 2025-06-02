// gameLogic.js
// Manages core game logic, including state, level progression, achievements, and timer.

import * as storage from './storage.js';
import * as state from './state.js';
import * as config from './config.js';
import * as ui from './ui.js';
import { createBottles } from './entities.js';
import { rotateGun, applyWeaponStats } from './playerAction.js';
import { ACHIEVEMENTS, WEAPONS } from './config.js';

// Unlocks an achievement if not already unlocked and updates storage/UI.
export async function checkAndUnlockAchievement(achievementId) {
    if (state.getUnlockedAchievementIds().includes(achievementId)) return false;

    const achievement = ACHIEVEMENTS.find(ach => ach.id === achievementId);
    if (!achievement) {
        console.warn(`Achievement "${achievementId}" not found.`);
        return false;
    }

    const unlocked = state.unlockAchievement(achievementId);
    if (unlocked) {
        await storage.saveUnlockedAchievements(state.getUnlockedAchievementIds());
        ui.showAchievementNotification(achievement.id, achievement.name, achievement.icon);
        
        if (achievementId !== 'achievement_master') {
            checkMasterAchievement();
        }

        if (ui.achievementsScreen?.style.display !== 'none') {
            ui.populateAchievementsList();
        }
        return true;
    }
    return false;
}

// Resets game state and UI for a new game.
export function resetGame() {
    state.setGameOver(false);
    state.setGameWon(false);
    state.setLevel(1);
    state.setScore(0);
    state.resetComboState();
    state.setCurrentRotation(0);
    state.setTimeLeft(config.TIME_LIMIT_SECONDS);
    state.setHasMissedShotInSession(false);
    state.setUsedAmmoRewardThisGame(false);
    state.setUsedRedBottleRewardThisGame(false);
    state.clearActiveTrialOnNewGame();

    stopTimer();
    state.clearShotTimeout();
    state.cancelAnimationFrame();
    state.cancelSpinAnimationFrame();

    ui.updateGameInfo('SpinShot Fury');
    ui.hideGameCompleteScreen();
    ui.setGunRotation(0);
    applyWeaponStats();
    state.setRotating(true);
    ui.updateUI();
    ui.updateTimerDisplay();
    ui.updateComboDisplay();
    createBottles();
    state.setSpinning(false);
    state.setCanFire(true);
}

// Starts the game, hides menu, resets state, and begins game loops.
export function startGame() {
    state.setMenuActive(false);
    ui.hideMainMenuAndShowGame();
    ui.hideModeSelectScreen();
    resetGame();
    startTimer();
    ui.setCursor('crosshair');
    if (state.isRotating() && !state.getAnimationFrameId()) {
        rotateGun();
    }
}

// Ends the game with a reason and shows game over screen.
export async function gameOver(reason) {
    if (state.isGameOver() || state.isGameWon()) return;

    state.setGameOver(true);
    if (state.getHasMissedShotInSession() && state.getPerfectGameStreakCount() > 0) {
        state.resetPerfectGameStreakCount();
        await storage.savePerfectGameStreakCount(state.getPerfectGameStreakCount());
    }

    stopTimer();
    state.setRotating(false);
    state.setSpinning(false);
    state.cancelAnimationFrame();
    state.cancelSpinAnimationFrame();
    state.clearShotTimeout();

    if (state.getScore() > state.getHighScore()) {
        state.setHighScore(state.getScore());
        await storage.saveHighScore(state.getScore());
    }

    let titleKey = 'game_complete_over';
    let textKey = '';
    if (reason === 'timeout') {
        titleKey = 'game_complete_timeout';
        textKey = 'game_over_reason_timeout_desc';
    } else if (reason === 'red_bottle') {
        titleKey = 'game_complete_wrong_bottle';
        textKey = 'game_over_reason_red_bottle_desc';
    } else if (reason === 'no_ammo') {
        titleKey = 'game_complete_no_ammo';
        textKey = 'game_over_reason_no_ammo_desc';
    }

    state.clearFullTrialWeaponState();
    ui.showGameCompleteScreen(titleKey, textKey, state.getScore());
}

// Marks game as won, applies bonuses, and shows victory screen.
export async function gameWon() {
    if (state.isGameWon() || state.isGameOver()) return;

    state.setGameWon(true);
    stopTimer();

    const weaponId = state.getSelectedWeaponId();
    state.incrementWinsForWeapon(weaponId);
    await storage.saveWinsData(state.getAllWinsData());

    const timeLeft = state.getTimeLeft();
    let score = state.getScore();
    const timeBonus = timeLeft > 0 ? timeLeft * config.POINTS_PER_SECOND : 0;
    let finalScore = score + timeBonus;

    const weapon = WEAPONS.find(w => w.id === weaponId);
    if (weapon?.scoreMultiplier && weapon.id === 'awm') {
        finalScore *= weapon.scoreMultiplier;
    }

    if (finalScore > state.getHighScore()) {
        state.setHighScore(finalScore);
        await storage.saveHighScore(finalScore);
    }

    checkAndUnlockAchievement('game_completed');
    if (config.TIME_LIMIT_SECONDS - timeLeft < 60) {
        checkAndUnlockAchievement('fast_clear_1_min');
    }
    if (finalScore >= 30000) {
        checkAndUnlockAchievement('game_over_score_30k');
    }
    if (finalScore >= 10000) {
        checkAndUnlockAchievement('score_10000_points');
    }

    if (!state.getHasMissedShotInSession()) {
        checkAndUnlockAchievement('perfect_game_no_miss');
        if (weaponId === 'glock17') {
            checkAndUnlockAchievement('perfect_game_weapon_2');
        } else if (weaponId === 'UMP45') {
            checkAndUnlockAchievement('perfect_game_weapon_3');
        }

        state.incrementPerfectGameStreakCount();
        await storage.savePerfectGameStreakCount(state.getPerfectGameStreakCount());
        if (state.getPerfectGameStreakCount() >= 10) {
            checkAndUnlockAchievement('ten_perfect_games');
        }
    } else if (state.getPerfectGameStreakCount() > 0) {
        state.resetPerfectGameStreakCount();
        await storage.savePerfectGameStreakCount(state.getPerfectGameStreakCount());
    }

    checkMasterAchievement();
    state.clearFullTrialWeaponState();
    state.setRotating(false);
    ui.showGameCompleteScreen(
        'Congratulations!',
        `You finished the game! Time Bonus: +${timeBonus}`,
        finalScore
    );
}

// Checks if all achievements are unlocked to grant master achievement.
async function checkMasterAchievement() {
    const unlockedAchievements = state.getUnlockedAchievementIds();
    const masterAchievementId = 'achievement_master';

    if (unlockedAchievements.includes(masterAchievementId)) return;

    const otherAchievementIds = ACHIEVEMENTS
        .filter(ach => ach.id !== masterAchievementId && !ach.isHidden)
        .map(ach => ach.id);

    if (otherAchievementIds.every(id => unlockedAchievements.includes(id))) {
        const unlockedMaster = await checkAndUnlockAchievement(masterAchievementId);
        if (unlockedMaster) {
            const awmWeaponId = 'awm';
            if (!state.getUnlockedWeaponIds().includes(awmWeaponId)) {
                state.addUnlockedWeaponId(awmWeaponId);
                await storage.saveUnlockedWeapons(state.getUnlockedWeaponIds());
                if (ui.armoryScreen?.style.display !== 'none') {
                    ui.updateArmoryDisplay();
                }
            }
        }
    }
}

// Checks if all green bottles are hit and advances level or ends game.
export function checkLevelComplete() {
    if (state.isGameOver() || state.isGameWon()) return;

    const greenBottles = state.getBottles().filter(b => b.type === 'green');
    if (greenBottles.length === 0) return;

    if (greenBottles.every(b => b.hit)) {
        if (state.getLevel() === 5) {
            checkAndUnlockAchievement('level_5_clear');
        }

        if (state.getLevel() === config.MAX_LEVEL) {
            gameWon();
            return;
        }

        state.setLevel(state.getLevel() + 1);
        state.setRotating(false);
        state.setSpinning(false);
        state.cancelAnimationFrame();
        state.cancelSpinAnimationFrame();

        const levelMessage = ui.getText('level_starting_message', { level: state.getLevel() });
        ui.updateGameInfo(levelMessage, 'lime');

        setTimeout(() => {
            if (state.isGameOver() || state.isGameWon()) return;

            ui.updateGameInfo('SpinShot Fury');
            applyWeaponStats();
            ui.updateUI();
            createBottles();
            state.setRotating(true);
            rotateGun();
        }, 1500);
    }
}

// Starts or restarts the game timer.
export function startTimer() {
    stopTimer();
    state.setTimeLeft(config.TIME_LIMIT_SECONDS);
    ui.updateTimerDisplay();
    state.setTimerInterval(setInterval(updateTimerIntervalCallback, 1000));
}

// Stops the game timer and clears interval.
export function stopTimer() {
    state.clearTimerInterval();
}

// Updates timer every second, checks for timeout, and updates UI.
function updateTimerIntervalCallback() {
    if (state.isGameOver() || state.isGameWon() || state.isMenuActive()) {
        stopTimer();
        return;
    }

    state.decreaseTime();
    ui.updateTimerDisplay();
    if (state.getTimeLeft() <= 0) {
        gameOver('timeout');
    }
}

// Resets combo and multiplier, updates UI.
export function resetCombo() {
    state.resetComboState();
    ui.updateComboDisplay();
}

// Loads saved progress and initializes game state.
export async function loadProgressAndInitialize() {
    const savedData = await storage.loadGameProgress();
    state.setWinsData(savedData.winsPerWeapon);
    state.setUnlockedWeaponIds(savedData.unlockedWeaponIds);
    state.setUnlockedAchievements(savedData.unlockedAchievementIds);
    state.setHighScore(savedData.highScore);
    state.setPerfectGameStreakCount(savedData.perfectGameStreakCount || 0);
    state.setMasterVolume(savedData.masterVolume);
    state.setMusicVolume(savedData.musicVolume);
    state.setSfxVolume(savedData.sfxVolume);
    state.setIsMuted(savedData.isMuted);

    const ysdk = storage.getYSDKInstance();
    if (ysdk) {
        const adsShouldBeRemoved = await storage.checkAdsRemovedStatus(ysdk);
        state.setAdsRemoved(adsShouldBeRemoved);
    } else {
        state.setAdsRemoved(false);
    }

    const weaponId = savedData.unlockedWeaponIds.includes(savedData.selectedWeaponId)
        ? savedData.selectedWeaponId
        : config.WEAPONS[0].id;
    state.setSelectedWeaponId(weaponId);

    applyWeaponStats();
}

// Pauses game for ad opportunity, stopping timer and animations.
export function pauseGameForAd() {
    stopTimer();
    state.setRotating(false);
    state.setCanFire(false);
    state.setSpinning(false);
    state.cancelAnimationFrame();
    state.cancelSpinAnimationFrame();
}

// Resumes game after ad, handling game state based on ammo and bottles.
export function resumeGameAfterAd(rewardGranted = true) {
    if (state.isGameOver() || state.isGameWon()) return;

    state.cancelAnimationFrame();
    state.cancelSpinAnimationFrame();

    const greenBottlesLeft = state.getBottles().some(b => b.type === 'green' && !b.hit);
    const ammoAvailable = state.getAmmoCount() > 0;

    if (ammoAvailable && greenBottlesLeft) {
        state.setRotating(true);
        state.setCanFire(true);
        startTimer();
        if (!state.getAnimationFrameId()) {
            rotateGun();
        }
    } else if (!ammoAvailable && greenBottlesLeft) {
        gameOver('no_ammo');
    } else if (!greenBottlesLeft) {
        checkLevelComplete();
    } else {
        gameOver('unknown_resume_issue');
    }
}