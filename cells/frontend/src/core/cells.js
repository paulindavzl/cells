// @ts-check
/// <reference path="../types/types.ts" />


import { OfflineGame } from "../scenes/offline_game.js";
import { DNAPoints } from "./dna_points.js";
import { Bar, parseNaturalEffects, randomColor, randomItem, randomNumber } from "./utils.js";
import { setEffect, AttributeUpgrade } from "./upgrades.js";
import { Messager } from "./messages.js";


export class Cells {

    /** 
     * @param {OfflineGame} scene
     * @param {string} specie 
     * @param {boolean} isPlayer
    */
    constructor (scene, specie, isPlayer=false) {
        this.scene = scene;
        this.isPlayer = isPlayer;
        this.scene.cells.push(this);
        this.playerWatching = false;
        
        if (!isPlayer) specie += `-${scene.cells.length}`;
        this.specie = specie;

        this.X = randomNumber(0, scene.mapWidth);
        this.Y = randomNumber(0, scene.mapHeight);
        this.lastX = this.X;
        this.lastY = this.Y;
        this.speedSecond = 0;
        this.angle = null;
        this.angleVariation = 0;
        // @ts-ignore
        this.color = this.getUniqueColor()

        // controla o ganho de cartas raras/épicas
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
        this.allPoints = 0;
        this.level = 1;
        this.nextLevel = randomNumber(100, 200);
        this.reduceSpeedBy = 5;
        this.stamina = 100;
        this.maxStamina = 100;

        /** @type {null | {"target": Cells | DNAPoints, "type": "hunt" | "escape"}} */
        this.state = null;
        /** @type {EffectType[]} */
        this.effects = []

        // consumo de estâmina para ações
        this.consumptionForRunning = 2;
        this.consumptionForRegeneration = 2;

        // controla o tempo em que pode atacar ou ser atacado e corrida
        this.attackOn = true;
        this.fullDefenseOn = false;
        this.attackCooldown = 600;
        this.fullDefenseCooldown = 200;
        this.running = false;

        // buffs
        this.adrenalineSpeedBuff = 20;
        this.adrenalineDamageBuff = 10;
        this.adrenalineTime = 1;
        this.adrenalineOn = false;
        this.DNAHarvesting = 1;
        this.lifeRegeneration = 0;
        this.staminaRegeneration = 1;
        this.reduceSpeed = true;
        this.runBuff = 100;

        // máximo de cada atributo cada 5 níveis
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
            lifeRegeneration: 8,
            multiplierMaxValue: 1.5,
            runBuff: 200
        };

        this.reference = null;

        /** @type {Cells[]} */
        this.predators = [];
        /** @type {null|Cells} */
        this.hunting = null;
        /** @type {null|Cells} */
        this.lastHunt = null;
        /** @type {null|Cells} */
        this.lastPrey = null;

        /** @type {CellEventType[]} */
        this.events = [];

        this.object = scene.add.circle(0, 0, this.size, this.color);
        this.nameTextObject = scene.add.text(0, this.size -55, this.specie, {
            color: isPlayer ? "#2ddc27ff" : "#ff1d1dff",
            align: "center"
        }).setOrigin(0.5);

        this.allPointsTextObject = scene.add.text(0, this.size -40, `(${this.allPoints})`,
            {
                color: isPlayer ? "#2ddc27ff" : "#ff1d1dff",
                align: "center",
                fontSize: 12
            }
        ).setOrigin(0.5);

        this.alertObject = scene.add.image(0, this.size -75, "alert_icon").setScale(0.04);
        this.alertObject.visible = false;
        
        this.targetObject = scene.add.image(0, this.size -75, "target_icon").setScale(0.06);
        this.targetObject.visible = false;

        this.conteiner = scene.add.container(this.X, this.Y, [this.object, this.nameTextObject, this.allPointsTextObject, this.alertObject, this.targetObject]);

        if (isPlayer) {
            scene.cameras.main.startFollow(this.conteiner);
        }

        this.startBackgroundEvents()

        this.chooseCard();

