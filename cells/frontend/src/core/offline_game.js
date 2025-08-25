// @ts-check
/// <reference path="../types/phaser.d.ts" />

import { DNAPoints } from "./dna_points.js";
import { keyMapper } from "./key_handler.js";
import { loadAnims, loadImages } from "./load_sprites.js";
import { Cells } from "./cells.js";

export class OfflineGame extends Phaser.Scene {


    constructor () {
        super("offline-scene")
        /** @type {DNAPoints[]} */
        this.DNAPoints = [];
        /** @type {DNAPoints[]} */
        this.DNADeadPoints = [];
        /** @type {Cells[]} */
        this.cells = [];
        
        this.keys = keyMapper(this);

        this.botsNumberMax = 20;
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
    }
    

    create () {
        this.add.graphics()
            .lineStyle(4, 0xffffffff)
            .strokeRect(1, 1, this.mapWidth, this.mapHeight);
            
        loadAnims(this, "dna_sprite")

        for ( let i = 0; i < this.maxDNAPoints; i ++ ) {
            new DNAPoints(this);
        }

        for (let i = 0; i < this.botsNumberMax; i ++) {
            new Cells(this);
        }

        const windows = this.cameras.main;
        this.player = new Cells(this, true);
        this.alivesText = this.add.text(windows.width * 0.5, windows.height * 0.1, `alives: ${this.cells.length}`)
        .setScrollFactor(0);
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
        if (!this.alivesText) return;
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
                cell.object.destroy();
                return;
            }
            cell.update(dt);
        });

        this.DNAPoints = this.DNAPoints.filter(dna => dna.object.active);
        this.DNADeadPoints = this.DNADeadPoints.filter(dna => dna.object.active);
        this.cells = this.cells.filter(cell => cell.object.active);
        this.alivesText.text = `alives: ${this.cells.length}`;
    }

};
