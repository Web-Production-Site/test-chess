/* ==========================================
   عقل أيانوكوجي - Stockfish AI المحلي (مُحسّن لمنع التعليق)
   ========================================== */

let stockfish = null;
let isStockfishReady = false;

try {
    stockfish = new Worker('stockfish.js');
    
    stockfish.onmessage = function(event) {
        const msg = event.data;
        
        // إزالة التعليق عن السطر التالي مؤقتاً إذا أردت رؤية كل ما يقوله المحرك
        // console.log('SF:', msg);
        
        if (msg === 'readyok') {
            isStockfishReady = true;
            console.log('✅ Stockfish المحلي جاهز ويعمل بكفاءة!');
        }
    };
    
    stockfish.onerror = function(err) {
        console.error('❌ فشل في تحميل Stockfish:', err);
    };
    
    // إعداد المحرك
    stockfish.postMessage('uci');
    stockfish.postMessage('setoption name Skill Level value 20');
    stockfish.postMessage('setoption name Contempt value 100'); // يكره التعادل بشدة
    stockfish.postMessage('isready');
    
} catch (e) {
    console.error('❌ خطأ في إنشاء Worker:', e);
}

// الدالة الرئيسية
function getBestMove(game, timeLimit, callback) {
    if (!stockfish || !isStockfishReady) {
        console.warn('⚠️ Stockfish غير جاهز، استخدام المحرك الذكي الاحتياطي');
        setTimeout(() => callback(getSmartFallbackMove(game)), 300);
        return;
    }
    
    console.log('🧠 Stockfish يفكر (مدة 1.5 ثانية)...');
    stockfish.postMessage('position fen ' + game.fen());
    
    // ✅ الحل السحري: استخدام movetime بدلاً من depth لمنع التعليق
    stockfish.postMessage('go movetime 1500'); 
    
    let responded = false;
    const timeout = setTimeout(() => {
        if (!responded) {
            console.error('❌ مهلة Stockfish انتهت دون استجابة!');
            responded = true;
            callback(getSmartFallbackMove(game));
        }
    }, 3000); // مهلة قصوى 3 ثواني
    
    const onMessage = (event) => {
        if (responded) return;
        const msg = event.data;
        
        if (msg.startsWith('bestmove')) {
            responded = true;
            clearTimeout(timeout);
            stockfish.removeEventListener('message', onMessage);
            
            const moveStr = msg.split(' ')[1];
            console.log('✅ Stockfish اختار الحركة:', moveStr);
            
            if (moveStr && moveStr !== '(none)') {
                callback({
                    from: moveStr.substring(0, 2),
                    to: moveStr.substring(2, 4),
                    promotion: moveStr.length > 4 ? moveStr.substring(4, 5) : 'q'
                });
            } else {
                callback(getSmartFallbackMove(game));
            }
        }
    };
    
    stockfish.addEventListener('message', onMessage);
}

// ==========================================
// المحرك الاحتياطي "الذكي" (Minimax عمق 3)
// يضمن أن الخصم ليس غبياً حتى لو فشل Stockfish
// ==========================================
const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

function evaluateFallback(game) {
    if (game.in_checkmate()) return game.turn() === 'w' ? -99999 : 99999;
    if (game.in_draw()) return 0;
    let score = 0;
    const board = game.board();
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const p = board[i][j];
            if (p) {
                score += p.color === 'w' ? PIECE_VALUES[p.type] : -PIECE_VALUES[p.type];
            }
        }
    }
    return score;
}

function minimaxFallback(game, depth, alpha, beta, isMaximizing) {
    if (depth === 0 || game.game_over()) return evaluateFallback(game);
    
    const moves = game.moves({ verbose: true });
    // تفضيل الأكل أولاً
    moves.sort((a, b) => (b.captured ? PIECE_VALUES[b.captured] : 0) - (a.captured ? PIECE_VALUES[a.captured] : 0));
    
    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            game.move(move);
            const eval = minimaxFallback(game, depth - 1, alpha, beta, false);
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
            const eval = minimaxFallback(game, depth - 1, alpha, beta, true);
            game.undo();
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function getSmartFallbackMove(game) {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;
    if (moves.length === 1) return moves[0];
    
    const isMax = game.turn() === 'w';
    let bestMove = null;
    let bestScore = isMax ? -Infinity : Infinity;
    
    for (const move of moves) {
        game.move(move);
        // عمق 3 كافي لجعله يلعب بشكل منطقي وليس عشوائياً
        const score = minimaxFallback(game, 3, -Infinity, Infinity, !isMax);
        game.undo();
        
        if (isMax ? score > bestScore : score < bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    return bestMove || moves[0];
}
