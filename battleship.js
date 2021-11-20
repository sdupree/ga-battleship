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
let board, winner;


/*----- Cached Element References -----*/


/*----- Event Listeners -----*/


/*----- Functions -----*/
init();

function init() {
  console.log('hello');
  document.querySelector('#computer-board').innerHTML = generateBoardHTML();
  document.querySelector('#player-board').innerHTML = generateBoardHTML();
}

function generateBoardHTML() {
  let boardHtml = '';


  // Generate top row.
  boardHtml += '<div class="board-border-square"></div>';
  for(let i = 1; i < 11; i++) {
    boardHtml += '<div class="board-border-square">' + i + '</div>';
  }
  boardHtml += '<div class="board-border-square"></div>';

  boardHtml += '\n';

  // Generate middle 10 rows.
  for(let i = 0; i < 10; i++) {
    boardHtml += '<div class="board-border-square">' + String.fromCharCode(65 + i) + '</div>';
    for(let j = 0; j < 10; j++) {
      if(Math.floor(Math.random() * 7) % 7 == 0) {
        if(Math.floor(Math.random() * 7) % 7 == 0) {
          boardHtml += `<div class="board-square" id="h${i}v${j}"><span class="peg red-peg"></span></div>`;
        } else {
          boardHtml += `<div class="board-square" id="h${i}v${j}"><span class="peg white-peg"></span></div>`;
        }
      } else {
        boardHtml += `<div class="board-square" id="h${i}v${j}"><span class="peg-hole"></span></div>`;
      }
      // boardHtml += `<div class="board-square" id="h${i}v${j}"><span class="peg-hole"></span></div>`;
    }
    boardHtml += '<div class="board-border-square"></div>\n';
  }

  // Footer.
  for(let i = 0; i < 12; i++) {
    boardHtml += '<div class="board-border-square"></div>';
  }

  return boardHtml;
}

function renderShip(ship, topLeft, whichBoard, borderColor) {
  // Could do better than "borderColor"...
  // Select grid squares
  // Modify CSS
}