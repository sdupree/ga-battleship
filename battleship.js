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
let player1_board, player2_board, player1_ships, player2_ships, winner, boardPositions;


/*----- Cached Element References -----*/


/*----- Event Listeners -----*/


/*----- Functions -----*/
init();

function init() {
  // Populate "boardPositions" array.
  generateBoardPositions();

  player1_board = [];
  player2_board = [];

  // Instantiate game boards.
  [player1_board, player2_board].forEach(function(which_board) {
    boardPositions.forEach(function(pos) {
      which_board[pos] = null;
    });
  });
  
  // Construct game board HTML.
  document.querySelector('#player1-board').innerHTML = generateBoardHTML('p1');
  document.querySelector('#player2-board').innerHTML = generateBoardHTML('p2');

  // Make random pegs (optional)
  ['p1', 'p2'].forEach(function(which_board) {
    boardPositions.forEach(function(pos) {
      let div = document.getElementById(`${which_board}-${pos}`);
      let span = div.querySelector('span');
      if(Math.floor(Math.random() * 7) % 7 == 0) {
        if(Math.floor(Math.random() * 7) % 7 == 0) {
          span.classList.add('peg', 'red-peg');
          // div.classList.remove('peg-hole');
        } else {
          span.classList.add('peg', 'white-peg');
          // div.classList.remove('peg-hole');
        }
      }
    });
  });


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
    console.log(pos);
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
  // First render board (hits/misses)
  // Then render ships
  // Then render messages (or is messaging separate?)
}

function renderShip(ship, topLeft, whichBoard, borderColor) {
  topLeft = 'A1';
  let targetGridSquare = topLeft;
  let shipLength = 3;

  let targetDiv = document.getElementById(targetGridSquare);
  targetDiv.classList.add('ship-left');
  targetGridSquare = gridAdd(targetGridSquare, 'col');

  for(i = 0; i < shipLength - 2; i++) {
    let targetDiv = document.getElementById(targetGridSquare);
    targetDiv.classList.add('ship-lr-mid');
    targetGridSquare = gridAdd(targetGridSquare, 'col');
  }
  targetDiv = document.getElementById(targetGridSquare);
  targetDiv.classList.add('ship-right');

}

function gridAdd(pos, dir) {
  // Add 1 position to the 'row' or 'column' of the grid square we were passed, and return it.
  let row = pos.substring(0, 1);
  let col = pos.substring(1);

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