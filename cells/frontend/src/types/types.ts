type UpdateAttributeType = {
    "id": string, 
    "buffIn": string, 
    "attribute": string, 
    "text": string, 
    "type": ("absolute"|"percent"), 
    "absolute"?:number, 
    "percent"?:number, 
    "update"?: string, 
    "minLevel": number, 
    "rarity": number, 
    "rarityName": string,
    "increment": string
};


type PossibleUpdateAttributeType = {
    "id": string, 
    "buffIn": string, 
    "attribute": string, 
    "text": string, 
    "type": ("absolute"|"percent")[]|["absolute","percent"], 
    "absolute"?:number[]|number, 
    "percent"?:number[]|number, 
    "update"?: string, 
    "minLevel": number, 
    "rarity": number, 
    "rarityName": string,
    "increment": string
};


type DeckUICardType = {
    "buffs": UpdateAttributeType, 
    "debuffs"?: UpdateAttributeType
};


