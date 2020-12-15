import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

// Example usage: <Square value="1" />
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

// Example usage: <Board />
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

  // Handles when a square is clicked.
  handleClick(i) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();

    // Ignore the click if there's already a winner or the space is taken.
    if (calculateWinner(squares) || squares[i]) {
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

  // Jumps to a past move/board state.
  jumpTo(step) {
    this.setState({
      stepNumber: step,
      xIsNext: (step % 2) === 0
    });
  }

  // Reverses the order of the move order history.
  handleMoveSortClick() {
    this.setState({
      areMovesSortedAscending: !this.state.areMovesSortedAscending
    });
  }

  // Renders the Game.
  render() {
    const history = this.state.history.slice();
    const current = history[this.state.stepNumber];
    const winner = calculateWinner(current?.squares);

    // Iterate over the entire move history and build a list of previous moves that the user can click to
    // go back to.
    var moves = history.map((step, move) => {
      var desc = 'Go to game start';
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
            className={current === step ? 'current-move' : ''}
            onClick={() => this.jumpTo(move)}
          >
            {desc}
          </button>
          <span>{moveLocationDescription}</span>
        </li>
      );
    });

    // This is where the heavy lifting for controlling the move history order happens. Every button we
    // built above will now be reversed in order if necessary.
    if (!this.state.areMovesSortedAscending) {
      moves = moves.reverse();
    }

    let status

    if (winner) {
      status = 'Winner: ' + winner.player;
    } else if (calculateIsDraw(current.squares)) {
      status = 'Draw';
    } else {
      status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
    }

    return (
      <div className="game">
        <div className="game-board">
          <Board 
            squares={current.squares}
            onClick={(i) => this.handleClick(i)}
            highlightedSquares={winner?.winningSquares}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <ol>{moves}</ol>
          <div>
            <button onClick={() => this.handleMoveSortClick()}>Sort Moves {this.state.areMovesSortedAscending ? "Descending" : "Ascending"}</button>
          </div>
        </div>
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return {
        player: squares[a],
        winningSquares: lines[i]
      };
    }
  }

  return null;
}

function calculateIsDraw(squares) {
  for (let i = 0; i < squares.length; i++) {
    // If at least 1 square is empty, it's not a draw.
    if (squares[i] === null) {
      return false;
    }
  }

  // All squares are taken. This is either a victory or a draw (but there's a separate function for calculating victory).
  return true;
}