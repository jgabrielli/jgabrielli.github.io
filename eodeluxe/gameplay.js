function isTileSelected(line, column) {
	return nCurrentLine == line && nCurrentCol == column;	
}

function canUnitBePlacedHere(ranged, line, column) {
	if (column >= nNbColumns / 2)
		return false;
	/*if (ranged && column >= 2)
		return false;
	if (!ranged && column < 1)
		return false;*/
	return true;	
}

function unitTargetSelect(unitID) {
	if (pUnits[unitID].hasStatus(UnitStatus.TAUNT)) {
		return pUnits[unitID].getValueForStatus(UnitStatus.TAUNT);
	}
	
	var line = pUnits[unitID].line;
	var col = pUnits[unitID].col;
	
	var directTargets = 0;
	var bestTargetID = -1;
	var bestTargetDist = 99;
	
	for (var i = 0; i < nNbLines; ++i) {
		for (j = 0; j < nNbColumns; ++j) {
			if (pTiles[i][j].unitID >= 0 && pUnits[pTiles[i][j].unitID].team != pUnits[unitID].team && pUnits[pTiles[i][j].unitID].HP > 0)
			{
				// Priority to current line to avoid moving, then closest
				var targetID = pTiles[i][j].unitID;
				var dist = Math.abs(i - line) + Math.abs(j - col);
				if (pUnits[unitID].ranged && line != i)
					dist += nNbColumns;
				if (!pUnits[unitID].ranged)
					dist += Math.abs(j - col) * nNbLines;
				
				if (line == i)
					directTargets++;
				
				// Replace best target if needed (in case of ties: melee = middle lanes, ranged = side lanes)
				if (dist < bestTargetDist
					|| (!pUnits[unitID].ranged && dist == bestTargetDist && i > 0 && i < nNbLines - 1)
					|| (pUnits[unitID].ranged && dist == bestTargetDist && i == 0 && i == nNbLines - 1)) {
					bestTargetID = targetID;
					bestTargetDist = dist;
				}
			}
		}
	}
	
	return bestTargetID;
}

function trySpawnUnit(unitID, type, behindFirst = true) {
	var valid = false;
	var line = pUnits[unitID].line;
	var col = pUnits[unitID].col;
	
	switch (type) {
		case SPAWN_TYPE_ADJACENT:
			var min = pUnits[unitID].team == HERO_TEAM ? 0 : nNbColumns / 2;
			var max = pUnits[unitID].team == HERO_TEAM ? nNbColumns / 2 : nNbColumns;
			var behindCol = pUnits[unitID].team == HERO_TEAM ? col - 1 : col + 1;
			var beforeCol = pUnits[unitID].team == HERO_TEAM ? col + 1 : col - 1;
			var targetCol = behindFirst ? behindCol : beforeCol;
			if (targetCol >= min && targetCol < max && pTiles[line][targetCol].unitID < 0)
				return [ true, line, targetCol ];
			else {
				targetCol = behindFirst ? beforeCol : behindCol;
				if (targetCol >= min && targetCol < max && pTiles[line][targetCol].unitID < 0)
					return [ true, line, targetCol ];
				else if (pUnits[unitID].line == 0 && pTiles[1][col].unitID < 0)
					return [ true, 1, col ];
				else if (pUnits[unitID].line == 1 && pTiles[2][col].unitID < 0)
					return [ true, 2, col ];
				else if (pUnits[unitID].line == 2 && pTiles[1][col].unitID < 0)
					return [ true, 1, col ];
				else if (pUnits[unitID].line == 3 && pTiles[1][col].unitID < 0)
					return [ true, 2, col ];
				else if (pUnits[unitID].line == 1 && pTiles[0][col].unitID < 0)
					return [ true, 0, col ];
				else if (pUnits[unitID].line == 2 && pTiles[3][col].unitID < 0)
					return [ true, 3, col ];
			}
			break;
		case SPAWN_TYPE_FRONTLINE:
			var targetCol = pUnits[i].team == HERO_TEAM ? (nNbColumns / 2 - 1) : (nNbColumns / 2);
			if (pTiles[nNbLines / 2 - 1][targetCol].unitID < 0)
				return [ true, nNbLines / 2 - 1, targetCol ];
			else if (pTiles[nNbLines / 2][targetCol].unitID < 0)
				return [ true, nNbLines / 2, targetCol ];
			else if (pTiles[0][targetCol].unitID < 0)
				return [ true, 0, targetCol ];
			else if (pTiles[3][targetCol].unitID < 0)
				return [ true, 3, targetCol ];
			break;
	}
	
	return [ false, -1, -1 ];
}

