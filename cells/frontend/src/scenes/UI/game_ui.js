// @ts-check
/// <reference path="../../types/phaser.d.ts" />

import { Cells } from "../../core/cells.js";
import { Bar } from "../../core/utils.js";
import { OfflineGame } from "../offline_game.js";


export class GameUI extends Phaser.Scene {
    constructor () {
        super("game-ui");
    }


    init (data) {
        /** @type {OfflineGame} */
        this.gameScene = data.scene;
        /** @type {Cells} */
        this.cell = data.cell;
    }


    create () {
        this.initHUD();
        this.scene.bringToTop();
    }


    initHUD () {
        if (!this.cell || !this.gameScene) return; 
        const windows = this.cameras.main;
        this.alivesText = this.add.text(windows.width * 0.5, windows.height * 0.1, `alives: ${this.gameScene.cells.length}`)
            .setScrollFactor(0);
        this.lifeBar = new Bar(
            this.gameScene, 
            windows.width * 0.1,
            windows.height * 0.1, 
            this.cell.life, 
            this.cell.maxLife, 
            0x5b5b5b, 
            true,
            {"r": 239,"g": 50, "b": 50},
            {"r": 50,"g": 239,"b": 91}
        ).setScrollFactor(0);

        this.pointsBar = new Bar(
            this.gameScene, 
            windows.width * 0.1,
            windows.height * 0.12,
            this.cell.points, 
            this.cell.nextLevel, 
            0x5b5b5b, 
            false,
            {"r": 48,"g": 161, "b": 222}
        ).setScrollFactor(0);

        this.speedSecondUI = this.gameScene.add.text(
            windows.width * 0.1,
            windows.height * 0.14,
            `${this.cell.speedSecond} px/s`
        ).setScrollFactor(0);
    }


    update () {
        if (!this.gameScene || !this.cell) return;

        this.speedSecondUI?.setText(`${this.cell.speedSecond} px/s`);
        this.lifeBar?.updateValue(this.cell.life, this.cell.maxLife);
        this.pointsBar?.updateValue(this.cell.points, this.cell.nextLevel); 
        this.alivesText?.setText(`alives: ${this.gameScene.cells.length}`) 
        
    }


    /**
     * 
     * @param {Cells} cell 
     */
    changeReference (cell) {
        if (!this.speedSecondUI) return;        
        this.cell = cell;

        this.speedSecondUI.text = `${this.cell.speedSecond} px/s`;
        this.lifeBar?.updateValue(this.cell.life, this.cell.maxLife);
        this.pointsBar?.updateValue(this.cell.points, this.cell.nextLevel);
    }
}

