// @ts-check

import { randomItem, randomNumber } from "./utils.js";
import { Cells } from "./cells.js";
import { parseValue } from "./utils.js";


/**
 * @param {Cells} cell
 * @param {DeckUICardType} effect 
 */
export const setEffect = (cell, effect) => {
    /*** @param {UpdateAttributeType} info */
    const updater = (info) => {
        parseValue(info, cell, true);
    }
    
    const buff = effect.buffs;
    const debuff = effect.debuffs;
    updater(buff);
    if (debuff) updater(debuff);
}


export class AttributeUpgrade {
    /**
     * @param {Cells} cell 
     * @param {boolean} rare 
     * @param {boolean} epic 
     */
    constructor (cell, rare=false, epic=false) {
        this.cell = cell;
        this.rare = rare;
        this.epic = epic;
    }


    allBuffs () {
        /** @type {PossibleUpdateAttributeType[]} */
        const buffs = [
            // rarity 7-10 -> common | 3-6 -> rare | 1-2 -> epic
            {"id": "0", "updateIn": "life", "attribute": "maxLife", "text": "+<VALUE> maximum health", "type": ["absolute", "percent"], "absolute": [1, 10], "percent": [1, 10], "update": "life", "minLevel": 1, "rarity": 10, "rarityName": "common", "increment": "points"},
            {"id": "1", "updateIn": "life", "attribute": "lifeRegeneration", "text": "+<VALUE> health recovered per second", "type": ["absolute"], "absolute": [0.1, 2], "minLevel": 1, "rarity": 10, "rarityName": "common", "increment": "points"},
            {"id": "2", "updateIn": "speed", "attribute": "baseSpeed", "text": "+<VALUE> movement speed", "type": ["absolute", "percent"], "absolute": [10, 30], "percent": [1, 3], "update": "speed", "minLevel": 1, "rarity": 9, "rarityName": "common", "increment": "points"},
            {"id": "3", "updateIn": "adrenaline", "attribute": "adrenalineSpeedBuff", "text": "+<VALUE> speed increase when attacked", "type": ["percent"], "percent": [0.5, 3], "minLevel": 1, "rarity": 9, "rarityName": "common", "increment": "points"},
            {"id": "4", "updateIn": "adrenaline", "attribute": "adrenalineDamageBuff", "text": "+<VALUE> damage increase when attacked", "type": ["percent"], "percent": [0.3, 5], "minLevel": 1, "rarity": 8, "rarityName": "common", "increment": "points"},
            {"id": "5", "updateIn": "adrenaline", "attribute": "adrenalineTime", "text": "+<VALUE> seconds in adrenaline time", "type": ["absolute"], "absolute": [0.1, 0.5], "minLevel": 1, "rarity": 7, "rarityName": "common", "increment": ""},
            {"id": "6", "updateIn": "DNA", "attribute": "DNAHarvesting", "text": "+<VALUE> DNA points, stamina and health recovery when harvesting", "type": ["absolute", "percent"], "percent": [5, 10], "absolute": [0.1, 1], "minLevel": 3, "rarity": 6, "rarityName": "rare", "increment": ""},
            {"id": "7", "updateIn": "speed", "attribute": "reduceSpeed", "text": "stops slowing down when leveling up, but all buffs are reduced by 3%", "type": ["boolean"], "boolean": [false], "minLevel": 6, "rarity": 2, "rarityName": "epic", "conditions": [{"attribute": "reduceSpeed", "comparator": "===", "value": true}], "increment": ""},
            {"id": "8", "updateIn": "speed", "attribute": "reduceSpeedBy", "text": "<VALUE> speed reduction when leveling up", "type": ["percent"], "percent": [-0.1, -0.5], "minLevel": 4, "rarity": 5, "rarityName": "rare", "conditions": [{"attribute": "reduceSpeed", "comparator": "===", "value": true}, {"attribute": "reduceSpeedBy", "comparator": ">", "value": 0}], "increment": ""},
            {"id": "9", "updateIn": "damage", "attribute": "baseDamage", "text": "+<VALUE> damage when attacking","type": ["absolute", "percent"], "absolute": [1, 5], "percent": [10, 20], "minLevel": 3, "rarity": 7, "rarityName": "common", "increment": "points"}
        ]
        const b = structuredClone(buffs);
        return b;
    }


