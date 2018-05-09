function getTileColor(line, column) {
	if (nDraggedUnitID >= 0 && isTileSelected(line, column)) {
		if (canUnitBePlacedHere(pUnits[nDraggedUnitID].ranged, line, column))
			return "#00FF00";
		else
			return "#FF0000";
	}
	else if (isTileSelected(line, column))
		return "#FFFFFF";
	else if (column < nNbColumns / 2)
		return "#333333";
	else
		return "#000000";
}

function getCharacterColor(type) {
	if (type == "Cut")
		return "red";
	else if (type == "Stab")
		return "blue";
	else if (type == "Bash")
		return "green";
	else
		return "white";
}

function drawTextWrap(text, x, y, maxWidth, lineHeight) {
	var words = text.split(' ');
	var line = '';

	for (var n = 0; n < words.length; n++) {
		var testLine = line + words[n] + ' ';
		var metrics = ctx.measureText(testLine);
		var testWidth = metrics.width;
		if (testWidth > maxWidth && n > 0) {
			ctx.fillText(line, x, y);
			line = words[n] + ' ';
			y += lineHeight;
		}
		else {
			line = testLine;
		}
	}
	ctx.fillText(line, x, y);
}

function drawGrid() {
	for (i = 0; i < nNbLines; i++) {
		for (j = 0; j < nNbColumns; j++) {
			var tileX = j * (nTileSize + nTilePadding);
			var tileY = nTopOffset + i * (nTileSize + nTilePadding);
			ctx.beginPath();
			ctx.rect(tileX, tileY, nTileSize, nTileSize);
			ctx.fillStyle = getTileColor(i, j);
			ctx.fill();
			ctx.closePath();
		}
	}
}

function drawUnitTooltip() {
	if (nHoveredUnitID >= 0) {
		var startX = nNbColumns * (nTileSize + nTilePadding) + 10;
		var startY = nTopOffset + 20;
		//var startX = pMousePos[0] + 20;
		//var startY = pMousePos[1] + 40;
		var offsetY = 0;
		
		ctx.textAlign = "left";
		ctx.font = "18px Arial";
		ctx.fillStyle = "#000000";
		ctx.fillText(pUnits[nHoveredUnitID].name, startX, startY);
		offsetY += 20;
		
		// Filter
		ctx.font = "italic 13px Arial";
		for (i = 0; i < pUnits[nHoveredUnitID].filterArray.length; ++i) {
			ctx.fillText(pUnits[nHoveredUnitID].filterArray[i], startX, startY + offsetY);
			offsetY += 13;
		}
		
		// Data
		offsetY += 5;
		ctx.font = "15px Arial";
		ctx.fillText(pUnits[nHoveredUnitID].type, startX, startY + offsetY);
			offsetY += 15;
		ctx.fillText("HP =	" + parseInt(pUnits[nHoveredUnitID].HP) + " / " + pUnits[nHoveredUnitID].maxHP, startX, startY + offsetY);
			offsetY += 15;
		ctx.fillText("ATK = " + pUnits[nHoveredUnitID].ATK, startX, startY + offsetY);
			offsetY += 15;
		ctx.fillText("DEF = " + pUnits[nHoveredUnitID].DEF, startX, startY + offsetY);
			offsetY += 15;
		ctx.fillText("SPD = " + pUnits[nHoveredUnitID].SPD, startX, startY + offsetY);
			offsetY += 15;
		if (pUnits[nHoveredUnitID].ranged)
			ctx.fillText("Ranged", startX, startY + offsetY);
		else
			ctx.fillText("Melee", startX, startY + offsetY);
			offsetY += 15;
		
		// Abilities
		ctx.font = "13px Arial";
		ctx.fillStyle = "#000000";
		for (i = 0; i < pUnits[nHoveredUnitID].abilityArray.length; ++i) {
			ctx.fillText("Ability: " + pUnits[nHoveredUnitID].abilityArray[i].name, startX, startY + offsetY);
		offsetY += 13;
		}
		
		// Status
		ctx.font = "13px Arial";
		for (i = 0; i < pUnits[nHoveredUnitID].statusArray.length; ++i) {
			ctx.fillStyle = pUnits[nHoveredUnitID].statusArray[i].positive ? "#00FF00" : "#FF0000";
			ctx.fillText("-" + pUnits[nHoveredUnitID].statusArray[i].name + " (" + pUnits[nHoveredUnitID].statusArray[i].duration + " turn(s))", startX, startY + offsetY);
			offsetY += 13;
		}
		
		// Description
		offsetY += 5;
		ctx.font = "italic 13px Arial";
		ctx.fillStyle = "#000000";
		drawTextWrap(pUnits[nHoveredUnitID].desc, startX, startY + offsetY, 400, 13);
		offsetY += 13;
	}
}

