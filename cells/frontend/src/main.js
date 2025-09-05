// @ts-check

import { OfflineGame } from "./scenes/offline_game.js";
import { DeckUI } from "./scenes/UI/upgrade_deck.js";
import { GameUI } from "./scenes/UI/game_ui.js";


/** @type {Phaser.Types.Core.GameConfig} */
const gameConfig = {
    width: window.innerWidth,
    height: window.innerHeight,
    scene: [OfflineGame, DeckUI, GameUI],
    physics: {
        default: "arcade"
    },
    fps: {
        target: 60,
        forceSetTimeOut: true
    }
};


const game = new Phaser.Game(gameConfig);
game.scene.start("offline-scene");