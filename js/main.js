// main.js
// Initializes the game, sets up event listeners, and handles window resizing.

import { setupArmoryListeners } from './armory.js';
import * as ui from './ui.js';
import * as state from './state.js';
import * as storage from './storage.js';
import * as gameLogic from './gameLogic.js';
import * as playerAction from './playerAction.js';
import * as audio from './audio.js';
import { loadSounds, ensureAudioContext, notifyUserInteractionForMusic, applyCurrentAudioSettingsWAA } from './audio.js';
import { NATIVE_WIDTH, NATIVE_HEIGHT, MENU_NATIVE_WIDTH, MENU_NATIVE_HEIGHT } from './config.js';

function detectUserLanguage(ysdk) {
    let detectedLang = 'en';

    if (ysdk && ysdk.environment && ysdk.environment.i18n && ysdk.environment.i18n.lang) {
        const yandexLang = ysdk.environment.i18n.lang.substring(0, 2).toLowerCase();
        if (['en', 'tr', 'ru'].includes(yandexLang)) {
            return yandexLang;
        }
    }

    if (navigator.languages && navigator.languages.length) {
        for (const lang of navigator.languages) {
            const browserLang = lang.substring(0, 2).toLowerCase();
            if (['en', 'tr', 'ru'].includes(browserLang)) {
                return browserLang;
            }
        }
    } else if (navigator.language) {
        const browserLang = navigator.language.substring(0, 2).toLowerCase();
        if (['en', 'tr', 'ru'].includes(browserLang)) {
            return browserLang;
        }
    }

    return detectedLang;
}

let ysdkInstance = null;

const ASSETS_TO_LOAD = [
    'images/Background.png',
    'images/armory_background.png',
    'images/revolver.png',
    'images/glock17.png',
    'images/ump45.png',
    'images/awm.png',
    'images/bottle.png',
    'images/redbottle.png',
    'images/bullet_icon.png',
];

const progressBar = document.getElementById('loading-progress-bar');
const progressPercentageText = document.getElementById('loading-progress-percentage');
let assetsLoadedCount = 0;
const TOTAL_LOADING_STEPS = ASSETS_TO_LOAD.length + 1;

// Updates loading progress bar and percentage text.
function updateProgress() {
    assetsLoadedCount++;
    const percentage = Math.round((assetsLoadedCount / TOTAL_LOADING_STEPS) * 100);
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (progressPercentageText) progressPercentageText.textContent = `${percentage}%`;
}

// Preloads an asset (image) and updates progress.
async function preloadAsset(src) {
    return new Promise((resolve, reject) => {
        if (src.endsWith('.png') || src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.gif')) {
            const img = new Image();
            img.onload = () => {
                updateProgress();
                resolve(src);
            };
            img.onerror = () => reject(`Failed to load image: ${src}`);
            img.src = src;
        } else {
            resolve(src);
        }
    });
}

// Loads all assets, including images, sounds, and music elements.
async function loadAllAssets() {
    console.log("Starting asset loading...");
    const assetLoadPromises = ASSETS_TO_LOAD.map(src => 
        preloadAsset(src) // preloadAsset zaten updateProgress çağırıyor varsayıyorum
    );

    // loadSounds da bir Promise döndürür ve kendi içinde seslerin yüklenmesini yönetir.
    // Başarılı olursa updateProgress çağrılır.
    const soundLoadPromise = loadSounds().then(() => {
        updateProgress(); // loadSounds tamamlandığında ilerlemeyi güncelle
        console.log("Sounds and music loaded successfully.");
    }).catch(error => {
        console.error("Error loading sounds or music:", error);
        updateProgress(); // Hata olsa bile adımı tamamlanmış say (opsiyonel)
    });

    assetLoadPromises.push(soundLoadPromise);

    try {
        await Promise.all(assetLoadPromises);
        console.log("All assets and sounds/music setup complete.");
    } catch (error) {
        console.error("An error occurred during the loading process:", error);
        // Kullanıcıya bir hata mesajı göstermek ve yüklemeyi durdurmak iyi olabilir.
        const loadingText = document.querySelector('#loading-screen .loading-text');
        if (loadingText) {
            loadingText.textContent = 'Error loading game assets. Please refresh.';
            loadingText.style.color = 'red';
        }
        // Daha fazla ilerlemeyi engelle
        return Promise.reject(error);
    }
    console.log("loadAllAssets function finished.");
}

