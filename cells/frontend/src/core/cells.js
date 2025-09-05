// @ts-check

import { OfflineGame } from "../scenes/offline_game.js";
import { DNAPoints } from "./dna_points.js";
import { Bar, randomColor, randomItem, randomNumber } from "./utils.js";
import { setEffect, AttributeUpgrade } from "./upgrades.js";
import { Messager } from "./messages.js";
import { GameUI } from "../scenes/UI/game_ui.js";


export class Cells {

    /** 
     * @param {OfflineGame} scene
     * @param {boolean} isPlayer
    */
    constructor (scene, specie, isPlayer=false) {
        this.scene = scene;
        this.specie = specie;
        this.isPlayer = isPlayer;
        this.scene.cells.push(this);
        this.playerWatching = false;

        if (!isPlayer) specie += `-${scene.cells.length}`;

        this.X = randomNumber(0, scene.mapWidth);
        this.Y = randomNumber(0, scene.mapHeight);
        this.lastX = this.X;
        this.lastY = this.Y;
        this.speedSecond = 0;
        this.angle = null;
        this.angleVariation = 0;
        this.color = this.getUniqueColor()

        this.lastRareCard = 0;
        this.lastEpicCard = 0;

        /** @type {null|Cells} */
        this.lastContact = null;
        /** @type {null|("defense"|"attack")} */
        this.lastContactType = null;
        this.successHunt = false;
        
        this.life = 20;
        this.maxLife = 20;
        this.defense = 20;
        this.baseDefense = 20;
        this.damage = 8;
        this.baseDamage = 8;
        this.speed = 200;
        this.baseSpeed = 200;
        this.size = 10;
        this.kills = 0;
        this.points = 0;
        this.level = 1;
        this.nextLevel = randomNumber(100, 200);
        this.reduceSpeedBy = 5;

        /** @type {null | {"target": Cells | DNAPoints, "type": "hunt" | "escape"}} */
        this.state = null;

        this.attackOn = true;
        this.fullDefenseOn = false;
        this.attackCooldown = 600;
        this.fullDefenseCooldown = 200;

        this.adrenalineSpeedBuff = 20;
        this.adrenalineDamageBuff = 10;
        this.adrenalineTime = 1;
        this.adrenalineOn = false;
        this.DNAHarvesting = 1;
        this.lifeRecovery = 0;
        this.reduceSpeed = true;

        this.multiplierMaxValue = 1.3;
        this.maxPerFiveLevel = {
            maxLife: 40,
            baseDefense: 40,
            baseDamage: 18,
            baseSpeed: 300,
            attackCooldown: 400,
            fullDefenseCooldown: 400,
            adrenalineSpeedBuff: 40,
            adrenalineDamageBuff: 20,
            adrenalineTime: 1,
            DNAHarvesting: 5,
            lifeRecovery: 8,
            multiplierMaxValue: 1.5,
        };

        /** @type {Cells[]} */
        this.predators = [];
        /** @type {null|Cells} */
        this.hunting = null;
        /** @type {null|Cells} */
        this.lastHunt = null;

        this.object = scene.add.circle(0, 0, this.size, this.color);
        this.nameTextObject = scene.add.text(0, -30, this.specie, {
            color: isPlayer ? "#2ddc27ff" : "#ff1d1dff",
            align: "center"
        }).setOrigin(0.5);
        this.conteiner = scene.add.container(this.X, this.Y, [this.object, this.nameTextObject]);

        if (isPlayer) {
            scene.cameras.main.startFollow(this.conteiner);
        }

        this.startBackgroundEvents()

    }


    /**
     * 
     * @param {number} dt 
     */
    update (dt) {
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
        this.conteiner.x = this.X;
        this.conteiner.y = this.Y;
        this.object.radius = this.size;
    }


    updateMaxValue () {
        for (let key in this.maxPerFiveLevel) {
            if (key !== "multiplierMaxValue") this.maxPerFiveLevel[key] *= this.multiplierMaxValue;
        };
    }


