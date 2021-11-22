/*----- Constants -----*/
// The 5 ships are: Carrier (occupies 5 spaces), Battleship (4), Cruiser (3), Submarine (3), and Destroyer (2).
const ships = {
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


/*----- Variables -----*/
let players, turn, winner, boardPositions;


/*----- Cached Element References -----*/


/*----- Event Listeners -----*/


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
    for(const ship in ships) {
      player.ships[ship] = ships[ship];
      player.ships[ship].isSunk = false;
      player.ships[ship].topLeft = undefined;
      player.ships[ship].orientation = undefined;
    }

    // Construct game board HTML.
    document.querySelector(`#${player.id}-board`).innerHTML = generateBoardHTML(player.id);
  });

  // Make random pegs (optional)
  ['p1', 'p2'].forEach(function(which_board) {
    boardPositions.forEach(function(pos) {
      let div = document.getElementById(`${which_board}-${pos}`);
      let span = div.querySelector('span');
      if(Math.floor(Math.random() * 7) % 7 == 0) {
        if(Math.floor(Math.random() * 7) % 7 == 0) {
          span.classList.add('peg', 'red-peg');
          span.classList.remove('peg-hole');
        } else {
          span.classList.add('peg', 'white-peg');
          span.classList.remove('peg-hole');
        }
      }
    });
  });

  // Whose turn is it?
  turn = 'p1';

  // Initialize "winner".
  winner = undefined;
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
  });

  // Then render ships


  // Then render messages (or is messaging separate?)


}

function renderShip(ship, topLeft, whichBoard, borderColor) {
  topLeft = topLeft ? topLeft : 'A1';
  playerBoard = 'p2';

  let targetGridSquare = topLeft;
  let shipLength = 3;

  let targetDiv = document.getElementById(`${playerBoard}-${targetGridSquare}`);
  targetDiv.classList.add('ship-left');
  targetGridSquare = gridAdd(targetGridSquare, 'col');

  for(i = 0; i < shipLength - 2; i++) {
    let targetDiv = document.getElementById(`${playerBoard}-${targetGridSquare}`);
    targetDiv.classList.add('ship-lr-mid');
    targetGridSquare = gridAdd(targetGridSquare, 'col');
  }
  targetDiv = document.getElementById(`${playerBoard}-${targetGridSquare}`);
  targetDiv.classList.add('ship-right');

}

function gridAdd(pos, dir, num) {
  // Add 'num' position(s) [default 1] to the 'row' or 'column' of the grid square we were passed, and return it, or 'undefined' if out of bounds.
  let row = pos.substring(0, 1);
  let col = pos.substring(1);
  num ? num : 1;

  if(dir === 'row') { row = String.fromCharCode(row.charCodeAt() + 1); }
  else if(dir === 'col') { col = parseInt(col) + 1; }
  else { return undefined; }

  return `${row}${col}`;
}

function withinBounds(pos) {
  // Return 'false' if 'row' > 'J' or if 'col' > '10', else return true.
  const row = pos.substring(0, 1);
  const col = pos.substring(1);

  if(row.charCodeAt() - 65 > 9) { return false; }
  if(parseInt(col) > 10) { return false; }

  return true;
}