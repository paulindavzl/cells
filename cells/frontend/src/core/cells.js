// @ts-check

import { OfflineGame } from "./offline_game.js";
import { DNAPoints } from "./dna_points.js";
import { Bar, randomColor, randomItem, randomNumber } from "./utils.js";
import { setEffect, AttributeUpgrade } from "./upgrade_deck_ui.js"


export class Cells {

    /** 
     * @param {OfflineGame} scene
     * @param {boolean} isPlayer
    */
    constructor (scene, isPlayer=false) {
        this.scene = scene;
        this.isPlayer = isPlayer;

        this.X = randomNumber(0, scene.mapWidth);
        this.Y = randomNumber(0, scene.mapHeight);
        this.lastX = this.X;
        this.lastY = this.Y;
        this.speedSecond = 0;
        this.angle = null;
        this.angleVariation = 0;
        this.color = this.getUniqueColor()
        
        this.life = 20;
        this.maxLife = 20;
        this.defense = 20;
        this.damage = 8;
        this.defaultDamage=8;
        this.speed = 200;
        this.defaultSpeed = 200;
        this.size = 10;
        this.kills = 0;
        this.points = 0;
        this.level = 1;
        this.nextLevel = randomNumber(100, 200);

        /** @type {null | {"target": Cells | DNAPoints, "type": "hunt" | "escape"}} */
        this.state = null;

        this.attackOn = true;
        this.fullDefenseOn = false;
        this.attackCooldown = 500;
        this.fullDefenseCooldown = 200;

        this.adrenalineSpeedBuff = 20;
        this.adrenalineDamageBuff = 10;
        this.adrenalineTime = 0.5;
        this.adrenalineOn = false;
        this.DNA_harvesting = 1;
        this.lifeRecovery = 0;

        /** @type {Cells[]} */
        this.predators = [];
        /** @type {null|Cells} */
        this.hunting = null;

        this.object = scene.add.circle(this.X, this.Y, this.size, this.color);

        if (isPlayer) {
            scene.cameras.main.startFollow(this.object);
            this.initHUD();
        }

        this.startBackgroundEvents()
        this.scene.cells.push(this);
    }


    /**
     * 
     * @param {number} dt 
     */
    update (dt) {
        this.lifeBar?.updateValue(this.life, this.maxLife);
        this.pointsBar?.updateValue(this.points, this.nextLevel);

        if (!this.isAlive()) return;     

        this.fighting(dt)
        this.updatePosition();
        this.updatePoints();
        
        if (!this.isPlayer) {
            if (this.escape(dt)) "";
            else if (this.hunt(dt)) "";
            else this.findDNA(dt);
        }
        this.move(dt);
    }


    /**
     * 
     * @param {number} dt 
     */
    move (dt) {
        let dx = 0;
        let dy = 0;
        if (this.isPlayer) {
            const keys =  this.scene.getKeys();
            if (!keys) return;

            if (keys.w.isDown) dy -= 1;
            if (keys.s.isDown) dy += 1;
            if (keys.a.isDown) dx -= 1;
            if (keys.d.isDown) dx += 1;

        } else {
            let angle = this.angle
            if (this.state && this.state.type === "escape") {
                this.setAngleVariation();
                angle += this.angleVariation;
            }

            this.angle = Phaser.Math.Angle.RotateTo(this.angle, angle, 0.05);

            dx = Math.cos(this.angle);
            dy = Math.sin(this.angle);
        };
        
        if (this.X <= 1) dx += 1;
        if (this.X >= this.scene.mapWidth) dx -= -1;
        if (this.Y <= 1) dy += 1;
        if (this.Y >= this.scene.mapHeight) dy -= -1;
        
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) {
            dx /= length;
            dy /= length;
        }

