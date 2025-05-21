// storage.js
// Manages saving and loading game progress to localStorage.

import { STORAGE_KEY, WEAPONS } from './config.js';

// Loads data from localStorage with default values.
function loadData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Failed to read from localStorage:', error);
    }
    return {
        winsPerWeapon: {},
        unlockedWeaponIds: [WEAPONS[0].id],
        selectedWeaponId: WEAPONS[0].id,
        unlockedAchievementIds: [],
        highScore: 0,
        perfectGameStreakCount: 0,
        masterVolume: 0.5,
        musicVolume: 0.5,
        sfxVolume: 0.5,
        isMuted: false,
        currentLanguage: 'en'
    };
}

// Saves data to localStorage.
function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to write to localStorage:', error);
    }
}

// Loads game progress with default values for missing fields.
export function loadGameProgress() {
    const data = loadData();
    return {
        winsPerWeapon: data.winsPerWeapon || {},
        unlockedWeaponIds: data.unlockedWeaponIds || [WEAPONS[0].id],
        selectedWeaponId: data.selectedWeaponId || WEAPONS[0].id,
        unlockedAchievementIds: data.unlockedAchievementIds || [],
        highScore: data.highScore ?? 0,
        perfectGameStreakCount: data.perfectGameStreakCount ?? 0,
        masterVolume: data.masterVolume ?? 0.5,
        musicVolume: data.musicVolume ?? 0.5,
        sfxVolume: data.sfxVolume ?? 0.5,
        isMuted: data.isMuted ?? false,
        currentLanguage: ['en', 'tr', 'ru'].includes(data.currentLanguage) ? data.currentLanguage : 'en'
    };
}

// Saves wins data to localStorage.
export function saveWinsData(winsData) {
    const data = loadData();
    data.winsPerWeapon = winsData ? { ...winsData } : {};
    saveData(data);
}

// Saves unlocked weapon IDs to localStorage.
export function saveUnlockedWeapons(unlockedIds) {
    const data = loadData();
    data.unlockedWeaponIds = unlockedIds ? [...unlockedIds] : [];
    saveData(data);
}

// Saves selected weapon ID to localStorage.
export function saveSelectedWeapon(selectedId) {
    const data = loadData();
    data.selectedWeaponId = selectedId;
    saveData(data);
}

// Saves unlocked achievement IDs to localStorage.
export function saveUnlockedAchievements(achievementIds) {
    const data = loadData();
    data.unlockedAchievementIds = achievementIds ? [...achievementIds] : [];
    saveData(data);
}

// Saves high score to localStorage.
export function saveHighScore(highScore) {
    const data = loadData();
    data.highScore = highScore;
    saveData(data);
}

// Saves perfect game streak count to localStorage.
export function savePerfectGameStreakCount(count) {
    const data = loadData();
    data.perfectGameStreakCount = count;
    saveData(data);
}

// Saves audio settings to localStorage.
export function saveAudioSettings(settings) {
    const data = loadData();
    data.masterVolume = settings.masterVolume ?? 0.5;
    data.musicVolume = settings.musicVolume ?? 0.5;
    data.sfxVolume = settings.sfxVolume ?? 0.5;
    data.isMuted = settings.isMuted ?? false;
    saveData(data);
}

// Saves language code to localStorage.
export function saveLanguage(langCode) {
    const data = loadData();
    data.currentLanguage = langCode;
    saveData(data);
}