// Displays an interstitial ad and handles audio pause/resume.
async function showInterstitialAd(onAdClosedCallback) {
    if (state.areAdsRemoved()) {
        console.log("Ads are removed by user. Skipping Interstitial Ad.");
        if (onAdClosedCallback) {
            onAdClosedCallback(false);
        }
        return;
    }

    if (!ysdkInstance || !ysdkInstance.adv || typeof ysdkInstance.adv.showFullscreenAdv !== 'function') {
        console.warn("Yandex SDK or Adv module/showFullscreenAdv not available. Skipping Interstitial ad.");
        if (onAdClosedCallback) {
            onAdClosedCallback(false);
        }
        return;
    }

    audio.pauseAllAudioForAd();
    console.log("Attempting to show Interstitial Ad...");

    try {
        await new Promise((resolve, reject) => {
            ysdkInstance.adv.showFullscreenAdv({
                callbacks: {
                    onOpen: () => {
                        console.log("Interstitial Ad opened.");
                    },
                    onClose: function (wasShown) {
                        console.log("Interstitial Ad closed. Was shown:", wasShown);
                        audio.resumeAllAudioAfterAd().then(() => {
                        if (onAdClosedCallback) {
                            onAdClosedCallback(wasShown);
                        }
                        resolve(wasShown);
                    })},
                    onError: function (errorData) {
                        console.error("Interstitial Ad error:", errorData);
                        audio.resumeAllAudioAfterAd().then(() => {

                        if (onAdClosedCallback) {
                            onAdClosedCallback(false);
                        }

                        reject(new Error(typeof errorData === 'string' ? errorData : JSON.stringify(errorData)));
                    })},
                    onOffline: () => {
                        console.warn("Interstitial Ad offline. Cannot show ad.");
                        audio.resumeAllAudioAfterAd().then(() => {
                        if (onAdClosedCallback) {
                            onAdClosedCallback(false);
                        }
                        resolve(false);
                    })}
                }
            });
        });
    } catch (error) {
        console.error("Exception during showFullscreenAdv call or its callbacks:", error);
        if (!audio.sfxPausedByAd && !audio.musicPausedByAd) {
            audio.resumeAllAudioAfterAd();
        }
        if (onAdClosedCallback) {
            onAdClosedCallback(false);
        }
    }
}
// Displays a rewarded video ad and handles callbacks.
/**
 * @param {function} onRewarded 
 * @param {function} [onClose] 
 * @param {function} [onError] 
 */
export async function showRewardedVideoAd(onRewarded, onClose, onError) {
    console.log("Attempting to show Rewarded Video Ad or grant reward directly.");

    if (state.areAdsRemoved()) {
        console.log("Ads are removed by user. Granting reward directly for Rewarded Video action.");
        if (onRewarded) {
            try {
                onRewarded();
            } catch (e) {
                console.error("Error in onRewarded callback after direct grant:", e);
                if (onError) onError(e);
            }
        }
        if (onClose) {
            onClose(false);
        }
        return;
    }

    if (!ysdkInstance || !ysdkInstance.adv || typeof ysdkInstance.adv.showRewardedVideo !== 'function') {
        console.warn("Yandex SDK or Rewarded Video module/showRewardedVideo not available. Skipping ad.");
        if (onError) {
            onError("SDK_REWARDED_UNAVAILABLE");
        }
        if (onClose) {
            onClose(false);
        }
        return;
    }

    audio.pauseAllAudioForAd();
    console.log("Showing Rewarded Video Ad via SDK...");

    try {
        await new Promise((resolve, reject) => {
            ysdkInstance.adv.showRewardedVideo({
                callbacks: {
                    onOpen: () => {
                        console.log('REWARDED_AD: Opened.');
                    },
                    onRewarded: () => {
                        console.log('REWARDED_AD: User was rewarded by watching ad!');
                        if (onRewarded) {
                            try {
                                onRewarded();
                            } catch (e) {
                                console.error("Error in onRewarded callback after ad watch:", e);
                            }
                        }
                    },
                    onClose: (wasShown) => {
                        console.log('REWARDED_AD: Closed. Was shown:', wasShown);
                        audio.resumeAllAudioAfterAd();
                        if (onClose) {
                            onClose(wasShown);
                        }
                        resolve(wasShown);
                    },
                    onError: (errorData) => {
                        console.error('REWARDED_AD: Error:', errorData);
                        audio.resumeAllAudioAfterAd();
                        if (onError) {
                            onError(errorData);
                        }
                        if (onClose) {
                            onClose(false);
                        }
                        reject(new Error(typeof errorData === 'string' ? errorData : JSON.stringify(errorData))); // Promise'ı reddet
                    }
                }
            });
        });
    } catch (error) {
        console.error("Exception during showRewardedVideo call or its callbacks:", error);
        if (!audio.sfxPausedByAd && !audio.musicPausedByAd) {
            audio.resumeAllAudioAfterAd();
        }
        if (onError) {
            onError(error.message || "UNKNOWN_REWARDED_AD_EXCEPTION");
        }
        if (onClose) {
            onClose(false);
        }
    }
}

// Initializes the game by loading progress, audio, and setting up UI and events.
async function initGame() {
    await gameLogic.loadProgressAndInitialize();
    applyCurrentAudioSettingsWAA();
    ui.updateAllTextsForLanguage();

    ui.setupSettingsListeners();
    setupEventListeners();
    setupArmoryListeners();
    handleResize();

    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'none';
    ui.showMainMenu();

    await showInterstitialAd(async wasShown => {
        if (ysdkInstance?.features?.LoadingAPI) {
            try {
                await ysdkInstance.features.LoadingAPI.ready();
            } catch (error) {
                console.error('Error calling LoadingAPI.ready():', error);
            }
        }
    });
}

