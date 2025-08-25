// @ts-check
/// <reference path="../types/types.ts" />


import { OfflineGame } from "./offline_game.js";


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
     * @param {OfflineGame} scene 
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
    constructor (scene, x, y, currentValue, maxValue, backgroudColor, interpolate, color1, color2=null, offSetY=null) {
        this.scene = scene;

        this.X = x;
        this.Y = y;
        this.offSetY = offSetY;

        this.width = 100;
        this.height = 10;

        this.currentValue = Phaser.Math.Clamp(currentValue, 0, maxValue);
        this.displayValue = Phaser.Math.Clamp(currentValue, 0, maxValue);
        this.delayValue = Phaser.Math.Clamp(currentValue, 0, maxValue);
        this.maxValue = maxValue;
        this.backgroundColor = backgroudColor;
        this.interpolate = interpolate;

        this.color1 = color1;
        this.color2 = color2;

        this.object = scene.add.graphics();
        this.draw();
    }


    draw () {
        this.object.clear();
        
        this.object.lineStyle(2, 0x000000);
        this.object.strokeRect(this.X, this.Y, this.width, this.height);

        this.object.fillStyle(this.backgroundColor, 0.3);
        this.object.fillRect(this.X, this.Y, this.width, this.height);

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

        this.object.fillStyle(hexColor);
        this.object.fillRect(this.X, this.Y, this.width * valuePercent, this.height);
    }


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


    /** @param {number} value  */
    setScrollFactor (value) {
        this.object.setScrollFactor(value);
        return this;
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