function drawImageAtAngle(img, posX, posY, width, height, angle) {
	ctx.save();
	ctx.translate(posX + width / 2, posY + height / 2);
	ctx.rotate(angle);
	ctx.drawImage(img, - width / 2, - height / 2, width, height);
	ctx.restore(); 
}

function drawUnits() {
	for (i = 0; i < nNbLines; ++i) {
		for (j = 0; j < nNbColumns; j++) {
			var unitID = pTiles[i][j].unitID;
			if (unitID >= 0) {				
				var img = new Image();
				img.src = pUnits[unitID].src;
				var finalHeight = nTileSize * 1.2 * pUnits[unitID].scale;
				var finalWidth = finalHeight * img.width / img.height;
				var tileX = j * (nTileSize + nTilePadding) - (finalWidth - nTileSize) / 2;
				var tileY = nTopOffset + i * (nTileSize + nTilePadding) - 0.2 * nTileSize + (1 - pUnits[unitID].scale) * finalHeight * 0.7;
				
				ctx.beginPath();
				ctx.fillStyle = getCharacterColor(pUnits[unitID].type);
				ctx.ellipse(j * (nTileSize + nTilePadding) + nTileSize / 2, nTopOffset + i * (nTileSize + nTilePadding) + nTileSize * 0.85, nTileSize * 0.4, nTileSize / 8, 0, 0, 2 * Math.PI)
				ctx.fill();
				
				if (pUnits[unitID].HP <= 0)
					drawImageAtAngle(img, tileX, tileY, finalWidth, finalHeight, Math.PI / 2 * (pUnits[unitID].team == HERO_TEAM ? -1 : 1));
				else
					ctx.drawImage(img, tileX, tileY, finalWidth, finalHeight);
				
				if (eGameState == GameState.BATTLE) {
					ctx.beginPath();
					ctx.rect(j * (nTileSize + nTilePadding) + (nTileSize - nLifeBarWidth) / 2, tileY - nLifeBarHeight, nLifeBarWidth, nLifeBarHeight);
					ctx.fillStyle = "#FF0000";
					ctx.fill();
					ctx.closePath();
					
					var HPratio = pUnits[unitID].HP / pUnits[unitID].maxHP;
					ctx.beginPath();
					ctx.rect(j * (nTileSize + nTilePadding) + (nTileSize - nLifeBarWidth) / 2, tileY - nLifeBarHeight, nLifeBarWidth * HPratio, nLifeBarHeight);
					ctx.fillStyle = "#00FF00";
					ctx.fill();
					ctx.closePath();
				}
			}
		}
	}
}

