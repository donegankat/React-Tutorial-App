import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

/**
 * Enum for the possible game states.
 */
const GameState = Object.freeze({
  "Winner": 1,
  "Draw": 2,
  "Playing": 3
});

/**
 * Creates an HTML element representing a single square on the game board.
 * Example usage: <Square value="1" />
 * @param {*} props 
 */
function Square(props) {
  var className = "square";

  if (props.isHighlighted) {
    className += " square-highlighted";
  }

  return (
    <button
      className={className}
      onClick={props.onClick}
    >
      {props.value}
    </button>
  );
}

/**
 * Creates the board which contains the 9 Squares.
 * Example usage: <Board />
 */
class Board extends React.Component {

  renderSquare(i) {
    return <Square
      key={"square-index-" + i}
      value={this.props.squares[i]}
      onClick={() => this.props.onClick(i)}
      isHighlighted={this.props.highlightedSquares?.indexOf(i) > -1}
    />;
  }

  render() {
    const squareRows = [];

    // Build the 9 squares in 3 rows dynamically.
    for (let i = 0; i < 3; i++) {
      const squares = [];

      for (let j = 0; j < 3; j++) {
        const squareIndex = (i * 3) + j;
        squares.push(this.renderSquare(squareIndex));
      }

      squareRows.push(<div key={"board-row-" + i} className="board-row">{squares}</div>);
    }    

    return (
      <div>
        {squareRows}
      </div>
    );
  }
}

/**
 * Manages the entire game, including the Board, Squares, and move history, and manages all actions and game states.
 */
class Game extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      history: [{
        squares: Array(9).fill(null)
      }],
      stepNumber: 0,
      xIsNext: true,
      areMovesSortedAscending: true
    }
  }

  /**
   * Handles when a square is clicked.
   * @param {*} i 
   */
  handleClick(i) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();

    // Ignore the click if there's already a winner or the space is taken.
    if (this.calculateGameStatus(squares).gameStatus === GameState.Winner || squares[i]) {
      return;
    }

    squares[i] = this.state.xIsNext ? 'X' : 'O';

    this.setState({
      history: history.concat([{
        squares: squares,
      }]),
      stepNumber: history.length,
      xIsNext: !this.state.xIsNext
    });
  }

  /**
   * Called when a move in the game's history is clicked. Jumps to the past or future board state.
   * @param {*} step 
   */
  jumpTo(step) {
    this.setState({
      stepNumber: step,
      xIsNext: (step % 2) === 0
    });
  }

  /**
   * Reverses the order of the move order history.
   */
  reverseSortMoveHistory() {
    this.setState({
      areMovesSortedAscending: !this.state.areMovesSortedAscending
    });
  }

  /**
   * Renders the Game.
   */
  render() {
    const history = this.state.history.slice();
    const currentMove = history[this.state.stepNumber];
    const gameStatus = this.calculateGameStatus(currentMove?.squares);

    // Iterate over the entire move history and build a list of previous moves that the user can click to
    // go back to.
    const moveHistory = this.buildMoveHistory(history, currentMove);

    let status

    if (gameStatus.gameStatus === GameState.Winner) {
      status = 'Winner: ' + gameStatus.winningPlayer;
    } else if (gameStatus.gameStatus === GameState.Draw) {
      status = 'Draw';
    } else {
      status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
    }

    return (
      <div className="game">
        <div className="game-board">
          <Board 
            squares={currentMove.squares}
            onClick={(i) => this.handleClick(i)}
            highlightedSquares={gameStatus?.winningSquares}
          />
        </div>
        <div className="flex-row-break"></div>
        <div className="game-info">
          <div className="game-status">{status}</div>
          <div className="move-history">
            <div className="move-history-header">
              Move History
              <button onClick={() => this.reverseSortMoveHistory()}>Sort {this.state.areMovesSortedAscending ? '\u25B2' : '\u25BC'}</button>
            </div>
            <hr/>
            <ol>{moveHistory}</ol>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Iterate over the entire move history and build a list of previous moves that the user can click to
   * go back to.
   * @param {*} history 
   * @param {*} currentMove 
   */
  buildMoveHistory(history, currentMove) {
    var moves = history.map((step, move) => {
      var desc = 'Go to game start'; // Default if there was no move yet.
      var moveLocationDescription = '';

      // If there was a player action during the move, build a description which indicates what happened
      // on that turn.
      if (move) {
        const previous = history[move - 1];
        var changedSquareIndex;

        // Find which square index was changed from the prior move.
        for (let i = 0; i < step.squares.length; i++) {
          if (step.squares[i] !== previous.squares[i]) {
            changedSquareIndex = i;
            break;
          }
        }

        const col = (changedSquareIndex % 3) + 1;
        const row = (Math.floor(changedSquareIndex / 3)) + 1;

        desc = 'Go to move #' + move;
        moveLocationDescription = '(Col: ' + col + ', Row: ' + row + ')';
      }

      // Build the button that the user can click to go back to previous moves/board states.
      return (
        <li key={move}>
          <button
            className={currentMove === step ? 'current-move' : ''}
            onClick={() => this.jumpTo(move)}
          >
            {desc}
          </button>
          <span className="move-history-location">{moveLocationDescription}</span>
        </li>
      );
    });

    // This is where the heavy lifting for controlling the move history order happens. Every button we
    // built above will now be reversed in order if necessary.
    if (!this.state.areMovesSortedAscending) {
      moves = moves.reverse();
    }

    return moves;
  }

  /**
   * Determines the current state of the game. If there's a winner, this returns the winning player and the
   * list of Squares that resulted in the win. If all squares are filled but there's no winner, the state is
   * a draw.
   * @param {*} squares 
   */
  calculateGameStatus(squares) {
    const winningLines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];

    for (let i = 0; i < winningLines.length; i++) {
      const [a, b, c] = winningLines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return {
          gameStatus: GameState.Winner,
          winningPlayer: squares[a],
          winningSquares: winningLines[i]
        };
      }
    }

    for (let i = 0; i < squares.length; i++) {
      // If at least 1 square is empty, it's not a draw.
      if (squares[i] === null) {
        return {
          gameStatus: GameState.Playing
        };
      }
    }

    // All squares are taken, but there wasn't a winner.
    return {
      gameStatus: GameState.Draw
    };
  }
}

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);