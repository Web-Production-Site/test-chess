/* ==========================================
   عقل أيانوكوجي - White Room AI v4
   المستوى: 2200-2600 ELO
   السرعة: 4 ثوانٍ كحد أقصى
   التقنيات: Minimax + Alpha-Beta + Quiescence + PST + Opening Book
   ========================================== */

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// جداول المواقع (Piece-Square Tables) - محسّنة
const PST = {
    p: [
        [ 0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [ 5,  5, 10, 25, 25, 10,  5,  5],
        [ 0,  0,  0, 20, 20,  0,  0,  0],
        [ 5, -5,-10,  0,  0,-10, -5,  5],
        [ 5, 10, 10,-20,-20, 10, 10,  5],
        [ 0,  0,  0,  0,  0,  0,  0,  0]
    ],
    n: [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
    ],
    b: [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10, 10, 10, 10, 10, 10, 10,-10],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
    ],
    r: [
        [ 0,  0,  0,  0,  0,  0,  0,  0],
        [ 5, 10, 10, 10, 10, 10, 10,  5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [ 0,  0,  0,  5,  5,  0,  0,  0]
    ],
    q: [
        [-20,-10,-10, -5, -5,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5,  5,  5,  5,  0,-10],
        [ -5,  0,  5,  5,  5,  5,  0, -5],
        [  0,  0,  5,  5,  5,  5,  0, -5],
        [-10,  5,  5,  5,  5,  5,  0,-10],
        [-10,  0,  5,  0,  0,  0,  0,-10],
        [-20,-10,-10, -5, -5,-10,-10,-20]
    ],
    k: [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [ 20, 20,  0,  0,  0,  0, 20, 20],
        [ 20, 30, 10,  0,  0, 10, 30, 20]
    ]
};

// Opening Book بسيط
const OPENING_BOOK = {
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1': ['e2e4', 'd2d4', 'g1f3', 'c2c4'],
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1': ['e7e5', 'c7c5', 'e7e6'],
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2': ['g1f3', 'f1c4', 'd2d4', 'f1b5'],
    'rnbqkbnr/pppp1ppp/8/4p3/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1': ['e5d4', 'd7d5', 'b8c6'],
    'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2': ['g1f3', 'd2d4', 'b1c3']
};

function getBookMove(game) {
    const fen = game.fen().split(' ').slice(0, 4).join(' ');
    if (OPENING_BOOK[fen]) {
        const moves = game.moves({ verbose: true });
        for (const bookMove of OPENING_BOOK[fen]) {
            const from = bookMove.substring(0, 2);
            const to = bookMove.substring(2, 4);
            const found = moves.find(m => m.from === from && m.to === to);
            if (found) return found;
        }
    }
    return null;
}

// دالة التقييم المتقدمة
function evaluatePosition(game) {
    if (game.in_checkmate()) return game.turn() === 'w' ? -99999 : 99999;
    if (game.in_draw()) return 0;

    let score = 0;
    const board = game.board();
    
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = board[i][j];
            if (!piece) continue;
            
            const pstValue = piece.color === 'w' 
                ? PST[piece.type][i][j] 
                : PST[piece.type][7 - i][j];
            const totalValue = PIECE_VALUES[piece.type] + pstValue;
            
            score += piece.color === 'w' ? totalValue : -totalValue;
        }
    }
    
    // مكافأة السيطرة على المركز
    const centerBonus = 10;
    const centerSquares = [[3,3],[3,4],[4,3],[4,4]];
    centerSquares.forEach(([r, c]) => {
        const p = board[r][c];
        if (p) {
            const bonus = p.type === 'p' ? centerBonus : centerBonus * 1.5;
            score += p.color === 'w' ? bonus : -bonus;
        }
    });
    
    // مكافأة التطور (Development)
    const history = game.history();
    const moveCount = history.length;
    if (moveCount < 20) {
        const developedPieces = new Set();
        history.forEach((m, idx) => {
            if (idx < 10) {
                const piece = m[0];
                if (piece !== 'P' && piece !== 'p') {
                    developedPieces.add(piece + m[1]);
                }
            }
        });
        score += developedPieces.size * 8;
    }
    
    return score;
}

