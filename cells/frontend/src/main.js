// @ts-check

import { OfflineGame } from "./core/offline_game.js";
import { DeckUI } from "./core/upgrade_deck_ui.js";


/** @type {Phaser.Types.Core.GameConfig} */
const gameConfig = {
    width: window.innerWidth,
    height: window.innerHeight,
    scene: [OfflineGame, DeckUI],
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