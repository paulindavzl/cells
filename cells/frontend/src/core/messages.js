// @ts-check

import { OfflineGame } from "../scenes/offline_game.js";
import { rexTag } from "./utils.js";

export class Messager {

    /**
     * @param {string} message 
     *  @param {OfflineGame} scene 
    */
    constructor (message, scene, base="yellow") {
        // @ts-ignore
        const object = scene.add.rexBBCodeText(100, 350, 
            message, {
                fontSize: "10px",
                fontFamily: "quicksand_font",
                color: base,
                tags: rexTag()
            }
        ).setScrollFactor(0);

        let repeat = 0;
        scene.time.addEvent({
            delay: 20,
            callback: () => {
                repeat ++
                object.y -= 1

                if (repeat > 75) object.alpha -= 0.008;

                if (repeat >= 150) {
                    object.destroy();
                }
            },
            callbackScope: scene,
            repeat: 150
        })
    }
}