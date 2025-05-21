// config.js

// Game Dimensions & Layout

export const NATIVE_WIDTH = 900;
export const NATIVE_HEIGHT = 1273;

export const MENU_NATIVE_WIDTH = 800;
export const MENU_NATIVE_HEIGHT = 900;

// Core Game Rules

export const MAX_LEVEL = 10;
export const TIME_LIMIT_SECONDS = 120;
export const MAX_AMMO = 8;
export const POINTS_PER_SECOND = 100;

// Game Object Dimensions

export const bottleWidth = 15;
export const bottleHeight = 30;
export const bulletWidth = 10;
export const bulletHeight = 10;

// Mechanics & Physics

export const bulletSpeed = 12;
export const spinDuration = 300; // ms
export const bottlePlacementRadius = 375;

export const centerX = NATIVE_WIDTH / 2;
export const centerY = NATIVE_HEIGHT / 2;

// Storage

export const STORAGE_KEY = 'spinShotFurySaveData';

// Scoring System

export function getBasePointsForLevel(level) {
    return level * 5 + 5;
}

// Bottle Placement per Level

export const levelAngles = [
    [45, 135, 270], // Level 1
    [45, 135, 225, 315], // Level 2
    [0, 180, 270, 135, 45], // Level 3
    [0, 45, 90, 135, 180, 225, 270, 315], // Level 4
    [0, 45, 90, 135, 180, 225, 270, 315], // Level 5
    [0, 45, 90, 135, 180, 225, 270, 315], // Level 6
    [0, 25, 50, 90, 130, 155, 180, 205, 230, 270, 310, 335], // Level 7
    [35, 55, 75, 105, 125, 145, 215, 235, 255, 285, 305, 325], // Level 8
    [0, 22.5, 45, 67.5, 90, 112.5, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 337.5], // Level 9
    [0, 22, 44, 66, 88, 110, 132, 154, 176, 198, 220, 242, 264, 286, 308, 330] // Level 10
];

// Red Bottle Placement


// Predefined red bottle positions for some levels
export const redBottlePlacements = [
    { levelIndex: 3, redIndices: [1, 3, 5, 7] },
    { levelIndex: 4, redIndices: [0, 2, 4, 6] },
    { levelIndex: 6, redIndices: [1, 3, 5, 7, 9, 11] },
    { levelIndex: 7, redIndices: [0, 2, 3, 5, 6, 8, 9, 11] },
    { levelIndex: 8, redIndices: [1, 3, 5, 6, 8, 10, 12, 13] },
    { levelIndex: 9, redIndices: [1, 3, 5, 7, 9, 11, 13, 15] }
];

// Random red bottle count for each level (if not predefined above)
export const redBottleCountsForRandomMode = {
    3: 4,
    4: 4,
    6: 6,
    7: 8,
    8: 8,
    9: 8
};

// Weapon Configuration

export const WEAPONS = [
    {
        id: 'revolver',
        name: 'Revolver',
        imageSrc: 'images/revolver.png',
        rotationSpeed: 1.2,
        maxAmmo: 8,
        unlockWins: 0,
        unlocksWith: null,
        description: 'Balanced and reliable.'
    },
    {
        id: 'glock17',
        name: 'Glock 17',
        imageSrc: 'images/glock17.png',
        rotationSpeed: 1.75,
        maxAmmo: 10,
        unlockWins: 10,
        unlocksWith: { weaponId: 'revolver', winsNeeded: 10 },
        description: 'Spins fast, shoots fast!'
    },
    {
        id: 'UMP45',
        name: 'UMP45',
        imageSrc: 'images/ump45.png',
        rotationSpeed: 0.7,
        maxAmmo: 12,
        unlockWins: 10,
        unlocksWith: { weaponId: 'glock17', winsNeeded: 10 },
        description: 'Slow but packs more ammo.'
    },
    {
        id: 'awm',
        name: 'AWM',
        imageSrc: 'images/awm.png',
        rotationSpeed: 0.5,
        maxAmmo: 8,
        unlocksWith: null,
        description: 'Ultimate precision. Unlocked by mastering all achievements.',
        scoreMultiplier: 2
    }
];

// Utility Functions

export function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

export function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Achievements

export const ACHIEVEMENTS = [
    { id: 'game_completed', name: 'Game Clear!', description: 'Successfully complete all levels.', icon: '🏆' },
    { id: 'unlock_weapon_2', name: 'New Firepower', description: 'Unlock the second weapon.', icon: '🔫' },
    { id: 'unlock_weapon_3', name: 'Fully Armed', description: 'Unlock the third weapon.', icon: '💣' },
    { id: 'perfect_game_no_miss', name: 'Flawless Victory', description: 'Complete all levels without missing a single shot.', icon: '🎯' },
    { id: 'fast_clear_1_min', name: 'Speed Runner', description: 'Complete all levels in under 1 minute (excluding time bonus).', icon: '⏱️' },
    { id: 'combo_master_x5', name: 'Combo Master', description: 'Achieve a x5 combo multiplier.', icon: '💥' },
    { id: 'perfect_game_weapon_2', name: 'Glock17 Ace', description: 'Complete all levels with the Glock17 without missing a shot.', icon: '🤠' },
    { id: 'first_red_bottle', name: 'Oops!', description: 'Hit a red bottle for the first time.', icon: '💀' },
    { id: 'level_5_clear', name: 'Halfway There', description: 'Complete level 5.', icon: '🚩' },
    { id: 'perfect_game_weapon_3', name: 'UMP45 Dominator', description: 'Complete all levels with the UMP45 without missing a shot.', icon: '🎖️' },
    { id: 'score_10000_points', name: 'Point Hoarder', description: 'Achieve a score of 10,000 points in a single game.', icon: '💰' },
    { id: 'ten_perfect_games', name: 'Perfectionist x10', description: 'Complete the game 10 times flawlessly (no misses).', icon: '🌟' },
    { id: 'achievement_master', name: 'Achievement Master', description: 'Unlock all other achievements.', icon: '👑' },
    { id: 'game_over_score_20k', name: 'Game Over!', description: 'Reach a score of 20,000 points. You broke the game!', icon: '💀', isHidden: true }
];
