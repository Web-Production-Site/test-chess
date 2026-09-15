/* ==========================================
   عقل أيانوكوجي - Stockfish حقيقي
   المستوى: 20 + كراهية للتعادل
   ========================================== */

const stockfish = new Worker('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js');

stockfish.postMessage('uci');
stockfish.postMessage('setoption name Skill Level value 20');
stockfish.postMessage('setoption name Contempt value 50');
stockfish.postMessage('isready');

let isStockfishReady = false;

stockfish.onmessage = function(event) {
    if (event.data === 'readyok') {
        isStockfishReady = true;
    }
};

// الدالة ترجع Promise
function getBestMove(game, timeLimit) {
    return new Promise((resolve) => {
        if (!isStockfishReady) {
            setTimeout(() => {
                getBestMove(game, timeLimit).then(resolve);
            }, 100);
            return;
        }
        
        stockfish.postMessage('position fen ' + game.fen());
        stockfish.postMessage('go depth 15');
        
        const onMessage = (event) => {
            if (event.data.startsWith('bestmove')) {
                const bestMoveStr = event.data.split(' ')[1];
                stockfish.removeEventListener('message', onMessage);
                
                if (bestMoveStr && bestMoveStr !== '(none)') {
                    resolve({
                        from: bestMoveStr.substring(0, 2),
                        to: bestMoveStr.substring(2, 4),
                        promotion: bestMoveStr.length > 4 ? bestMoveStr.substring(4, 5) : 'q'
                    });
                } else {
                    resolve(null);
                }
            }
        };
        
        stockfish.addEventListener('message', onMessage);
    });
}
