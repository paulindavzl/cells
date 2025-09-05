// @ts-check

import { OfflineGame } from "../scenes/offline_game.js";
import { randomNumber } from "./utils.js";


export class DNAPoints {

    /**
     * @param {OfflineGame} scene
     * @param {null|number} x
     * @param {null|number} y
    */
    constructor (scene, pointerBooster=randomNumber(1, 3), points=randomNumber(1, 10), x=null, y=null, natural=true) {
        if (!x) x = randomNumber(1, scene.mapWidth);
        if (!y) y = randomNumber(1, scene.mapHeight);

        this.X = Phaser.Math.Clamp(x, 30, scene.mapWidth - 30);
        this.Y = Phaser.Math.Clamp(y, 30, scene.mapHeight - 30)

        this.object = scene.add.sprite(this.X, this.Y, "dna_sprite_0");
        this.pointerBooster = pointerBooster;
        this.object.scale = 0.03 * (this.pointerBooster - 1);
        this.object.rotation = randomNumber(0, 360);
        this.object.play("dna_sprite");
        natural ? scene.DNAPoints.push(this) : scene.DNADeadPoints.push(this);
        this.scene = scene;
        this.points = points;
        this.natural = natural;
    }
    
    
    update () {
        this.scene.cells.forEach(cell => {
            const dx = this.X - cell.X;
            const dy = this.Y - cell.Y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= (10 + cell.size - 1)) {
                cell.points += ((this.points ?? 1) * (this.pointerBooster ?? 1) * cell.DNAHarvesting);
                
                if (cell.life < cell.maxLife) {
                    let life = cell.life + (this.points * 0.1) * cell.DNAHarvesting;
                    if (life > cell.maxLife) life = cell.maxLife;
                    cell.life = Math.floor(life);
                }
                this.object.destroy();
                if (this.natural) new DNAPoints(this.scene);
            }
        })
    }
}