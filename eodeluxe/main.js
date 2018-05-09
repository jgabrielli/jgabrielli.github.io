function draw() {
  canvas.width = canvas.width;
  //ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  drawGrid();
  drawUnits();
  
  if (eGameState == GameState.TEAM_SELECT) {
	  drawClassSelect();
  }
  else {
	  drawBattleLog();
  }
  
  drawButtons();
  drawUnitTooltip();
  
  /*if (isPaused)
  {
	drawPause();
  }*/
  requestAnimationFrame(draw);
}

function process() {
  //if (!isPaused)
  {
	  if (eGameState == GameState.BATTLE)
		  processTurn();
  }
  requestAnimationFrame(process);
}

// Init
for (i = 0; i < nNbLines; ++i) {
	pTiles[i] = new Array(nNbColumns);
	for (j = 0; j < nNbColumns; j++) {
		pTiles[i][j] = new Tile(i, j, -1);
	}
}

pButtons[BUTTON_RESET] = new Button(canvas.width - 120, 50, 200, 30, "RESET", resetGrid);
pButtons[BUTTON_NEXT] = new Button(canvas.width - 120, 90, 200, 30, "NEXT STAGE", nextStage);
pButtons[BUTTON_START] = new Button(canvas.width / 2, (nTileSize + nTilePadding) * nNbLines + nPortraitHeight * 2 + 30 + nTopOffset, 200, 30, "START BATTLE", startGame);
loadPlayerXML("xml/Playable_Characters.xml");
loadSummonXML("xml/Summons.xml");
loadStageXML("xml/Stages.xml");
draw();
process();