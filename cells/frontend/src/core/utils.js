// @ts-check
/// <reference path="../types/types.ts" />


import { OfflineGame } from "../scenes/offline_game.js";
import { GameUI } from "../scenes/UI/game_ui.js";
import { Cells } from "./cells.js";


/**
 * @param {number} min 
 * @param {number} max
 * @param {boolean} [integer=true]
 * @returns {number}
*/
export const randomNumber = (min, max, integer = true) => {
    if (integer) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    } else {
        return Math.random() * (max - min) + min;
    }
};


export const randomColor = () => {
    return Math.floor(Math.random() * 0xffffff);
}


export class Bar {

    /**
     * @param {OfflineGame|GameUI} scene 
     * @param {number} x
     * @param {number} y
     * @param {number} currentValue 
     * @param {number} maxValue 
     * @param {number} backgroudColor 
     * @param {boolean} interpolate 
     * @param { {"r": number, "g": number, "b": number} } color1 
     * @param { null | {"r": number, "g": number, "b": number} } [color2=null]
     * @param {null | number} [offSetY=null] 
     */
    constructor (scene, x, y, currentValue, maxValue, backgroudColor, interpolate, color1, color2=null, offSetY=null, width=window.innerWidth * 0.088, height = 10) {
        this.scene = scene;

        this.X = x;
        this.Y = y;
        this.offSetY = offSetY;

        this.width = width;
        this.height = height;

        this.currentValue = Phaser.Math.Clamp(currentValue, 0, maxValue);
        this.displayValue = Phaser.Math.Clamp(currentValue, 0, maxValue);
        this.delayValue = Phaser.Math.Clamp(currentValue, 0, maxValue);
        this.maxValue = maxValue;
        this.backgroundColor = backgroudColor;
        this.interpolate = interpolate;

        this.color1 = color1;
        this.color2 = color2;

        this.hitArea = new Phaser.Geom.Rectangle(this.X, this.Y, this.width, this.height);
        this.object = scene.add.graphics();
        this.draw();
    }


    draw () {
        this.object.clear();
        
        this.object.lineStyle(2, 0x000000);
        this.object.strokeRoundedRect(this.X, this.Y, this.width, this.height, 3);

        this.object.fillStyle(this.backgroundColor, 0.3);
        this.object.fillRoundedRect(this.X, this.Y, this.width, this.height, 3);

        const valuePercent = this.displayValue / this.maxValue;

        let hexColor
        if (this.interpolate) {
            const secondColor = this.color2 ? this.color2 : this.color1;
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                new Phaser.Display.Color(this.color1.r, this.color1.g, this.color1.b, 0),
                new Phaser.Display.Color(secondColor.r, secondColor.g, secondColor.b, 0),
                100,
                valuePercent * 100
            );

            hexColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
        } else {
            hexColor = Phaser.Display.Color.GetColor(this.color1.r, this.color1.g, this.color1.b);
        }

        if (this.currentValue > this.maxValue * 0.01) {

            this.object.fillStyle(hexColor);
            this.object.fillRoundedRect(this.X, this.Y, this.width * valuePercent, this.height, 3);
        }

        this.hitArea.setPosition(this.X, this.Y);

        this.object.setInteractive(
            this.hitArea,
            Phaser.Geom.Rectangle.Contains
        );
    }


    // @ts-ignore
    updateValue (value, maxValue) {
        this.currentValue = Phaser.Math.Clamp(value, 0, this.maxValue);
        this.maxValue = maxValue;
        this.scene.tweens.add({
            targets: this,
            displayValue: this.currentValue,
            duration: 200,
            onUpdate: () => this.draw()
        });
    }
}


/**
 * 
 * @param {any[]} iterable 
 */
export const randomItem = (iterable) => {
    const index = Math.floor(Math.random() * iterable.length)
    const item = iterable[index];
    return item;
}


/** 
 * @param {UpdateAttributeType} info 
 * @param {Cells} cell
 * @param {boolean} set
 * @param {boolean} debuff
 * @returns {string}
*/
export const parseValue = (info, cell, set=false, debuff=false) => {
    const attribute = info.attribute;
    const update = info.update;

    let type = info.type;
    if (typeof type !== "string") type = type[0];

    // @ts-ignore
    if (typeof info[type] === "object") info[type] = info[type][0];

    // @ts-ignore
    let baseValue = cell[attribute];
    let change = 0;

    if (type === "absolute") {
        change = info.absolute ?? 0;
    }
    else if (type === "boolean") { // @ts-ignore
        if (set) cell[attribute] = info.boolean;
        return `set to ${info.boolean}`
    }
    else if (type === "percent") {
        const percent = info.percent ?? 0;
        change = baseValue * (percent/100);
    }

    if (!cell.reduceSpeed) change -= change * 0.05;

    const newValue = baseValue + change;

    if (set) {  // @ts-ignore
        cell[attribute] = newValue; // @ts-ignore
        if (update) cell[update] += change;
    }

    const diffText = (change >= 0 && !debuff ? "+" : "") + change.toFixed(2);
    return `${baseValue.toFixed(2)} > ${newValue.toFixed(2)} (${diffText})`;
}