        this.statusCooldown("defense");
    }


    /** @param {CellEventType} event  */
    addEvent (event) {
        event.triggerTime = 0;
        this.events.push(event);
    }


    /** @param {number} time  */
    executeEvents (time) {
        const removeEvents = new Set();

        this.events.forEach(event => {
            // @ts-ignore
            event.triggerTime += time * 1000;
            // @ts-ignore
            if (event.triggerTime >= event.delay) {
                const callback = event.callback();
                if (!event.loop || (event.destroy && callback)) {
                    removeEvents.add(event);
                    return;
                };
                event.triggerTime = 0;
            };
        });

        this.events = this.events.filter(event => !removeEvents.has(event));
    }


    /**
     * 
     * @param {number} dt 
     */
    update (dt) {
        if (!this.isAlive()) return;
        this.executeEvents(dt);

        this.fighting(dt)
        this.updatePosition();
        this.updatePoints();
        
        let prey = this.minDistWeaker();

        if (!this.isPlayer) {
            if (this.escape()) "";
            else if (this.findDNA(false)) "";
            else if (this.hunt(prey)) "";
            else this.findDNA(true);
        }
        if (this.isPlayer || this.playerWatching) {
            if (!this.lastPrey) this.lastPrey = prey;
            else if (this.lastPrey !== prey) this.lastPrey.targetObject.visible = false;

            if (prey) prey.targetObject.visible = true;
            this.lastPrey = prey;
            this.targetObject.visible = false;
        }
        this.move(dt);

        const gameUI = this.scene.scene.get("game-ui");
        // @ts-ignore
        if (gameUI.runText.active && this.playerWatching || (this.isPlayer && this.scene.getKeys()?.SPACE.isDown)) gameUI.runText.destroy();

        this.allPointsTextObject.text = `(${Math.floor(this.allPoints)})`;

        if (this.isPlayer || this.playerWatching) {
            this.nameTextObject.setColor("#2ddc27ff");
            this.allPointsTextObject.setColor("#2ddc27ff");
        } else {
            this.nameTextObject.setColor("#ff1d1dff");
            this.allPointsTextObject.setColor("#ff1d1dff");
        }
    }


    // @ts-ignore
    run (key) {
        if (
            this.running || 
            this.stamina < (this.maxStamina * 0.3) ||
            (!this.isPlayer && this.reference === "dna")
        ) return;

        this.running = true;

        this.effects.push({
            name: "speed",
            type: "buff",
            message: `increased speed (+${this.runBuff})`,
            cause: "running",
            natural: false,
            change: this.runBuff
        })

        this.addEvent({
            delay: 20,
            callback: () => {
                if (
                    // @ts-ignore
                    (this.isPlayer && !key.isDown) || 
                    this.stamina < this.consumptionForRunning || 
                    (!this.isPlayer && (this.reference !== "cell" || (this.stamina < this.maxStamina * 0.25 && [1, 3].includes(randomNumber(1, 3)))))
                ) {
                    this.effects = this.effects.filter(effect => effect.name !== "speed" || (effect.cause !== "running"));
                    this.running = false;
                    return true;
                } else {
                    this.stamina -= this.consumptionForRunning;
                }
            },
            loop: true,
            destroy: true
        });
    }


    /**
     * 
     * @param {number} dt 
     */
    move (dt) {
        let dx = 0;
        let dy = 0;
        const keys =  this.scene.getKeys();
        if (this.isPlayer) {
            if (!keys) return;

            if (keys.SPACE.isDown) this.run(keys.SPACE);
            if (keys.w.isDown) dy -= 1;
            if (keys.s.isDown) dy += 1;
            if (keys.a.isDown) dx -= 1;
            if (keys.d.isDown) dx += 1;

        } else {
            if (
                this.stamina >= (this.maxStamina * randomNumber(0.3, 0.5, false)) &&
                (this.reference === "cell" && (this.life > this.maxLife * 0.3) && ((
                    // @ts-ignore
                    this.state?.type === "hunt" && (this.state.target.isPlayer || this.state.target.playerWatching) && randomNumber(0, 3, true) !== 2
                )) || randomNumber(0, 4, true) === 2)
            ) this.run(keys?.SPACE);

            let angle = this.angle;
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

        const speed = this.getSpeed();

        this.X = Phaser.Math.Clamp(this.X + dx * speed * dt, 10, this.scene.mapWidth - 10);
        this.Y = Phaser.Math.Clamp(this.Y + dy * speed * dt, 10, this.scene.mapHeight - 10);
    }


    setAngleVariation () {
        if (this.angleVariation !== 0) return;
        if (randomNumber(1, 5) === 2) return;
        this.angleVariation = randomNumber(-3, 3, false);
        this.addEvent({
            delay: 300,
            callback: () => {
                this.angleVariation = 0;
            },
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
        this.addEvent({
            delay: randomNumber(500, 1000, false),
            callback: () => {
                this.state = null;
            },
            loop: false
        });
    }


    updatePosition () {
        this.conteiner.x = this.X;
        this.conteiner.y = this.Y;
        this.object.radius = this.size;
    }


    updateMaxValue () {
        for (let key in this.maxPerFiveLevel) { // @ts-ignore
            if (key !== "multiplierMaxValue") this.maxPerFiveLevel[key] *= this.multiplierMaxValue;
        };
    }


    increasedLevel () {
        const star = this.scene.add.image(0, -this.size, "level_up")
            .setScale(0.05);
        this.conteiner.add(star);

        let repeat = 0;
        this.addEvent({
            delay: 5,
            callback: () => {
                repeat ++
                if (repeat <= 20) star.y -= 1;
                if (repeat >= 30) {
                    star.destroy(); 
                    return true;
                };
            },
            loop: true,
            destroy: true
        })
    }


    chooseCard () {
        const attributesManager = new AttributeUpgrade(this, this.lastRareCard > 5, this.lastEpicCard > 10);
        const cards = attributesManager.getCards();
        if (this.isPlayer) {
            this.scene.scene.pause();
            this.scene.scene.launch("deck-ui", {
                player: this,
                mode: this.scene.MODE,
                cards: cards
            })
        } else {
            const card = randomItem(cards);
            setEffect(this, card);
        }
    }


    updatePoints () {
        if (this.points >= this.nextLevel) {
            this.increasedLevel();
            this.lastRareCard += 1;
            this.lastEpicCard += 1;
            this.points -= this.nextLevel;
            this.level ++;
            this.consumptionForRunning *= 1.1;
            this.consumptionForRegeneration *= 1.1;
            if (this.reduceSpeed) this.baseSpeed -= (this.baseSpeed * (this.reduceSpeedBy / 100));
            this.size += (this.size * 0.05);
            this.nextLevel = randomNumber(150, 300, false) * this.level;

            if (this.level / 5 === 1 || this.level / 5 === 5) this.updateMaxValue();

            this.chooseCard();
        }

    }


    isAlive (onlyread=false) {
        if (Math.floor(this.life) <= 0) {
            if (!onlyread) {
                if (this.lastContact?.object.active) {
                    this.lastContact.kills ++; 
                };
                if (this.isPlayer || this.playerWatching) {
                    // @ts-ignore
                    this.changeCamera(this.lastContact);
                };
                
                this.conteiner.destroy();
                for (let i = 0; i <= this.level * 50; i++) {
                    const x = randomNumber(this.X - 20, this.X + 20);
                    const y = randomNumber(this.Y - 20, this.Y + 20);
                    new DNAPoints(this.scene, 2, 1, x, y, false);
                }

                const reason = this.lastContactType === "attack" ? "attacking him" : "trying to escape";
                const killed = `[b][u][color=red]${this.specie}[/color][/u][/b]`;
                const killer = `[b][u][color=green]${this.lastContact?.specie}[/color][/u][/b]`
                new Messager(`${killed} was killed by ${killer} while ${reason}`, this.scene, "yellow");
            }
            return false;
        }
        return true;
    }


    /** @param {Cells} target  */
    changeCamera (target) {
        if (!target || !target.object.active) {
            // @ts-ignore
            target = this.scene.cells.find(cell => cell != this && cell.object.active && cell.isAlive(true));
        } 
        const main = this.scene.cameras.main;

        main.stopFollow();
        main.startFollow(target.conteiner);

        target.playerWatching = true;

        // @ts-ignore
        this.scene.scene.get("game-ui").changeReference(target, this.isPlayer ? target.specie : null);
    }


    getSpeed () {
        let speed = this.speed;

        this.effects.forEach(effect => {
            if (effect.name !== "speed") return;
            speed += effect.change ?? 0;
        })
        
        return speed;
    }
    
    
    getDamage () {
        let damage = this.damage;
        
        this.effects.forEach(effect => {
            if (effect.name !== "damage") return;
    
            damage += effect.change ?? 0;
        })
        
        return damage;
    }
    
    
    getDefense () {
        let defense = this.defense;
        
        this.effects.forEach(effect => {
            if (effect.name !== "defense") return;
    
            defense += effect.change ?? 0;
        })

        return defense;
    }


    getlifeRegeneration () {
        let lifeRegeneration = this.lifeRegeneration;

        this.effects.forEach(effect => {
            if (effect.name !== "lifeRegeneration") return;

            lifeRegeneration += effect.change ?? 0;
        })

        return lifeRegeneration;
    }


    // @ts-ignore
    fighting (dt) {
        let fighting = false;

        /**
         * 
         * @param {Cells} stronger 
         * @param {Cells} weaker 
         */
        const initFight = (stronger, weaker, full=true) => {
            const strongerDamage = stronger.getDamage();
            const strongerDefense = stronger.getDefense();
            const weakerDamage = weaker.getDamage();
            const weakerDefense = weaker.getDefense();

            fighting = true;
            weaker.life -= Phaser.Math.Clamp((strongerDamage * (full ? 1 : 1/3) - (strongerDamage * (weakerDefense / 100))), stronger.level, weaker.maxLife);
            stronger.life -= Phaser.Math.Clamp(((weakerDamage * (full ? 1/2 : 1/3)) - (weakerDamage * (strongerDefense / 100))), weaker.level, stronger.maxLife);    

            if (!full) stronger.adrenaline();
            weaker.adrenaline();

            if (full) {
                stronger.statusCooldown("attack");
                weaker.statusCooldown("defense");
            }     
            stronger.lastContactType = !full ? "defense" : "attack";  
            weaker.lastContactType = full ? "defense": "attack";

            if (weaker === stronger.hunting && !full) stronger.successHunt = true;

            stronger.lastContact = weaker;
            weaker.lastContact = stronger;
        }
        const cells = this.scene.cells;
        cells.forEach(cell => {
            if (cell === this) return;
            const dx = this.X - cell.X;
            const dy = this.Y - cell.Y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= ((this.object.width + cell.object.width )/2) - 5) {
                if (cell.hunting === this && cell.attackOn && !this.fullDefenseOn) initFight(cell, this);
                else if ((this.hunting === cell || this.isPlayer) && this.attackOn && !cell.fullDefenseOn) initFight(this, cell);
                else initFight(this, cell, false);

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


    // @ts-ignore
    statusCooldown (type) {
        this.attackOn = false;
        this.fullDefenseOn = true;

        if (type === "attack") {
            this.addEvent({
                delay: this.attackCooldown,
                callback: () => {
                    this.attackOn = true;
                },
                loop: false
            });
        }
        else {
            const circle = this.scene.add.image(0, 0, "defense_circle")
                .setScale(0.9);
            this.conteiner.add(circle);
            this.addEvent({
                delay: this.fullDefenseCooldown,
                callback: () => {
                    this.fullDefenseOn = false;
                    circle.destroy();
                },
                loop: false
            });
        }
    }


    adrenaline () {
        if (!this.adrenalineOn){
            this.adrenalineOn = true;
            
            this.addEvent({
                delay: this.adrenalineTime * 1000,
                callback: () => {
                    this.adrenalineOn = false;
                },
                loop: false
            });
        }
    }


    /**
     * @param {boolean} natural 
     * @returns {boolean} 
    */
    findDNA (natural) {
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
                nearest = null;
                let minDist = natural ? Infinity : 400;
    
                for (const dna of DNAPoints) {
                    if (!dna.object.active || dna.invincibility) continue;
                    if (natural && !dna.natural) continue;
                    if (!natural && dna.natural) continue;
                    const dist = Phaser.Math.Distance.Between(this.X, this.Y, dna.X, dna.Y);
                    if (dist < minDist) {
                        nearest = dna;
                        minDist = dist;
                    }
                }
            }
            if (nearest) {
                this.setState(nearest, "hunt");
                this.angle = Math.atan2(nearest.Y - this.Y, nearest.X - this.X);
                this.reference = "dna";
                return true;
            }
        }
        return false;
    }


    /**
     * @returns {boolean} 
    */
    escape () {
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
            this.reference = "cell";
            return true
        }
        return false;
    }


    /**
     * @param {Cells|null} prey 
     * @returns {boolean} 
    */
    hunt (prey) {
        if (this.isPlayer) return false;
        if (this.life <= this.maxLife * 0.5) return false;
        if (this.stamina < this.maxStamina * 0.1) return false;

        if (this.state) {
            if (!this.state.target.object.active) this.state = null;
            if (this.state?.type !== "hunt" || this.state.target instanceof DNAPoints) return false;
            else prey = this.state.target;
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
            this.reference = "cell";
            return true;
        }
        return false;
    }


    minDistWeaker () {
        let minDist = Infinity;
        let prey = null;
        for (const cell of this.scene.cells) {
            if (cell === this) continue;
            if (!cell.conteiner.active) continue;

            const dist = Phaser.Math.Distance.Between(this.X, this.Y, cell.X, cell.Y);
            const visiblity = this.isPlayer ? (window.innerHeight / 2) - 50  : randomNumber(300, 500)
            if (dist < minDist && dist < visiblity && (
                cell.level < this.level  || ( cell.level == this.level && cell.points < this.points - (this.level * 50))
            ) && cell !== this.lastHunt) {
                prey = cell;
                minDist = dist;
            }
        }

        return prey;
    }


    startBackgroundEvents () {
        // ativa/desativa efeitos
        this.addEvent({
            delay: 30/1000,
            callback: () => {
                this.effects = this.effects.filter(e => !e.natural); // limpa todos os efeitos naturais
                const effects = parseNaturalEffects(this);

                effects.forEach(effect => {
                    if (!this.effects.find(e => 
                        e.name === effect.name &&
                        e.type === effect.type && 
                        e.cause === effect.cause
                    )) this.effects.push(effect);
                });
                
            },
            loop: true
        })

        // calcula a velocidada em px da célula
        this.addEvent({
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
            loop: true
        });

        // para de caçar a mesma célula depois de um tempo sem sucesso
        let timeHuntControl = 0;
        let tolerance = randomNumber(3000, 6000);
        let lastDist = 0;
        this.addEvent({
            delay: 200,
            callback: () => {
                if (!this.hunting) {
                    timeHuntControl = 0;
                    this.successHunt = false;
                    return;
                }
                
                const dist = Phaser.Math.Distance.Between(this.X, this.Y, this.hunting.X, this.hunting.Y);
                if (dist < lastDist - 5) {
                    timeHuntControl = 0;
                    this.successHunt = false;
                } else if (this.successHunt) {
                    timeHuntControl = 0;
                    this.successHunt = false;
                } else {
                    timeHuntControl += 200;
                }

                lastDist = dist;

                const cancelHunt = () => {
                    this.lastHunt = this.hunting;
                    // @ts-ignore
                    this.hunting.predators = this.hunting.predators.filter(c => c !== this);
                    this.hunting = null;
                    timeHuntControl = 0;
                    tolerance = randomNumber(3000, 6000);

                    this.addEvent({
                        delay: randomNumber(3000, 6000),
                        callback: () => {
                            this.lastHunt = null;
                        },
                        loop: false
                    });
                }

                if (timeHuntControl >= tolerance) {
                    cancelHunt();
                } else if (timeHuntControl > 4000 && this.stamina < this.maxStamina * 0.35) {
                    cancelHunt();
                    this.lastHunt = null;
                }
            },
            loop: true
        })

        // recupera a vida. recupera estâmina e diminui os pontos
        this.addEvent({
            delay: 1000,
            callback: () => {
                const lifeRegen = this.getlifeRegeneration();
                if (this.life < this.maxLife && lifeRegen > 0) {
                    /** @type {EffectType} */
                    const effect = {
                        name: "lifeRegeneration",
                        type: "buff",
                        message: `active regeneration (+${lifeRegen.toFixed(2)}/s)`,
                        cause: "low_life",
                        natural: false
                    };

                    if (!this.effects.find(e => 
                        e.name === effect.name &&
                        e.type === effect.type && 
                        e.cause === effect.cause
                    )) {
                        this.effects.push(effect);
                        this.addEvent({
                            delay: 20,
                            callback: () => {
                                if (this.life >= this.maxLife) {
                                    this.effects = this.effects.filter(e => e !== effect)
                                    return true;
                                }
                            },
                            loop: true,
                            destroy: true
                        });
                    };

                    this.life = Phaser.Math.Clamp(this.life + lifeRegen, this.life, this.maxLife);
                    this.stamina -= this.consumptionForRegeneration;
                }

                const pointsReduction = 0.5 * (this.level / 2);
                if (this.points > 0) this.points -= pointsReduction;
                if (this.allPoints > 0) this.allPoints -= pointsReduction;

                if (this.stamina < this.maxStamina && !this.running) this.stamina += this.staminaRegeneration * (this.adrenalineOn ? 2 : 1);
            },
            loop: true
        })

        // adiciona um sinal de alerta nas células que estão te caçando
        this.addEvent({
            delay: 50,
            callback: () => {
                if (this.hunting && (this.hunting.isPlayer || this.hunting.playerWatching)) this.alertObject.visible = true;
                else this.alertObject.visible = false;
            },
            loop: true
        })

    }


    // @ts-ignore
    getUniqueColor () {
        while (true) {
            // @ts-ignore
            const colorsUnavailable = this.scene.cells.map(cell => cell.color);
            let color = randomColor();

            if (!colorsUnavailable.includes(color)) return color;
        }
    }

} 