function spawnNewUnit(unitID, line, col, ignore = false) {
	if (!ignore) {
		while (pUnits[unitID].inGame)
			unitID++;
	}
	pTiles[line][col].unitID = unitID;
	pUnits[unitID].reset();
	pUnits[unitID].line = line;
	pUnits[unitID].col = col;
	pUnits[unitID].inGame = true;
}

function unitMoves(unitID, line, col, findAlt) {
	if (!canUnitMove(unitID, line, col))
	{
		if (!findAlt)
			return pBattleLog.push(pUnits[unitID].name + " cannot move.");
			
		// Try to walk forward (melee) or backward (ranged)
		line = pUnits[unitID].line;
		var currentCol = pUnits[unitID].col;
		if (pUnits[unitID].ranged)
			col = currentCol * 1 + (pUnits[unitID].team == HERO_TEAM ? -1 : 1);
		else
			col = currentCol * 1 + (pUnits[unitID].team == HERO_TEAM ? 1 : -1);
		
		if (!canUnitMove(unitID, line, col))
			return pBattleLog.push(pUnits[unitID].name + " cannot move.");
	}
	
	var currentLine = pUnits[unitID].line;
	var currentCol = pUnits[unitID].col;
	pTiles[currentLine][currentCol].unitID = -1;
	pUnits[unitID].line = line;
	pUnits[unitID].col = col;
	pTiles[line][col].unitID = unitID;
	
	pBattleLog.push(pUnits[unitID].name + " moves.");
}

function canUnitMove(unitID, line, col) {
	if (pTiles[line][col].unitID >= 0)
		return false;
	
	if (line < 0 || line >= nNbLines || col < 0 || col >= nNbColumns)
		return false;
	
	// Cannot move to enemy territory
	if ((pUnits[unitID].team == HERO_TEAM && col >= nNbColumns / 2) || (pUnits[unitID].team == ENEMY_TEAM && col < nNbColumns / 2))
		return false;
	
	// if snared... return false
	return true;
}

function canUnitAct(unitID) {
	if (!pUnits[unitID].inGame)
		return false;
	
	if (pUnits[unitID].HP <= 0) {
		return false;
	}
	
	if (pUnits[unitID].hasStatus(UnitStatus.STUN)) {
		pBattleLog.push(pUnits[unitID].name + " is stunned and cannot act.");
		bWaitClick = true;
		return false;
	}
	return true;
}

