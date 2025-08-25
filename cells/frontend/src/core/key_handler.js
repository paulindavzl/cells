// @ts-check
/// <reference path="../types/phaser.d.ts" />


/**@param {Phaser.Scene} scene */
export const keyMapper = (scene) => {
    const keyboard = scene.input?.keyboard;
    if (!keyboard) return;

    const keyCodes = Phaser.Input.Keyboard.KeyCodes;
    const keys = {
        "w": keyboard.addKey(keyCodes.W),
        "a": keyboard.addKey(keyCodes.A),
        "s": keyboard.addKey(keyCodes.S),
        "d": keyboard.addKey(keyCodes.D),
        "ONE": keyboard.addKey(keyCodes.ONE),
        "TWO": keyboard.addKey(keyCodes.TWO),
        "THREE": keyboard.addKey(keyCodes.THREE)
    };
    return keys;
}