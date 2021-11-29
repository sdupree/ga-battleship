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
let players, turn, winner, boardPositions;


/*----- Cached Element References -----*/


/*----- Event Listeners -----*/
document.getElementById('p2-board').addEventListener('mouseover', placeShip);
document.addEventListener('click', handleClick);


/*----- Functions -----*/
init();

function init() {
  // Populate "boardPositions" array.
  generateBoardPositions();

  // How many players?
  players = [];
  for(let i = 0; i < 2; i++) {
    players[i] = {};
    players[i].board = [];
    players[i].ships = [];
    players[i].id = `p${i + 1}`;
  }

  // Initialilze each player's board and ships.
  players.forEach(function(player) {
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
      player.ships[ship].orientation = undefined;
    }

    deployNextShip(player);  // Deploy first ship.

    // Construct game board HTML.
    document.querySelector(`#${player.id}-board`).innerHTML = generateBoardHTML(player.id);
  });

  // Some fake ship data for testing:
  players.forEach(function(player) {
    if(player === 'p1') {
      player.ships['carrier'].topLeft = 'A1';
      player.ships['carrier'].orientation = 'ver';
      player.ships['carrier'].status = 'deployed';
      player.ships['battleship'].topLeft = 'C4';
      player.ships['battleship'].orientation = 'hor';
      player.ships['battleship'].status = 'deployed';
      player.ships['cruiser'].topLeft = 'E1';
      player.ships['cruiser'].orientation = 'ver';
      player.ships['cruiser'].status = 'deployed';
      player.ships['submarine'].topLeft = 'E4';
      player.ships['submarine'].orientation = 'ver';
      player.ships['submarine'].status = 'deployed';
      player.ships['destroyer'].topLeft = 'I6';
      player.ships['destroyer'].orientation = 'hor';
      player.ships['destroyer'].status = 'deployed';
    }
  });
  
  // Whose turn is it? ('null' until ships are placed.)
  turn = null;

  // Initialize "winner".
  winner = undefined;

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

function render() {
  players.forEach(function(player) {
    // First render board (hits/misses)
    for(const boardSquareID in player.board) {
      // Get HTML elements.
      const boardSquare = document.getElementById(`${player.id}-${boardSquareID}`);
      const boardSquareSpan = boardSquare.querySelector('span');

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

    // Then render ships
    for(ship in player.ships) {
      renderShip(player.ships[ship], player);
    }
  });

  // Manage event listeners (dependent on state)

  // Then render messages (or is messaging separate?)

}

function renderShip(ship, player) {
  if(ship.status === 'undeployed') return;
  if(! ship.topLeft) return;

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
    let targetDiv = document.getElementById(`${player.id}-${targetSquare}`);
    let targetSpan = targetDiv.querySelector('span');
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
    
    // Peg/hole color adjustment
    if(player.board[targetSquare]) {
      // Hit.
      targetSpan.classList.remove('white-peg');
      targetSpan.classList.add('red-peg');
    } else {
      // Not shot at.
      if(ship.status === 'anchored' && ship.anchorSquare === targetSquare) {
        targetSpan.classList.add('anchor');
      } else {
        targetSpan.classList.add('in-ship');
      }
    }

    // Move to next square.
    targetSquare = gridAdd(targetSquare, direction);
  }
}

function placeShip(e) {
  const [player_id, square] = getPlayerIDAndSquareFromTargetID(e.target.id);
  if(! player_id || ! square) return undefined;

  let player = getPlayerFromPlayerID(player_id);
  let [row, col] = splitPos(square);  // 'square' is where the mouse is.
  
  // One of these should exist. If not, just do nothing.
  const ship = getDeployingOrAnchoredShip(player);
  if(! ship) return undefined;

  // If we're placing a ship that doesn't have a topLeft, it's new.
  if(! ship.topLeft) {
    ship.topLeft = `${row}${col}`;
    ship.orientation = 'hor';
  }
  
  if(ship.status === 'anchored') {
    let [anchorRow, anchorCol]  = splitPos(ship.anchorSquare);
    // Adjust orientation if necessary.

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
  
  ship.topLeft = `${row}${col}`;

  render();
}

function handleClick(e) {
  // If message is popped up, handle that first.

  // If game play mode is 'place ship', handle 'place ship' logic'
  if(! turn) {
    // Get player ID and game square, or return undefined if the click wasn't on a game square.
    const [player_id, square] = getPlayerIDAndSquareFromTargetID(e.target.id);
    if(! player_id || ! square) return undefined;

    const player = getPlayerFromPlayerID(player_id);

    const ship = getDeployingOrAnchoredShip(player);

    if(! detectCollision(player, ship)) {
      if(ship.status === 'deploying') {
        ship.status = 'anchored';
        ship.anchorSquare = square;
      } else if(ship.status === 'anchored') {
        ship.status = 'deployed';
        if(! deployNextShip(player)) {
          // No more ships to deploy; prepare to begin game.
          document.getElementById('p2-board').removeEventListener('mouseover', placeShip);
          turn = 'p1';
          console.log("BEGINNING GAME");
        }
      }
    }
  }

  // If game play mode is 'play game', handle that here.

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

  newPos = `${row}${col}`;

  // If not within bounds, return undefined.
  if(! withinBounds(newPos)) return undefined;

  return newPos;
}

function withinBounds(pos) {
  // Return 'false' if 'row' > 'J' or if 'col' > '10', else return true.
  const [row, col] = splitPos(pos);

  if(row.charCodeAt() - 65 > 9 || row.charCodeAt() - 65 < 0) { return false; }
  if(parseInt(col) > 10 || parseInt(col) < 1) { return false; }

  return true;
}

function splitPos(pos) {
  // Give us 'A9' and we'll give you ['A', '9'].
  const row = pos.substring(0, 1);
  const col = parseInt(pos.substring(1));

  return [row, col];
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

function getPlayerFromPlayerID(player_id) {
  let player = undefined;
  players.forEach(function(whichPlayer) {
    if(whichPlayer.id === player_id) player = whichPlayer;
  });

  return player;
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