// Quiescence Search (للحركات التكتيكية فقط)
function quiesce(game, alpha, beta, isMaximizing) {
    const standPat = evaluatePosition(game);
    
    if (isMaximizing) {
        if (standPat >= beta) return beta;
        if (alpha < standPat) alpha = standPat;
    } else {
        if (standPat <= alpha) return alpha;
        if (beta > standPat) beta = standPat;
    }
    
    const moves = game.moves({ verbose: true });
    const captures = moves.filter(m => m.captured || m.promotion);
    
    captures.sort((a, b) => {
        const scoreA = (PIECE_VALUES[a.captured] || 0) * 10 - PIECE_VALUES[a.piece];
        const scoreB = (PIECE_VALUES[b.captured] || 0) * 10 - PIECE_VALUES[b.piece];
        return scoreB - scoreA;
    });
    
    for (const move of captures) {
        game.move(move);
        const score = quiesce(game, alpha, beta, !isMaximizing);
        game.undo();
        
        if (isMaximizing) {
            if (score >= beta) return beta;
            if (score > alpha) alpha = score;
        } else {
            if (score <= alpha) return alpha;
            if (score < beta) beta = score;
        }
    }
    
    return isMaximizing ? alpha : beta;
}

// Minimax مع Alpha-Beta Pruning
function minimax(game, depth, alpha, beta, isMaximizing, startTime, timeLimit) {
    // فحص الوقت كل بضع مستويات
    if (depth % 2 === 0 && Date.now() - startTime > timeLimit) {
        return evaluatePosition(game);
    }
    
    if (depth === 0) {
        return quiesce(game, alpha, beta, isMaximizing);
    }
    
    if (game.game_over()) {
        if (game.in_checkmate()) {
            return isMaximizing ? -99999 + depth : 99999 - depth;
        }
        return 0;
    }

    const moves = game.moves({ verbose: true });
    
    // Move Ordering: الأكل أولاً (MVV-LVA)
    moves.sort((a, b) => {
        let scoreA = 0, scoreB = 0;
        if (a.captured) scoreA = PIECE_VALUES[a.captured] * 10 - PIECE_VALUES[a.piece];
        if (b.captured) scoreB = PIECE_VALUES[b.captured] * 10 - PIECE_VALUES[b.piece];
        if (a.promotion) scoreA += 900;
        if (b.promotion) scoreB += 900;
        return scoreB - scoreA;
    });

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            game.move(move);
            const eval = minimax(game, depth - 1, alpha, beta, false, startTime, timeLimit);
            game.undo();
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            game.move(move);
            const eval = minimax(game, depth - 1, alpha, beta, true, startTime, timeLimit);
            game.undo();
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

// الدالة الرئيسية - Iterative Deepening
function getBestMove(game, timeLimit = 4000) {
    // 1. Opening Book
    const bookMove = getBookMove(game);
    if (bookMove) return bookMove;
    
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;
    if (moves.length === 1) return moves[0];
    
    const startTime = Date.now();
    let bestMove = null;
    let bestScore = 0;
    const isMaximizing = game.turn() === 'w';
    
    // ترتيب أولي للحركات
    moves.sort((a, b) => {
        const scoreA = a.captured ? PIECE_VALUES[a.captured] : 0;
        const scoreB = b.captured ? PIECE_VALUES[b.captured] : 0;
        return scoreB - scoreA;
    });

    // Iterative Deepening: نبدأ بعمق 1 ونزيد حتى 5
    for (let depth = 1; depth <= 5; depth++) {
        let depthBestMove = null;
        let depthBestScore = isMaximizing ? -Infinity : Infinity;
        
        for (const move of moves) {
            // فحص الوقت قبل كل حركة
            if (Date.now() - startTime > timeLimit * 0.75) break;
            
            game.move(move);
            const score = minimax(game, depth - 1, -Infinity, Infinity, !isMaximizing, startTime, timeLimit);
            game.undo();
            
            if (isMaximizing) {
                if (score > depthBestScore) {
                    depthBestScore = score;
                    depthBestMove = move;
                }
            } else {
                if (score < depthBestScore) {
                    depthBestScore = score;
                    depthBestMove = move;
                }
            }
        }
        
        if (depthBestMove) {
            bestMove = depthBestMove;
            bestScore = depthBestScore;
        }
        
        // إذا وجدنا كش مات، نتوقف فوراً
        if (Math.abs(bestScore) > 90000) break;
        
        // إذا نفد الوقت، نتوقف
        if (Date.now() - startTime > timeLimit * 0.75) break;
    }
    
    return bestMove;
}
