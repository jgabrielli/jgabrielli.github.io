var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler, false);
document.addEventListener("mouseup", mouseUpHandler, false);
document.addEventListener("mousedown", mouseDownHandler, false);
document.addEventListener("click", mouseClickHandler, false);

// Game state
var GameState = { 
	TEAM_SELECT : 1,
	BATTLE : 2,
	PAUSED : 3,
	ENDED : 4
};

// Battle state
var BattleState = { 
	PRE_BATTLE : 0,
	TURN_START : 1,
	TURN : 2,
	TURN_END : 3
};


// Properties
var nNbLines = 4;
var nNbColumns = 8;
var nTileSize = 100;
var nTilePadding = 2;
var nMaxSelection = 5;
var nPortraitWidth = 100;
var nPortraitHeight = 100;
var nLifeBarWidth = 80;
var nLifeBarHeight = 10;
var nTopOffset = 50;
var nMaxCharacters = 5;
var HERO_TEAM = 0;
var ENEMY_TEAM = 1;
var BUTTON_RESET = 0;
var BUTTON_NEXT = 1;
var BUTTON_START = 2;
var SPAWN_TYPE_ADJACENT = 0;
var SPAWN_TYPE_BACKLINE = 1;
var SPAWN_TYPE_FRONTLINE = 2;

// Main data
var eGameState = GameState.TEAM_SELECT;
var eBattleState = BattleState.PRE_BATTLE;
var pMousePos = [];
var nCurrentLine = -1;
var nCurrentCol = -1;
var nHoveredUnitID = -1;
var nDraggedUnitID = -1;
var pTiles = new Array(nNbLines);
var pUnits = [];
var pButtons = [];
var nTurnIndex = 0;
var nNbStages = 0;
var nNbCharacters = 0;
var nNbSummons = 0;
var nNbSelectedCharacters = 0;
var nCurrentStage = 0;		// Stage index
var pStageXML;				// XML doc containing the current stage (boss)
var pClassXML;				// XML doc containing all classes
var bWaitClick = true;		// Wait for click before continueing
var nCurrentActor = -1;		// Index in pSortedUnits
var pSortedUnits = [];		// Units in battle, sorted by SPD
var pBattleLog = [];

// Classes
class Status {
	constructor(type, duration, positive, effect = 0) {
		this.type = type;
		this.duration = duration;
		this.effect = effect;
		this.positive = positive;
		switch (type) {
			case UnitStatus.ATK_BUFF:
				this.name = "ATK Boost";
				this.canStack = true;
				break;
			case UnitStatus.DEF_BUFF:
				this.name = "DEF Boost";
				this.canStack = true;
				break;
			case UnitStatus.SPD_BUFF:
				this.name = "SPD Boost";
				this.canStack = true;
				break;
			case UnitStatus.STUN:
				this.name = "Stunned";
				this.canStack = true;
				break;
			case UnitStatus.POISON:
				this.name = "Poisoned";
				this.canStack = true;
				break;
			case UnitStatus.TAUNT:
				this.name = "Taunted";
				this.canStack = false;
				break;
		}
	}
}

function canStatusStack(type) {
	if (type == UnitStatus.TAUNT)
		return false;
	return true;
}

var UnitStatus = { 
	ATK_BUFF : 1,
	DEF_BUFF : 2,
	SPD_BUFF : 3,
	STUN : 4,
	POISON : 5,
	TAUNT : 6,
};

class Ability {
	constructor(type, name, value = 0) {
		this.name = name;
		this.type = type;
		this.value = value;
	}
}

var UnitAbility = {
	ANTI_SUMMON : 1,
	TAUNT_STRONG : 2,
	STATUS_IMMUNE : 3,
	TEAM_HEAL : 4,
	TEAM_ATTACK : 5,
	AUTO_HEAL : 6,
	FINISHER : 7,
	COUNTER_ATTACK : 8,
	MAGIC_DMG : 9,
	GRAVITY_CIRCLE : 10,
	HEAL_CLEANSE : 11,
	SPLASH_DMG : 12,
	PROTECT_WEAK : 13,
	TEAM_BOOST : 14,
	SUMMON_BUNKER : 15,
	SUMMON_BEAST : 16,
	NO_ATTACK : 99,
}

