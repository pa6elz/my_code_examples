<?php

define('STATE_START'			, 1);
define('STATE_GAME'				, 2);
define('STATE_END'				, 3);

define('RESULT_WIN'				, 1);
define('RESULT_DEF'				, 2);
define('RESULT_DRAW'			, 3);

$game = new Game($_POST);
$game->render();

class Game
{
	
	var $state;
	var $playerName;
	var $playerFigure; 	//'X' - игрок играет крестиками, '0' - ноликами
	var $positions;		// Массив значений клеток, передаются строкой вида ---0X--X0
	var $result; 		// RESULT_WIN, RESULT_DEF, RESULT_DRAW
	var $selectedCells; // Выделенные ячейки отображаются красным
	
	function Game($request){
		
		//Заполняем поля объекта данными запроса
		$this->playerName 		= isset($request['name']) 		? $request['name'] 	: null;
		$this->playerFigure 	= isset($request['figure']) 	? $request['figure'] : null;
		$this->positions		= isset($request['pos']) 		? str_split($request['pos']) : null;
		
		if($this->positions){
			//Если запросом переданы позиции, то состояние STATE_GAME и делаем ход
			$this->state = STATE_GAME;
			$this->makeMove();
		}else if($this->playerName !== null){
			//Если передано имя, то устанавливаем начальную позицию
			$this->state = STATE_GAME;
			$this->positions = array_fill(0, 9, '-');
			
			//Если пользователь играет ноликами, то делаем ход
			if($this->playerFigure === '0') $this->makeMove();
		}else {
			//В противном случае устанавливаем начальную позицию
			$this->state = STATE_START;
		}
	}
	
	function makeMove(){
		
		//Если фигура, которой играет пользователь не передана, то рассчитываем
		// ее исходя из состояния доски
		if($this->playerFigure === null) $this->setPlayerFigure();	
		
		//Устанавливаем в переменные фигуры игрока и компьютера
		$playerFigure = $this->playerFigure;
		$AIfigure = $playerFigure === 'X' ? '0' : 'X';
		
		//Проверим не заполнил ли игрок ряд
		$completed = $this->checkLineComplete($playerFigure);
		
		if($completed){
			//Если заполнил, устанавливаем результат
			$this->result = RESULT_WIN;
		}else{
			//Запускаем алгоритм расчета хода
			$selectedCell = $this->calculateNextMove($AIfigure, $playerFigure);
			
			//Если алгоритм вернул ячейку, то устанавливаем в нее фигуру компьютера
			if($selectedCell !== null){
				$this->positions[$selectedCell] = $AIfigure;
				$this->selectedCells = [$selectedCell];	
				
				//Проверяем не заполнил ли компьютер ряд,
				//Если заполнил устанавливаем результат
				if($completed = $this->checkLineComplete($AIfigure)){
					$this->result = RESULT_DEF;	
				} 
			}		
		}
		
		//Проверяем остались ли свободные ячейки, 
		// если нет, то устанавливаем результат НИЧЬЯ
		if(array_search('-', $this->positions) === FALSE){
			$this->result = RESULT_DRAW;	
		}
		
		//Если результат известен, то устанавливаем состояние STATE END
		if($this->result){
			
			$this->state = STATE_END;
			
			if($completed){
				$this->selectedCells = $completed;	
			}
		}
		
	}
	
	//Автоматически по состоянию позиций фигур вычисляет фигуру игрока
	//В начале игры функция не вызывается, так как фигура передается параметром выбранным пользователем
	function setPlayerFigure(){
		
		//Фигура устанавливается в зависимости от четности незаполненных ячеек
		if(count( array_keys($this->positions, '-') ) % 2){
			$this->playerFigure = '0';	
		} else {
			$this->playerFigure = 'X';
		}
					
	}
	
