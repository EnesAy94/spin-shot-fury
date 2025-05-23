import * as state from './state.js';

let _ysdk = null;
export function setYandexSDK(ysdk) {
    _ysdk = ysdk;
}
export function getYSDKInstance() { 
    return _ysdk;
}

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
    currentLanguage: 'en'
};

async function getPlayerData() {
    if (!_ysdk || !_ysdk.getPlayer) {
        console.warn('Yandex SDK or Player module not available for getData. Returning local defaults.');
        return { ...DEFAULT_PLAYER_DATA };
    }
    try {
        const player = await _ysdk.getPlayer();
        const data = await player.getData(['playerProfileData']);
        if (data && data.playerProfileData) {
            return { ...DEFAULT_PLAYER_DATA, ...data.playerProfileData };
        }
        console.log('No player data found on server, returning defaults.');
        return { ...DEFAULT_PLAYER_DATA };
    } catch (error) {
        console.error('Failed to get player data from Yandex SDK:', error);
        return { ...DEFAULT_PLAYER_DATA };
    }
}

async function savePlayerData(dataToSave) {
    if (!_ysdk || !_ysdk.getPlayer) {
        console.warn('Yandex SDK or Player module not available for setData. Data not saved to server.');
        return false;
    }
    try {
        const player = await _ysdk.getPlayer();
        await player.setData({ playerProfileData: dataToSave }, true);
        console.log('Player data saved to Yandex SDK:', dataToSave);
        return true;
    } catch (error) {
        console.error('Failed to save player data to Yandex SDK:', error);
        return false;
    }
}

export async function loadGameProgress() {
    console.log("Loading game progress from Yandex SDK...");
    const data = await getPlayerData();
    return {
        winsPerWeapon: data.winsPerWeapon || DEFAULT_PLAYER_DATA.winsPerWeapon,
        unlockedWeaponIds: data.unlockedWeaponIds && data.unlockedWeaponIds.length > 0 ? data.unlockedWeaponIds : [...DEFAULT_PLAYER_DATA.unlockedWeaponIds],
        selectedWeaponId: data.selectedWeaponId || DEFAULT_PLAYER_DATA.selectedWeaponId,
        unlockedAchievementIds: data.unlockedAchievementIds || DEFAULT_PLAYER_DATA.unlockedAchievementIds,
        highScore: data.highScore ?? DEFAULT_PLAYER_DATA.highScore, // ?? nullish coalescing
        perfectGameStreakCount: data.perfectGameStreakCount ?? DEFAULT_PLAYER_DATA.perfectGameStreakCount,
        masterVolume: data.masterVolume ?? DEFAULT_PLAYER_DATA.masterVolume,
        musicVolume: data.musicVolume ?? DEFAULT_PLAYER_DATA.musicVolume,
        sfxVolume: data.sfxVolume ?? DEFAULT_PLAYER_DATA.sfxVolume,
        isMuted: data.isMuted ?? DEFAULT_PLAYER_DATA.isMuted,
        currentLanguage: ['en', 'tr', 'ru'].includes(data.currentLanguage) ? data.currentLanguage : DEFAULT_PLAYER_DATA.currentLanguage
    };
}

async function updateAndSave(key, value) {
    const currentData = await getPlayerData();
    currentData[key] = value;
    return await savePlayerData(currentData);
}

async function updateMultipleAndSave(updates) {
    const currentData = await getPlayerData();
    const newData = { ...currentData, ...updates };
    return await savePlayerData(newData);
}


export async function saveWinsData(winsData) {
    return updateAndSave('winsPerWeapon', winsData);
}

export async function saveUnlockedWeapons(unlockedIds) {
    return updateAndSave('unlockedWeaponIds', unlockedIds);
}

export async function saveSelectedWeapon(selectedId) {
    return updateAndSave('selectedWeaponId', selectedId);
}

export async function saveUnlockedAchievements(achievementIds) {
    return updateAndSave('unlockedAchievementIds', achievementIds);
}

export async function saveHighScore(newHighScore) {
    const localSaveSuccess = await updateAndSave('highScore', newHighScore);

    if (_ysdk && _ysdk.getLeaderboards) {
        try {
            console.log(`Attempting to set score ${newHighScore} to leaderboard.`);
            const leaderboardName = 'highScoresTable';
            await _ysdk.getLeaderboards().setLeaderboardScore(leaderboardName, newHighScore);
            console.log(`Score ${newHighScore} successfully set to leaderboard '${leaderboardName}'.`);
        } catch (error) {
            console.error(`Failed to set score on leaderboard '${leaderboardName}':`, error);
        }
    } else {
        console.warn('Yandex SDK Leaderboards module not available. Score not sent to leaderboard.');
    }
    return localSaveSuccess;
}

export async function savePerfectGameStreakCount(count) {
    return updateAndSave('perfectGameStreakCount', count);
}

export async function saveAudioSettings(settings) {
    return updateMultipleAndSave(settings);
}

export async function saveLanguage(langCode) {
    return updateAndSave('currentLanguage', langCode);
}