class Unit {
	constructor(name, HP, ATK, DEF, SPD, line, col, type, ranged, team, src, scale) {
		this.baseHP = parseInt(HP);
		this.baseATK = parseInt(ATK);
		this.baseDEF = parseInt(DEF);
		this.baseSPD = parseInt(SPD);
		
		this.name = name;
		this.type = type;
		this.ranged = ranged;
		this.line = parseInt(line);
		this.col = parseInt(col);
		this.team = team;
		this.src = src;
		this.thumbSrc = src.replace("img/", "img/thumbs/");
		this.scale = scale;
		this.inGame = team == ENEMY_TEAM;
		
		this.maxHP = this.baseHP;
		this.HP = this.baseHP;
		this.ATK = this.baseATK;
		this.DEF = this.baseDEF;
		this.SPD = this.baseSPD;
		
		this.statusArray = [];
		this.abilityArray = [];
		this.filterArray = [];
		
		this.desc = "";
		this.turnCount = 0;
	}
	hasFilter(filter) {
		return this.filterArray.includes(filter);
	}
	addAbility(type, text) {
		var value = text != null ? parseInt(text) : 0;
		switch (type) {
			case "anti_summon":
				this.abilityArray.push(new Ability(UnitAbility.ANTI_SUMMON, type, value));
				break;
			case "finisher":
				this.abilityArray.push(new Ability(UnitAbility.FINISHER, type, value));
				break;
			case "taunt_strongest":
				this.abilityArray.push(new Ability(UnitAbility.TAUNT_STRONG, type, value));
				break;
			case "gravity_circle":
				this.abilityArray.push(new Ability(UnitAbility.GRAVITY_CIRCLE, type, value));
				break;
			case "counter_attack":
				this.abilityArray.push(new Ability(UnitAbility.COUNTER_ATTACK, type, value));
				break;
			case "magic_damage":
				this.abilityArray.push(new Ability(UnitAbility.MAGIC_DMG, type, value));
				break;
			case "team_heal":
				this.abilityArray.push(new Ability(UnitAbility.TEAM_HEAL, type, value));
				break;
			case "heal_cleanse":
				this.abilityArray.push(new Ability(UnitAbility.HEAL_CLEANSE, type, value));
				break;
			case "team_attack":
				this.abilityArray.push(new Ability(UnitAbility.TEAM_ATTACK, type, value));
				break;
			case "splash":
				this.abilityArray.push(new Ability(UnitAbility.SPLASH_DMG, type, value));
				break;
			case "protect_weak":
				this.abilityArray.push(new Ability(UnitAbility.PROTECT_WEAK, type, value));
				break;
			case "team_total_boost":
				this.abilityArray.push(new Ability(UnitAbility.TEAM_BOOST, type, value));
				break;
			case "auto_heal":
				this.abilityArray.push(new Ability(UnitAbility.AUTO_HEAL, type, value));
				break;
			case "immune":
				this.abilityArray.push(new Ability(UnitAbility.STATUS_IMMUNE, type, value));
				break;
			case "summon_bunker":
				this.abilityArray.push(new Ability(UnitAbility.SUMMON_BUNKER, type, value));
				break;
			case "summon_beast":
				this.abilityArray.push(new Ability(UnitAbility.SUMMON_BEAST, type, value));
				break;
			case "no_attack":
				this.abilityArray.push(new Ability(UnitAbility.NO_ATTACK, type, value));
				break;
			default:
				alert("Invalid skill: " + type + " - " + text);
				break;
		}
	}
	hasAbility(type) {
		for (i = 0; i < this.abilityArray.length; ++i) {
			if (this.abilityArray[i].type == type)
				return true;
		}
		return false;
	}
	getValueForAbility(type) {
		for (i = 0; i < this.abilityArray.length; ++i) {
			if (this.abilityArray[i].type == type)
				return this.abilityArray[i].value;
		}
		return 0;
	}
	addStatus(type, duration, positive, effect) {
		if (this.hasStatus(type) && !canStatusStack(type))
			return;
		if (this.hasAbility(UnitAbility.IMMUNE))
			return;
		this.statusArray.push(new Status(type, duration, positive, effect));	
	}
	hasStatus(status) {
		var n = 0;
		for (n = 0; n < this.statusArray.length; ++n) {
			if (this.statusArray[n].type == status)
				return true;
		}
		return false;
	}
	getValueForStatus(status) {
		var value = 0;
		for (i = 0; i < this.statusArray.length; ++i) {
			if (this.statusArray[i].type == status) {
				value += this.statusArray[i].effect;
				if (!canStatusStack(this.statusArray[i].type))
					return value;
			}
		}
		return value;
	}
	cleanse() { 
		for (i = 0; i < this.statusArray.length; ++i) {
			if (this.statusArray[i].positive)
				this.statusArray.splice(i, 1);
		}
	}
	reset() {
		this.maxHP = this.baseHP;
		this.HP = this.baseHP;
		this.ATK = this.baseATK;
		this.DEF = this.baseDEF; 
		this.SPD = this.baseSPD;
		this.statusArray = [];
		this.turnCount = 0;
	}
}

class Tile {
	constructor(x, y, unitID) {
		this.x = x;
		this.y = y;
		this.unitID = unitID;
	}
	reset() { this.unitID = -1; }
}

