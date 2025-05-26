// state.js
// Manages game state, including level, score, weapons, achievements, and audio settings.

import { WEAPONS, MAX_AMMO, TIME_LIMIT_SECONDS } from './config.js';

// Private state variables
let _level = 1;
let _score = 0;
let _ammoCount = WEAPONS[0].maxAmmo;
let _timeLeft = TIME_LIMIT_SECONDS;
let _currentCombo = 0;
let _comboMultiplier = 1;
let _isGameOver = false;
let _isGameWon = false;
let _isRotating = true;
let _isSpinning = false;
let _canFire = true;
let _isMenuActive = true;
let _rotationSpeed = WEAPONS[0].rotationSpeed;
let _bottles = [];
let _timerInterval = null;
let _shotTimeout = null;
let _animationFrameId = null;
let _spinAnimationFrameId = null;
let _currentRotation = 0;
let _selectedWeaponId = WEAPONS[0].id;
let _currentArmoryIndex = 0;
let _winsPerWeapon = {};
let _unlockedWeaponIds = [WEAPONS[0].id];
let _unlockedAchievementIds = [];
let _highScore = 0;
let _hasMissedShotInSession = false;
let _perfectGameStreakCount = 0;
let _masterVolume = 0.5;
let _musicVolume = 0.5;
let _sfxVolume = 0.5;
let _isMuted = false;
let _currentLanguage = 'en';
let _currentGameMode = 'normal';
let _lostGamePlayAgainCount = 0;
let _usedAmmoRewardThisGame = false;
let _usedRedBottleRewardThisGame = false;
let _trialWeaponId = null;
let _isTrialWeaponActive = false;

// Getters
export function getTrialWeaponId() { return _trialWeaponId; }
export function isTrialWeaponActive() { return _isTrialWeaponActive; }
export function hasUsedRedBottleRewardThisGame() { return _usedRedBottleRewardThisGame; }
export function hasUsedAmmoRewardThisGame() { return _usedAmmoRewardThisGame; }
export function getLostGamePlayAgainCount() { return _lostGamePlayAgainCount; }
export function getWinsForWeapon(weaponId) { return _winsPerWeapon[weaponId] || 0; }
export function getAllWinsData() { return { ..._winsPerWeapon }; }
export function getLevel() { return _level; }
export function getScore() { return _score; }
export function getAmmoCount() { return _ammoCount; }
export function getTimeLeft() { return _timeLeft; }
export function getCurrentCombo() { return _currentCombo; }
export function getComboMultiplier() { return _comboMultiplier; }
export function isGameOver() { return _isGameOver; }
export function isGameWon() { return _isGameWon; }
export function isRotating() { return _isRotating; }
export function isSpinning() { return _isSpinning; }
export function canFire() { return _canFire; }
export function isMenuActive() { return _isMenuActive; }
export function getBottles() { return _bottles; }
export function getTimerInterval() { return _timerInterval; }
export function getShotTimeout() { return _shotTimeout; }
export function getAnimationFrameId() { return _animationFrameId; }
export function getSpinAnimationFrameId() { return _spinAnimationFrameId; }
export function getCurrentRotation() { return _currentRotation; }
export function getRotationSpeed() { return _rotationSpeed; }
export function getMaxAmmo() {
    const weapon = WEAPONS.find(w => w.id === _selectedWeaponId);
    return weapon ? weapon.maxAmmo : MAX_AMMO;
}
export function getCurrentArmoryIndex() { return _currentArmoryIndex; }
export function getSelectedWeaponId() { return _selectedWeaponId; }
export function getHighScore() { return _highScore; }
export function getUnlockedWeaponIds() { return [..._unlockedWeaponIds]; }
export function getHasMissedShotInSession() { return _hasMissedShotInSession; }
export function getPerfectGameStreakCount() { return _perfectGameStreakCount; }
export function getUnlockedAchievementIds() { return [..._unlockedAchievementIds]; }
export function getMasterVolume() { return _masterVolume; }
export function getMusicVolume() { return _musicVolume; }
export function getSfxVolume() { return _sfxVolume; }
export function getIsMuted() { return _isMuted; }
export function getCurrentLanguage() { return _currentLanguage; }
export function getCurrentGameMode() { return _currentGameMode; }

