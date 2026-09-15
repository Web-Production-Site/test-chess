/* ==========================================
   عقل أيانوكوجي - Stockfish AI (مستوى 20)
   ========================================== */

let stockfish = null;
let isStockfishReady = false;

try {
    // تحميل Stockfish من CDN موثوق
    stockfish = new Worker('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js');
    
    stockfish.onmessage = function(event) {
        if (event.data === 'readyok') {
            isStockfishReady = true;
            console.log('✅ Stockfish جاهز!');
        }
    };
    
    stockfish.onerror = function(err) {
        console.error('❌ فشل تحميل Stockfish:', err);
    };
    
    // إعداد المحرك: أقصى قوة + يكره التعادل
    stockfish.postMessage('uci');
    stockfish.postMessage('setoption name Skill Level value 20');
    stockfish.postMessage('setoption name Contempt value 50');
    stockfish.postMessage('isready');
} catch (e) {
    console.error('❌ خطأ في إنشاء Worker:', e);
}

// الدالة الرئيسية (محدثة لتدعم الـ Callback لأن Stockfish غير متزامن)
function getBestMove(game, timeLimit, callback) {
    // إذا فشل التحميل، نستخدم محرك احتياطي حتى لا تتعطل اللعبة
    if (!stockfish || !isStockfishReady) {
        console.warn('⚠️ Stockfish غير جاهز، استخدام المحرك الاحتياطي');
        setTimeout(() => callback(getFallbackMove(game)), 300);
        return;
    }
    
    stockfish.postMessage('position fen ' + game.fen());
    stockfish.postMessage('go depth 15'); // عمق 15 سريع وقوي جداً
    
    let responded = false;
    const timeout = setTimeout(() => {
        if (!responded) {
            console.warn('⚠️ Stockfish تأخر، استخدام المحرك الاحتياطي');
            responded = true;
            callback(getFallbackMove(game));
        }
    }, timeLimit || 4000);
    
    const onMessage = (event) => {
        if (responded) return;
        if (event.data.startsWith('bestmove')) {
            responded = true;
            clearTimeout(timeout);
            stockfish.removeEventListener('message', onMessage);
            
            const moveStr = event.data.split(' ')[1];
            if (moveStr && moveStr !== '(none)') {
                callback({
                    from: moveStr.substring(0, 2),
                    to: moveStr.substring(2, 4),
                    promotion: moveStr.length > 4 ? moveStr.substring(4, 5) : 'q'
                });
            } else {
                callback(getFallbackMove(game));
            }
        }
    };
    
    stockfish.addEventListener('message', onMessage);
}

// ==========================================
// المحرك الاحتياطي (بسيط وسريع لضمان عدم التجمد)
// ==========================================
const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

function getFallbackMove(game) {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;
    if (moves.length === 1) return moves[0];
    
    // تفضيل الحركات التي تأكل قطع الخصم
    const captures = moves.filter(m => m.captured);
    if (captures.length > 0) {
        captures.sort((a, b) => PIECE_VALUES[b.captured] - PIECE_VALUES[a.captured]);
        return captures[0];
    }
    
    return moves[Math.floor(Math.random() * moves.length)];
}
