// @ts-check

import { OfflineGame } from "../scenes/offline_game.js";

export class Messager {

    /**
     * @param {string} message 
     *  @param {OfflineGame} scene 
    */
    constructor (message, scene, base="yellow") {
        // @ts-ignore
        const object = scene.add.rexBBCodeText(100, 350 + (10 * scene.killMessages), 
            message, 
            {
                fontSize: "10px",
                fontFamily: "quicksand_font",
                color: base,
                tags: {
                    white: {color: "#f0f0f0ff"},
                    red: {color: "#d62828ff"},
                    green: {color:"#14be5bff"},
                    yellow: {color: "#d4e306ff"}
                }
            }
        ).setScrollFactor(0);

        scene.killMessages ++;

        let repeat = 0;
        scene.time.addEvent({
            delay: 20,
            callback: () => {
                repeat ++
                object.y -= 0.1;

                if (repeat > 75) object.alpha -= 0.01;

                if (repeat >= 150) {
                    object.destroy();
                    scene.killMessages --;
                }
            },
            callbackScope: scene,
            repeat: 150
        })
    }
}