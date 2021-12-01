/*----- Constants -----*/
// The 5 ships are: Carrier (occupies 5 spaces), Battleship (4), Cruiser (3), Submarine (3), and Destroyer (2).
const baseShips = {
  carrier: {
    squares: 5
  },
  battleship: {
    squares: 4
  },
  cruiser: {
    squares: 3
  },
  submarine: {
    squares: 3
  },
  destroyer: {
    squares: 2
  }
};

const boardDimensions = {
  col: {
    min: 1,
    max: 10
  },
  row: {
    min: 'A',
    max: 'J'
  }
}


/*----- Variables -----*/
let players, turn, winner, message, boardPositions;


/*----- Cached Element References -----*/
const gameBoardEls = {
  p1: document.getElementById('p1-board'),
  p2: document.getElementById('p2-board')
};

// We'll fill these two during cacheElementReferences() after we've generated the HTML.
const gameSquareEls     = {};
const gameSquareSpanEls = {};

const messageContainerEl = document.getElementById('message-container');
const messageTextEl      = document.getElementById('message-text');


/*----- Event Listeners -----*/
gameBoardEls['p2'].addEventListener('mouseover', placeShip);
document.addEventListener('click', handleClick);


/*----- Functions -----*/
init();

function init() {
  // Populate "boardPositions" array.
  generateBoardPositions();

  // How many players?
  players = {
    'p1': {},
    'p2': {}
  };
  for(const playerID in players) {
    const player = players[playerID];
    
    player.board = [];
    player.ships = [];
    player.id = playerID;

    // Instantiate player's game board.
    boardPositions.forEach(function(pos) {
      player.board[pos] = null;
    });
    // Initialize player's ships.
    for(const ship in baseShips) {
      player.ships[ship] = {};
      player.ships[ship].squares = baseShips[ship].squares;
      player.ships[ship].sunk = false;
      player.ships[ship].status = 'undeployed';
      player.ships[ship].anchorSquare = undefined;
      player.ships[ship].topLeft = undefined;
      player.ships[ship].orientation = 'hor';
    }

    deployNextShip(player);  // Deploy first ship.

    // Construct game board HTML.
    gameBoardEls[player.id].innerHTML = generateBoardHTML(player.id);
  }

  // Cache element references.
  cacheElementReferences();

  // Generate random computer ship positions.
  possibleBoardPositions = [...boardPositions];
  
  for(shipName in players['p1'].ships) {
    const ship = players['p1'].ships[shipName];
    while(ship.status !== 'deployed') {
      const rnd = Math.floor(Math.random() * possibleBoardPositions.length - 1);
      const pos = possibleBoardPositions[rnd];
      let [row, col] = splitPos(pos);
      const orientation = Math.floor(Math.random() * 2) ? 'hor' : 'ver';

      possibleBoardPositions.slice(rnd, 1);

      // Adjust ship.topLeft if ship would extend beyond board.
      if(orientation === 'hor' && col + (ship.squares - 1) > boardDimensions.col.max) {
        col = boardDimensions.col.max - (ship.squares - 1);
      }
      if(orientation === 'ver' && row.charCodeAt() + (ship.squares - 1) > boardDimensions.row.max.charCodeAt()) {
        row = String.fromCharCode(boardDimensions.row.max.charCodeAt() - (ship.squares - 1));
      }

      ship.topLeft = makePos(row, col);
      ship.orientation = orientation;

      if(! detectCollision(players['p1'], ship)) {
        ship.status = 'deployed';
      }
    }
  }

  // Whose turn is it? ('null' until ships are placed.)
  turn = null;

  // Initialize "winner".
  winner = undefined;

  // Display 'welcome' message.
  message = 'Welcome to GA Battleship!<br><br>Click to begin.<br><br>Then place your Carrier on the board below.';

  // Initial render.
  render();
}

// generateBoardPositions populates our array of name-friendly board spaces with e.g. "A1" - "J10".
function generateBoardPositions() {
  boardPositions = [];  // Make array empty, just in case.

  for(let i = 0; i < 10; i++) {
    for(let j = 0; j < 10; j++) {
      boardPositions.push(String.fromCharCode(i + 65) + (j + 1));
    }
  }
  // return boardPositions;
}