function unitAttacks(unitID) {
	if (!canUnitAct(unitID))
		return;
	
	if (unitSpecialAttack(unitID))
		return;
	
	var target = unitTargetSelect(unitID);
	if (target < 0)
		return;
	
	var damage = calculateDamage(target, pUnits[unitID].ATK, pUnits[unitID].type);
	
	// Before attack effects
	if (pUnits[unitID].hasAbility(UnitAbility.ANTI_SUMMON)) {
		var value = pUnits[unitID].getValueForAbility(UnitAbility.ANTI_SUMMON);
		if (pUnits[target].hasFilter("Minion") || pUnits[target].hasFilter("Summon"))
			damage = damage + damage * value / 100;
	}
	
	if (pUnits[unitID].hasAbility(UnitAbility.MAGIC_DMG)) {
		var value = pUnits[unitID].getValueForAbility(UnitAbility.MAGIC_DMG);
		damage = calculateDamage(target, pUnits[unitID].ATK * (100 - value) / 100, pUnits[unitID].type);
		damage += calculateDamage(target, pUnits[unitID].ATK * value / 100, "Magic");
	}
	
	if (pUnits[unitID].hasAbility(UnitAbility.FINISHER)) {
		var value = pUnits[unitID].getValueForAbility(UnitAbility.FINISHER);
		if (100 * pUnits[target].HP / pUnits[target].maxHP <= value) {
			pBattleLog.push(pUnits[unitID].name + " finishes " + pUnits[target].name + "'s suffering.");
			removeHP(target, 999999);
			bWaitClick = true;
			return;
		}
	}
	
	pBattleLog.push(pUnits[unitID].name + " attacks " + pUnits[target].name + " for " + damage + " damage.");
	removeHP(target, damage);
	bWaitClick = true;
	
	unitAttacked(target, unitID);
	
	// After attack effects
	if (pUnits[unitID].hasAbility(UnitAbility.SPLASH_DMG)) {
		var targetLine = pUnits[target].line;
		var targetCol = pUnits[target].col;
		var value = pUnits[unitID].getValueForAbility(UnitAbility.SPLASH_DMG);
		var otherTargets = [];
		
		if (targetCol < nNbColumns - 1) {
			var adjID = pTiles[targetLine][targetCol + 1].unitID;
			if (adjID >= 0 && pUnits[adjID].HP > 0 && pUnits[adjID].team != pUnits[unitID].team)
				otherTargets.push(adjID);
		}
		if (targetLine > 0) {
			var adjID = pTiles[targetLine - 1][targetCol].unitID;
			if (adjID >= 0 && pUnits[adjID].HP > 0 && pUnits[adjID].team != pUnits[unitID].team)
				otherTargets.push(adjID);
		}
		if (targetLine < nNbLines - 1) {
			var adjID = pTiles[targetLine + 1][targetCol].unitID;
			if (adjID >= 0 && pUnits[adjID].HP > 0 && pUnits[adjID].team != pUnits[unitID].team)
				otherTargets.push(adjID);
		}
		
		for (var i = 0; i < otherTargets.length; ++i) {
			var damage = calculateDamage(otherTargets[i], pUnits[unitID].ATK * value / 100, pUnits[unitID].type);
			pBattleLog.push(pUnits[otherTargets[i]].name + " receives " + damage + " damage from " + pUnits[unitID].name + "'s wide attack.");
			removeHP(otherTargets[i], damage);
		}
	}
}

function calculateDamage(target, damage, damageType) {
	var value = damage * 1;
	switch (damageType) {
		case "Cut":
			if (pUnits[target].type == "Bash")
				value = value + 30 * value / 100;
			else if (pUnits[target].type == "Stab")
				value = value - 30 * value / 100;
			break;
		case "Bash":
			if (pUnits[target].type == "Stab")
				value = value + 30 * value / 100;
			else if (pUnits[target].type == "Cut")
				value = value - 30 * value / 100;
			break;
		case "Stab":
			if (pUnits[target].type == "Cut")
				value = value + 30 * value / 100;
			else if (pUnits[target].type == "Bash")
				value = value - 30 * value / 100;
			break;
		default:
			// Magic
			break;
	}
	
	value = Math.ceil(value);
	if (damageType != "Magic")
		value = Math.max(value - pUnits[target].DEF, 0);
	return value;
}

function removeHP(unitID, value) {
	pUnits[unitID].HP = Math.max(0, pUnits[unitID].HP - value);
	
	if (pUnits[unitID].HP <= 0) {
		// Trigger death effects
		if (pUnits[unitID].hasFilter("Summon")) {
			pUnits[unitID].inGame = false;
			pTiles[pUnits[unitID].line][pUnits[unitID].col].unitID = -1;
		}
	}
}

function unitAttacked(unitID, attackerID) {
	if (!canUnitAct(unitID))
		return;
	
	if (pUnits[unitID].hasAbility(UnitAbility.COUNTER_ATTACK)) {
		var damage = calculateDamage(attackerID, pUnits[unitID].ATK, pUnits[unitID].type);
		pBattleLog.push(pUnits[unitID].name + " counter attacks " + pUnits[attackerID].name + " for " + damage + " damage.");
		removeHP(attackerID, damage);
		bWaitClick = true;
	}
}

