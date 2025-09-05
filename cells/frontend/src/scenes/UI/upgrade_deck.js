// @ts-check
/// <reference path="../../types/types.ts" />

import { Cells } from "../../core/cells.js";
import { keyMapper } from "../../core/key_handler.js";
import { parseValue } from "../../core/utils.js";
import { setEffect, AttributeUpgrade } from "../../core/upgrades.js";


export class DeckUI extends Phaser.Scene {

    constructor () {
        super("deck-ui");
        this.cards = [];
    }
    
    
    init (data) {
        /** @type {Cells} */
        this.player = data.player;

        if (this.player && this.player.life <= 0) {
            this.scene.stop();
            this.scene.resume("offline-scene");
        }

        this.mode = data.mode;

        /** @type {DeckUICardType[]} */
        this.cards = data.cards;
    }


    preload () {
        const cards = "/assets/img/cards/"
        this.load.image("card_common", cards + "card_common.png");
        this.load.image("card_rare", cards + "card_rare.png");
        this.load.image("card_epic", cards + "card_epic.png");

        const icons = "/assets/img/icons/"
        this.load.image("adrenaline_icon", icons + "adrenaline_icon.png");
        this.load.image("dna_icon", icons + "dna_icon.png");
        this.load.image("health_icon", icons + "health_icon.png");
        this.load.image("poison_icon", icons + "poison_icon.png");
        this.load.image("shield_icon", icons + "shield_icon.png");
        this.load.image("skull_icon", icons + "skull_icon.png");
        this.load.image("sword_icon", icons + "sword_icon.png");
        this.load.image("speed_icon", icons + "speed_icon.png");
    }


    getIconInfo (type) {
        const iconsName = {
            life: ["health_icon", 0.03],
            adrenaline: ["adrenaline_icon", 0.1],
            DNA: ["dna_icon", 0.1],
            poison: ["poison_icon", 0.3],
            defense: ["shield_icon", 0.2],
            damage: ["sword_icon", 0.12],
            skull: ["skull_icon", 0.6],
            speed: ["speed_icon", 0.15]
        };

        return iconsName[type];
    }


    getColorTo (name) {
        const colors = {
            common: "#1CB4DE",
            rare: "#CF4715",
            epic: "#5A1FBF"
        }

        return colors[name];
    }


    create () {
        this.keys = keyMapper(this);
        const base = this.add.rectangle(1, 1, window.innerWidth, window.innerHeight, 0x000000, 0.5);
        this.cameras.main.startFollow(base);
        
        this.cards?.forEach((card, index) => {
            if (!this.player) return;
            const buffs = card.buffs;
            const debuffs = card.debuffs;

            const positions = [-260, 0, 260];
            const pos = positions[index];
            const color = this.getColorTo(buffs.rarityName);
            const cardOption = this.add.image(pos, 0, `card_${buffs.rarityName}`)
                .setInteractive()
                .setScale(0.8);

            const infos = this.getIconInfo(buffs.updateIn)
            const icon = this.add.image(pos, -50, infos[0])
                .setScale(infos[1]);

            const updateIn = this.add.text(pos, -118, buffs.updateIn, {
                fontSize: "18px",
                color: color,
                align: "center",
                fontFamily: '"hanalei_fill", system-ui',
                resolution: 2
            }).setOrigin(0.5)
    
            const message = `${buffs.text}\n${card.debuffs ? card.debuffs.text : ""}`;
            const text = this.add.text(pos, 40, message, {
                fontSize: "16px",
                color: "#000000ff",
                align: "center",
                fontFamily: "quicksand_font",
                resolution: 2,
                wordWrap: { width: 150 }
            }).setOrigin(0.5);

            const preview = parseValue(buffs, this.player);
            const buffResult = this.add.text(pos, 80, preview, {
                fontSize: "12px",
                color: "#059800ff",
                align: "center",
                fontFamily: "quicksand_font",
                resolution: 2,
                wordWrap: { width: 200 }
            }).setOrigin(0.5);

            const allBuffs = new AttributeUpgrade(this.player).allBuffs()
            let buffsLength = 0;
            allBuffs.forEach(b => {
                buffsLength += b.rarity;
            });
            const rarity = `${buffs.rarity}/${buffsLength}\n(${((buffs.rarity/buffsLength) * 100).toFixed(2)}%)`;
            const rarityText = this.add.text(pos, 110, rarity, {
                fontSize: "10px",
                color: "#313131ff",
                align: "center",
                resolution: 2,
                fontFamily: "quicksand_font",
                wordWrap: { width: 200 }
            }).setOrigin(0.5);

            cardOption.on("pointerover", () => {
                cardOption.setScale(1);
                updateIn.setFontSize(18)
                    .setY(-145);
                icon.scale *= 1.3;
                icon.setY(-60);
                text.setFontSize(18)
                    .setWordWrapWidth(180);
                buffResult.setFontSize(16);
                rarityText.setFontSize(14);

                this.input.setDefaultCursor("pointer");
            });
            cardOption.on("pointerout", () => {
                cardOption.setScale(0.8);
                updateIn.setFontSize(18)
                    .setY(-117);
                icon.scale = infos[1];
                icon.setY(-50);
                text.setFontSize(16)
                    .setWordWrapWidth(150);
                buffResult.setFontSize(12);
                rarityText.setFontSize(10);

                this.input.setDefaultCursor("default");
            });
            cardOption.on("pointerdown", () => {
                if (!this.player) return;
                setEffect(this.player, card);
                this.scene.stop();
                if (this.mode === "offline") this.scene.resume("offline-scene");
            });
        })
    }

    
    update () {
        if (!this.player) return;
        if (!this.keys) {
            this.keys = keyMapper(this); 
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) {
            setEffect(this.player, this.cards[0]);
            this.scene.stop();
            if (this.mode === "offline") this.scene.resume("offline-scene");
        }   else if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) {
            setEffect(this.player, this.cards[1]);
            this.scene.stop();
            if (this.mode === "offline") this.scene.resume("offline-scene");
        } else if (Phaser.Input.Keyboard.JustDown(this.keys.THREE)) {
            setEffect(this.player, this.cards[2]);
            this.scene.stop();
            if (this.mode === "offline") this.scene.resume("offline-scene");
        }
    }
}