function generateBoardHTML(player) {
  let boardHtml = '';

  // Generate top row.
  boardHtml += '<div class="board-border-square"></div>';
  for(let i = 1; i < 11; i++) {
    boardHtml += '<div class="board-border-square">' + i + '</div>';
  }
  boardHtml += '<div class="board-border-square"></div>';

  boardHtml += '\n';

  // Generate middle 10 rows.
  boardPositions.forEach(function(pos, idx) {
    if(idx % 10 === 0) { boardHtml += '<div class="board-border-square">' + pos.charAt() + '</div>'; }
    boardHtml += `<div class="board-square" id="${player}-${pos}"><span id="${player}-${pos}-span" class="peg-hole"></span></div>`;
    if(idx % 10 === 9) { boardHtml += '<div class="board-border-square"></div>\n'; }
  });


  // Footer.
  for(let i = 0; i < 12; i++) {
    boardHtml += '<div class="board-border-square"></div>';
  }

  return boardHtml;
}

function cacheElementReferences() {
  for(const player in players) {
    for(const square in players[player].board) {
      const id = `${player}-${square}`;
      gameSquareEls[id] = document.getElementById(id);
      gameSquareSpanEls[id] = gameSquareEls[id].querySelector('span');
    }
  }
}

function render() {
  // Render play areas.
  for(const playerID in players) {
    const player = players[playerID];
    const hideShips = playerID === 'p1' ? true : false;  // Hide player 1's ships.

    // Render board (hits/misses)
    for(const boardSquareID in player.board) {
      // Get HTML elements.
      const boardSquareFullID = `${player.id}-${boardSquareID}`;
      const boardSquare = gameSquareEls[boardSquareFullID];
      const boardSquareSpan = gameSquareSpanEls[boardSquareFullID];

      // Clear all non-default classes.
      // Trying to loop over an array while you remove elements causes odd behavior, so copy the array first!
      let classesToRemove = [];
      classesToRemove = [...boardSquare.classList];
      classesToRemove.forEach(function(htmlClass) {
        if(htmlClass !== 'board-square') boardSquare.classList.remove(htmlClass);
      });
      classesToRemove = [...boardSquareSpan.classList];
      classesToRemove.forEach(function(htmlClass, i) {
        boardSquareSpan.classList.remove(htmlClass);
      });

      // Add base classes back in.
      if(player.board[boardSquareID]) {
        // Has been hit.
        boardSquareSpan.classList.add('peg', 'white-peg');
      } else {
        // Has not been hit.
        boardSquareSpan.classList.add('peg-hole');
      }
    }

    // Render ships
    for(ship in player.ships) {
      renderShip(player.ships[ship], player, hideShips);
    }
  }

  // Render messages.
  if(message) { showMessage(message); }
  else { hideMessage(); }
}

function renderShip(ship, player, hideShip) {
  if(ship.status === 'undeployed') return;
  if(! ship.topLeft) return;

  hideShip = hideShip ? true : false;

  let targetSquare = ship.topLeft;
  let shipLength = ship.squares;
  let direction = ship.orientation === 'ver' ? 'row' : 'col';
  let borderModifier = '';

  // Detect collisions.
  if(ship.status === 'deploying' || ship.status === 'anchored') {
    borderModifier = 'deploying-';
    if(detectCollision(player, ship)) borderModifier = 'collision-';
  }

  // Draw ship body.
  for(i = 0; i < shipLength; i++) {
    const targetFullID = `${player.id}-${targetSquare}`;
    let targetDiv = gameSquareEls[targetFullID];
    let targetSpan = gameSquareSpanEls[targetFullID];
    
    if(! hideShip) {
      // Draw actual ship here, if it is not hidden.
      if(i === 0) {
        // Top/left
        targetDiv.classList.add(ship.orientation === 'ver' ? `ship-${borderModifier}top` : `ship-${borderModifier}left`);
      } else if(i === shipLength - 1) {
        // Bottom/right
        targetDiv.classList.add(ship.orientation === 'ver' ? `ship-${borderModifier}bottom` : `ship-${borderModifier}right`);
      } else {
        // Middle
        targetDiv.classList.add(ship.orientation === 'ver' ? `ship-${borderModifier}tb-mid` : `ship-${borderModifier}lr-mid`);
      }
    }

    // Peg/hole color adjustment
    if(player.board[targetSquare]) {
      // Hit.
      targetSpan.classList.remove('white-peg');
      targetSpan.classList.add('red-peg');
    } else {
      // Not shot at.
      if(ship.status === 'anchored' && ship.anchorSquare === targetSquare) {
        // Hole is green.
        targetSpan.classList.add('anchor');
      } else if(! hideShip) {
        // Hole is dark gray.
        targetSpan.classList.add('in-ship');
      }
    }

    // Move to next square.
    targetSquare = gridAdd(targetSquare, direction);
  }
}

