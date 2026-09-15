// ==========================================
// ملف منطق اللعبة والذكاء الاصطناعي
// ==========================================

var game = new Chess();
var selectedSquare = null;
var ayanokojiFirstMoveMade = false; // لتتبع أول حركة لأيانوكوجي

var board = Chessboard('board-container', {
    draggable: true,
    position: 'start',
    pieceTheme: 'img/chesspieces/wikipedia/{piece}.png',
    
    onDragStart: function(source, piece) {
        if (game.game_over()) return false;
        if (playerColor === 'w' && piece.search(/^b/) !== -1) return false;
        if (playerColor === 'b' && piece.search(/^w/) !== -1) return false;
        
        removeMoveIndicators();
        selectedSquare = null;
        return true;
    },
    
    onDrop: function(source, target) {
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });
        
        if (move === null) return 'snapback';
        
        if (typeof playMoveSound === 'function') playMoveSound();
        
        removeMoveIndicators();
        selectedSquare = null;
        
        if (!game.game_over()) {
            setTimeout(makeAyanokojiMove, 300);
        } else {
            updateCheckStatus();
        }
    },
    
    onSnapEnd: function() {
        board.position(game.fen());
    }
});

// ====== النقر على المربعات ======
$(document).on('click', '.square-55d63', function(e) {
    if (board.dragging && board.dragging()) return;
    
    var square = $(this).data('square');
    if (!square) return;
    
    var piece = game.get(square);
    
    if (selectedSquare && $(this).is('.move-normal, .move-capture, .move-castle')) {
        var move = game.move({
            from: selectedSquare,
            to: square,
            promotion: 'q'
        });
        
        if (move !== null) {
            if (typeof playMoveSound === 'function') playMoveSound();
            
            board.position(game.fen());
            removeMoveIndicators();
            selectedSquare = null;
            
            if (!game.game_over()) {
                setTimeout(makeAyanokojiMove, 300);
            } else {
                updateCheckStatus();
            }
            return;
        }
    }
    
    if (piece && piece.color === playerColor) {
        if (selectedSquare === square) {
            selectedSquare = null;
            removeMoveIndicators();
        } else {
            selectedSquare = square;
            showPossibleMoves(square);
        }
        return;
    }
    
    selectedSquare = null;
    removeMoveIndicators();
});

function showPossibleMoves(square) {
    removeMoveIndicators();
    var moves = game.moves({ square: square, verbose: true });
    if (moves.length === 0) return;
    
    for (var i = 0; i < moves.length; i++) {
        var move = moves[i];
        var $targetSquare = $('.square-' + move.to);
        
        if (move.flags.indexOf('k') !== -1 || move.flags.indexOf('q') !== -1) {
            $targetSquare.addClass('move-castle');
        } else if (move.flags.indexOf('c') !== -1 || move.flags.indexOf('e') !== -1) {
            $targetSquare.addClass('move-capture');
        } else {
            $targetSquare.addClass('move-normal');
        }
    }
}

function removeMoveIndicators() {
    $('.square-55d63').removeClass('move-normal move-capture move-castle in-check in-checkmate');
}

// ====== دور أيانوكوجي ======
function makeAyanokojiMove() {
    $('#ayanokoji-thinking').addClass('active');
    $('.ayanokoji-profile').addClass('thinking');
    
    setTimeout(function() {
        var bestMove = getBestMove(game, 4000);
        
        if (bestMove) {
            game.move(bestMove);
            board.position(game.fen());
            
            if (typeof playMoveSound === 'function') playMoveSound();
            
            // ✅ تشغيل صوت أيانوكوجي عند أول حركة يقوم بها هو
            if (!ayanokojiFirstMoveMade) {
                ayanokojiFirstMoveMade = true;
                setTimeout(function() {
                    if (typeof playAyanokojiVoice === 'function') playAyanokojiVoice();
                }, 300);
            }
            
            updateCheckStatus();
        }
        
        $('#ayanokoji-thinking').removeClass('active');
        $('.ayanokoji-profile').removeClass('thinking');
    }, 100);
}

// ====== التحقق من حالة اللعبة ======
function updateCheckStatus() {
    removeMoveIndicators();
    
    if (game.in_checkmate()) {
        var kingSquare = getKingSquare(game.turn());
        if (kingSquare) $('.square-' + kingSquare).addClass('in-checkmate');
        
        var result = (game.turn() === playerColor) ? 'loss' : 'win';
        
        setTimeout(function() {
            showEndScreen(result);
        }, 500);
        
    } else if (game.in_check()) {
        var kingSquare = getKingSquare(game.turn());
        if (kingSquare) $('.square-' + kingSquare).addClass('in-check');
        
    } else if (game.in_draw()) {
        setTimeout(function() {
            showEndScreen('draw');
        }, 500);
    }
}

function getKingSquare(color) {
    var boardPosition = game.board();
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            var piece = boardPosition[i][j];
            if (piece && piece.type === 'k' && piece.color === color) {
                return String.fromCharCode(97 + j) + (8 - i);
            }
        }
    }
    return null;
}

// ====== إعادة تعيين لأول حركة ======
function resetAyanokojiFirstMove() {
    ayanokojiFirstMoveMade = false;
}

$(window).resize(function() {
    board.resize();
});

window.resetAyanokojiFirstMove = resetAyanokojiFirstMove;
