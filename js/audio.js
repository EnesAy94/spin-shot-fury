// js/audio.js
import * as state from './state.js';

// --- SOUND EFFECTS (Web Audio API) ---
let audioContext;
let gunshotBuffer = null;
let bottleBreakBuffer = null;
let sfxPausedByAd = false; 
let musicPausedByAd = false;
let musicShouldBePlayingType = null;

export function pauseAllAudioForAd() {
    console.log("Pausing all audio for ad.");
    musicShouldBePlayingType = activeMusicType; 

    if (activeMusicType && ((activeMusicType === 'menu' && menuMusicEl && !menuMusicEl.paused) || (activeMusicType === 'game' && gameMusicEl && !gameMusicEl.paused))) {
        manageMusic('stop'); 
        musicPausedByAd = true;
    }
    sfxPausedByAd = true; 
    if (audioContext && audioContext.state === 'running') {
        audioContext.suspend().then(() => console.log("AudioContext suspended for ad."));
    }
}

export function resumeAllAudioAfterAd() {
    console.log("Resuming all audio after ad.");
    if (musicPausedByAd && musicShouldBePlayingType) {
        manageMusic(musicShouldBePlayingType); 
        musicPausedByAd = false;
        musicShouldBePlayingType = null;
    }
    sfxPausedByAd = false;
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => console.log("AudioContext resumed after ad."));
    }
    applyCurrentAudioSettings();
}


function _initAudioContextInternal() {
    if (!audioContext) {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioContext();
        } catch (e) {
            console.error("Web Audio API not supported", e);
        }
    }
    if (audioContext?.state === 'suspended') {
        audioContext.resume().catch(e => console.error("AudioContext resume error:", e));
    }
}

async function _loadSoundInternal(url) {
    if (!audioContext) _initAudioContextInternal();
    if (!audioContext) return null;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        return await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
        console.error(`Failed to load sound: ${url}`, error);
        return null;
    }
}

export function ensureAudioContext() {
    _initAudioContextInternal();
}

export async function loadSounds() {
    ensureAudioContext();
    if (!audioContext) return;

    try {
        [gunshotBuffer, bottleBreakBuffer] = await Promise.all([
            _loadSoundInternal('audio/gunshot.wav'),
            _loadSoundInternal('audio/bottle_break.wav')
        ]);
    } catch (error) {
        console.error("Error loading sound effects:", error);
    }
}

export function playSound(type) {
    ensureAudioContext();
    if (!audioContext || audioContext.state === 'suspended' || sfxPausedByAd) return;
    if (state.getIsMuted()) return;

    let buffer = null;
    if (type === 'gunshot') buffer = gunshotBuffer;
    else if (type === 'break') buffer = bottleBreakBuffer;

    if (!buffer) return;

    try {
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();

        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.setValueAtTime(
            state.getMasterVolume() * state.getSfxVolume(),
            audioContext.currentTime
        );

        source.start(0);
    } catch (error) {
        console.error(`Failed to play sound (${type}):`, error);
    }
}

// --- MUSIC MANAGEMENT (<audio> elements) ---
let menuMusicEl = null;
let gameMusicEl = null;
let activeMusicType = null; // 'menu', 'game', or null
let userHasInteracted = false;

const MAX_MENU_MUSIC_VOLUME = 0.8;
const MAX_GAME_MUSIC_VOLUME = 0.3;

function initializeMusicElements() {
    if (menuMusicEl && gameMusicEl) return;

    menuMusicEl = document.getElementById('menu-music');
    gameMusicEl = document.getElementById('game-music');

    if (!menuMusicEl || !gameMusicEl) {
        console.error("Music elements not found in DOM.");
    }
}

export function ensureMusicElementsReady() {
    if (!menuMusicEl || !gameMusicEl) initializeMusicElements();
    return (menuMusicEl && gameMusicEl);
}

export function notifyUserInteractionForMusic() {
    if (!userHasInteracted) {
        userHasInteracted = true;
        if (activeMusicType === 'menu' && menuMusicEl?.paused) {
            manageMusic('menu');
        }
    }
}

function playMusicInternal(audioEl, type, maxVol) {
    if (!audioEl) return;

    if (state.getIsMuted()) {
        if (!audioEl.paused) audioEl.pause();
        return;
    }

    audioEl.volume = state.getMasterVolume() * state.getMusicVolume() * maxVol;

    if (audioEl.paused || audioEl.currentTime === 0) {
        audioEl.play().then(() => {
            activeMusicType = type;
        }).catch(error => {
            if (!userHasInteracted && ['NotAllowedError', 'AbortError'].includes(error.name)) {
                // Autoplay blocked
            } else {
                console.error(`Failed to play music (${type})`, error);
            }
        });
    } else {
        activeMusicType = type;
    }
}

function stopMusicInternal(audioEl, type, nextType = null) {
    if (audioEl && !audioEl.paused) {
        audioEl.pause();
        if (type === 'menu' && nextType === 'game') {
            audioEl.currentTime = 0;
        }
    }
}

export function manageMusic(type) {
    if (!ensureMusicElementsReady()) return;

    const prevActive = activeMusicType;

    if (state.getIsMuted() && type !== 'stop') {
        if (menuMusicEl && !menuMusicEl.paused) stopMusicInternal(menuMusicEl, 'menu');
        if (gameMusicEl && !gameMusicEl.paused) stopMusicInternal(gameMusicEl, 'game');
        activeMusicType = null;
        return;
    }

    if (type === 'menu') {
        if (activeMusicType !== 'menu') {
            stopMusicInternal(gameMusicEl, 'game');
            if (menuMusicEl && (prevActive === 'game' || menuMusicEl.paused || menuMusicEl.currentTime === 0)) {
                menuMusicEl.currentTime = 0;
            }
            playMusicInternal(menuMusicEl, 'menu', MAX_MENU_MUSIC_VOLUME);
        }
    } else if (type === 'game') {
        if (activeMusicType !== 'game') {
            if (activeMusicType === 'menu') stopMusicInternal(menuMusicEl, 'menu', 'game');
            playMusicInternal(gameMusicEl, 'game', MAX_GAME_MUSIC_VOLUME);
        }
    } else if (type === 'stop') {
        stopMusicInternal(menuMusicEl, 'menu');
        if (menuMusicEl) menuMusicEl.currentTime = 0;
        stopMusicInternal(gameMusicEl, 'game');
        if (gameMusicEl) gameMusicEl.currentTime = 0;
        activeMusicType = null;
    } else {
        console.warn("Unknown music type:", type);
    }
}

export function applyCurrentAudioSettings() {
    if (!ensureMusicElementsReady()) return;

    const isMuted = state.getIsMuted();

    if (isMuted) {
        if (!menuMusicEl?.paused) menuMusicEl.pause();
        if (!gameMusicEl?.paused) gameMusicEl.pause();
        return;
    }

    if (menuMusicEl) {
        menuMusicEl.volume = state.getMasterVolume() * state.getMusicVolume() * MAX_MENU_MUSIC_VOLUME;
        if (activeMusicType === 'menu' && menuMusicEl.paused && userHasInteracted) {
            menuMusicEl.play().catch(e => {});
        }
    }

    if (gameMusicEl) {
        gameMusicEl.volume = state.getMasterVolume() * state.getMusicVolume() * MAX_GAME_MUSIC_VOLUME;
        if (activeMusicType === 'game' && gameMusicEl.paused && userHasInteracted) {
            gameMusicEl.play().catch(e => {});
        }
    }
}

// Run once on script load to bind audio elements
initializeMusicElements();