        this.X = Phaser.Math.Clamp(this.X + dx * this.speed * dt, 10, this.scene.mapWidth - 10);
        this.Y = Phaser.Math.Clamp(this.Y + dy * this.speed * dt, 10, this.scene.mapHeight - 10);
    }


    setAngleVariation () {
        if (this.angleVariation !== 0) return;
        if (randomNumber(0, 1) === 0) return;
        this.angleVariation = randomNumber(-1.5, 1.5, false);
        this.scene.time.addEvent({
            delay: 300,
            callback: () => {
                this.angleVariation = 0;
            },
            callbackScope: this.scene,
            loop: false
        });
    }


    /**
     * 
     * @param {Cells | DNAPoints} target 
     * @param {"hunt" | "escape"} type 
     */
    setState (target, type) {
        this.state = {"target": target, "type": type};
        this.scene.time.addEvent({
            delay: randomNumber(500, 1000, false),
            callback: () => {
                this.state = null;
            },
            callbackScope: this.scene,
            loop: false
        });
    }


    updatePosition () {
        this.object.x = this.X;
        this.object.y = this.Y;
        this.object.radius = this.size;

        this.speedSecondUI?.setText(`${this.speedSecond} px/s`);
    }


    updatePoints () {
        if (this.points >= this.nextLevel) {
            this.points -= this.nextLevel;
            this.level ++;
            this.defaultSpeed -= (this.defaultSpeed * 0.05); // -5% speed/level
            this.size += (this.size * 0.1); // +10% size/level
            this.nextLevel = randomNumber(150, 300, false) * this.level;
            this.pointsBar?.updateValue(this.points, this.nextLevel);
            const attributesManager = new AttributeUpgrade(this.level);
            const cards = attributesManager.getCards();
            if (this.isPlayer) {
                console.log(this.level);
                this.scene.scene.pause();
                this.scene.scene.launch("deck-ui", {
                    player: this,
                    mode: "offline",
                    cards: cards
                })
            } else {
                const card = randomItem(cards);
                setEffect(this, card);
            }
        }
    }


    isAlive () {
        if (Math.floor(this.life) <= 0) {
            this.object.destroy();
            this.speedSecondUI?.destroy()
            for (let i = 0; i <= this.level * 50; i++) {
                const x = randomNumber(this.X - 20, this.X + 20);
                const y = randomNumber(this.Y - 20, this.Y + 20);
                new DNAPoints(this.scene, 2, 1, x, y, false);
            }
            return false;
        }
        return true;
    }


    fighting (dt) {
        const cells = this.scene.cells;
        cells.forEach(cell => {
            const dx = this.X - cell.X;
            const dy = this.Y - cell.Y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= ((this.size + cell.size )/2)) {
                let fighting = false;
                const imStronger = (this.level > cell.level) || (this.level == cell.level && this.points > cell.points + (this.nextLevel / 2));
                const imWeaker = (this.level < cell.level) || (this.level == cell.level && this.points < cell.points - (this.nextLevel / 2));

                if (imStronger && (this.attackOn && !cell.fullDefenseOn)) {
                    cell.life -= (this.damage - (this.damage * (cell.defense / 100)));
                    this.life -= ((cell.damage * (1/2)) - (cell.damage * (this.defense / 100)));    
                    fighting = true;
                    cell.adrenaline();         
                } else if (imWeaker && (!this.fullDefenseOn && cell.attackOn)) {
                    this.life -= (cell.damage - (cell.damage * (this.defense / 100)));
                    cell.life -= ((this.damage * (1/2)) - (this.damage * (cell.defense / 100)));
                    this.adrenaline();
                    fighting = true;
                };

                if (fighting) {
                    this.statusCooldown()
                    cell.statusCooldown()

                    const angle = Phaser.Math.Angle.Between(this.X, this.Y, cell.X, cell.Y);
                    const impact = 1200;
    
                    this.X = Phaser.Math.Clamp(this.X + (Math.cos(angle + Math.PI) * (impact) * dt), 10, this.scene.mapWidth - 10);
                    this.Y = Phaser.Math.Clamp(this.Y + (Math.sin(angle + Math.PI) * (impact) * dt), 10, this.scene.mapHeight - 10);
    
                    cell.X = Phaser.Math.Clamp(cell.X + (Math.cos(angle) * (impact) * dt), 10, this.scene.mapWidth - 10);
                    cell.Y = Phaser.Math.Clamp(cell.Y + (Math.sin(angle) * (impact) * dt), 10, this.scene.mapHeight - 10);
                }
            }
        })
    }


    statusCooldown () {
        this.attackOn = false;
        this.fullDefenseOn = true;

        this.scene.time.addEvent({
            delay: this.attackCooldown,
            callback: () => {
                this.attackOn = true;
            },
            callbackScope: this.scene,
            loop: false
        });
        this.scene.time.addEvent({
            delay: this.fullDefenseCooldown,
            callback: () => {
                this.fullDefenseOn = false;
            },
            callbackScope: this.scene,
            loop: false
        })
    }


    adrenaline () {
        if (!this.adrenalineOn){
            this.speed += (this.defaultSpeed * (this.adrenalineSpeedBuff/100));
            this.damage += (this.defaultDamage * (this.adrenalineDamageBuff/100));
            this.adrenalineOn = true;
            
            this.scene.time.addEvent({
                delay: this.adrenalineTime * 1000,
                callback: () => {
                    this.speed = this.defaultSpeed;
                    this.damage = this.defaultDamage;
                    this.adrenalineOn = false;
                },
                callbackScope: this.scene,
                loop: false
            });
        }
    }


    /**
     * @param {number} dt 
     * @returns {boolean} 
    */
    findDNA (dt) {
        if (this.isPlayer) return false;

        let nearest = null;
        if (this.state) {
            if (!this.state.target.object.active) this.state = null;
            if (this.state?.type === "escape" || this.state?.target instanceof Cells) return false;
            else nearest = this.state?.target ?? null;
        };

        const DNAPoints = this.scene.DNAPoints;

        if (DNAPoints.length > 0) {
            if (this.hunting) {
                this.hunting.predators.filter(cell => cell !== this);
                this.hunting = null;
            };

            if (!nearest) {
                nearest = DNAPoints[0];
                let minDist = Phaser.Math.Distance.Between(this.X, this.Y, nearest.X, nearest.Y);
    
                for (const dna of DNAPoints) {
                    if (!dna.object.active) continue;
                    const dist = Phaser.Math.Distance.Between(this.X, this.Y, dna.X, dna.Y);
                    if (dist < minDist) {
                        nearest = dna;
                        minDist = dist;
                    }
                }
                this.setState(nearest, "hunt");
            }

            this.angle = Math.atan2(nearest.Y - this.Y, nearest.X - this.X);
            return true;
        }
        return false;
    }


    /**
     * @param {number} dt 
     * @returns {boolean} 
    */
    escape (dt) {
        if (this.isPlayer) return false;

        /** @type {null | Cells} */
        let threat = null;

        if (this.state) {
            if (!this.state.target.object.active) this.state = null; 
            if (this.state?.type !== "escape" || this.state.target instanceof DNAPoints) return false;
            else threat = this.state.target;
        }

        if (!threat) {
            let minDist = Infinity;
    
            for (const cell of this.scene.cells) {
                if (cell === this) continue;
                if (!cell.object.active) continue;
    
                const dist = Phaser.Math.Distance.Between(this.X, this.Y, cell.X, cell.Y);
    
                if (dist < minDist && dist < randomNumber(150, 200) && (
                    cell.level > this.level  || ( cell.level == this.level && cell.points > this.points + (this.nextLevel / 2))
                )) {
                    threat = cell;
                    minDist = dist;
                }
            }
            if (threat) this.setState(threat, "escape");
        }

        if (threat) {
            if (this.hunting) {
                this.hunting.predators = this.hunting.predators.filter(cell => cell !== this);
                this.hunting = null;
            };

            let dx = this.X - threat.X;
            let dy = this.Y - threat.Y;

            if (dx !== 0 || dy !== 0) {
                this.angle = Math.atan2(dy, dx);
            }
            return true
        }
        return false;
    }


    /**
     * @param {number} dt 
     * @returns {boolean} 
    */
    hunt (dt) {
        if (this.isPlayer) return false;
        if (this.life <= this.maxLife * 0.5) return false;

        /** @type {null | Cells} */
        let prey = null;

        if (this.state) {
            if (!this.state.target.object.active) this.state = null;
            if (this.state?.type !== "hunt" || this.state.target instanceof DNAPoints) return false;
            else prey = this.state.target;
        }

        if (!prey) {
            let minDist = Infinity;
    
            for (const cell of this.scene.cells) {
                if (cell === this) continue;
                if (!cell.object.active) continue;
    
                const dist = Phaser.Math.Distance.Between(this.X, this.Y, cell.X, cell.Y);
    
                if (dist < minDist && dist < randomNumber(200, 250) && (
                    cell.level < this.level  || ( cell.level == this.level && cell.points < this.points - (this.nextLevel / 2))
                )) {
                    prey = cell;
                    minDist = dist;
                }
            }
            if (prey) this.setState(prey, "hunt");
        }

        if (prey) {
            if (this.hunting && this.hunting !== prey) {
                this.hunting.predators = this.hunting.predators.filter(cell => cell !== this);
            }
            this.hunting = prey;

            let dx = prey.X - this.X;
            let dy = prey.Y - this.Y;

            prey.predators.push(this);

            if (dx !== 0 || dy !== 0) {
                this.angle = Math.atan2(dy, dx);
            }
            return true;
        }
        return false;
    }


    initHUD () {
        const windows = this.scene.cameras.main;
        this.lifeBar = new Bar(
            this.scene, 
            windows.width * 0.1,
            windows.height * 0.1, 
            this.life, 
            this.maxLife, 
            0x5b5b5b, 
            true,
            {
                "r": 239,
                "g": 50, 
                "b": 50
            },
            {
                "r": 50,
                "g": 239,
                "b": 91
            }
        ).setScrollFactor(0);
        this.pointsBar = new Bar(
            this.scene, 
            windows.width * 0.1,
            windows.height * 0.12,
            this.points, 
            this.nextLevel, 
            0x5b5b5b, 
            false,
            {
                "r": 48,
                "g": 161, 
                "b": 222
            }
        ).setScrollFactor(0);
        this.speedSecondUI = this.scene.add.text(
            windows.width * 0.1,
            windows.height * 0.14,
            `${this.speedSecond} px/s`
        ).setScrollFactor(0);
    }


    startBackgroundEvents () {
        const time = this.scene.time;
        if (this.isPlayer) {
            time.addEvent({
                delay: 1000,
                callback: () => {
                    let dx = this.X - this.lastX;
                    let dy = this.Y - this.lastY;
                    
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    this.lastX = this.X;
                    this.lastY = this.Y;
    
                    this.speedSecond = Math.floor(distance);
                },
                callbackScope: this.scene,
                loop: true
            });
        }
        time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.life < this.maxLife) {
                    this.life += this.lifeRecovery;
                }

                if (this.points > 0) this.points -= 0.5;
            },
            callbackScope: this.scene,
            loop: true
        })
    }


    getUniqueColor () {
        while (true) {
            const colorsUnavailable = this.scene.cells.map(cell => cell.color);
            let color = randomColor();

            if (!colorsUnavailable.includes(color)) return color;
        }
    }

}