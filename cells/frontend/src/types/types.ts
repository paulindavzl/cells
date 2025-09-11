type UpdateAttributeType = {
    "id": string, 
    "updateIn": string,
    "attribute": string, 
    "text": string, 
    "type": ("absolute"|"percent"|"boolean"), 
    "absolute"?:number, 
    "percent"?:number, 
    "boolean"?: boolean,
    "update"?: string, 
    "minLevel": number, 
    "rarity": (1|2|3|4|5|6|7|8|9|10|11|12), 
    "rarityName": ("common"|"rare"|"epic"),
    "increment": string,
    "conditions"?: {
        "attribute": string,
        "comparator": ("==="|"!=="|"<"|">"),
        "value": any
    }[]
};


type PossibleUpdateAttributeType = {
    "id": string, 
    "updateIn": string,
    "attribute": string, 
    "text": string, 
    "type": ["absolute","percent"]|["boolean"]|["absolute"]|["percent"]|"boolean"|"absolute"|"percent", 
    "absolute"?:number[]|number, 
    "percent"?:number[]|number, 
    "boolean"?: boolean[]|number,
    "update"?: string, 
    "minLevel": number, 
    "rarity": (1|2|3|4|5|6|7|8|9|10|11|12), 
    "rarityName": ("common"|"rare"|"epic"),
    "increment": string,
    "conditions"?: {
        "attribute": string,
        "comparator": ("==="|"!=="|"<"|">"),
        "value": any
    }[]
};


type DeckUICardType = {
    "buffs": UpdateAttributeType, 
    "debuffs"?: UpdateAttributeType
};


type EffectsNames = "speed"|"damage"|"stamina"|"defense"|"adrenaline"|"lifeRegeneration";


type EffectType = {
    name: (EffectsNames),
    type: ("buff"|"debuff"),
    message: string,
    cause: ("low_stamina"|"adrenaline"|"low_life"|"running"),
    natural: boolean,
    change?: number
};


type EffectIconsType = Record<EffectsNames, {
    buff?: {
        text: string,
        object: Phaser.GameObjects.Image
    },
    debuff?: {
        text: string,
        object: Phaser.GameObjects.Image
    }
}>;


type CellEventType = {
    callback: Function,
    delay: number,
    loop: boolean,
    triggerTime?: number,
    destroy?: boolean
};