// Setters and Updaters
export function setUsedRedBottleRewardThisGame(value) { _usedRedBottleRewardThisGame = value; }
export function setUsedAmmoRewardThisGame(value) { _usedAmmoRewardThisGame = value; }
export function incrementLostGamePlayAgainCount() { _lostGamePlayAgainCount++; }
export function resetLostGamePlayAgainCount() { _lostGamePlayAgainCount = 0; }
export function setAmmo(count) { _ammoCount = count; }
export function setLevel(level) { _level = level; }
export function setScore(score) { _score = score; }
export function increaseScore(amount) { _score += amount; }
export function decreaseAmmo() { if (_ammoCount > 0) _ammoCount--; }
export function setTimeLeft(time) { _timeLeft = time; }
export function decreaseTime() { if (_timeLeft > 0) _timeLeft--; }
export function setCurrentCombo(combo) { _currentCombo = combo; }
export function increaseCombo() { _currentCombo++; }
export function setComboMultiplier(multiplier) { _comboMultiplier = multiplier; }
export function setGameOver(value) { _isGameOver = value; }
export function setGameWon(value) { _isGameWon = value; }
export function setRotating(value) { _isRotating = value; }
export function setSpinning(value) { _isSpinning = value; }
export function setCanFire(value) { _canFire = value; }
export function setRotationSpeed(speed) { _rotationSpeed = speed; }
export function setMenuActive(value) { _isMenuActive = value; }
export function setBottles(bottles) { _bottles = bottles; }
export function clearBottles() { _bottles = []; }
export function setCurrentRotation(angle) { _currentRotation = angle; }
export function setCurrentArmoryIndex(index) { _currentArmoryIndex = index; }
export function setWinsData(winsData) { _winsPerWeapon = winsData ? { ...winsData } : {}; }
export function incrementWinsForWeapon(weaponId) { _winsPerWeapon[weaponId] = (_winsPerWeapon[weaponId] || 0) + 1; }
export function setUnlockedWeaponIds(ids) { _unlockedWeaponIds = ids ? [...ids] : []; }
export function setHighScore(score) { _highScore = score; }
export function addUnlockedWeaponId(weaponId) {
    if (!_unlockedWeaponIds.includes(weaponId)) {
        _unlockedWeaponIds.push(weaponId);
    }
}
export function setUnlockedAchievements(ids) { _unlockedAchievementIds = ids ? [...ids] : []; }
export function setHasMissedShotInSession(value) { _hasMissedShotInSession = value; }
export function setPerfectGameStreakCount(count) { _perfectGameStreakCount = count; }
export function incrementPerfectGameStreakCount() { _perfectGameStreakCount++; }
export function resetPerfectGameStreakCount() { _perfectGameStreakCount = 0; }
export function unlockAchievement(achievementId) {
    if (!_unlockedAchievementIds.includes(achievementId)) {
        _unlockedAchievementIds.push(achievementId);
        return true;
    }
    return false;
}
export function setMasterVolume(volume) {
    _masterVolume = Math.max(0, Math.min(1, parseFloat(volume)));
}
export function setMusicVolume(volume) {
    _musicVolume = Math.max(0, Math.min(1, parseFloat(volume)));
}
export function setSfxVolume(volume) {
    _sfxVolume = Math.max(0, Math.min(1, parseFloat(volume)));
}
export function setIsMuted(muted) {
    _isMuted = Boolean(muted);
}
export function setCurrentLanguage(langCode) {
    if (['en', 'tr', 'ru'].includes(langCode)) {
        _currentLanguage = langCode;
    } else {
        _currentLanguage = 'en';
    }
}
export function setCurrentGameMode(mode) {
    if (['normal', 'random'].includes(mode)) {
        _currentGameMode = mode;
    } else {
        _currentGameMode = 'normal';
    }
}
export function setTrialWeapon(weaponId) {
    _trialWeaponId = weaponId;
    _isTrialWeaponActive = !!weaponId;
}
export function setSelectedWeaponId(weaponId) {
    const isUnlocked = _unlockedWeaponIds.includes(weaponId);
    const isCurrentlyTrial = _trialWeaponId === weaponId && _isTrialWeaponActive;

    if (isUnlocked || isCurrentlyTrial) {
        _selectedWeaponId = weaponId;
        const weapon = WEAPONS.find(w => w.id === weaponId);
        if (weapon) {
            _rotationSpeed = weapon.rotationSpeed;
        }
        if (isUnlocked && _trialWeaponId && _trialWeaponId !== weaponId) {
            clearTrialWeaponState();
        }
        return true;
    }
    return false;
}

// Timer and Animation ID Management
export function setTimerInterval(id) { _timerInterval = id; }
export function clearTimerInterval() {
    if (_timerInterval) {
        clearInterval(_timerInterval);
        _timerInterval = null;
    }
}
export function setShotTimeout(id) { _shotTimeout = id; }
export function clearShotTimeout() {
    if (_shotTimeout) {
        clearTimeout(_shotTimeout);
        _shotTimeout = null;
    }
}
export function setAnimationFrameId(id) { _animationFrameId = id; }
export function cancelAnimationFrame() {
    if (_animationFrameId) {
        window.cancelAnimationFrame(_animationFrameId);
        _animationFrameId = null;
    }
}
export function setSpinAnimationFrameId(id) { _spinAnimationFrameId = id; }
export function cancelSpinAnimationFrame() {
    if (_spinAnimationFrameId) {
        window.cancelAnimationFrame(_spinAnimationFrameId);
        _spinAnimationFrameId = null;
    }
}
export function clearFullTrialWeaponState() {
    _trialWeaponId = null;
    _isTrialWeaponActive = false;
    const weaponIsStillUnlocked = _unlockedWeaponIds.includes(_selectedWeaponId);
    const weaponIsDefault = WEAPONS[0].id === _selectedWeaponId;

    if (_selectedWeaponId && !weaponIsStillUnlocked && !weaponIsDefault) {
        _selectedWeaponId = WEAPONS[0].id;
    }
}
export function clearActiveTrialOnNewGame() {
    _isTrialWeaponActive = false;
}

// Resets combo-related state.
export function resetComboState() {
    _currentCombo = 0;
    _comboMultiplier = 1;
}