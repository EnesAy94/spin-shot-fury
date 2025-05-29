// js/audio.js
import * as state from './state.js'; // state.js dosyanızın doğru yolda olduğundan emin olun

// --- Web Audio API Genel Ayarları ---
let audioContext;
let userHasInteracted = false; // Kullanıcı etkileşimi oldu mu?
let sfxPausedByAd = false; // Reklam için SFX ve AudioContext duraklatıldı mı?
let musicPausedByAd = false; // Reklam için Müzik duraklatıldı mı?
let musicShouldBePlayingType = null; // Reklam sonrası hangi müzik tipi çalmalı?

// --- Ses Efektleri (SFX) Bufferları ---
let gunshotBuffer = null;
let bottleBreakBuffer = null;

// --- Müzik Bufferları ve Kontrolleri (Web Audio API) ---
let menuMusicBuffer = null;
let gameMusicBuffer = null;
let currentMusicSourceNode = null; // O an çalan müziğin source node'u
let musicGainNode = null; // Müzik ses seviyesi için gain node
let activeMusicTypeWAA = null; // 'menu', 'game' veya null

const MENU_MUSIC_PATH = 'audio/menu.mp3';
const GAME_MUSIC_PATH = 'audio/playgame.mp3';

// --- AudioContext Başlatma ve Ses Yükleme ---

// AudioContext'i başlatır veya askıdan alır.
function _initAudioContextInternal() {
    if (!audioContext) {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext();
            console.log("AudioContext initialized.");
        } catch (e) {
            console.error("Web Audio API not supported or AudioContext creation failed.", e);
            return false;
        }
    }
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log("AudioContext resumed by internal init.");
        }).catch(e => console.error("AudioContext resume error in internal init:", e));
    }
    return true;
}

