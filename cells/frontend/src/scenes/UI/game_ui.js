// @ts-check
/// <reference path="../../types/phaser.d.ts" />

import { Cells } from "../../core/cells.js";
import { Bar, rexTag } from "../../core/utils.js";
import { OfflineGame } from "../offline_game.js";


export class GameUI extends Phaser.Scene {
    constructor () {
        super("game-ui");
        this.killedBy = null;

        this.ranking = {}
        let pos = 0;
        this.getPos = () => {
            pos += 15;
            return pos;
        }
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
        this.createRanking();
    }


    initHUD () {
        const windows = this.cameras.main;

        this.initBars(windows);
        this.initTexts(windows);
    }


    initBars (windows) {
        if (!this.cell || !this.gameScene) return;

        this.lifeBar = new Bar(
            this.gameScene, 
            windows.width * 0.05,
            windows.height * 0.05 + this.getPos(), 
            this.cell.life, 
            this.cell.maxLife, 
            0x5b5b5b, 
            true,
            {"r": 239,"g": 50, "b": 50},
            {"r": 50,"g": 239,"b": 91}
        ).setScrollFactor(0);

        this.pointsBar = new Bar(
            this.gameScene, 
            windows.width * 0.05,
            windows.height * 0.05 + this.getPos(),
            this.cell.points, 
            this.cell.nextLevel, 
            0x5b5b5b, 
            false,
            {"r": 48,"g": 161, "b": 222}
        ).setScrollFactor(0);

        this.staminaBar = new Bar(
            this.gameScene,
            windows.width * 0.05,
            windows.height * 0.05 + this.getPos(),
            this.cell.stamina,
            this.cell.maxStamina,
            0x5b5b5b,
            false,
            {"r": 163, "g": 229, "b":21}
        ).setScrollFactor(0);
    }


    initTexts (windows) {
        if (!this.cell || !this.gameScene) return;

        this.speedSecondUI = this.gameScene.add.text(
            windows.width * 0.05,
            windows.height * 0.05 + this.getPos(),
            `${this.cell.speedSecond} px/s`,
            {
                fontSize: 12,
                fontFamily: "quicksand_font",
                resolution: 2
            }
        ).setScrollFactor(0);

        this.killsText = this.add.text(
            windows.width * 0.05,
            windows.height * 0.05 + this.getPos(),
            `kills: ${this.cell.kills}`, {
                fontSize: 12,
                resolution: 2,
                fontFamily: "quicksand_font"
            }
        ).setScrollFactor(0);

        this.levelText = this.add.text(
            windows.width * 0.05,
            windows.height * 0.05 + this.getPos(),
            `level: ${this.cell.level}`, {
                fontSize: 12,
                resolution: 2,
                fontFamily: "quicksand_font"
            }
        ).setScrollFactor(0);

        if (this.cell.isPlayer) {
            // @ts-ignore
            this.runText = this.add.rexBBCodeText(windows.width * 0.5, windows.height * 0.8, "hold [size=18][color=lightgreen][b]SPACE[/b][/color][/size] to move faster", {
                color: "yellow",
                tags: rexTag(),
                fontSize: 15,
                resolution: 2,
                fontFamily: "quicksand_font"
            }).setScrollFactor(0).setOrigin(0.5);

            this.tweens.add({
                targets: this.runText,
                scale: {to: 1, from: 1.2},
                ease: 'Sine.easeInOut',
                duration: 700,
                yoyo: true,
                repeat: -1
            })
        }
    }


    createRanking () {
        for (let i = 0; i < 10; i ++) {
            const key = `pos${i}`;
            this.ranking[key] = this.add.text(
                window.innerWidth * 0.9,
                window.innerHeight * 0.1 + (i * 11),
                "undefined", {
                    fontSize: 10,
                    fontFamily: "quicksand_font"
                }
            )
        }
    }


    updateRanking () {
        if (!this.gameScene) return;

        const sorted = this.gameScene.cells
            .filter(c => c.conteiner.active)
            .sort((a, b) => b.allPoints - a.allPoints)
            .slice(0, 10);

        sorted.forEach((cell, i) => {
            const key = `pos${i}`;
            const text = this.ranking[key];
            text.text = `${i + 1}. ${cell.specie} (${Math.floor(cell.allPoints)})`;
            text.setColor((cell === this.gameScene?.player || cell.playerWatching) ? "#2ddc27ff" : "#e4e4e4ff");
        });
    }


    update () {
        if (!this.gameScene || !this.cell) return;

        this.lifeBar?.updateValue(this.cell.life, this.cell.maxLife);
        this.pointsBar?.updateValue(this.cell.points, this.cell.nextLevel);
        this.staminaBar?.updateValue(this.cell.stamina, this.cell.maxStamina); 
        
        this.speedSecondUI?.setText(`${this.cell.speedSecond} px/s`);
        this.killsText?.setText(`kills: ${this.cell.kills}`);
        this.levelText?.setText(`level: ${this.cell.level}`);

        this.updateRanking()
    }


    /**
     * 
     * @param {Cells} cell 
     */
    changeReference (cell, killedBy=null) {
        if (!this.speedSecondUI) return;        
        this.cell = cell;
        this.killedBy = killedBy
        
        this.speedSecondUI.text = `${this.cell.speedSecond} px/s`;
        this.lifeBar?.updateValue(this.cell.life, this.cell.maxLife);
        this.pointsBar?.updateValue(this.cell.points, this.cell.nextLevel);
        if (killedBy) this.initDeathUI();
    }


    initDeathUI () {
        const windows = this.cameras.main;
        // @ts-ignore
        const killedByText = this.add.rexBBCodeText(
            windows.width * 0.5,
            windows.height * 0.1,
            `killed by\n[b][color=red]${this.killedBy}[/color][/b]`,{
                fontSize: 15,
                fontFamily: "quicksand_font",
                color: "yellow",
                tags: rexTag(),
                align: "center"
            }
        ).setOrigin(0.5)
    }
}