function unitSpecialAttack(unitID) {
	if (pUnits[unitID].hasAbility(UnitAbility.TEAM_ATTACK)) {
		var damage = pUnits[unitID].getValueForAbility(UnitAbility.TEAM_ATTACK);
		for (var i = 0; i < pUnits.length; ++i) {
			if (pUnits[i].inGame && pUnits[i].team != pUnits[unitID].team && pUnits[i].HP > 0) {
				damage = calculateDamage(i, damage, "Magic");
				removeHP(i, damage);
			}
		}
		pBattleLog.push(pUnits[unitID].name + " uses magic runes to deal " + damage + " damage to all enemies.");
		bWaitClick = true;
		return true;
	}
	
	if (pUnits[unitID].hasAbility(UnitAbility.GRAVITY_CIRCLE)) {
		var heal = pUnits[unitID].getValueForAbility(UnitAbility.GRAVITY_CIRCLE);
		for (var i = 0; i < pUnits.length; ++i)
			if (pUnits[i].inGame && pUnits[i].team == pUnits[unitID].team && pUnits[i].HP > 0)
				pUnits[i].HP = Math.min(pUnits[i].maxHP, pUnits[i].HP + heal);
		pBattleLog.push(pUnits[unitID].name + " alters the gravity, healing all allies by " + heal + ".");
		
		var worstSPD = 999;
		var worstTargets = [];
		for (var i = 0; i < pUnits.length; ++i) {
			if (pUnits[i].inGame && pUnits[i].team != pUnits[unitID].team && pUnits[i].HP > 0 && worstSPD >= pUnits[i].SPD) {
				worstSPD = pUnits[i].SPD;
				worstTargets.push(i);
			}
		}
		for (var i = 0; i < worstTargets.length; ++i) {
			var targetID = worstTargets[i];
			if (pUnits[targetID].SPD == worstSPD) {
				pUnits[targetID].addStatus(UnitStatus.STUN, 1, false, unitID);
				pBattleLog.push(pUnits[targetID].name + " is stunned by the gravity change.");
			}
		}

		bWaitClick = true;
		return true;
	}
	
	if (pUnits[unitID].hasAbility(UnitAbility.TEAM_HEAL)) {
		var heal = pUnits[unitID].getValueForAbility(UnitAbility.TEAM_HEAL);
		for (var i = 0; i < pUnits.length; ++i)
			if (pUnits[i].inGame && pUnits[i].team == pUnits[unitID].team && pUnits[i].HP > 0)
				pUnits[i].HP = Math.min(pUnits[i].maxHP, pUnits[i].HP + heal);
		pBattleLog.push(pUnits[unitID].name + " restores " + heal + " HP to all allies with his song.");
		bWaitClick = true;
		return true;
	}
	
	if (pUnits[unitID].hasAbility(UnitAbility.HEAL_CLEANSE)) {
		var bestTargetID = -1;
		var bestTargetHP = 100;
		for (var i = 0; i < pUnits.length; ++i) {
			if (pUnits[i].inGame && pUnits[i].team == pUnits[unitID].team && pUnits[i].HP > 0 && pUnits[i].HP != pUnits[i].maxHP) {
				ratio = pUnits[i].HP / pUnits[i].maxHP;
				if (ratio < bestTargetHP) {
					bestTargetID = i;
					bestTargetHP = ratio;
				}
			}
		}
		if (bestTargetID >= 0) {
			var heal = pUnits[unitID].getValueForAbility(UnitAbility.HEAL_CLEANSE);
			pUnits[bestTargetID].HP = Math.min(pUnits[bestTargetID].maxHP, pUnits[bestTargetID].HP + heal);
			pUnits[bestTargetID].cleanse();
			pBattleLog.push(pUnits[unitID].name + " treats the wounds of " + pUnits[bestTargetID].name + ", restoring " + heal + " HP.");
			bWaitClick = true;
			return true;
		}
	}
	
	if (pUnits[unitID].hasAbility(UnitAbility.SUMMON_BEAST)) {
		var frequency = pUnits[unitID].getValueForAbility(UnitAbility.SUMMON_BEAST);
		pUnits[unitID].turnCount = (pUnits[unitID].turnCount + 1) % frequency;
		if (pUnits[unitID].turnCount == 0) {
			var newUnit = -1;
			for (var i = nNbCharacters; newUnit < 0 && i < nNbCharacters + nNbSummons; ++i) {
				if (pUnits[i].name == "Wild beast")
					newUnit = i;
			}
			var results = trySpawnUnit(unitID, SPAWN_TYPE_ADJACENT, false);
			if (results[0]) {
				spawnNewUnit(newUnit, results[1], results[2]);
				pBattleLog.push(pUnits[unitID].name + " has called a wild beast for help.");
				bWaitClick = true;
				return true;
			}
		}
	}
	
	if (pUnits[unitID].hasAbility(UnitAbility.NO_ATTACK)) {
		return true;
	}
	
	return false;
}

