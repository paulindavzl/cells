// @ts-check
/// <reference path="../types/phaser.d.ts" />

import { DNAPoints } from "../core/dna_points.js";
import { keyMapper } from "../core/key_handler.js";
import { loadAnims, loadImages } from "../core/load_sprites.js";
import { Cells } from "../core/cells.js";

export class OfflineGame extends Phaser.Scene {

    constructor () {
        super("offline-scene")

        /** @type {DNAPoints[]} */
        this.DNAPoints = [];

        /** @type {DNAPoints[]} */
        this.DNADeadPoints = [];

        /** @type {Cells[]} */
        this.cells = [];

        this.killMessages = 0
        
        this.keys = keyMapper(this);

        this.botsNumberMax = 10;
        this.botsCreated = 0;
        this.mapWidth = 2000;
        this.mapHeight = 2000;
        this.maxDNAPoints = 1000;
        
        this.logicTimer = 0;
        this.logicFPS = 1000 / 30;
    }


    getKeys () {
        if (this.keys) return this.keys;
        this.keys = keyMapper(this);
        return this.keys;
    }


    preload () {
        loadImages(this, "dna_sprite");
        this.load.image("level_up", "/assets/img/icons/star_icon.png");
        this.load.image("defense_circle", "/assets/img/icons/defense_circle.png");
        
        this.load.plugin(
            'rexbbcodetextplugin',
            'https://cdn.jsdelivr.net/npm/phaser3-rex-plugins/dist/rexbbcodetextplugin.min.js',
            true
        );
        
    }
    

    create () {
        this.cameras.main.roundPixels = true;
        this.add.graphics()
            .lineStyle(4, 0xffffffff)
            .strokeRect(1, 1, this.mapWidth, this.mapHeight);
            
        loadAnims(this, "dna_sprite")

        for ( let i = 0; i < this.maxDNAPoints; i ++ ) {
            new DNAPoints(this);
        }

        this.player = new Cells(this, "Astuto", true);

        while (this.cells.length < this.botsNumberMax) {
            new Cells(this, `Alpha-${this.cells.length}`);
        }

        this.scene.launch("game-ui", {
            scene: this,
            cell: this.player
        });
    }


    update (time, delta) {
        this.logicTimer += delta;
        
        if (this.logicTimer >= this.logicFPS) {
            this.logicTimer -= this.logicFPS;
            const dt = this.logicFPS / 1000;
            this.updateLogic(dt);
        }
        
    }
    
    
    updateLogic (dt) {
        this.DNAPoints.forEach(dna => {
            if (dna.X < 1 || dna.X > this.mapWidth || dna.Y < 1 || dna.Y > this.mapHeight) {
                dna.object.destroy();
                return;
            }
            dna.update();
        });
        this.DNADeadPoints.forEach(dna => {
            if (dna.X < 1 || dna.X > this.mapWidth || dna.Y < 1 || dna.Y > this.mapHeight) {
                dna.object.destroy();
                return;
            }
            dna.update();
        });

        this.cells.forEach((cell) => {
            if (cell.X < 1 || cell.X > this.mapWidth || cell.Y < 1 || cell.Y > this.mapHeight) {
                cell.conteiner.destroy();
                return;
            }
            cell.update(dt);
        });

        this.DNAPoints = this.DNAPoints.filter(dna => dna.object.active);
        this.DNADeadPoints = this.DNADeadPoints.filter(dna => dna.object.active);
        this.cells = this.cells.filter(cell => cell.object.active);
    }

};