class Button {
	constructor(x, y, width, height, text, callBack) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.text = text;
		this.callBack = callBack;
		this.active = true;
	}
	isHovered() { return (pMousePos[0] > this.x - this.width / 2 && pMousePos[0] < this.x + this.width / 2
					&& pMousePos[1] > this.y - this.height / 2 && pMousePos[1] < this.y + this.height / 2); }
	onClick() { this.callBack(); }
}

// Control handlers
function keyDownHandler(e) {
	if (e.keyCode == 39) {
		rightPressed = true;
	}
	else if (e.keyCode == 37) {
		leftPressed = true;
	}
	else if (e.keyCode == 32) {
		bWaitClick = false;
	}
	//else if (e.keyCode == 17)
		//isPaused = !isPaused;
}
function keyUpHandler(e) {
	if (e.keyCode == 39) {
		rightPressed = false;
	}
	else if (e.keyCode == 37) {
		leftPressed = false;
	}
}

function mouseMoveHandler(e) {
	pMousePos[0] = e.clientX - canvas.offsetLeft;
	pMousePos[1] = e.clientY - canvas.offsetTop;
	
	if (pMousePos[0] > 0 && pMousePos[0] < (nTileSize + nTilePadding) * nNbColumns && pMousePos[1] > nTopOffset && pMousePos[1] < (nTileSize + nTilePadding) * nNbLines + nTopOffset) {
		  nCurrentLine = parseInt((pMousePos[1] - nTopOffset) / (nTileSize + nTilePadding));
		  nCurrentCol = parseInt(pMousePos[0] / (nTileSize + nTilePadding));
		  
		  if (nCurrentLine >= 0 && nCurrentLine < nNbLines && nCurrentCol >= 0 && nCurrentCol < nNbColumns)
				nHoveredUnitID = pTiles[nCurrentLine][nCurrentCol].unitID;
	}
	else {
		nCurrentLine = -1;
		nCurrentCol = -1;
	}
}

function mouseDownHandler(e) {
	if (eGameState == GameState.TEAM_SELECT)
	{
		if (nHoveredUnitID >= 0 && nHoveredUnitID < nNbCharacters)
			nDraggedUnitID = nHoveredUnitID;
	}
}	

function mouseUpHandler(e) {
	if (eGameState == GameState.TEAM_SELECT)
	{
		// If dragged to a correct slot in grid
		if (nDraggedUnitID >= 0 && nCurrentLine >= 0 && nCurrentLine <= nNbLines && nCurrentCol >= 0 && nCurrentCol < nNbColumns) {

			// If slot is correct according to melee/ranged constraints
			if (!canUnitBePlacedHere(pUnits[nDraggedUnitID].ranged, nCurrentLine, nCurrentCol)) {
				nDraggedUnitID = -1;
				return;
			}
			
			// If unit is already in the game, move it instead
			if (pUnits[nDraggedUnitID].inGame) {
				var line = pUnits[nDraggedUnitID].line;
				var col = pUnits[nDraggedUnitID].col;
				pTiles[line][col].unitID = -1;
			}
			
			// If another unit is already here, remove it or swap them
			if (pTiles[nCurrentLine][nCurrentCol].unitID >= 0) {
				if (!pUnits[nDraggedUnitID].inGame) {
					pUnits[pTiles[nCurrentLine][nCurrentCol].unitID].inGame = false;
					nNbSelectedCharacters--;
				}
				else {
					var oldLine = pUnits[nDraggedUnitID].line;
					var oldCol = pUnits[nDraggedUnitID].col;
					pUnits[pTiles[nCurrentLine][nCurrentCol].unitID].line = oldLine;
					pUnits[pTiles[nCurrentLine][nCurrentCol].unitID].col = oldCol;
					pTiles[oldLine][oldCol].unitID = pTiles[nCurrentLine][nCurrentCol].unitID;
				}
			}
			
			// When adding, check that max unit has not been reached yet, or abort
			if (!pUnits[nDraggedUnitID].inGame) {
				if (nNbSelectedCharacters >= nMaxCharacters) {
					nDraggedUnitID = -1;
					return;
				}
				else
					nNbSelectedCharacters++;
			}
			
			spawnNewUnit(nDraggedUnitID, nCurrentLine, nCurrentCol, true);
		}
		// If unit is dragged of the grid, remove it
		else if (nDraggedUnitID >= 0 && pUnits[nDraggedUnitID].inGame) {
			pTiles[pUnits[nDraggedUnitID].line][pUnits[nDraggedUnitID].col].unitID = -1;
			pUnits[nDraggedUnitID].inGame = false;
			nNbSelectedCharacters--;
		}
		nDraggedUnitID = -1;
	}
}

function mouseClickHandler(e) {
	//if (!isPaused)
	{
		if (bWaitClick)
			bWaitClick = false;
		
		for (i = 0; i < pButtons.length; ++i) {
			if (!pButtons[i].isHovered())
				continue;
			if (pButtons[i].active)
				pButtons[i].onClick();
		}
	}
}	