    increasedLevel () {
        const star = this.scene.add.image(0, -this.size, "level_up")
            .setScale(0.05);
        this.conteiner.add(star);

        let repeat = 0;
        this.scene.time.addEvent({
            delay: 5,
            callback: () => {
                repeat ++
                if (repeat <= 20) star.y -= 1;
                if (repeat >= 30) star.destroy();
            },
            callbackScope: this.scene,
            repeat: 30
        })
    }


    updatePoints () {
        if (this.points >= this.nextLevel) {
            this.increasedLevel();
            this.lastRareCard += 1;
            this.lastEpicCard += 1;
            this.points -= this.nextLevel;
            this.level ++;
            if (this.reduceSpeed) this.baseSpeed -= (this.baseSpeed * (this.reduceSpeedBy / 100));
            this.size += (this.size * 0.01);
            this.nextLevel = randomNumber(150, 300, false) * this.level;

            if (this.level / 5 === 1 || this.level / 5 === 5) this.updateMaxValue();

            const attributesManager = new AttributeUpgrade(this, this.lastRareCard > 5, this.lastEpicCard > 10);
            const cards = attributesManager.getCards();
            if (this.isPlayer) {
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


    isAlive (onlyread=false) {
        if (Math.floor(this.life) <= 0) {
            if (!onlyread) {
                if (this.lastContact?.object.active) {
                    this.lastContact.kills ++;
                    if (this.isPlayer || this.playerWatching) {
                        const follow = (this.lastContact.object.active) ? this.lastContact : this.scene.cells.find(cell => cell.object.active && cell.isAlive(true));
                        const main = this.scene.cameras.main;
                        if (follow) {
                            main.stopFollow();
                            main.startFollow(follow.conteiner);
                            follow.playerWatching = true;

                            // @ts-ignore
                            this.scene.scene.get("game-ui").changeReference(follow);
                        }
                    };
                }
    
                const reason = this.lastContactType === "attack" ? "attacking him" : "trying to escape";
                const killed = `[b][u][color=red]${this.specie}[/color][/u][/b]`;
                const killer = `[b][u][color=green]${this.lastContact?.specie}[/color][/u][/b]`
                new Messager(`${killed} was killed by ${killer} while ${reason}`, this.scene, "yellow");
    
                this.conteiner.destroy();
                for (let i = 0; i <= this.level * 50; i++) {
                    const x = randomNumber(this.X - 20, this.X + 20);
                    const y = randomNumber(this.Y - 20, this.Y + 20);
                    new DNAPoints(this.scene, 2, 1, x, y, false);
                }
            }
            return false;
        }
        return true;
    }


    fighting (dt) {
        const cells = this.scene.cells;
        cells.forEach(cell => {
            if (cell === this) return;
            const dx = this.X - cell.X;
            const dy = this.Y - cell.Y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= ((this.size + cell.size )/2)) {
                let fighting = false;
                const imStronger = (this.level > cell.level) || (this.level == cell.level && this.points > cell.points + (cell.level * 50));
                const imWeaker = (this.level < cell.level) || (this.level == cell.level && this.points < cell.points - (this.level * 50));

                this.lastContact = cell;
                cell.lastContact = this;
                if (imStronger && (this.attackOn && !cell.fullDefenseOn)) {
                    cell.life -= (this.damage - (this.damage * (cell.defense / 100)));
                    this.life -= ((cell.damage * (1/2)) - (cell.damage * (this.defense / 100)));    
                    fighting = true;
                    cell.adrenaline();
                    this.lastContactType = "attack";       
                    this.statusCooldown("attack");
                    cell.lastContactType = "defense";
                    if (cell === this.hunting) this.successHunt = true;
                } else if (imWeaker && (!this.fullDefenseOn && cell.attackOn)) {
                    this.life -= (cell.damage - (cell.damage * (this.defense / 100)));
                    cell.life -= ((this.damage * (1/2)) - (this.damage * (cell.defense / 100)));
                    this.adrenaline();
                    fighting = true;
                    this.lastContactType = "defense";
                    this.statusCooldown("defense");
                    cell.lastContactType = "attack";       
                };

                if (fighting) {

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


    statusCooldown (type) {
        this.attackOn = false;
        this.fullDefenseOn = true;

        if (type === "attack") {
            this.scene.time.addEvent({
                delay: this.attackCooldown,
                callback: () => {
                    this.attackOn = true;
                },
                callbackScope: this.scene,
                loop: false
            });
        }
        else {
            const circle = this.scene.add.image(0, 0, "defense_circle")
                .setScale(0.9);
            this.conteiner.add(circle);
            this.scene.time.addEvent({
                delay: this.fullDefenseCooldown,
                callback: () => {
                    this.fullDefenseOn = false;
                    circle.destroy();
                },
                callbackScope: this.scene,
                loop: false
            });
        }
    }


    adrenaline () {
        if (!this.adrenalineOn){
            this.speed += (this.baseSpeed * (this.adrenalineSpeedBuff/100));
            this.damage += (this.baseDamage * (this.adrenalineDamageBuff/100));
            this.adrenalineOn = true;
            
            this.scene.time.addEvent({
                delay: this.adrenalineTime * 1000,
                callback: () => {
                    this.speed = this.baseSpeed;
                    this.damage = this.baseDamage;
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
                if (!cell.conteiner.active) continue;
    
                const dist = Phaser.Math.Distance.Between(this.X, this.Y, cell.X, cell.Y);
    
                if (dist < minDist && dist < randomNumber(150, 200) && (
                    cell.level > this.level  || ( cell.level == this.level && cell.points > this.points + (cell.level * 50))
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
                if (!cell.conteiner.active) continue;
    
                const dist = Phaser.Math.Distance.Between(this.X, this.Y, cell.X, cell.Y);
    
                if (dist < minDist && dist < randomNumber(200, 250) && (
                    cell.level < this.level  || ( cell.level == this.level && cell.points < this.points - (this.level * 50))
                ) && cell !== this.lastHunt) {
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


    startBackgroundEvents () {
        const time = this.scene.time;

        // calcula a velocidada em px da célula
        time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.isPlayer || this.playerWatching) {

                    let dx = this.X - this.lastX;
                    let dy = this.Y - this.lastY;
                    
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    this.lastX = this.X;
                    this.lastY = this.Y;

                    this.speedSecond = Math.floor(distance);
                }
            },
            callbackScope: this.scene,
            loop: true
        });

        // para de caçar a mesma célula depois de um tempo sem sucesso
        let timeHuntControl = 0;
        let tolerance = randomNumber(3000, 6000);
        let lastDist = 0;
        time.addEvent({
            delay: 200,
            callback: () => {
                if (!this.hunting) {
                    timeHuntControl = 0;
                    this.successHunt = false;
                    return;
                }
                
                const dist = Phaser.Math.Distance.Between(this.X, this.Y, this.hunting.X, this.hunting.Y);
                if (dist < lastDist - 10) {
                    timeHuntControl = 0;
                    this.successHunt = false;
                } else if (this.successHunt) {
                    timeHuntControl = 0;
                    this.successHunt = false;
                } else {
                    timeHuntControl += 200;
                }

                lastDist = dist;

                if (timeHuntControl >= tolerance) {
                    if (timeHuntControl >= tolerance) {
                        this.lastHunt = this.hunting;
                        this.hunting.predators = this.hunting.predators.filter(c => c !== this);
                        this.hunting = null;
                        timeHuntControl = 0;
                        tolerance = randomNumber(3000, 6000);

                        this.scene.time.addEvent({
                            delay: randomNumber(3000, 6000),
                            callback: () => {
                                this.lastHunt = null;
                            },
                            callbackScope: this.scene
                        });
                    }
                }
            },
            callbackScope: this.scene,
            loop: true
        })

        // recupera a vida e diminui os pontos
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