// ==========================================
// خوارزمية الغرفة البيضاء (White Room Algorithm)
// تعكس شخصية أيانوكوجي: حكمة، سيطرة، كره للتعادل، وعقاب قاسٍ
// ==========================================

// قيم القطع الأساسية
const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// جداول تموضع القطع (Piece-Square Tables)
// أيانوكوجي يفضل السيطرة على الوسط والقطع النشطة
const pawnEvalWhite = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
];
const pawnEvalBlack = pawnEvalWhite.slice().reverse();

const knightEval = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
];

const bishopEvalWhite = [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
];
const bishopEvalBlack = bishopEvalWhite.slice().reverse();

const rookEvalWhite = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
];
const rookEvalBlack = rookEvalWhite.slice().reverse();

const queenEval = [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
];

const kingEvalWhite = [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20]
];
const kingEvalBlack = kingEvalWhite.slice().reverse();

// ==========================================
// دالة التقييم (عقل أيانوكوجي)
// ==========================================
function evaluateBoard(game) {
    let totalEvaluation = 0;
    const board = game.board();
    
    // 1. التقييم المادي وتموضع القطع (الحكمة والسيطرة)
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = board[i][j];
            if (piece) {
                let value = pieceValues[piece.type];
                let positionValue = 0;
                
                // تطبيق جداول التموضع
                if (piece.type === 'p') positionValue = piece.color === 'w' ? pawnEvalWhite[i][j] : pawnEvalBlack[i][j];
                else if (piece.type === 'n') positionValue = knightEval[i][j];
                else if (piece.type === 'b') positionValue = piece.color === 'w' ? bishopEvalWhite[i][j] : bishopEvalBlack[i][j];
                else if (piece.type === 'r') positionValue = piece.color === 'w' ? rookEvalWhite[i][j] : rookEvalBlack[i][j];
                else if (piece.type === 'q') positionValue = queenEval[i][j];
                else if (piece.type === 'k') positionValue = piece.color === 'w' ? kingEvalWhite[i][j] : kingEvalBlack[i][j];
                
                totalEvaluation += (piece.color === 'w' ? 1 : -1) * (value + positionValue);
            }
        }
    }
    
    // 2. حرية الحركة (Mobility) - أيانوكوجي يتحكم في كل شيء
    const currentTurn = game.turn();
    game.toggleTurn(); // نحسب حركات الخصم
    const opponentMoves = game.moves().length;
    game.toggleTurn(); // نعود لدورنا
    const myMoves = game.moves().length;
    
    // كلما زادت حركاتي وقلت حركات خصمي، زادت سيطرتي
    totalEvaluation += (currentTurn === 'w' ? 1 : -1) * (myMoves - opponentMoves) * 5;

    // 3. كره التعادل (Contempt) - لن يقبل بالسلام أبداً
    // إذا كانت المواد متقاربة جداً، نفضل الوضع الذي يحتوي على بيادق أكثر (للفوز في النهاية)
    const materialBalance = Math.abs(totalEvaluation);
    if (materialBalance < 100) {
        // نضيف تحيزاً طفيفاً ضد التعادل
        totalEvaluation += (currentTurn === 'w' ? 1 : -1) * 15; 
    }

    return totalEvaluation;
}

// ==========================================
// خوارزمية Minimax مع Alpha-Beta Pruning
// ==========================================
function minimax(game, depth, alpha, beta, isMaximizingPlayer) {
    if (depth === 0 || game.game_over()) {
        return evaluateBoard(game);
    }

    const moves = game.moves({ verbose: true });
    
    // ترتيب الحركات: نفضل الأكلات أولاً (لتسريع البحث والعقاب السريع)
    moves.sort((a, b) => {
        let scoreA = a.captured ? pieceValues[a.captured] : 0;
        let scoreB = b.captured ? pieceValues[b.captured] : 0;
        return scoreB - scoreA;
    });

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of moves) {
            game.move(move);
            const evalScore = minimax(game, depth - 1, alpha, beta, false);
            game.undo();
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            game.move(move);
            const evalScore = minimax(game, depth - 1, alpha, beta, true);
            game.undo();
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

// ==========================================
// الحصول على أفضل حركة
// ==========================================
function getBestMove(game, timeLimit) {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;

    let bestMove = null;
    let bestValue = -Infinity;
    const isMaximizing = game.turn() === 'w'; // افترضنا أن أيانوكوجي يلعب بالأبيض للتقييم، لكن الكود يتكيف
    
    // أيانوكوجي يفكر بعمق 3 (توازن مثالي بين القوة والسرعة في المتصفح)
    const searchDepth = 3; 

    // ترتيب الحركات للبحث
    moves.sort((a, b) => {
        let scoreA = a.captured ? pieceValues[a.captured] : 0;
        let scoreB = b.captured ? pieceValues[b.captured] : 0;
        return scoreB - scoreA;
    });

    for (const move of moves) {
        game.move(move);
        // نبحث عن أقل قيمة للخصم (لأننا نلعب دور الخصم الآن في الشجرة)
        const boardValue = minimax(game, searchDepth - 1, -Infinity, Infinity, !isMaximizing);
        game.undo();

        // أيانوكوجي يختار الحركة التي تزيد من سيطرته (أو تقلل خسارة الخصم إذا كان يلعب بالأسود)
        // لتبسيط الكود، نعكس التقييم بناءً على لون أيانوكوجي
        const finalValue = game.turn() === 'w' ? boardValue : -boardValue;

        if (finalValue > bestValue) {
            bestValue = finalValue;
            bestMove = move;
        }
    }

    return bestMove || moves[Math.floor(Math.random() * moves.length)];
}