// Main entry point for game initialization.
async function main() {
    try {
        ysdkInstance = await YaGames.init();
        storage.setYandexSDK(ysdkInstance);
    } catch (e) {
        console.warn('Yandex SDK could not be initialized.', e);
        ysdkInstance = null;
        storage.setYandexSDK(null);
    }

    const initialUserLang = detectUserLanguage(ysdkInstance);
    state.setCurrentLanguage(initialUserLang);
    try {
        await loadAllAssets();
        await initGame();
    } catch (error) {
        const loadingText = document.querySelector('#loading-screen .loading-text');
        if (loadingText) {
            loadingText.textContent = 'Error loading game assets. Please refresh.';
            loadingText.style.color = 'red';
        }
        console.error("Error during asset loading or game initialization:", error);
    }
}

// Sets up event listeners for game interactions and UI navigation.
function setupEventListeners() {
    if (ui.gameContainer) {
        ui.gameContainer.addEventListener('click', handleGameClick);
    }
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    const buttons = {
        'play-button': ui.showModeSelectScreen,
        'leaderboard-button': ui.showLeaderboardScreen,
        'how-to-play-button': ui.showHowToPlayScreen,
        'settings-button': ui.showSettingsScreen,
        'armory-button': ui.showArmoryScreen,
        'achievements-button': ui.showAchievementsScreen,
        'play-again-button': async () => {
            if (state.isGameWon()) {
                await showInterstitialAd(wasShown => {
                    state.resetLostGamePlayAgainCount();
                    gameLogic.startGame();
                });
            } else {
                if (state.getLostGamePlayAgainCount() >= 1) {
                    await showInterstitialAd(wasShown => {
                        state.incrementLostGamePlayAgainCount();
                        gameLogic.startGame();
                    });
                } else {
                    state.incrementLostGamePlayAgainCount();
                    gameLogic.startGame();
                }
            }
        },
        'exit-button': async () => {
            await showInterstitialAd(wasShown => {
                ui.showMainMenu();
            });
        },
        'leaderboard-back-button': ui.showMainMenu,
        'achievements-back-button': ui.showMainMenu,
        'how-to-play-back-button': ui.showMainMenu,
        'settings-back-button': ui.showMainMenu,
        'in-game-exit-button': handleInGameExit,
        'normal-mode-button': () => {
            state.setCurrentGameMode('normal');
            gameLogic.startGame();
        },
        'random-mode-button': () => {
            state.setCurrentGameMode('random');
            gameLogic.startGame();
        },
        'mode-select-back-button': ui.showMainMenu,
    };

    Object.entries(buttons).forEach(([id, handler]) => {
        const button = document.getElementById(id);
        if (button) button.addEventListener('click', () => {
            handleUserInteraction();
            handler();
        });
    });

    const nonInteractiveScreenIds = [
        'main-menu', 'leaderboard-screen', 'mode-select-screen', 'armory-screen',
        'achievements-screen', 'how-to-play-screen', 'settings-screen', 'game-wrapper',
        'game-complete-screen', 'loading-screen', 'orientation-blocker', 'confirmation-modal'
    ];

    nonInteractiveScreenIds.forEach(screenId => {
        const screenElement = document.getElementById(screenId);
        if (screenElement) {
            screenElement.addEventListener('contextmenu', function (event) {
                if (!(event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA')) {
                    event.preventDefault();
                }
            });
        }
    });

    document.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    });
}

// Handles in-game exit by stopping game loops and showing main menu.
async function handleInGameExit() {
    await showInterstitialAd(wasShown => {
        state.setGameOver(true);
        gameLogic.stopTimer();
        state.setRotating(false);
        state.setSpinning(false);
        state.cancelAnimationFrame();
        state.cancelSpinAnimationFrame();
        state.clearShotTimeout();
        state.setMenuActive(true);
        ui.showMainMenu();
    });
}

// Triggers audio context and music on user interaction.
function handleUserInteraction() {
    notifyUserInteractionForMusic();
    ensureAudioContext();
}

// Handles game click for firing and audio initialization.
function handleGameClick() {
    handleUserInteraction();
    playerAction.fire();
}

// Handles keydown events for firing and audio initialization.
function handleKeyDown(e) {
    handleUserInteraction();
    if (e.code === 'Space' && !e.repeat) {
        playerAction.fire();
    }
}

// Adjusts game and menu scaling based on window size.
function handleResize() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const menuScale = Math.min(windowWidth / MENU_NATIVE_WIDTH, windowHeight / MENU_NATIVE_HEIGHT);
    const elements = [
        'main-menu-content',
        'how-to-play-content',
        'settings-content',
        'mode-select-content',
    ];

    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element && element.parentElement.style.display === 'flex') {
            element.style.transform = `scale(${menuScale})`;
        }
    });
}

// Starts the game initialization.
main();