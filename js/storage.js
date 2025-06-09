// storage.js
// Manages game data storage and retrieval using Yandex SDK or local defaults.

import * as state from './state.js';

let _ysdk = null;

// Sets the Yandex SDK instance.
export function setYandexSDK(ysdk) {
    _ysdk = ysdk;
}

// Returns the Yandex SDK instance.
export function getYSDKInstance() {
    return _ysdk;
}

// Default player data structure.
const DEFAULT_PLAYER_DATA = {
    winsPerWeapon: {},
    unlockedWeaponIds: ['revolver'],
    selectedWeaponId: 'revolver',
    unlockedAchievementIds: [],
    highScore: 0,
    perfectGameStreakCount: 0,
    masterVolume: 0.5,
    musicVolume: 0.5,
    sfxVolume: 0.5,
    isMuted: false,
};

// Retrieves player data from Yandex SDK or returns defaults.
async function getPlayerData() {
    if (!_ysdk?.getPlayer) {
        return { ...DEFAULT_PLAYER_DATA };
    }
    try {
        const player = await _ysdk.getPlayer();
        const data = await player.getData(['playerProfileData']);
        return data?.playerProfileData ? { ...DEFAULT_PLAYER_DATA, ...data.playerProfileData } : { ...DEFAULT_PLAYER_DATA };
    } catch (error) {
        return { ...DEFAULT_PLAYER_DATA };
    }
}

// Saves player data to Yandex SDK.
async function savePlayerData(dataToSave) {
    if (!_ysdk?.getPlayer) {
        return false;
    }
    try {
        const player = await _ysdk.getPlayer();
        await player.setData({ playerProfileData: dataToSave }, true);
        return true;
    } catch (error) {
        return false;
    }
}

// Loads game progress, merging server data with defaults.
export async function loadGameProgress() {
    const data = await getPlayerData();
    return {
        winsPerWeapon: data.winsPerWeapon || DEFAULT_PLAYER_DATA.winsPerWeapon,
        unlockedWeaponIds: data.unlockedWeaponIds?.length > 0 ? data.unlockedWeaponIds : [...DEFAULT_PLAYER_DATA.unlockedWeaponIds],
        selectedWeaponId: data.selectedWeaponId || DEFAULT_PLAYER_DATA.selectedWeaponId,
        unlockedAchievementIds: data.unlockedAchievementIds || DEFAULT_PLAYER_DATA.unlockedAchievementIds,
        highScore: data.highScore ?? DEFAULT_PLAYER_DATA.highScore,
        perfectGameStreakCount: data.perfectGameStreakCount ?? DEFAULT_PLAYER_DATA.perfectGameStreakCount,
        masterVolume: data.masterVolume ?? DEFAULT_PLAYER_DATA.masterVolume,
        musicVolume: data.musicVolume ?? DEFAULT_PLAYER_DATA.musicVolume,
        sfxVolume: data.sfxVolume ?? DEFAULT_PLAYER_DATA.sfxVolume,
        isMuted: data.isMuted ?? DEFAULT_PLAYER_DATA.isMuted,
    };
}

// Updates and saves a single key-value pair to player data.
async function updateAndSave(key, value) {
    const currentData = await getPlayerData();
    currentData[key] = value;
    return await savePlayerData(currentData);
}

// Updates and saves multiple key-value pairs to player data.
async function updateMultipleAndSave(updates) {
    const currentData = await getPlayerData();
    const newData = { ...currentData, ...updates };
    return await savePlayerData(newData);
}

// Saves wins data for weapons.
export async function saveWinsData(winsData) {
    return updateAndSave('winsPerWeapon', winsData);
}

// Saves unlocked weapon IDs.
export async function saveUnlockedWeapons(unlockedIds) {
    return updateAndSave('unlockedWeaponIds', unlockedIds);
}

// Saves selected weapon ID.
export async function saveSelectedWeapon(selectedId) {
    return updateAndSave('selectedWeaponId', selectedId);
}

// Saves unlocked achievement IDs.
export async function saveUnlockedAchievements(achievementIds) {
    return updateAndSave('unlockedAchievementIds', achievementIds);
}

// Saves high score to player data and leaderboard.
export async function saveHighScore(newHighScore) {
    const localSaveSuccess = await updateAndSave('highScore', newHighScore); // Bu lokal kayıt
    const leaderboardName = 'highScoresTable'; // Liderlik tablosu adınız

    if (_ysdk?.leaderboards) { // ysdk.leaderboards kontrolü daha iyi
        try {
            // ÖNEMLİ: leaderboards objesi üzerinden setScore çağrılmalı
            await _ysdk.leaderboards.setScore(leaderboardName, newHighScore);
            console.log(`Score ${newHighScore} successfully sent to Yandex Leaderboard: ${leaderboardName}`); // Başarı logu
        } catch (error) {
            console.error(`Failed to send score to Yandex Leaderboard: ${leaderboardName}`, error); // Hata logu
        }
    } else {
        console.warn("Yandex SDK leaderboards module not available, score not sent to Yandex.");
    }
    return localSaveSuccess;
}

// Saves perfect game streak count.
export async function savePerfectGameStreakCount(count) {
    return updateAndSave('perfectGameStreakCount', count);
}

// Saves audio settings.
export async function saveAudioSettings(settings) {
    return updateMultipleAndSave(settings);
}