	//Расчет хода компьютера, возвращает номер ячейки или null 
	// если свободных ячеек не осталось
	function calculateNextMove($AIFigure, $playerFigure){
		
		$positions = $this->positions;
		
		//Если центральная ячейка свободна - занимаем ее
		if($positions[4] === '-') return 4;
		
		//Проверяем можем ли мы завершить ряд, если можем то конечно завершаем
		$almostDone = $this->findLine($positions, $AIFigure, 2);	
		if($almostDone !== null){
			return $almostDone['value'];
		}
		
		//Проверяем может ли игрок завершить ряд, если может то мешаем ему
		$almostDonePlayer = $this->findLine($positions, $playerFigure, 2);	
		if($almostDonePlayer){
			return $almostDonePlayer['value'];
		}
		
		//Проверяем есть ли ячейки где мы можем поставить вторую фигуру	
		$hasOne = $this->findLine($positions, $AIFigure, 1);
		if($hasOne){
			return $hasOne['value'];
		} 
		
		//Проверяем есть ли ячейки где игрок может поставить вторую фигуру
		$hasOnePlayer 	= $this->findLine($positions, $playerFigure, 1);
		if($hasOnePlayer && $hasOnePlayer['count'] > 1) {
			return $hasOnePlayer['value'];
		} 
		
		//Ищем пустой ряд и ставим в него фигуру
		$hasZero 		= $this->findLine($positions, $AIFigure, 0);
		if($hasZero){
			return $hasZero['value'];
		}
		
		//Если все предыдущие алгоритмы не сработали, заполняем первую попавшуюся
		//ячейку либо возвращаем null, если все ячейки заняты
		$anyEmpty = array_search('-', $positions);
		if($anyEmpty === false) return null;
		else return $anyEmpty;
			
	}
	
	//Проверка есть ли заполненный переданной фигурой ряд
	function checkLineComplete($figure){
		
		$retVal = $this->findLine($this->positions, $figure, 3);
		return $retVal;
	}
	
	//В функцию передается фигура и количество, которое должно присутствовать в ряде
	// с этой фигурой и без фигуры соперника
	// Функция возвращает ряд, если $requiredCount равен 3
	// в прочих случаях возвращается ассоциативный массив
	// ['value' => ..., 'count' => ...], где value - номер пустой ячейки из удовлетворяющего условию ряда
	// а count - кол-во покрываемых ею рядов, count необходим для отслеживания 'вилок'
	function findLine($positions, $figure, $requiredCount){
		
		//Получаем все возможные ряды
		$lines = $this->getLines();
		
		//Инициализируем массив незанятых ячеек, из которых в конце выберем наиболее подходящую
		$emptyCells = Array();
		
		//Перебираем все возможные ряды
		foreach($lines as $line){
			
			//Массив пустых ячеек ряда
			$empties = [];
			
			//Считаем пустые ячейки, либо обнуляем массив $empties 
			//если в ряде присутствует ячейка соперника
			
			foreach($line as $index){
				
				if($positions[$index] !== $figure) {
					if($positions[$index] === '-'){
						$empties[] = $index; 
					} else {
						$empties = null;
						break; 	
					}	
				} 
			}
			
			//Проверяем содержит ли ряд требуемое кол-во запрашиваемой фигуры
			if($empties === null || 3 - count($empties) !== $requiredCount) continue;
			
			//Для завершенного ряда просто возвращаем его, поскольку делать ход больше не требуется
			if($requiredCount === 3) return $line;
			
			//Добавляем свободные ячейки ряда в общий массив свободных ячеек,
			//Номер ячейки - ключ массива, значением массива является счетчик
			//Чем больше рядов затронуто ячейкой, тем более она ценна, так как можно
			//можно сделать вилку
			foreach($empties as $cell){
				if(isset($emptyCells[$cell])){
					$emptyCells[$cell] ++;
				} else {
					$emptyCells[$cell] = 1;	
				}
			}
		}
		
		//Если нет свободных ячеек в рядах удовлетворяющих условию - возвращаем null
		if(!count($emptyCells))	return null;
		
		//Сортируем массив свободных ячеек по убыванию количества рядов
		arsort($emptyCells);
		
		//Возвращаем первую удовлетворяющую условию ячейку
		foreach($emptyCells as $cell => $count){ 
			if($count > 1 || !($cell % 2)){
				return Array('value' => $cell, 'count' => $count);	
			}	
		}
		
		foreach($emptyCells as $cell => $count){ 
			return Array('value' => $cell, 'count' => $count);		
		}
	}
	
	//Возвращает массив рядов
	function getLines(){
		
		$lines = Array(
			[0, 1, 2],
			[3, 4, 5],
			[6, 7, 8],
			[0, 3, 6],
			[1, 4, 7],
			[2, 5, 8],
			[0, 4, 8],
			[2, 4, 6]
		);
		
		return $lines;
	}
	