function drawClassSelect() {
	var maxColumn = 10;
	var padding = 3;
	var totalSize = nPortraitWidth * maxColumn + (maxColumn - 1) * padding;
	var startX = (canvas.width - totalSize) / 2;
	var startY = nTopOffset + nNbLines * (nTileSize + nTilePadding) + 10;
	
	for (i = 0; i < nNbCharacters; ++i) {
		if (pUnits[i].team != HERO_TEAM || pUnits[i].hasFilter("Summon"))
			continue;
		
		ctx.beginPath();
		ctx.rect(startX, startY, nPortraitWidth, nPortraitHeight);
		ctx.fillStyle = "#ffffff";
		ctx.fill();
		ctx.rect(startX, startY, nPortraitWidth, nPortraitHeight);
		ctx.strokeStyle = getCharacterColor(pUnits[i].type);
		ctx.stroke();
		ctx.closePath();
		
		var img = new Image();
		img.src = pUnits[i].thumbSrc;
		
		if (pUnits[i].inGame)
			ctx.globalAlpha = 0.5;
		else if (pMousePos[0] > startX && pMousePos[0] < startX + nPortraitWidth && pMousePos[1] > startY && pMousePos[1] < startY + nPortraitHeight)
			nHoveredUnitID = i;
		else
			ctx.globalAlpha = 0.75;
		
		ctx.drawImage(img, startX, startY, nPortraitWidth, nPortraitHeight);
		startX += nPortraitWidth + padding;
		ctx.globalAlpha = 1;
		
		if (i > 0 && i % (maxColumn - 1) == 0) {
			remainingCharacters = Math.min(maxColumn, nNbCharacters - i - 1);
			totalSize = nPortraitWidth * remainingCharacters + (remainingCharacters - 1) * padding;
			startX = (canvas.width - totalSize) / 2;
			startY += nPortraitWidth + padding;
		}
	}
	
	var img = new Image();
	img.src = "img/help.png";
	ctx.drawImage(img, canvas.width * 0.75, canvas.height * 0.35);
	
	if (nDraggedUnitID >= 0) {
		var posX = pMousePos[0] - nPortraitWidth / 2;
		var posY = pMousePos[1] - nPortraitHeight / 2;
		var img = new Image();
		img.src = pUnits[nDraggedUnitID].src;
		var finalWidth = nPortraitHeight * img.width / img.height;
		ctx.drawImage(img, posX, posY, finalWidth, nPortraitHeight);     
	}
	
	if (nNbSelectedCharacters < nMaxCharacters) {
		ctx.font = "18px Arial";
		ctx.textAlign = "center";
		ctx.fillStyle = "#000000";
		ctx.fillText("SELECT " + (nMaxCharacters - nNbSelectedCharacters) + " CHARACTER(S) TO BEGIN", canvas.width / 2, startY + nPortraitHeight + 20);
	}
}

function drawBattleLog() {
	var startX = canvas.width / 2;
	var startY = nTopOffset + nNbLines * (nTileSize + nTilePadding) + 40;
	
	if (bWaitClick) {
		ctx.font = "18px Arial";
		ctx.textAlign = "center";
		ctx.fillStyle = "#000000";
		ctx.fillText("CLICK TO CONTINUE", startX, startY);
	}
	
	var minLog = Math.max(0, pBattleLog.length - 10);
	for (i = pBattleLog.length - 1; i >= minLog; --i) {
		ctx.font = "16px Arial";
		ctx.textAlign = "left";
		ctx.fillStyle = "#101010";
		ctx.fillText(pBattleLog[i], 20, canvas.height - 20 - (pBattleLog.length - i) * 20);
	}
}

function drawButtons() {
	for (i = 0; i < pButtons.length; ++i) {
		if (!pButtons[i].active)
			continue;
		
		scale = pButtons[i].isHovered() ? 1.2 : 1;
		
		ctx.beginPath();
		ctx.rect(pButtons[i].x - pButtons[i].width * scale / 2, pButtons[i].y - pButtons[i].height * scale / 2, pButtons[i].width * scale, pButtons[i].height * scale);
		ctx.fillStyle = "#000000";
		ctx.fill();
		ctx.closePath();
		
		ctx.font = parseInt(18 * scale) + "px Arial";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = "#FFFFFF";
		ctx.fillText(pButtons[i].text, pButtons[i].x, pButtons[i].y);
		
	}
	
	pButtons[BUTTON_START].active = nNbSelectedCharacters == nMaxCharacters && eGameState == GameState.TEAM_SELECT;
}