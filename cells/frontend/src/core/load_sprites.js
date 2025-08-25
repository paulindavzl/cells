import { OfflineGame } from "./offline_game.js";


export const spritesPath = "/assets/sprites"


/**
 * @param {OfflineGame} scene
 * @param {string} key
*/
export const loadImages = (scene, key) => {
    for (let i = 0; i < 3; i ++) {
        const spriteName = `${key}_${i}`
        scene.load.image(spriteName, `${spritesPath}/${key}s/${spriteName}.png`)
    }
}


/**
 * @param {OfflineGame} scene
 * @param {string} key
*/
export const loadAnims = (scene, key) => {
    scene.anims.create({
        key: key,
        frames: [
            {key: `${key}_0`},
            {key: `${key}_1`},
            {key: `${key}_2`}
        ],
        frameRate: 5,
        repeat: -1
    })
}