    allDebuffs () {
        /** @type {PossibleUpdateAttributeType[]} */
        // rarity 9-12 -> common | 5-8 -> rare | 1-4 -> epic
        const debuffs = [
            {"id": "0", "updateIn": "life", "attribute": "maxLife", "text": "<VALUE> maximum health", "type": ["absolute", "percent"], "absolute": [-1, -10], "percent": [-1, -10], "update": "life", "minLevel": 5, "rarity": 12, "rarityName": "common", "increment": "points"},
            {"id": "1", "updateIn": "life", "attribute": "lifeRegeneration", "text": "<VALUE> health recovered per second", "type": ["absolute"], "absolute": [-0.1, -5], "minLevel": 5, "rarity": 12, "rarityName": "common", "increment": "points"},
            {"id": "2", "updateIn": "speed", "attribute": "baseSpeed", "text": "<VALUE> movement speed", "type": ["absolute", "percent"], "absolute": [-10, -30], "percent": [-1, -3], "update": "speed", "minLevel": 5, "rarity": 11, "rarityName": "common", "increment": "points"},
            {"id": "3", "updateIn": "adrenaline", "attribute": "adrenalineSpeedBuff", "text": "<VALUE> speed increase when attacked", "type": ["percent"], "percent": [-0.5, -3], "minLevel": 5, "rarity": 11, "rarityName": "common", "increment": "points"},
            {"id": "4", "updateIn": "adrenaline", "attribute": "adrenalineDamageBuff", "text": "<VALUE> damage increase when attacked", "type": ["percent"], "percent": [-0.3, -5], "minLevel": 5, "rarity": 10, "rarityName": "common", "increment": "points"},
            {"id": "5", "updateIn": "adrenaline", "attribute": "adrenalineTime", "text": "<VALUE> seconds in adrenaline time", "type": ["absolute"], "absolute": [-0.1, -0.5], "minLevel": 5, "rarity": 9, "rarityName": "common", "increment": ""},
            {"id": "6", "updateIn": "DNA", "attribute": "DNAHarvesting", "text": "<VALUE> DNA points and health recovery when harvesting", "type": ["absolute", "percent"], "percent": [-5, -10], "absolute": [-0.1, -1], "minLevel": 8, "rarity": 8, "rarityName": "rare", "increment": ""},
            {"id": "7", "updateIn": "speed", "attribute": "reduceSpeed", "text": "becomes slower again when leveling up and all buffs are improved by 3%", "type": ["boolean"], "boolean": [true], "minLevel": 10, "rarity": 2, "rarityName": "epic", "conditions": [{"attribute": "reduceSpeed", "comparator": "===", "value": false}], "increment": ""},
            {"id": "8", "updateIn": "speed", "attribute": "reduceSpeedBy", "text": "+<VALUE> speed reduction when leveling up", "type": ["percent"], "percent": [-0.1, -0.5], "minLevel": 9, "rarity": 7, "rarityName": "rare", "conditions": [{"attribute": "reduceSpeed", "comparator": "===", "value": true}, {"attribute": "reduceSpeedBy", "comparator": ">", "value": 0}], "increment": ""}
        ]

        const d = structuredClone(debuffs);
        return d;
    }


    getCards () {
        /** @type {PossibleUpdateAttributeType[]} */
        let buffsMultiplied = [];

        this.allBuffs().forEach(buff => {
            let rarity = buff.rarity;
            if (this.rare) {
                if (buff.rarityName === "rare") {
                    rarity *= 15;
                    rarity += this.cell.lastRareCard;
                }
            }
            if (this.epic) {
                if (buff.rarityName === "epic") {
                    rarity *= 10;
                    rarity += this.cell.lastEpicCard;
                }
            }

            for (let i = 0; i < rarity; i ++) {
                buffsMultiplied.push(buff);
            }
        })

        const cards = [];
        while (cards.length !== 3 && buffsMultiplied.length > 0) {
            /** @type {PossibleUpdateAttributeType} */
            const card = randomItem(buffsMultiplied);
            buffsMultiplied = buffsMultiplied.filter(c => c.id !== card.id);

            if (
                !(cards.some(c => c.buffs.id === card.id)) && (card.minLevel <= this.cell.level)) {
                const conditions = card.conditions;

                if (conditions) {
                    let isValid = true;

                    conditions.forEach(condition => {
                        const attribute = condition.attribute;
                        const comparator = condition.comparator;
                        const value = condition.value;

                        
                        if (!(
                            (comparator === "===" && this.cell[attribute] === value) ||
                            (comparator === "<" && this.cell[attribute] < value) ||
                            (comparator === "!==" && this.cell[attribute] !== value) ||
                            (comparator === ">" && this.cell[attribute] > value)
                        )) isValid = false 
                        else if (this.cell.maxPerFiveLevel[attribute] && (this.cell[attribute] >= this.cell.maxPerFiveLevel[attribute])) isValid = false;
                    });
                    
                    if (isValid) {
                        this.resolve(card);                
                        cards.push({"buffs": card, "withDebuffs": false});
                        if (card.rarityName === "rare") this.cell.lastRareCard = 0;
                        else if (card.rarityName === "epic") this.cell.lastEpicCard = 0;
                    };
                } else {
                    this.resolve(card);                
                    cards.push({"buffs": card, "withDebuffs": false});
                    if (card.rarityName === "rare") this.cell.lastRareCard = 0;
                    else if (card.rarityName === "epic") this.cell.lastEpicCard = 0;
                };
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
        /** @type {("absolute"|"percent"|"boolean")} */
        const type = randomItem(card.type);

        card.type = type;

        let value
        const possibleTypes = card[type];
        // @ts-ignore
        if ( typeof possibleTypes[0] === "boolean") {
            value = possibleTypes;
        }
        // @ts-ignore
        else value = randomNumber(possibleTypes[0], possibleTypes[1], type !== "percent");

        // @ts-ignore
        card[type] = value;
        // @ts-ignore
        card.text = card.text.replace("<VALUE>", (type === "percent" ? card[type].toFixed(2) : card[type]) + (type === "percent" ? "%" : " " + card.increment));
    }
}