	//Рендерит ответ браузеру по состоянию объекта класса Game
	function render(){ ?>
	
	<html>
		<body>
			<div id = title><h2>Игра в крестики-нолики</h2></div>
			<div id = main>
				<form id = gameForm method= post action= testXO.php>
		
			<?php if($this->state === STATE_START){ ?>
					
					<div><label>Ваше имя: </label><input name = name value = Дмитрий /></div>
					<div>Играете 
						<input type ="radio" name = figure value="X" checked = true>крестиками</input>
						<input type ="radio" name = figure value="0">ноликами</input>
					</div>
					<div>
						<input type="submit" value="Начать игру"/>
					</div>
					
			<?php } elseif ($this->state === STATE_GAME) {?>
			
					<p id = turn>Ваш ход, <?= $this->playerName ?> </p>
					<input type ="hidden" name = name value = '<?= $this->playerName ?>' />
					<input type ="hidden" name = figure value = '<?= $this->playerFigure ?>' id = figure />
					<input type ="hidden" name = pos id = positions />
					
			<?php } elseif ($this->state === STATE_END) {
				
				switch($this->result){
					
					case RESULT_DRAW:
					
						$endGameAlert = 'Похоже, @name, у нас боевая ничья!!!';
						break;
					
					case RESULT_WIN: 
						
						$endGameAlert = 'Что ж, @name, вы сильнее искусственного интеллекта! Победа за вами... ';
						break;
						
					case RESULT_DEF:
					
						$endGameAlert = 'Эх, @name, кажется вы продули куску железа... ';
						break;	
				} 
				
					
				$endGameAlert = str_replace('@name', $this->playerName, $endGameAlert); ?>
			
					<p> <?= $endGameAlert ?> </p>
					
					<div>
						<input type="submit" value="Сыграть снова"/>
						<input type ="radio" name = figure value="X" checked = true>крестиками</input>
						<input type ="radio" name = figure value="0">ноликами</input>
					</div>
					<input type ="hidden" name = name value = '<?= $this->playerName ?>' />
					
			<?php }; 
			
				if ($this->state > STATE_START) { ?>
					
					<div>
						<div id = board>
							<?php for($row = 0; $row < 3; $row ++) {?>
							<div class = line>
								<?php for($col = 0; $col < 3; $col ++) {
									
									$index = $row * 3 + $col; 
									$figure = $this->positions[$index]; 
									$figureView = $figure === '-' ? '' : $figure; 
									$elemClass = 'cell'; 
									
									if($this->selectedCells && array_search($index, $this->selectedCells) !== FALSE){
										$elemClass.= ' selected';
									} 
								?>
										
									<div class = '<?= $elemClass ?>' onclick = clickEvent(this)>
										<?= $figureView ?>
									</div>
								<?php }; ?>
							</div>
							<?php }; ?>
						</div>
					</div>
					
				<?php }; ?>
		
				</form>
			</div>
		</body>
	</html>
		
	<?php }
	
}

?>

<style>
	html, body{
		width: 100%;
		height: 100%;
		font-family: Verdana;
	}
	#title{
		width: 100%;
		text-align: center;
		background-color:#60352b;
		color: white;		
	}
	
	form{
		margin: 0px 30px 0px 30px;
	}
	
	form>div{
		padding: 5px;
	}
	
	#board{
		display: table;
	}
	#board .line{
		display: table-row;
	}
	#board .line .cell{
		display: table-cell;
		border: 1px solid black;
		font: 30px;
		width: 40px;
		height: 40px;
		text-align: center;
		vertical-align: middle;
		cursor: arrow;
	}
	#board .line .cell:hover{
		background-color:#daddc4;	
	}
	#board .line .cell.selected{
		color: red;	
	}
	
</style>

<script>
	function clickEvent(cell){
		
		if(board.hasAttribute('data-lockClick') || cell.textContent.trim()) return;
		
		var currentSelection = document.querySelector('.cell.selected');
		if(currentSelection) currentSelection.classList.remove('selected');
		
		cell.textContent = figure.value;
		cell.classList.add('selected');
		
		turn.textContent = 'Так, моя очередь...';
		
		board.setAttribute('data-lockClick', 'lock');
		
		var positionsLine = '';
		var cells = document.querySelectorAll('.cell');
		
		for(var i = 0; i < cells.length; i++){
			cellFigure = cells[i].textContent.trim();
			positionsLine += cellFigure ? cellFigure : '-';
		}
		
		positions.value = positionsLine;
		
		setTimeout(function(){gameForm.submit();}, 1000);
		
	}
</script>