function showMessage(message) {
  messageTextEl.innerHTML = message;
  messageContainerEl.classList.add('show-message');
}

function hideMessage() {
  messageContainerEl.classList.remove('show-message');
}

function placeShip(e) {
  const [playerID, square] = getPlayerIDAndSquareFromTargetID(e.target.id);
  if(! playerID || ! square) return undefined;

  const player = players[playerID];
  let [row, col] = splitPos(square);  // 'square' is where the mouse is.

  // One of these should exist. If not, just do nothing.
  const ship = getDeployingOrAnchoredShip(player);
  if(! ship) return undefined;
  
  // If we're placing a ship that doesn't have a topLeft, it's new.
  if(! ship.topLeft) {
    ship.topLeft = makePos(row, col);
  }
  
  if(ship.status === 'anchored') {
    let [anchorRow, anchorCol]  = splitPos(ship.anchorSquare);
    
    // Change ship orientation when mouse aligns with alternate ship alignment.
    if(row === anchorRow && col !== anchorCol && ship.orientation !== 'hor') ship.orientation = 'hor';
    else if(col === anchorCol && row !== anchorRow && ship.orientation !== 'ver') ship.orientation = 'ver';
    
    row = anchorRow;
    col = anchorCol;
  }
  
  // Adjust ship.topLeft if ship would extend beyond board.
  if(ship.orientation === 'hor' && col + (ship.squares - 1) > boardDimensions.col.max) {
    col = boardDimensions.col.max - (ship.squares - 1);
  }
  if(ship.orientation === 'ver' && row.charCodeAt() + (ship.squares - 1) > boardDimensions.row.max.charCodeAt()) {
    row = String.fromCharCode(boardDimensions.row.max.charCodeAt() - (ship.squares - 1));
  }
  
  ship.topLeft = makePos(row, col);
  
  render();
}

function handleClick(e) {
  // If message is popped up, clear it out.
  if(message) {
    message = '';
    if(winner) {
      // Reset game.
      gameBoardEls['p2'].addEventListener('mouseover', placeShip);
      init();
    } else {
      render();
    }
    return undefined;
  }

  // If game play mode is 'place ship', handle 'place ship' logic'
  if(! turn) {
    // Get player ID and game square, or return undefined if the click wasn't on a game square.
    const [playerID, square] = getPlayerIDAndSquareFromTargetID(e.target.id);
    if(! playerID || ! square) return undefined;

    // Ignore all clicks that aren't on the 'p2' board (for now).
    if(playerID !== 'p2') return undefined;

    const player = players[playerID];

    const ship = getDeployingOrAnchoredShip(player);

    if(! detectCollision(player, ship)) {
      if(ship.status === 'deploying') {
        ship.status = 'anchored';
        ship.anchorSquare = square;
      } else if(ship.status === 'anchored') {
        ship.status = 'deployed';
        if(! deployNextShip(player)) {
          // No more ships to deploy; prepare to begin game.
          gameBoardEls['p2'].removeEventListener('mouseover', placeShip);
          turn = 'p2';
        }
      }
    }
  } else {
    // Player's turn! (First handle P2, then handle P1 (computer).)
    const [targetPlayerID, targetSquare] = getPlayerIDAndSquareFromTargetID(e.target.id);

    // Target wasn't a game square.
    if(! targetPlayerID || ! targetSquare) return undefined;
    
    // You can't shoot at your own board!
    if(targetPlayerID === turn) return undefined;
    
    const targetPlayer = players[targetPlayerID];
    
    // If square has already been hit, take no action.
    if(targetPlayer.board[targetSquare]) return undefined;
    
    // Update game board to indicate a shot was taken.
    targetPlayer.board[targetSquare] = true;
    
    // Did we win the game?
    const shipsSquares = getDeployedShipsSquares(targetPlayer);
    if(shipsSquares.every(function(sq) { return targetPlayer.board[sq]; })) {
      // WINNER!
      winner = turn;
      message = 'You have won!<br><br>Click to start again!';
      render();
      return undefined;
    }

    // Advance turn.
    turn = 'p1';

    // Computer's turn!
    const playableSquares = [];
    for(const square in players['p2'].board) {
      if(! players['p2'].board[square]) playableSquares.push(square);
    }

    const randomSquare = playableSquares[Math.floor(Math.random() * playableSquares.length)];

    players['p2'].board[randomSquare] = true;

    // Did the computer win the game?
    const p2ShipsSquares = getDeployedShipsSquares(players['p2']);
    if(p2ShipsSquares.every(function(sq) { return players['p2'].board[sq]; })) {
      // WINNER!
      winner = turn;
      message = 'The Computer has won!<br><br>Click to start again!';
      render();
      return undefined;
    }

    // End computer's turn.
    turn = 'p2';
  }

  render();
}

