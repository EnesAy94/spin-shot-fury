// storage.js (Yandex SDK Entegrasyonlu Hali)
// import { WEAPONS } from './config.js'; // WEAPONS burada artık gerekmeyebilir, varsayılanlar state'ten gelebilir

// ysdkInstance'ı main.js'ten almamız gerekecek ya da burada bir getter/setter olmalı.
// Şimdilik, bu fonksiyonların ysdkInstance'a erişebildiğini varsayalım.
// En iyi yol, main.js'te ysdkInstance'ı global yapmak veya bir modül aracılığıyla sağlamaktır.
// Veya bu fonksiyonları async yapıp, her çağrıda ysdkInstance'ı parametre olarak almak.
// Daha temiz bir çözüm için main.js'ten ysdkInstance'ı buraya import etmeye çalışalım.

// main.js'te ysdkInstance'ı export etmeniz gerekir: export let ysdkInstance = null;
// import { ysdkInstance } from './main.js'; // Bu döngüsel bağımlılık yaratabilir, dikkat!
// Daha iyi bir yöntem: Bir sdkWrapper.js oluşturup ysdkInstance'ı orada yönetmek ve her yerden oradan import etmek.
// Şimdilik, bu fonksiyonların çağrıldığı yerde ysdkInstance'ın dolu olduğunu varsayacağız
// ve onu parametre olarak alacak şekilde güncelleyebiliriz veya global bir referans kullanabiliriz.

// Global ysdkInstance'a erişim için bir yardımcı (main.js'te set edilmeli)
let _ysdk = null;
export function setYandexSDK(ysdk) {
    _ysdk = ysdk;
}

const DEFAULT_PLAYER_DATA = {
    winsPerWeapon: {},
    unlockedWeaponIds: [/* WEAPONS[0].id - Bu config'den alınmalı veya state'te tanımlanmalı */ 'revolver'], // Varsayılan ilk silah
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
        return { ...DEFAULT_PLAYER_DATA }; // SDK yoksa varsayılanı dön
    }
    try {
        const player = await _ysdk.getPlayer();
        // Tüm verileri çekmek için genellikle parametresiz çağrı veya belirli anahtarlar istenir.
        // Yandex dokümantasyonu 'keys' parametresini kontrol edin.
        // Eğer tüm data tek bir obje olarak saklanıyorsa, bu şekilde alınabilir:
        const data = await player.getData(['playerProfileData']); // 'playerProfileData' bizim anahtarımız olsun
        if (data && data.playerProfileData) {
            // Eksik alanlar için varsayılanlarla birleştir
            return { ...DEFAULT_PLAYER_DATA, ...data.playerProfileData };
        }
        console.log('No player data found on server, returning defaults.');
        return { ...DEFAULT_PLAYER_DATA };
    } catch (error) {
        console.error('Failed to get player data from Yandex SDK:', error);
        return { ...DEFAULT_PLAYER_DATA }; // Hata durumunda varsayılanı dön
    }
}

async function savePlayerData(dataToSave) {
    if (!_ysdk || !_ysdk.getPlayer) {
        console.warn('Yandex SDK or Player module not available for setData. Data not saved to server.');
        return false;
    }
    try {
        const player = await _ysdk.getPlayer();
        // Tüm verileri tek bir anahtar altında saklayalım
        await player.setData({ playerProfileData: dataToSave }, true); // true: flush immediately
        console.log('Player data saved to Yandex SDK:', dataToSave);
        return true;
    } catch (error) {
        console.error('Failed to save player data to Yandex SDK:', error);
        return false;
    }
}

// Mevcut export'ları SDK kullanacak şekilde güncelliyoruz
export async function loadGameProgress() {
    console.log("Loading game progress from Yandex SDK...");
    const data = await getPlayerData();
    // Gelen verinin yapısını kontrol et ve gerekirse DEFAULT_PLAYER_DATA ile birleştir
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

// Veri kaydetme fonksiyonları artık tek bir yerden yönetilecek.
// Her bir özelliği ayrı ayrı kaydetmek yerine, tüm state'i güncelleyip
// sonra toplu olarak savePlayerData ile kaydetmek daha verimli olabilir.
// Ya da her değişiklikte getPlayerData -> modify -> savePlayerData yapılabilir.
// Şimdilik, her save fonksiyonu tüm datayı alıp kaydetsin.

async function updateAndSave(key, value) {
    const currentData = await getPlayerData();
    currentData[key] = value;
    return await savePlayerData(currentData);
}

async function updateMultipleAndSave(updates) { // updates bir obje: {key1: value1, key2: value2}
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

export async function saveHighScore(highScore) {
    // Yüksek skoru hem genel data içinde hem de stats olarak kaydetmek iyi olabilir (lider tablosu için)
    if (_ysdk && _ysdk.getPlayer) {
        try {
            const player = await _ysdk.getPlayer();
            await player.setStats({ highScore: highScore }); // Lider tablosu için stats
            console.log('High score set in stats:', highScore);
        } catch (error) {
            console.error('Failed to set high score in stats:', error);
        }
    }
    return updateAndSave('highScore', highScore);
}

export async function savePerfectGameStreakCount(count) {
    return updateAndSave('perfectGameStreakCount', count);
}

export async function saveAudioSettings(settings) {
    // settings objesi: { masterVolume, musicVolume, sfxVolume, isMuted }
    return updateMultipleAndSave(settings);
}

export async function saveLanguage(langCode) {
    return updateAndSave('currentLanguage', langCode);
}