function speedCompare(a, b) {
	return (pUnits[b].SPD - pUnits[a].SPD);
}

function processUnitTurn(unitID) {
	if (eBattleState == BattleState.PRE_BATTLE) {
		processBattleStart(unitID);
	}
	else if (eBattleState == BattleState.TURN_START) {
		processTurnStart(unitID);
	}
	else if (eBattleState == BattleState.TURN) {
		unitAttacks(unitID);
		processStatus(unitID);
	}
	else {
		processTurnEnd(unitID);
	}
}

function processBattleStart(unitID) {
	if (pUnits[unitID].hasAbility(UnitAbility.TEAM_BOOST)) {
		var bonus = pUnits[unitID].getValueForAbility(UnitAbility.TEAM_BOOST);
		for (var i = 0; i < pUnits.length; ++i)
			if (pUnits[i].inGame && pUnits[i].team == pUnits[unitID].team && pUnits[i].HP == pUnits[i].maxHP) {
				pUnits[i].HP = Math.ceil(pUnits[i].HP * (100 + bonus) / 100);
				pUnits[i].maxHP = Math.ceil(pUnits[i].maxHP * (100 + bonus) / 100);
				pUnits[i].ATK = Math.ceil(pUnits[i].ATK * (100 + bonus) / 100);
				pUnits[i].DEF = Math.ceil(pUnits[i].DEF * (100 + bonus) / 100);
				pUnits[i].SPD = Math.ceil(pUnits[i].SPD * (100 + bonus) / 100);
			}
		pBattleLog.push(pUnits[unitID].name + "'s royal presence increases the team's max HP, ATK, DEF and SPD.");
		bWaitClick = true;
	}
	
	if (pUnits[unitID].hasAbility(UnitAbility.SUMMON_BUNKER)) {
		var newUnit = -1;
		var nbSummon = 0;
		for (var i = nNbCharacters; newUnit < 0 && i < nNbCharacters + nNbSummons; ++i) {
			if (pUnits[i].name == "Sandbag")
				newUnit = i;
		}
		var results = trySpawnUnit(unitID, SPAWN_TYPE_FRONTLINE);
		if (results[0]) {
			spawnNewUnit(newUnit, results[1], results[2]);
			nbSummon++;
		}
		results = trySpawnUnit(unitID, SPAWN_TYPE_FRONTLINE);
		if (results[0]) {
			spawnNewUnit(newUnit, results[1], results[2]);
			nbSummon++;
		}
		if (nbSummon > 0) {
			pBattleLog.push(pUnits[unitID].name + " has setup " + nbSummon + " sandbag(s) on the front line");
			bWaitClick = true;
		}
	}
}
	
