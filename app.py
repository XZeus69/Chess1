from flask import Flask, render_template, jsonify, request
import chess
import chess.engine

app = Flask(__name__)
board = chess.Board()
engine = chess.engine.SimpleEngine.popen_uci("bin/stockfish")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/move", methods=["POST"])
def move():
    global board
    data = request.json
    try:
        move = chess.Move.from_uci(data["move"])
        difficulty = int(data.get("difficulty", 20))
        if move in board.legal_moves:
            board.push(move)
            engine.configure({"Skill Level": difficulty})
            result = engine.play(board, chess.engine.Limit(time=0.1))
            board.push(result.move)

            if board.is_checkmate():
                return jsonify({"status": "checkmate", "ai_move": result.move.uci()})
            elif board.is_stalemate() or board.is_insufficient_material():
                return jsonify({"status": "draw", "ai_move": result.move.uci()})

            return jsonify({"status": "ok", "ai_move": result.move.uci()})
        else:
            return jsonify({"status": "invalid"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route("/fen")
def fen():
    global board
    board.reset()
    return jsonify({"fen": board.fen()})

if __name__ == "__main__":
    app.run(debug=True)
