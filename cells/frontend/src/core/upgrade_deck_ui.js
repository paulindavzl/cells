// @ts-check
/// <reference path="../types/types.ts" />

import { Cells } from "./cells.js";
import { keyMapper } from "./key_handler.js";
import { randomItem, randomNumber } from "./utils.js";


export class DeckUI extends Phaser.Scene {

    constructor () {
        super("deck-ui");
        this.cards = [];
    }
    
    
    init (data) {
        this.player = data.player;
        this.mode = data.mode;

        /** @type {DeckUICardType[]} */
        this.cards = data.cards;
    }


    create () {
        this.keys = keyMapper(this);
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.5);

        this.cards?.forEach((card, index) => {
            const cardOption = this.add.rectangle(250 + (index * 200), 300, 150, 200, 0xffffff)
                .setInteractive()
                .setStrokeStyle(3, 0x000000);
            
            const text = `${card.buffs.text}\n${card.debuffs ? card.debuffs.text : ""}`;
            this.add.text(cardOption.x, cardOption.y, text, {
                fontSize: "18px",
                color: "#000",
                align: "center",
                wordWrap: { width: 140 }
            }).setOrigin(0.5);

            cardOption.on("pointerover", () => cardOption.setFillStyle(0xdddddd))
                .on("pointerout", () => cardOption.setFillStyle(0xffffff))
                .on("pointerdown", () => {
                    setEffect(this.player, card);
                    this.scene.stop();
                    if (this.mode === "offline") this.scene.resume("offline-scene");
                })
        })
    }

    
    update () {
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


/**
 * @param {Cells} cell
 * @param {DeckUICardType} effect 
 */
export const setEffect = (cell, effect) => {
    /*** @param {UpdateAttributeType} info */
    const updater = (info) => {
        const attribute = info.attribute;
        const type = info.type;
        const value = info[type] ?? 1;
        const update = info.update;

        if (type === "absolute") cell[attribute] += value;
        else cell[attribute] += (cell[attribute] * (value/100));

        if (update) cell[update] = cell[attribute];
    }
    
    const buff = effect.buffs;
    const debuff = effect.debuffs;
    updater(buff);
    if (debuff) updater(debuff);
}


export class AttributeUpgrade {
    /**
     * @param {number} level 
     * @param {boolean} rare 
     * @param {boolean} epic 
     */
    constructor (level, rare=false, epic=false) {
        this.level = level;
        this.rare = rare;
        this.epic = epic;
    }


    allBuffs () {
        /** @type {PossibleUpdateAttributeType[]} */
        const buffs = [
            // rarity 7-10 -> common | 3-6 -> rare | 1-2 -> epic
            {"id": "0", "buffIn": "life", "attribute": "maxLife", "text": "+<BUFF> maximum health", "type": ["absolute", "percent"], "absolute": [1, 10], "percent": [1, 10], "update": "life", "minLevel": 1, "rarity": 10, "rarityName": "common", "increment": "points"},
            {"id": "1", "buffIn": "life", "attribute": "lifeRecovery", "text": "+<BUFF> health recovered per second", "type": ["absolute"], "absolute": [0.1, 5], "minLevel": 1, "rarity": 10, "rarityName": "common", "increment": "points"},
            {"id": "2", "buffIn": "speed", "attribute": "defaultSpeed", "text": "+<BUFF> movement speed", "type": ["absolute", "percent"], "absolute": [10, 30], "percent": [1, 3], "update": "speed", "minLevel": 1, "rarity": 9, "rarityName": "common", "increment": "points"},
            {"id": "3", "buffIn": "adrenaline", "attribute": "adrenalineSpeedBuff", "text": "+<BUFF> speed increase when attacked", "type": ["percent"], "percent": [0.5, 3], "minLevel": 1, "rarity": 9, "rarityName": "common", "increment": "points"},
            {"id": "4", "buffIn": "adrenaline", "attribute": "adrenalineDamageBuff", "text": "+<BUFF> damage increase when attacked", "type": ["percent"], "percent": [0.3, 5], "minLevel": 1, "rarity": 8, "rarityName": "common", "increment": "points"},
            {"id": "5", "buffIn": "adrenaline", "attribute": "adrenalineTime", "text": "+<BUFF> seconds in adrenaline time", "type": ["absolute"], "absolute": [0.1, 0.5], "minLevel": 1, "rarity": 7, "rarityName": "common", "increment": ""},
            {"id": "6", "buffIn": "DNA", "attribute": "DNA_harvesting", "text": "+<BUFF> DNA points and health recovery when harvesting", "type": ["absolute", "percent"], "percent": [5, 10], "absolute": [0.1, 1], "minLevel": 3, "rarity": 6, "rarityName": "rare", "increment": ""}
        ]
        return buffs
    }


    getCards () {
        /** @type {PossibleUpdateAttributeType[]} */
        let buffsMultiplied = [];

        this.allBuffs().forEach(buff => {
            const rarity = buff.rarity;

            for (let i = 0; i < rarity; i ++) {
                buffsMultiplied.push(buff);
            }
        })

        const cards = [];
        while (cards.length !== 3 && buffsMultiplied.length > 0) {
            /** @type {PossibleUpdateAttributeType} */
            const card = randomItem(buffsMultiplied);
            buffsMultiplied = buffsMultiplied.filter(c => c.id !== card.id);

            if (!(cards.some(c => c.buffs.id === card.id)) && (card.minLevel <= this.level)) {
                this.resolve(card);                
                cards.push({"buffs": card, "withDebuffs": false});
            }
        }
        return cards;
    }


    /**
     * 
     * @param {PossibleUpdateAttributeType} card 
     */
    resolve (card) {
        if (!(card.type instanceof Array)) return;
        const type = randomItem(card.type);
        const possibleTypes = card[type];
        card[type] = randomNumber(possibleTypes[0], possibleTypes[1], type === "percent" ? false : true);
        card.text = card.text.replace("<BUFF>", (type === "percent" ? card[type].toFixed(2) : card[type]) + (type === "percent" ? "%" : " " + card.increment));
    }
}