function getShipSquares(ship) {
  // Returns an array of squares where a ship is sitting.
  let occupiedSquares = [ship.topLeft];
  nextSquare = ship.topLeft;
  let direction = ship.orientation === 'ver' ? 'row' : 'col';

  for(i = 0; i < ship.squares - 1; i++) {
    occupiedSquares.push(gridAdd(occupiedSquares[i], direction));
  }

  return occupiedSquares;
}

function getDeployedShipsSquares(player) {
  // Return an array containing all squares that a current player's deployed ships are occupying.
  let occupiedSquares = [];

  for(const ship in player.ships) {
    if(player.ships[ship].status === 'deployed') {
      occupiedSquares.push(...getShipSquares(player.ships[ship]));
    }
  }

  return occupiedSquares;
}

function detectCollision(player, ship) {
  const occupiedSquares = getDeployedShipsSquares(player);
  const desiredSquares = getShipSquares(ship);

  let retVal = false;

  desiredSquares.forEach(function(square) {
    if(occupiedSquares.includes(square)) retVal = true;
  });

  return retVal;
}

function gridAdd(pos, dir, num) {
  // Add 'num' position(s) [default 1, negative okay] to the 'row' or 'column' of the grid square we were passed, and return it, or 'undefined' if out of bounds.
  let [row, col] = splitPos(pos);
  let newPos = undefined;
  num = num ? num : 1;

  if(dir === 'row') { row = String.fromCharCode(row.charCodeAt() + num); }
  else if(dir === 'col') { col = parseInt(col) + num; }
  else { return undefined; }

  newPos = makePos(row, col);

  // If not within bounds, return undefined.
  if(! withinBounds(newPos)) return undefined;

  return newPos;
}

function withinBounds(pos) {
  // Return 'false' if 'row' > 'J' or if 'col' > '10', else return true.
  const [row, col] = splitPos(pos);

  if(row.charCodeAt() > boardDimensions.row.max.charCodeAt() || row.charCodeAt() < boardDimensions.row.min.charCodeAt()) { return false; }
  if(parseInt(col) > boardDimensions.col.max || parseInt(col) < boardDimensions.col.min) { return false; }

  return true;
}

function splitPos(pos) {
  // Give us 'A9' and we'll give you ['A', '9'].
  const row = pos.substring(0, 1);
  const col = parseInt(pos.substring(1));

  return [row, col];
}

function makePos(row, col) {
  // Give us 'A' and '9' and we'll give you back 'A9'.
  return `${row}${col}`;
}

function getPlayerIDAndSquareFromTargetID(id) {
  // Returns [player_id, square] or undefined.
  let player_id, square, m;

  m = id.match(/^(p\d)-([A-J]\d\d?)(:?-span)?$/);
  if(m && m[1] && m[2]) {
    player_id = m[1];
    square = m[2];
  }

  return [player_id, square];
}

function getDeployingOrAnchoredShip(player) {
  // Returns the ship with status 'deploying' or 'anchored' from a player's list of ships, or undefined if there are none.
  for(const targetShip in player.ships) {
    // There should be one and only one.
    if(player.ships[targetShip].status === 'deploying' || player.ships[targetShip].status === 'anchored') return player.ships[targetShip];
  }

  return undefined;
}

function getNextShipToDeploy(player) {
  // Always do this in the same order.
  const shipOrder = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'];

  for(const ship of shipOrder) {
    if(player.ships[ship].status === 'undeployed') return player.ships[ship];
  }

  return null;  // No more ships!
}

function deployNextShip(player) {
  // Deploy another ship. Return 'true' if deployed or 'false' if no more.
  const shipToDeploy = getNextShipToDeploy(player);
  if(shipToDeploy) {
    shipToDeploy.status = 'deploying';
    return true;
  }

  return false;
}