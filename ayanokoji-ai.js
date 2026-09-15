/* ==========================================
   عقل أيانوكوجي - Stockfish AI المحلي (مستوى 20)
   تم إزالة المحرك الاحتياطي للكشف عن أي أخطاء
   ========================================== */

let stockfish = null;
let isStockfishReady = false;

try {
    // تحميل الملف محلياً من نفس المجلد
    stockfish = new Worker('stockfish.js');
    
    stockfish.onmessage = function(event) {
        const msg = event.data;
        if (msg === 'readyok') {
            isStockfishReady = true;
            console.log('✅ Stockfish المحلي جاهز ويعمل بكفاءة!');
        }
    };
    
    stockfish.onerror = function(err) {
        console.error('❌❌❌ فشل كارثي في تحميل Stockfish:', err);
        console.error('تأكد من أن ملف stockfish.js مرفوع في المجلد الرئيسي للمستودع.');
    };
    
    // إعداد المحرك: أقصى قوة + يكره التعادل
    stockfish.postMessage('uci');
    stockfish.postMessage('setoption name Skill Level value 20');
    stockfish.postMessage('setoption name Contempt value 100'); // كراهية شديدة للتعادل
    stockfish.postMessage('isready');
    
} catch (e) {
    console.error('❌❌❌ خطأ في إنشاء Worker لـ Stockfish:', e);
}

// الدالة الرئيسية (صارمة: لا يوجد محرك احتياطي)
function getBestMove(game, timeLimit, callback) {
    if (!stockfish) {
        console.error('❌ خطأ: كائن Stockfish غير موجود. لم يتم تحميل الملف.');
        return;
    }

    if (!isStockfishReady) {
        console.warn('⚠️ Stockfish لم يجهز بعد، جاري الانتظار...');
        setTimeout(() => getBestMove(game, timeLimit, callback), 500);
        return;
    }
    
    console.log('🧠 Stockfish يفكر في الوضعية:', game.fen());
    
    stockfish.postMessage('position fen ' + game.fen());
    stockfish.postMessage('go depth 15'); // عمق 15 (قوي جداً وسريع)
    
    let responded = false;
    const timeout = setTimeout(() => {
        if (!responded) {
            console.error('❌❌❌ مهلة Stockfish انتهت (Timeout) دون إرجاع حركة!');
            responded = true;
        }
    }, timeLimit || 5000);
    
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
                console.error('❌ Stockfish أرجع حركة فارغة (none)!');
            }
        }
    };
    
    stockfish.addEventListener('message', onMessage);
}
