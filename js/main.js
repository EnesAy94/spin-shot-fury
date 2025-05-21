// main.js
// Initializes the game, sets up event listeners, and handles window resizing.

import { setupArmoryListeners } from './armory.js';
import * as ui from './ui.js';
import * as state from './state.js';
import * as storage from './storage.js';
import * as gameLogic from './gameLogic.js';
import * as playerAction from './playerAction.js';
import { loadSounds, ensureAudioContext, notifyUserInteractionForMusic, applyCurrentAudioSettings, ensureMusicElementsReady, manageMusic } from './audio.js';
import { NATIVE_WIDTH, NATIVE_HEIGHT, MENU_NATIVE_WIDTH, MENU_NATIVE_HEIGHT } from './config.js';

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

function updateProgress() {
    assetsLoadedCount++;
    const percentage = Math.round((assetsLoadedCount / (ASSETS_TO_LOAD.length + 2)) * 100); // +2 loadSounds ve ensureMusicElementsReady için
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    if (progressPercentageText) {
        progressPercentageText.textContent = `${percentage}%`;
    }
}

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

async function loadAllAssets() {
    const assetPromises = ASSETS_TO_LOAD.map(preloadAsset);

    assetPromises.push(loadSounds().then(() => { updateProgress(); }));

    assetPromises.push(new Promise(resolve => {
        ensureMusicElementsReady();
        updateProgress();
        resolve();
    }));

    await Promise.all(assetPromises);
}



// Initializes the game by loading progress, audio, and setting up UI and events.
async function initGame() {
    try {
        ysdkInstance = await YaGames.init();
        console.log('Yandex SDK initialized');
    } catch (e) {
        console.warn('Yandex SDK initialization failed.', e);
    }

    console.log('All assets supposedly loaded.');

    gameLogic.loadProgressAndInitialize();
    applyCurrentAudioSettings();
    ui.updateAllTextsForLanguage();

    ui.setupSettingsListeners();
    setupEventListeners();
    setupArmoryListeners();
    handleResize();

    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    ui.showMainMenu();

    if (ysdkInstance && ysdkInstance.features.LoadingAPI) {
        ysdkInstance.features.LoadingAPI.ready();
        console.log('LoadingAPI.ready() called');
    } else {
        console.warn('Yandex SDK LoadingAPI not available.');
    }
}

async function main() {

    const savedProgress = storage.loadGameProgress();
    if (savedProgress.currentLanguage) {
        state.setCurrentLanguage(savedProgress.currentLanguage);
    }
    ui.updateAllTextsForLanguage();

    try {
        await loadAllAssets();
        await initGame();
    } catch (error) {
        console.error("Error during asset loading or game initialization:", error);
        const loadingText = document.querySelector('#loading-screen .loading-text');
        if (loadingText) {
            loadingText.textContent = 'Error loading game assets. Please refresh.';
            loadingText.style.color = 'red';
        }
    }
}


// Sets up event listeners for game interactions and UI navigation.
function setupEventListeners() {
    if (ui.gameContainer) {
        ui.gameContainer.addEventListener('click', handleGameClick);
    }
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    window.addEventListener('load', () => {
        // İlk yüklemede şişeleri oluştur
        if (typeof createBottles === 'function') {
            createBottles();
        }

        // Ekran boyutu değiştiğinde şişeleri yeniden konumlandır
        window.addEventListener('resize', () => {
            if (typeof handleResize === 'function') {
                handleResize();
            }
        });
    });


    const buttons = {
        'play-button': ui.showModeSelectScreen,
        'how-to-play-button': ui.showHowToPlayScreen,
        'settings-button': ui.showSettingsScreen,
        'armory-button': ui.showArmoryScreen,
        'achievements-button': ui.showAchievementsScreen,
        'play-again-button': gameLogic.startGame,
        'exit-button': ui.showMainMenu,
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
        if (button) button.addEventListener('click', handler);
    });
}

// Handles in-game exit by stopping game loops and showing main menu.
function handleInGameExit() {
    state.setGameOver(true);
    gameLogic.stopTimer();
    state.setRotating(false);
    state.setSpinning(false);
    state.cancelAnimationFrame();
    state.cancelSpinAnimationFrame();
    state.clearShotTimeout();
    manageMusic('menu');
    ui.showMainMenu();
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