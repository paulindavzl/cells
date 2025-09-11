// @ts-check
/// <reference path="../../types/phaser.d.ts" />
/// <reference path="../../types/types.ts" />

import { Cells } from "../../core/cells.js";
import { Bar, rexTag } from "../../core/utils.js";
import { OfflineGame } from "../offline_game.js";


export class GameUI extends Phaser.Scene {
    constructor () {
        super("game-ui");
        // @ts-ignore   
        this.killedBy = null;

        this.ranking = {}
        let pos = 0;
        this.getPos = () => {
            pos += 15;
            return pos;
        }
        /** @type {EffectIconsType} */
        // @ts-ignore
        this.effectIcons = {};
        this.tooltipTexts = {};

        this.hoverCount = 0;
    }


    // @ts-ignore
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
        this.createEffectsIcons();
    }


    preload () {
        const icons = "assets/img/icons/";

        this.load.image("adrenaline", icons + "adrenaline_icon.png");
        this.load.image("reduced_defense", icons + "broken_shield_icon.png");
        this.load.image("reduced_attack", icons + "broken_sword_icon.png");
        this.load.image("low_stamina", icons + "low_stamina_icon.png");
        this.load.image("poison", icons + "poison_icon.png");
        this.load.image("reduced_regeneration", icons + "reduced_regeneration_icon.png");
        this.load.image("regeneration", icons + "regeneration_icon.png");
        this.load.image("reduced_speed", icons + "slowness_icon.png");
        this.load.image("increased_speed", icons + "speed_icon.png");
        this.load.image("increased_attack", icons + "sword_icon.png");
    }


    initHUD () {
        const windows = this.cameras.main;

        this.initBars(windows);
        this.initTexts(windows);
    }


    // @ts-ignore
    initBars (windows) {
        if (!this.cell || !this.gameScene) return;

        this.lifeBar = new Bar(
            this, 
            windows.width * 0.05,
            windows.height * 0.05 + this.getPos(), 
            this.cell.life, 
            this.cell.maxLife, 
            0x5b5b5b, 
            true,
            {"r": 239,"g": 50, "b": 50},
            {"r": 50,"g": 239,"b": 91}
        );
        this.lifeBar.object.setScrollFactor(0)
            .on("pointerover", () => {
                this.hoverCount++;
                if (this.hoverCount !== 1) return;

                this.stateText?.setY(this.lifeBar?.Y) // @ts-ignore
                    .setText(`${Math.floor(this.cell?.life)}/${Math.floor(this.cell?.maxLife)}`)
                    .setVisible(true);
                    if (this.cell?.scene.MODE === "offline" && !this.scene.isPaused("offline-scene")) this.scene.pause("offline-scene");
            })
            .on("pointerout", () => {
                this.hoverCount = Math.max(0, this.hoverCount - 1);
                if (this.hoverCount !== 0) return;

                this.stateText?.setVisible(false);
                if (this.cell?.scene.MODE === "offline") this.scene.resume("offline-scene");
            });

        this.pointsBar = new Bar(
            this, 
            windows.width * 0.05,
            windows.height * 0.05 + this.getPos(),
            this.cell.points, 
            this.cell.nextLevel, 
            0x5b5b5b, 
            false,
            {"r": 48,"g": 161, "b": 222}
        );
        this.pointsBar.object.setScrollFactor(0)
            .on("pointerover", () => {
                this.hoverCount++;
                if (this.hoverCount !== 1) return;

                this.stateText?.setY(this.pointsBar?.Y) // @ts-ignore
                    .setText(`${Math.floor(this.cell?.points)}/${Math.floor(this.cell?.nextLevel)}`)
                    .setVisible(true);
                    if (this.cell?.scene.MODE === "offline" && !this.scene.isPaused("offline-scene")) this.scene.pause("offline-scene");
            })
            .on("pointerout", () => {
                this.hoverCount = Math.max(0, this.hoverCount - 1);
                if (this.hoverCount !== 0) return;

                this.stateText?.setVisible(false);
                if (this.cell?.scene.MODE === "offline") this.scene.resume("offline-scene");
            });

        this.staminaBar = new Bar(
            this,
            windows.width * 0.05,
            windows.height * 0.05 + this.getPos(),
            this.cell.stamina,
            this.cell.maxStamina,
            0x5b5b5b,
            false,
            {"r": 163, "g": 229, "b":21}
        );
        this.staminaBar.object.setScrollFactor(0)
            .on("pointerover", () => {
                this.hoverCount++;
                if (this.hoverCount !== 1) return;

                this.stateText?.setY(this.staminaBar?.Y) // @ts-ignore
                    .setText(`${Math.floor(this.cell?.stamina)}/${Math.floor(this.cell?.maxStamina)}`)
                    .setVisible(true);

                if (this.cell?.scene.MODE === "offline" && !this.scene.isPaused("offline-scene")) this.scene.pause("offline-scene");
            })
            .on("pointerout", () => {
                this.hoverCount = Math.max(0, this.hoverCount - 1);
                if (this.hoverCount !== 0) return;

                this.stateText?.setVisible(false);
                if (this.cell?.scene.MODE === "offline") this.scene.resume("offline-scene");
            });
    }


    // @ts-ignore
    initTexts (windows) {
        if (!this.cell || !this.gameScene) return;

        this.stateText = this.add.text(windows.width * 0.15, 0, "state", {
            color: "#b5ee0bff",
            fontSize: 12,
            fontFamily: "quicksand_font",
            resolution: 2
        }).setVisible(false);

        this.speedSecondUI = this.add.text(
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
        this.clickToWatchText = this.add.text(
            window.innerWidth * 0.9,
            window.innerHeight * 0.1 - 18,
            "click to watch", {
                fontSize: 15,
                fontFamily: "quicksand_font",
                color: "#b5ee0bff"
            }
        ).setVisible(false);
        for (let i = 0; i < 10; i ++) {
            const key = `pos${i}`;
            // @ts-ignore
            this.ranking[key] = this.add.text(
                window.innerWidth * 0.9,
                window.innerHeight * 0.1 + (i * 12),
                "?. nobody (?)", {
                    fontSize: 10,
                    fontFamily: "quicksand_font"
                }
            ).setInteractive({useHandCursor: true});
        }
    }


    updateRanking () {
        if (!this.gameScene) return;

        const sorted = this.gameScene.cells
            .filter(c => c.conteiner.active)
            .sort((a, b) => b.allPoints - a.allPoints)
            .slice(0, 10);

        sorted.forEach((cell, i) => {
            const key = `pos${i}`; // @ts-ignore
            const text = this.ranking[key];
            text.text = `${i + 1}. ${cell.specie} (${Math.floor(cell.allPoints)})`;
            text.setColor((cell === this.gameScene?.player || cell.playerWatching) ? "#2ddc27ff" : "#e4e4e4ff");
            text.on("pointerdown", () => {
                if (!this.cell?.isPlayer) {
                    // @ts-ignore
                    this.cell.playerWatching = false;
                    this.cell?.changeCamera(cell);
                }
            })
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

        this.updateRanking();
        if (!this.cell.isPlayer && this.cell.playerWatching) {
            this.clickToWatchText?.setVisible(true);
        }

        this.resetEffectIcons();
        this.parseEffectsIcons();
    }


    createEffectsIcons () {
        const windows = this.cameras.main;
        const x = windows.width * 0.16;
        const y = windows.height * 0.08;

        /** @type {Phaser.GameObjects.Text} */
        // @ts-ignore
        this.tooltipIcon = this.add.rexBBCodeText(x, y + 30, "", {
            color: "yellow",
            tags: rexTag(),
            fontSize: 10,
            fontFamily: "quicksand_font",
            align: "center"
        }).setVisible(false).setScrollFactor(0);

        this.effectIcons = {
            adrenaline: {
                buff: {
                    text: "",
                    object: this.add.image(x, y, "adrenaline")
                        .setScale(0.04)
                        .setVisible(false)
                        .setInteractive({useHandCursor: true})
                },
            },
            damage: {
                buff:  {
                    text: "",
                    object: this.add.image(x, y, "increased_attack")
                        .setScale(0.04)
                        .setVisible(false)
                        .setInteractive({useHandCursor: true})
                },
                debuff: {
                    text: "",
                    object: this.add.image(x, y, "reduced_attack")
                        .setScale(0.04)
                        .setVisible(false)
                        .setInteractive({useHandCursor: true})
                },
            },
            defense: {
                debuff: {
                    text: "",
                    object: this.add.image(x, y, "reduced_defense")
                        .setScale(0.04)
                        .setVisible(false)
                        .setInteractive({useHandCursor: true})
                },
            },
            speed: {
                buff: {
                    text: "",
                    object: this.add.image(x, y, "increased_speed")
                        .setScale(0.04)
                        .setVisible(false)
                        .setInteractive({useHandCursor: true})
                },
                debuff: {
                    text: "",
                    object: this.add.image(x, y, "reduced_speed")
                        .setScale(0.04)
                        .setVisible(false)
                        .setInteractive({useHandCursor: true})
                },
            },
            stamina: {
                debuff: {
                    text: "",
                    object: this.add.image(x, y, "low_stamina")
                        .setScale(0.04)
                        .setVisible(false)
                        .setInteractive({useHandCursor: true})
                },
            },
            lifeRegeneration: {
                buff: {
                    text: "",
                    object: this.add.image(x, y, "regeneration")
                        .setScale(0.04)
                        .setVisible(false)
                        .setInteractive({useHandCursor: true})
                },
                debuff: {
                    text: "",
                    object: this.add.image(x, y, "reduced_regeneration")
                        .setScale(0.04)
                        .setVisible(false)
                        .setInteractive({useHandCursor: true})
                },
            }
        }
    }


    resetEffectIcons () {
        const windows = this.cameras.main;
        const x = windows.width * 0.16;
        const y = windows.height * 0.08;

        Object.values(this.effectIcons).forEach(_effectType => {
            Object.values(_effectType).forEach(effect => {
                effect.text = "";
                effect.object.setX(x);
                effect.object.setY(y);
                effect.object.setVisible(false);
            })
        })

        this.tooltipTexts = {};
    }


    parseEffectsIcons () {
        const effects = new Set()
        const rep = this.stateText?.visible ? 30 : 0;

        this.cell?.effects.forEach(effect => {
            const effectKey = effect.name + effect.type;

            const info = this.effectIcons[effect.name][effect.type];
            if (!info) return

            // @ts-ignore
            if (this.tooltipTexts[effectKey]) { // @ts-ignore
                this.tooltipTexts[effectKey] += "\n" + effect.message + ` - ${effect.cause}`; // @ts-ignore
            } else this.tooltipTexts[effectKey] = effect.message + ` - ${effect.cause}`;
            
            if (effects.has(effectKey)) return;

            const windows = this.cameras.main;
            const x = windows.width * 0.16;

            info.object.setX(x + (25 * effects.size) + rep)
                .setVisible(true)
                .on("pointerover", () => {
                    this.hoverCount++;
                    if (this.hoverCount !== 1) return;

                    this.tooltipIcon
                        ?.setVisible(true)
                        .setX(x) // @ts-ignore
                        .setText(this.tooltipTexts[effectKey])
                    
                    if (this.cell?.scene.MODE === "offline" && !this.scene.isPaused("offline-scene")) this.scene.pause("offline-scene");
                })
                .on("pointerout", () => {
                    this.hoverCount = Math.max(0, this.hoverCount - 1);
                    if (this.hoverCount !== 0) return;

                    this.tooltipIcon?.setVisible(false);
                    if (this.cell?.scene.MODE === "offline") this.scene.resume("offline-scene");
                });

            effects.add(effectKey);
        })
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

