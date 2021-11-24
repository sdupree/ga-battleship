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
      player.ships[ship].deploying = false;
      player.ships[ship].delpoyed = false;
      player.ships[ship].topLeft = undefined;
      player.ships[ship].orientation = undefined;
    }

    // Construct game board HTML.
    document.querySelector(`#${player.id}-board`).innerHTML = generateBoardHTML(player.id);
  });

  // Some fake ship data for testing:
  players.forEach(function(player) {
    player.ships['carrier'].topLeft = 'A1';
    player.ships['carrier'].orientation = 'ver';
    player.ships['carrier'].deployed = true;
    player.ships['battleship'].topLeft = 'C4';
    player.ships['battleship'].orientation = 'hor';
    player.ships['battleship'].deployed = true;
    player.ships['cruiser'].topLeft = 'E1';
    player.ships['cruiser'].orientation = 'ver';
    player.ships['cruiser'].deploying = true;
    player.ships['submarine'].topLeft = 'G9';
    player.ships['submarine'].orientation = 'ver';
    player.ships['submarine'].deployed = true;
    player.ships['destroyer'].topLeft = 'I6';
    player.ships['destroyer'].orientation = 'hor';
    player.ships['destroyer'].deployed = true;
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
    boardHtml += `<div class="board-square" id="${player}-${pos}"><span class="peg-hole"></span></div>`;
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
  let targetGridSquare = ship.topLeft;
  let shipLength = ship.squares;
  let direction = ship.orientation === 'ver' ? 'row' : 'col';
  let borderModifier = '';

  // Detect collisions.
  if(ship.deploying) {
    borderModifier = 'deploying-';
    if(detectCollision(player, ship)) borderModifier = 'collision-';
  }

  let targetDiv = document.getElementById(`${player.id}-${targetGridSquare}`);
  let targetSpan = targetDiv.querySelector('span');
  targetDiv.classList.add(ship.orientation === 'ver' ? `ship-${borderModifier}top` : `ship-${borderModifier}left`);
  targetSpan.classList.add('in-ship');
  targetGridSquare = gridAdd(targetGridSquare, direction);

  for(i = 0; i < shipLength - 2; i++) {
    let targetDiv = document.getElementById(`${player.id}-${targetGridSquare}`);
    let targetSpan = targetDiv.querySelector('span');
    targetDiv.classList.add(ship.orientation === 'ver' ? `ship-${borderModifier}tb-mid` : `ship-${borderModifier}lr-mid`);
    targetSpan.classList.add('in-ship');
    targetGridSquare = gridAdd(targetGridSquare, direction);
  }

  targetDiv = document.getElementById(`${player.id}-${targetGridSquare}`);
  targetSpan = targetDiv.querySelector('span');
  targetDiv.classList.add(ship.orientation === 'ver' ? `ship-${borderModifier}bottom` : `ship-${borderModifier}right`);
  targetSpan.classList.add('in-ship');

}

function placeShip(e) {
  // Use regex to scan target IDs to filter for game squares.
  let m = e.target.id.match(/^p2-([A-J])(\d\d?)$/);
  
  if(m) {
    // This target ID is a game square. Ignore everything else.
    let row = null;
    let col = null;
    let ship = undefined;

    row = m[1];
    col = parseInt(m[2]);

    for(const targetShip in players[1].ships) {
      // There should be one and only one.
      if(players[1].ships[targetShip].deploying) ship = players[1].ships[targetShip];
    }

    if(ship.orientation === 'hor' && col + (ship.squares - 1) > boardDimensions.col.max) {
      col = boardDimensions.col.max - (ship.squares - 1);
    }
    if(ship.orientation === 'ver' && row.charCodeAt() + (ship.squares - 1) > boardDimensions.row.max.charCodeAt()) {
      row = String.fromCharCode(boardDimensions.row.max.charCodeAt() - (ship.squares - 1));
    }

    ship.topLeft = `${row}${col}`;
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
    if(player.ships[ship].deployed) {
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
  // Add 'num' position(s) [default 1] to the 'row' or 'column' of the grid square we were passed, and return it, or 'undefined' if out of bounds.
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
  const col = pos.substring(1);

  return [row, col];
}