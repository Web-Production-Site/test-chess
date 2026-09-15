/* ==========================================
   عقل أيانوكوجي - الآن باستخدام Stockfish الحقيقي
   المستوى: 20 (أقصى قوة) + كراهية للتعادل
   ========================================== */

// إنشاء Worker لـ Stockfish
const stockfishWorker = new Worker('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js');

// إعداد Stockfish
stockfishWorker.postMessage('uci');
stockfishWorker.postMessage('setoption name Skill Level value 20');
stockfishWorker.postMessage('setoption name Contempt value 50'); // يكره التعادل
stockfishWorker.postMessage('isready');

let stockfishReady = false;
let stockfishCallback = null;

// الاستماع لردود Stockfish
stockfishWorker.onmessage = function(event) {
    const message = event.data;
    
    if (message === 'readyok') {
        stockfishReady = true;
    }
    
    if (message.startsWith('bestmove')) {
        const bestMove = message.split(' ')[1];
        if (stockfishCallback && bestMove && bestMove !== '(none)') {
            const from = bestMove.substring(0, 2);
            const to = bestMove.substring(2, 4);
            const promotion = bestMove.length > 4 ? bestMove.substring(4, 5) : undefined;
            
            stockfishCallback({
                from: from,
                to: to,
                promotion: promotion
            });
            stockfishCallback = null;
        }
    }
};

// الدالة الرئيسية التي يستدعيها init.js
function getBestMove(game, callback) {
    if (!stockfishReady) {
        // إذا لم يكن Stockfish جاهزاً، انتظر قليلاً
        setTimeout(() => getBestMove(game, callback), 100);
        return;
    }
    
    // إرسال وضعية اللعبة الحالية
    stockfishWorker.postMessage('position fen ' + game.fen());
    
    // طلب أفضل حركة (عمق 15 - قوي وسريع)
    stockfishWorker.postMessage('go depth 15');
    
    // حفظ الـ callback لاستخدامه عند وصول الرد
    stockfishCallback = callback;
}