export const rexTag = () => {
    const tags = {
        white: {color: "#f0f0f0ff"},
        red: {color: "#d62828ff"},
        green: {color:"#14be5bff"},
        yellow: {color: "#d4e306ff"},
        lightgreen: {color: "#31f500ff"}
    };
    
    return tags;
}

/**
 * 
 * @param {Cells} cell
 * @param {EffectType[]} effects
 */
export const setEffectsByStamina = (cell, effects) => {
    const stamina = cell.stamina * 100 / cell.maxStamina;

    /** @type {EffectType[]} */
    const newEffects = []
    if (stamina < 50) {
        newEffects.push({
            name: "stamina",
            type: "debuff",
            cause: "low_stamina",
            message: `low stamina (${Math.floor(stamina)}%): attribute reduction`,
            natural: true
        });

        let dDFSSEReduce = 10;

        if (stamina < 20) {
            newEffects.push({
                name: "speed",
                type: "debuff",
                message: "reduced speed (-40%)",
                cause: "low_stamina",
                natural: true,
                change: -cell.baseSpeed * 0.4
            })

        } if (stamina < 30) {
            newEffects.push({
                name: "lifeRegeneration",
                type: "debuff",
                message: "reduced health regeneration (-50%)",
                cause: "low_stamina",
                natural: true,
                change: -cell.lifeRegeneration * 0.5
            });
        } if (stamina < 40) {
            dDFSSEReduce = stamina < 30 ? 30 : 25;

            let dDMGSReduce = stamina < 20 ? 20 : 10;
            /** @type {EffectType} */
            const debuffDamageStaminaEffect = {
                name: "damage",
                type: "debuff",
                message: `reduced damage (-${dDMGSReduce.toFixed(2)}%)`,
                cause: "low_stamina",
                natural: true,
                change: -cell.damage * (dDMGSReduce / 100)
            };

            newEffects.push(debuffDamageStaminaEffect);
        }

        /** @type {EffectType} */
        const debuffDefenseStaminaEffect = {
            name: "defense",
            type: "debuff",
            message: `reduce defense (-${dDFSSEReduce.toFixed(2)}%)`,
            cause: "low_stamina",
            natural: true,
            change: -cell.defense * (dDFSSEReduce / 100)
        }
        newEffects.push(debuffDefenseStaminaEffect);

        effects.push(...newEffects);

    }
};


/**
 * 
 * @param {Cells} cell
 * @param {EffectType[]} effects
 */
export const setEffectsByAdrenaline = (cell, effects) => {
    if (cell.adrenalineOn) {
        effects.push({
            name: "adrenaline",
            type: "buff",
            message: "adrenaline activated: increase in attributes",
            cause: "adrenaline",
            natural: true
        },{
            name: "speed",
            type: "buff",
            message: `adrenaline-enhanced speed (+${cell.adrenalineSpeedBuff.toFixed(2)}%)`,
            cause: "adrenaline",
            natural: true,
            change: cell.speed * cell.adrenalineSpeedBuff / 100
        }, {
            name: "damage",
            type: "buff",
            message: `adrenaline-enhanced damage (+${cell.adrenalineDamageBuff.toFixed(2)}%)`,
            cause: "adrenaline",
            natural: true,
            change: cell.speed * cell.adrenalineDamageBuff / 100
        });

        if (cell.lifeRegeneration > 0 && cell.life < cell.maxLife) {
            effects.push({
                name: "lifeRegeneration",
                type: "buff",
                message: "adrenaline-enhanced regeneration (+50%)",
                cause: "adrenaline",
                natural: true,
                change: cell.lifeRegeneration * 0.5
            });
        }
    }
}


/**
 * 
 * @param {Cells} cell
 * @returns {EffectType[]} 
 */
export const parseNaturalEffects = (cell) => {
    /** @type {EffectType[]} */
    const effects = [];

    setEffectsByStamina(cell, effects);
    setEffectsByAdrenaline(cell, effects);
    
    return effects;
}