function processTurnStart(unitID) {
	if (pUnits[unitID].HP <= 0)
		return;

	if (pUnits[unitID].hasAbility(UnitAbility.TAUNT_STRONG)) {
		var bestATK = 0;
		var bestTargets = [];
		for (var i = 0; i < pUnits.length; ++i) {
			if (pUnits[i].inGame && pUnits[i].team != pUnits[unitID].team && pUnits[i].HP > 0 && bestATK <= pUnits[i].ATK) {
				bestATK = pUnits[i].ATK;
				bestTargets.push(i);
			}
		}
		for (var i = 0; i < bestTargets.length; ++i) {
			var targetID = bestTargets[i];
			if (pUnits[targetID].ATK == bestATK) {
				pUnits[targetID].addStatus(UnitStatus.TAUNT, 1, false, unitID);
				pBattleLog.push(pUnits[targetID].name + " is taunted by " + pUnits[unitID].name + ".");
			}
		}
		bWaitClick = true;
	}
}

function processTurnEnd(unitID) {
	if (pUnits[unitID].HP <= 0)
		return;
	
	if (pUnits[unitID].hasAbility(UnitAbility.AUTO_HEAL)) {
		var heal = pUnits[unitID].getValueForAbility(UnitAbility.AUTO_HEAL);
		pUnits[unitID].HP = Math.min(pUnits[unitID].maxHP, pUnits[unitID].HP + heal);
		pBattleLog.push(pUnits[unitID].name + " gains " + heal + " HP.");
		bWaitClick = true;
	}
	
	if (pUnits[unitID].hasAbility(UnitAbility.PROTECT_WEAK)) {
		var bestTargetID = -1;
		var bestTargetHP = 100;
		for (var i = 0; i < pUnits.length; ++i) {
			if (pUnits[i].inGame && pUnits[i].team == pUnits[unitID].team && pUnits[i].HP > 0) {
				ratio = pUnits[i].HP / pUnits[i].maxHP;
				if (ratio < bestTargetHP) {
					bestTargetID = i;
					bestTargetHP = ratio;
				}
			}
		}
		if (bestTargetID >= 0) {
			var bonus = pUnits[unitID].getValueForAbility(UnitAbility.PROTECT_WEAK);
			pUnits[bestTargetID].addStatus(UnitStatus.DEF_BUFF, 1, true, bonus);
			pUnits[bestTargetID].DEF += bonus;
			pBattleLog.push(pUnits[unitID].name + " blesses " + pUnits[bestTargetID].name + ", improving its DEF by " + bonus + ".");
			bWaitClick = true;
			return true;
		}
	}
}

function processStatus(unitID) {
	if (pUnits[unitID].HP <= 0)
		return;
	
	for (var i = 0; i < pUnits[unitID].statusArray.length; ++i) {
		pUnits[unitID].statusArray[i].duration--;
		if (pUnits[unitID].statusArray[i].duration <= 0) {
			pBattleLog.push(pUnits[unitID].name + "'s " + pUnits[unitID].statusArray[i].name + " has ended.");
			
			if (pUnits[unitID].statusArray[i].type == UnitStatus.ATK_BUFF)
				pUnits[unitID].ATK -= pUnits[unitID].statusArray[i].effect;
			if (pUnits[unitID].statusArray[i].type == UnitStatus.DEF_BUFF)
				pUnits[unitID].DEF -= pUnits[unitID].statusArray[i].effect;
			if (pUnits[unitID].statusArray[i].type == UnitStatus.SPD_BUFF)
				pUnits[unitID].SPD -= pUnits[unitID].statusArray[i].effect;
			
			
			pUnits[unitID].statusArray.splice(i, 1);
			bWaitClick = true;
		}
		
		if (pUnits[unitID].hasStatus(UnitStatus.POISON)) {
			var poisonDamage = pUnits[unitID].getValueForStatus(UnitStatus.POISON);
			removeHP(target, damage);
			pBattleLog.push(pUnits[unitID].name + " takes " + poisonDamage + " poison damage.");
			bWaitClick = true;
		}
	}
}