// Verilen URL'den ses dosyasını yükler ve decode eder.
async function _loadSoundInternal(url) {
    if (!_initAudioContextInternal() || !audioContext) return null;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error: ${response.status} for ${url}`);
        const arrayBuffer = await response.arrayBuffer();
        return await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
        console.error(`Failed to load or decode sound: ${url}`, error);
        return null;
    }
}

// Tüm SFX ve Müzik dosyalarını yükler.
export async function loadSounds() {
    if (!_initAudioContextInternal()) return;

    try {
        [gunshotBuffer, bottleBreakBuffer, menuMusicBuffer, gameMusicBuffer] = await Promise.all([
            _loadSoundInternal('audio/gunshot.wav'),
            _loadSoundInternal('audio/bottle_break.wav'),
            _loadSoundInternal(MENU_MUSIC_PATH),
            _loadSoundInternal(GAME_MUSIC_PATH)
        ]);
        if (gunshotBuffer && bottleBreakBuffer && menuMusicBuffer && gameMusicBuffer) {
            console.log("All sounds and music successfully loaded and decoded.");
        } else {
            console.warn("One or more sound/music files failed to load or decode.");
        }
    } catch (error) {
        console.error("Error during parallel sound/music loading:", error);
    }
}

// AudioContext'in var olduğundan ve çalışır durumda olduğundan emin olur.
export function ensureAudioContext() {
    _initAudioContextInternal();
}

// --- Ses Efekti (SFX) Çalma ---
export function playSound(type) {
    ensureAudioContext();
    if (!audioContext || audioContext.state === 'suspended' || sfxPausedByAd || state.getIsMuted()) {
        return;
    }

    let bufferToPlay = null;
    if (type === 'gunshot') bufferToPlay = gunshotBuffer;
    else if (type === 'break') bufferToPlay = bottleBreakBuffer;

    if (!bufferToPlay) {
        // console.warn(`SFX buffer for type "${type}" not loaded or available.`);
        return;
    }

    try {
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain(); // Her SFX için ayrı gain node

        source.buffer = bufferToPlay;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.setValueAtTime(
            state.getMasterVolume() * state.getSfxVolume(),
            audioContext.currentTime
        );
        source.start(0);
    } catch (error) {
        console.error(`Failed to play SFX (${type}):`, error);
    }
}

// --- Müzik Yönetimi (Web Audio API) ---

// Müzik için global gain node'unu oluşturur/sağlar.
function ensureMusicGainNode() {
    if (!audioContext) _initAudioContextInternal();
    if (audioContext && !musicGainNode) {
        musicGainNode = audioContext.createGain();
        musicGainNode.connect(audioContext.destination);
        console.log("MusicGainNode created and connected.");
    }
}

// O an çalan Web Audio API müziğini durdurur.
function stopCurrentMusicWAA(preserveActiveType = false) {
    if (currentMusicSourceNode) {
        try {
            currentMusicSourceNode.stop();
        } catch (e) {
            // Hata oluşursa (örn. zaten durmuşsa), görmezden gel
        }
        currentMusicSourceNode.disconnect();
        currentMusicSourceNode = null;
        console.log("WAA Music source stopped and disconnected.");
    }
    if (!preserveActiveType) {
        // activeMusicTypeWAA = null; // Durdurulduğunda tipi sıfırlama, manageMusicWAA karar versin
    }
}

// Belirtilen tipteki müziği Web Audio API ile çalar.
export function manageMusicWAA(type) {
    ensureAudioContext();
    ensureMusicGainNode();

    if (!audioContext || !musicGainNode) {
        console.warn("Cannot manage WAA music: AudioContext or MusicGainNode not ready.");
        return;
    }
    
    // Reklam sırasındaysa veya kullanıcı etkileşimi olmadıysa müzik başlatma.
    // Ancak ses ayarı değiştiğinde (örn. mute açıldı) bu fonksiyon çağrılabilir,
    // bu yüzden reklam kontrolü burada da olmalı.
    if (sfxPausedByAd && type !== 'stop') { // sfxPausedByAd genel duraklatma
        musicShouldBePlayingType = type; // Duraklatıldı ama bu tip çalmalıydı
        console.log(`Music playback for ${type} deferred due to ad pause.`);
        return;
    }


    const isMuted = state.getIsMuted();
    const newVolume = isMuted ? 0 : state.getMasterVolume() * state.getMusicVolume();
    if (musicGainNode.gain.value !== newVolume) {
         musicGainNode.gain.setValueAtTime(newVolume, audioContext.currentTime);
    }

    // Eğer istenen müzik zaten çalıyorsa (ve mute durumu değişmediyse) bir şey yapma
    if (type === activeMusicTypeWAA && currentMusicSourceNode && !isMuted) {
        console.log(`${type} music already playing with WAA.`);
        return;
    }
    // Eğer mute ise ve istenen tip aktif ise (ama çalmıyorsa)
    if (isMuted && type === activeMusicTypeWAA) {
        stopCurrentMusicWAA(); // Mute ise ve bir şey çalıyorsa durdur
        console.log("Music stopped due to mute, type was:", type);
        return; // Mute ise yeni müzik başlatma
    }


    // Önce mevcut müziği durdur (tip değişiyorsa veya 'stop' komutu geldiyse)
    if (type !== activeMusicTypeWAA || type === 'stop' || isMuted) {
        stopCurrentMusicWAA(type === activeMusicTypeWAA && isMuted); // Eğer aynı tip mute ediliyorsa tipi koru
    }
    
    if (isMuted || type === 'stop') {
        activeMusicTypeWAA = (type === 'stop' ? null : activeMusicTypeWAA); // 'stop' ise tipi sıfırla
        console.log(isMuted ? "Music remains stopped (muted)." : "All WAA music stopped by command.");
        return;
    }


    let bufferToPlay = null;
    if (type === 'menu') {
        bufferToPlay = menuMusicBuffer;
    } else if (type === 'game') {
        bufferToPlay = gameMusicBuffer;
    } else {
        console.warn("Unknown music type for WAA:", type);
        activeMusicTypeWAA = null;
        return;
    }

    if (bufferToPlay) {
        if (!userHasInteracted && audioContext.state === 'suspended') {
            console.log(`WAA Music for ${type} deferred until user interaction (AudioContext suspended).`);
            activeMusicTypeWAA = type; // Kullanıcı etkileşiminden sonra çalması için tipi sakla
            return;
        }
        if (audioContext.state === 'suspended') {
             console.warn(`Cannot play WAA music ${type}, AudioContext is suspended.`);
             activeMusicTypeWAA = type; // Kullanıcı etkileşiminden sonra çalması için tipi sakla
             return;
        }

        try {
            currentMusicSourceNode = audioContext.createBufferSource();
            currentMusicSourceNode.buffer = bufferToPlay;
            currentMusicSourceNode.loop = true;
            currentMusicSourceNode.connect(musicGainNode);
            currentMusicSourceNode.start(0);
            activeMusicTypeWAA = type;
            console.log(`${type} music started with Web Audio API.`);
        } catch (e) {
            console.error(`Failed to play ${type} music with WAA:`, e);
            activeMusicTypeWAA = null;
        }
    } else {
        console.warn(`WAA Music buffer for type "${type}" not loaded. Attempting to load sounds again if needed.`);
        activeMusicTypeWAA = type; // Buffer yüklenince çalması için tipi sakla
        // Eğer bufferlar yüklenmemişse, burada loadSounds() tekrar çağrılabilir veya
        // bir flag set edilip, yükleme bitince bu müzik çalınabilir.
        // Şimdilik sadece uyarı veriyoruz. loadSounds() main.js'de çağrılıyor olmalı.
    }
}

// Mevcut ses ayarlarını Web Audio API müziğine uygular.
export function applyCurrentAudioSettingsWAA() {
    ensureAudioContext();
    ensureMusicGainNode();

    if (!audioContext || !musicGainNode) return;

    const isMuted = state.getIsMuted();
    const newVolume = isMuted ? 0 : state.getMasterVolume() * state.getMusicVolume();

    if (musicGainNode.gain.value !== newVolume) {
        musicGainNode.gain.setValueAtTime(newVolume, audioContext.currentTime);
        console.log("WAA Music volume updated:", newVolume);
    }

    if (isMuted && currentMusicSourceNode) {
        // Mute edildiyse ve müzik çalıyorsa durdur. Tipi koru ki unmute olunca devam etsin.
        console.log("Muting: Stopping current WAA music, preserving type:", activeMusicTypeWAA);
        stopCurrentMusicWAA(true);
    } else if (!isMuted && !currentMusicSourceNode && activeMusicTypeWAA && !sfxPausedByAd) {
        // Mute değil, müzik çalmıyor ama çalması gereken bir tip var ve reklam arası değil.
        console.log("Unmuting: Attempting to restart WAA music type:", activeMusicTypeWAA);
        manageMusicWAA(activeMusicTypeWAA);
    }
}

// --- Reklamlar İçin Ses Yönetimi ---

export function pauseAllAudioForAd() {
    console.log("Pausing all audio for ad (WAA version).");
    musicShouldBePlayingType = activeMusicTypeWAA; // Hangi müziğin çalması gerektiğini sakla

    if (currentMusicSourceNode) {
        stopCurrentMusicWAA(true); // Müziği durdur ama tipi koru
        musicPausedByAd = true;
        console.log("WAA music paused for ad. Type to resume:", musicShouldBePlayingType);
    } else {
        musicPausedByAd = false; // Çalan müzik yoktu
    }

    sfxPausedByAd = true; // SFX'leri ve AudioContext'i duraklat
    if (audioContext && audioContext.state === 'running') {
        audioContext.suspend().then(() => console.log("AudioContext suspended for ad.")).catch(e => console.error("Error suspending AudioContext for ad:", e));
    }
}

export function resumeAllAudioAfterAd() {
    console.log("Resuming all audio after ad (WAA version).");
    sfxPausedByAd = false;

    // Promise döndür
    return new Promise((resolve, reject) => {
        const resumeContextPromise = (audioContext && audioContext.state === 'suspended')
            ? audioContext.resume()
            : Promise.resolve();

        resumeContextPromise.then(() => {
            console.log("AudioContext resumed after ad (within promise).");
            if (musicPausedByAd && musicShouldBePlayingType) {
                console.log("Attempting to resume WAA music type after ad:", musicShouldBePlayingType);
                if (!state.getIsMuted()) {
                    manageMusicWAA(musicShouldBePlayingType);
                } else {
                    activeMusicTypeWAA = musicShouldBePlayingType;
                }
            } else if (!currentMusicSourceNode && activeMusicTypeWAA && !state.getIsMuted()) {
                manageMusicWAA(activeMusicTypeWAA);
            }
            musicPausedByAd = false;
            applyCurrentAudioSettingsWAA();
            resolve(); // Her şey yolunda, Promise'i resolve et
        }).catch(e => {
            console.error("Error resuming audio context or WAA music after ad:", e);
            musicPausedByAd = false; // Yine de flag'i temizle
            applyCurrentAudioSettingsWAA(); // Ayarları yine de uygula
            reject(e); // Promise'i reject et
        });
    });
}

// --- Kullanıcı Etkileşimi ---
// Bu fonksiyon, ilk kullanıcı etkileşiminde çağrılmalı.
export function notifyUserInteractionForMusic() {
    if (!userHasInteracted) {
        userHasInteracted = true;
        console.log("User interaction detected.");
        if (_initAudioContextInternal()) { // AudioContext'i başlat/devam ettir
            // Eğer menüdeysek ve müzik çalması gerekiyorsa (ve reklam arası değilse)
            if (state.isMenuActive() && !currentMusicSourceNode && !sfxPausedByAd && !state.getIsMuted()) {
                console.log("Attempting to play menu music on first user interaction.");
                manageMusicWAA('menu');
            } else if (state.isMenuActive() && !currentMusicSourceNode && !sfxPausedByAd && state.getIsMuted()){
                 console.log("Menu music not started on interaction because master mute is on.");
                 activeMusicTypeWAA = 'menu'; // Mute açılırsa çalması için tipi ayarla
            }
        }
    } else {
        // Kullanıcı zaten etkileşimde bulundu, sadece context'i devam ettir (gerekirse)
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log("AudioContext resumed on subsequent interaction.");
                // Eğer bir müzik çalması gerekiyorsa ve durmuşsa, burada da kontrol edilebilir
                if (!currentMusicSourceNode && activeMusicTypeWAA && !sfxPausedByAd && !state.getIsMuted()) {
                    manageMusicWAA(activeMusicTypeWAA);
                }
            }).catch(e => console.error("Error resuming AudioContext on subsequent interaction:", e));
        }
    }
}

// Eski HTML Audio elementleriyle ilgili fonksiyonlar kaldırıldı.
// initializeMusicElements()
// ensureMusicElementsReady()