function processTurn() {
	if (bWaitClick || eGameState == GameState.ENDED)
		return;
	
	if (nCurrentActor < 0) {
		nCurrentActor = 0;
		
		if (eBattleState <= BattleState.TURN_START) { 
			if (nTurnIndex > 0)
				eBattleState = BattleState.TURN_START;		
			nTurnIndex++;
			
			// sort by speed
			var index = 0;
			for (var i = 0; i < pUnits.length; ++i) {
				if (pUnits[i].inGame)
					pSortedUnits[index++] = i;
			}
			pSortedUnits.sort(speedCompare);
		}
	}
	
	processUnitTurn(pSortedUnits[nCurrentActor]);
	checkState();
	nCurrentActor++;
	
	if (nCurrentActor >= pSortedUnits.length) {
		nCurrentActor = -1;
		
		// All units have been processed, now what?
		if (eBattleState == BattleState.TURN_START)
			eBattleState = BattleState.TURN;
		else if (eBattleState == BattleState.TURN)
			eBattleState = BattleState.TURN_END;
		else
			eBattleState = BattleState.TURN_START;
	}
}

function checkState() {
	var nbHeroes = 0;
	var nbEnemies = 0;
	
	for (var i = 0; i < pUnits.length; ++i) {
		if (pUnits[i].inGame && pUnits[i].HP > 0) {
			if (pUnits[i].team == HERO_TEAM)
				nbHeroes++;
			else
				nbEnemies++;
		}
	}
	
	if (nbEnemies == 0)
		pBattleLog.push("VICTORY!");
	else if (nbHeroes == 0)
		pBattleLog.push("DEFEAT...");
	else 
		return;
	
	eGameState = GameState.ENDED;
}

function restartStage(XML, stageIndex) {
	pStageXML = XML.responseXML;
	var opponents = pStageXML.getElementsByTagName('opponents');
	nNbStages = opponents.length;
	var nodes = opponents[stageIndex].getElementsByTagName('opponent');
	nbNodes = nodes.length;
	
	for (var i = 0; i < nbNodes; ++i) {
		var name 	= nodes[i].getAttribute("name");
		var type 	= nodes[i].getAttribute("type");
		var HP 		= nodes[i].getAttribute("HP");
		var ATK 	= nodes[i].getAttribute("ATK");
		var DEF 	= nodes[i].getAttribute("DEF");
		var SPD 	= nodes[i].getAttribute("SPD");
		var line 	= nodes[i].getAttribute("line");
		var col 	= nodes[i].getAttribute("column");
		var ranged 	= nodes[i].getAttribute("ranged") == "true";
		var src 	= nodes[i].getAttribute("src");
		var scale 	= nodes[i].getAttribute("scale");
		var foe 	= nodes[i].getAttribute("foe");
		pUnits[nNbCharacters + nNbSummons + i] = new Unit(name, HP, ATK, DEF, SPD, line, col, type, ranged, ENEMY_TEAM, src, scale);
		pUnits[nNbCharacters + nNbSummons + i].filterArray.push(foe);
		
		if (line > nNbLines || col >= nNbColumns)
			alert("Incorrect position for unit " + name);
		if (line >= 0 && col >= 0 && pTiles[line][col].unitID >= 0)
			alert("Two units are on the same tile");
		pTiles[line][col].unitID = nNbCharacters + nNbSummons + i;
	}
	
	pBattleLog = [];
}

function loadClasses(XML) {
	pClassXML = XML.responseXML;
    var nodes = pClassXML.getElementsByTagName('class');
	nNbCharacters = nodes.length;
	
	for (var i = 0; i < nNbCharacters; ++i) {
		var name 	= nodes[i].getAttribute("name");
		var HP 		= nodes[i].getAttribute("HP");
		var ATK 	= nodes[i].getAttribute("ATK");
		var DEF 	= nodes[i].getAttribute("DEF");
		var SPD 	= nodes[i].getAttribute("SPD");
		var type 	= nodes[i].getAttribute("type");
		var ranged 	= nodes[i].getAttribute("ranged") == "true";
		var src 	= nodes[i].getAttribute("src");
		pUnits[i] = new Unit(name, HP, ATK, DEF, SPD, -1, -1, type, ranged, HERO_TEAM, src, 1);
		
		var filters = nodes[i].getElementsByTagName('filter');
		for (var j = 0; j < filters.length; ++j)
			pUnits[i].filterArray.push(filters[j].innerHTML);
		
		var abilities = nodes[i].getElementsByTagName('ability');
		for (var j = 0; j < abilities.length; ++j) {
			var id = abilities[j].getAttribute("ID");
			var value = abilities[j].innerHTML;
			pUnits[i].addAbility(id, value);
		}
		
		pUnits[i].desc = nodes[i].getElementsByTagName('desc')[0].innerHTML;
	}
}

function loadSummons(XML) {
	pClassXML = XML.responseXML;
    var nodes = pClassXML.getElementsByTagName('summon');
	var multiplier = nNbLines * nNbColumns / 2;
	nNbSummons = 0;
	
	for (var i = 0; i < nodes.length; ++i) {
		for (var k = 0; k < multiplier; ++k) {
			var name 	= nodes[i].getAttribute("name");
			var HP 		= nodes[i].getAttribute("HP");
			var ATK 	= nodes[i].getAttribute("ATK");
			var DEF 	= nodes[i].getAttribute("DEF");
			var SPD 	= nodes[i].getAttribute("SPD");
			var type 	= nodes[i].getAttribute("type");
			var ranged 	= nodes[i].getAttribute("ranged") == "true";
			var src 	= nodes[i].getAttribute("src");
			pUnits[nNbCharacters + i * multiplier + k] = new Unit(name, HP, ATK, DEF, SPD, -1, -1, type, ranged, HERO_TEAM, src, 1);
			
			var filters = nodes[i].getElementsByTagName('filter');
			for (var j = 0; j < filters.length; ++j)
				pUnits[nNbCharacters + i * multiplier + k].filterArray.push(filters[j].innerHTML);
			
			if (!pUnits[nNbCharacters + i * multiplier + k].hasFilter("Summon"))
				pUnits[nNbCharacters + i * multiplier + k].filterArray.push("Summon");
			
			var abilities = nodes[i].getElementsByTagName('ability');
			for (var j = 0; j < abilities.length; ++j) {
				var id = abilities[j].getAttribute("ID");
				var value = abilities[j].innerHTML;
				pUnits[nNbCharacters + i * multiplier + k].addAbility(id, value);
			}
			
			nNbSummons++;
		}
	}
}

function loadStageXML(XMLPath) {
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
	   if (this.readyState == 4 && this.status == 200) {
		   restartStage(this, nCurrentStage);
	   }
	};
	xhttp.open("GET", XMLPath, true);
	xhttp.send();
}

function loadPlayerXML(XMLPath) {
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
	   if (this.readyState == 4 && this.status == 200) {
		    loadClasses(this);
	   }
	};
	xhttp.open("GET", XMLPath, true);
	xhttp.send();
}

function loadSummonXML(XMLPath) {
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
	   if (this.readyState == 4 && this.status == 200) {
		    loadSummons(this);
	   }
	};
	xhttp.open("GET", XMLPath, true);
	xhttp.send();
}

function resetGrid(totalReset = false) {
	nTurnIndex = 0;
	eBattleState = BattleState.PRE_BATTLE;
	var totalHeroes = nNbCharacters + nNbSummons;
	
	var end = totalReset ? nNbColumns : nNbColumns / 2;
	pBattleLog = [];

	for (var i = 0; i < totalHeroes; ++i) {
		pUnits[i].reset();
		pUnits[i].inGame = false;
		pUnits[i].line = -1;
		pUnits[i].col = -1;
	}
	
	for (var i = totalHeroes; i < pUnits.length; ++i) {
		pUnits[i].reset();
		if (totalReset)
			pUnits[i].inGame = false;
	}
	
	for (var i = 0; i < nNbLines; ++i) {
		for (j = 0; j < end; j++) {
			pTiles[i][j].reset();
		}
	}
	
	eGameState = GameState.TEAM_SELECT;
	nNbSelectedCharacters = 0;
}
	
function startGame() {
	eGameState = GameState.BATTLE;
	bWaitClick = true;
}
	
function nextStage() {
	resetGrid(true);
	nCurrentStage++;
	if (nCurrentStage >= nNbStages)
		nCurrentStage = 0;
	loadStageXML("xml/Stages.xml");
}