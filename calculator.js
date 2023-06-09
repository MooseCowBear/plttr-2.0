/* functions relating to adding/ evaluating formulas */

function openCalculator() {
	const formulaModal = document.getElementById("formula-modal");
	formulaModal.style.display = "block";
}

function getEvaluationUtilities() {
	return {
		operators: ["+", "-", "/", "*", "^"], 
		functions: ["log10", "ln", "negate", "sq-root", "sin", "cos", "tan", "slope", "log2", "abs"],
		precedence: {
			"+": 1,
			"-": 1,
			"/": 2,
			"*": 2,
			"^": 3
		},
		association: {
			"+": "left",
			"-": "left",
			"/": "left",
			"*": "left",
			"^": "right"
		}
	};
}

function resetModal(formulaState) {
  /*
    function to clear out any changes made to the modal. 
    called whenever the modal closes. 
  */
	const nameLabel = document.getElementById("name-input__label"); 
	const nameForm = document.getElementById("name");

	nameLabel.innerText = "add a name: ";

  nameLabel.classList.remove("warning-on");
  nameForm.classList.remove("warning-on");

	nameForm.value = ""; //stays

  const warning = document.querySelector(".invalid-formula");
	warning.style.visibility = "hidden"; 

	formulaState.newFormula = ""; 
	formulaState.infix.length = 0; 
	formulaState.prevNum = false;
	formulaState.number = "";
	formulaState.ROC = 0;

	updateDisplay(formulaState);
	enableNonColButtons();
}

function updateDisplay(formulaState) {
	const display = document.querySelector(".calculator__screen");
	display.innerText = formulaState.newFormula; 
}

function disableNonColButtons() {
	document.querySelectorAll('calculator__button').forEach(elem => {
    elem.disabled = true;
	  elem.classList.remove("active"); 
  });
}

function enableNonColButtons(){
	document.querySelectorAll('calculator__button').forEach(elem => {
    elem.disabled = false;
	  elem.classList.add("active"); 
  });
}

function updateNumber(formulaState) {
	/* 
		called when a non-digit calculator is pushed. 
		need to wait until we know the number is finished before we add it to the 
		infix array
	*/
	if (formulaState.prevNum) { 
		formulaState.infix.push(formulaState.number);
		formulaState.prevNum = false;
		formulaState.number = ""; 
	}
}

function getColNameFromIndex(index) {
  const theTable = document.getElementById("table");
	return theTable.rows[0].cells[index].innerText; 
}
	
function cancelFormula(formulaState) {
	const formulaModal = document.getElementById("formula-modal");
	resetModal(formulaState);
	formulaModal.style.display = "none";
}

function addNonDigit(char, formulaState) {
	/* this includes e and pi, "(", ")", but not functions */
	const warning = document.querySelector(".invalid-formula");
	warning.style.visibility = "hidden"; 
	formulaState.newFormula += char;
	updateDisplay(formulaState);
	updateNumber(formulaState);
	if (char === "e") {
		formulaState.infix.push(Math.E)
	}
	else if(char == "\u03C0") {
		formulaState.infix.push(Math.PI);
	}
	else {
		formulaState.infix.push(char); 
	}
}

function addDigit(digit, formulaState) { 
	/* decimal counts as digit for our purposes */
	const warning = document.querySelector(".invalid-formula");
	warning.style.visibility = "hidden"; 
	formulaState.newFormula += digit;	
	updateDisplay(formulaState);
	formulaState.prevNum = true;
	formulaState.number += digit;
}

function addFunction(funcName, charRepresentation, formulaState, withParen = true) {
	/* every function except for negation adds left parenthesis */
	const warning = document.querySelector(".invalid-formula");
	warning.style.visibility = "hidden"; 
	formulaState.newFormula += charRepresentation; 
	formulaState.infix.push(funcName);
	if (withParen) {
		formulaState.newFormula += "(";
		formulaState.infix.push("(");
	}
	updateDisplay(formulaState);
	updateNumber(formulaState);
}
	
function addSlope(formulaState) {
	const warning = document.querySelector(".invalid-formula");
	warning.style.visibility = "hidden"; 
	formulaState.newFormula += "Rate of Change( , )";  
	updateDisplay(formulaState);
	updateNumber(formulaState);
	formulaState.infix.push("slope"); 
	formulaState.infix.push("(");
	formulaState.ROC = 1;

	disableNonColButtons();
}

function degreesToRadians(degrees) {
  	return degrees * (Math.PI / 180);
}

function deleteFromFormula(formulaState) {
	/*
		a convoluted function that removes the last element from the infix array,
		and the calculator display
	*/
	const util = getEvaluationUtilities();

	if(formulaState.number !== "") { //removing a digit
		formulaState.number = formulaState.number.slice(0, formulaState.number.length - 1); 
		formulaState.newFormula = formulaState.newFormula.slice(0, formulaState.newFormula.length - 1);
		updateDisplay(formulaState);
	}
	else { 
		if (formulaState.infix.length === 0) {
			return;
		}
		else if (typeof formulaState.infix[formulaState.infix.length -1] === "string" && formulaState.infix[formulaState.infix.length - 1].startsWith("col")) {
			const col = formulaState.infix.pop(); 
			let index = col.slice(3); 
			index = parseInt(index); 

			const colName = getColNameFromIndex(index);

			formulaState.newFormula = formulaState.newFormula.slice(0, formulaState.newFormula.length - colName.length); 
			updateDisplay(formulaState);
		}
		else if (formulaState.infix[formulaState.infix.length - 1] === "(") {
			if (util.functions.includes(formulaState.infix[formulaState.infix.length - 2])) {
				formulaState.infix.pop(); 
				const endingFcn = formulaState.infix.pop(); //2nd to last elem
				if (endingFcn == "sqRoot") {
					formulaState.newFormula = formulaState.newFormula.slice(0, formulaState.newFormula.length - 8); //bc "&#8730;(" has 8 chars
				}
				else {
					formulaState.newFormula = formulaState.newFormula.slice(0, formulaState.newFormula.length - (endingFcn.length + 1)); //+1 for the left parenthesis
				}
				updateDisplay(formulaState);
			}	
			else { //here is just open "("
				formulaState.infix.pop();
				formulaState.newFormula = formulaState.newFormula.slice(0, formulaState.newFormula.length - 1); 
				updateDisplay(formulaState);
			}
		}
		else if (formulaState.infix[formulaState.infix.length - 1] === ")") {
			if (formulaState.infix[formulaState.infix.length - 5] === "slope") {
				let curr; 
				let toSlice = 0; 

				while (curr !== "slope") {
					curr = formulaState.infix.pop(); //as soon as we've pooped slope we're done
					if (curr.startsWith("col")) { 
						let index = curr.slice(3); 
						index = parseInt(index); 

						const colName = getColNameFromIndex(index);
						toSlice += colName.length;
					}
					else if (curr == "slope") {
						toSlice += "rate of change".length + 1;
					}
					else {
						toSlice += curr.length;
					}
				}
			
				formulaState.newFormula = formulaState.newFormula.slice(0, formulaState.newFormula.length - toSlice); 
				enableNonColButtons(); 
				updateDisplay(formulaState);
			}
			else { //")" all by itself
				formulaState.infix.pop();
				formulaState.newFormula = formulaState.newFormula.slice(0, formulaState.newFormula.length - 1); 
				updateDisplay(formulaState);
			}
		}
		else if (formulaState.infix[formulaState.infix.length - 1] === Math.PI) {
			formulaState.infix.pop(); 
			formulaState.newFormula = formulaState.newFormula.slice(0, formulaState.newFormula.length - 4); //"&pi;" has 4 chars
			updateDisplay(formulaState);

			revertNumberInput(formulaState);
		}
		else { //either an operator or E 
			formulaState.infix.pop();
			formulaState.newFormula = formulaState.newFormula.slice(0, formulaState.newFormula.length - 1); 
			updateDisplay(formulaState);
		}
		revertNumberInput(formulaState);
	}
}

function revertNumberInput(formulaState) {
	if (/\d/.test(formulaState.infix[formulaState.infix.length - 1]) && !formulaState.infix[formulaState.infix.length - 1].startsWith("col")) {
		const num = formulaState.infix.pop();
		formulaState.number = num;
		formulaState.prevNum = true;
	}
}

function updateFormula(event, formulaState, formulaMap) { 
	if (event.target.classList.contains("digit")) {
		addDigit(event.target.innerText, formulaState);
		return;
	}
	else if (event.target.classList.contains("non-digit")) {
		addNonDigit(event.target.innerText, formulaState);
		return;
	}
	else if (event.target.classList.contains("func")) {
		if (event.target.id === "negate") {
			addFunction("negate", " -", formulaState, false);
		}
		else {
			addFunction(event.target.id, event.target.innerText, formulaState);
		}
		return;
	}
	else if (event.target.classList.contains("calculator__button-column")) {
		updateDisplay(formulaState); 
		updateNumber(formulaState);
		columnName = event.target.innerText; 
		addColumnToFormula(columnName, formulaState);
	}

	switch(event.target.id) {
		case "del":
			deleteFromFormula(formulaState);
			break;
		case "cancel":
			cancelFormula(formulaState);
			break;
		case "clear":
			resetModal(formulaState);
			break;
		case "slope":
			addSlope(formulaState)
			break;
		case "submit": 
			submitFormula(formulaState, formulaMap); 
	}
}

function addColumnToFormula(columnName, formulaState) { 
	const theTable = document.getElementById("table");
	const row = theTable.rows[0]; 
	
	for (let i = 1, col; col = row.cells[i]; i++) {
		const header = col.innerText;
		if (header === columnName) {
			formulaState.infix.push("col" + i); //whoever's header matches the innertext of the button pushed
			break;
		}
		else if (header.includes(columnName)) {
			formulaState.infix.push("col" + i); //this is for error columns
			break;
		}
	}

	if (formulaState.ROC === 1) {
		formulaState.newFormula = formulaState.newFormula.slice(0, formulaState.newFormula.length - 4);
		formulaState.newFormula += columnName;
		formulaState.newFormula += ", )";
		formulaState.ROC = 2;
	}
	else if (formulaState.ROC === 2) {
		formulaState.newFormula = formulaState.newFormula.slice(0, formulaState.newFormula.length - 2);
		formulaState.newFormula += columnName;
		formulaState.newFormula += ")";
		formulaState.ROC = 0;
		formulaState.infix.push(")");

		//reactivate other, non-col buttons here...
		enableNonColButtons(); 
	}
	else {
		formulaState.newFormula += columnName; 
	}
	updateDisplay(formulaState);
}

function submitFormula(formulaState, formulaMap) { 
	/*
		when a new formula is submitted, we need to check 1. that it is a valid formula,
		2. that user has entered a name for the column and it is unique.
		we also need to update the dom to reflect the new column.
	*/

	const formModal = document.getElementById("formula-modal");
	updateNumber(formulaState);

	const nameForm = document.getElementById("name");
	const nameLabel = document.getElementById("name-input__label");

	if (nameForm.value === "") {
		nameLabel.classList.add("warning-on");
		nameForm.classList.add("warning-on"); 
	}

	else { 
		const newColName = nameForm.value;
		const validName = checkName(newColName, 0); 

		if (validName) {
			nameLabel.innerText = "add a name:"; 
			nameLabel.classList.remove("warning-on"); 
			nameForm.classList.remove("warning-on");

			const [valid, postfix] = makePostfix(formulaState); 

			if (valid) {
				addToFormulaMap(postfix, formulaMap);

				addFormulaColumn(newColName, formulaMap); 

				extendVariableDropdowns(newColName);

				formulaState.newFormula = "";
				formulaState.infix.length = 0;
				
				const newColumnButton = document.createElement('button'); 
				newColumnButton.classList.add("calculator__button-column", "active"); 
				newColumnButton.innerText = newColName;
		
				const columns = document.getElementById("columns");
				columns.appendChild(newColumnButton); 

				nameForm.value = ""; 
				updateDisplay(formulaState); 
				formModal.style.display = "none"; 
			}
			else { 
				const warning = document.querySelector(".invalid-formula");
				warning.style.visibility = "visible"; 
				updateDisplay(formulaState);
			}
		} 
		else {
			nameLabel.innerText = "add a distinct name:"; 
			nameLabel.classList.add("warning-on");
			nameForm.classList.add("warning-on");
		}
	}
}

function addToFormulaMap(postfix, formulaMap) {
	const currNumCols = document.getElementById('table').rows[0].cells.length; 
	formulaMap.set(currNumCols, postfix); 
}

function compute(postfix, rowIndex, numRows){ 
	/*
		function to compute the value of a table cell from the formula given as
		a postfix array 
	*/
	const stack = []; 
	
	for (let i = 0; i < postfix.length; i ++) {
		if (!isNaN(postfix[i])) {
			stack.push(postfix[i]); 
		}
		else if (isColumn(postfix[i])) {
			stack.push(postfix[i]); 
		}

		else if (postfix[i] === "+") {
			let one = convertColumn(stack.pop(), rowIndex);
			if (stopCompute(one)) {
				return one; 
			} 

			let two = convertColumn(stack.pop(), rowIndex);
			if (stopCompute(two)) {
				return two; 
			}
			
			stack.push(one + two);
		}
		else if (postfix[i] === "-") {
			let one = convertColumn(stack.pop(), rowIndex);
			if (stopCompute(one)) {
				return one; 
			}

			let two = convertColumn(stack.pop(), rowIndex);
			if (stopCompute(two)) {
				return two; 
			}

			stack.push(two - one);
		}
		else if (postfix[i] === "/") {
			let one = convertColumn(stack.pop(), rowIndex);
			if (stopCompute(one)) {
				return one; 
			}

			let two = convertColumn(stack.pop(), rowIndex);
			if (stopCompute(two)) {
				return two; 
			}

			if (!isFinite(two / one)) {
				return "!"; 
			}
			stack.push(two / one);
		}
		else if (postfix[i] === "*") {
			let one = convertColumn(stack.pop(), rowIndex);
			if (stopCompute(one)) {
				return one; 
			}
		
			let two = convertColumn(stack.pop(), rowIndex);
			if (stopCompute(two)) {
				return two; 
			}
			stack.push(two * one);
		}
		else if (postfix[i] === "^") {
			let one = convertColumn(stack.pop(), rowIndex);
			if (stopCompute(one)) {
				return one; 
			}
		
			let two = convertColumn(stack.pop(), rowIndex);
			if (stopCompute(two)) {
				return two; 
			}
			stack.push(two ** one);
		}
		else if (postfix[i] === "log10") {
			let one = convertColumn(stack.pop(), rowIndex);
			if (stopCompute(one)) {
				return one; 
			}

			const val = Math.log10(one);
			if (!isFinite(val)) {
				return "!";
			}
			stack.push(val);
		}
		else if (postfix[i] === "ln") {
			let one = convertColumn(stack.pop(), rowIndex);
			if (stopCompute(one)) {
				return one; 
			}
		
			const val = Math.log(one);
			if (!isFinite(val)) {
				return "!";
			}
			stack.push(val);
		}
		else if (postfix[i] === "log2") {
			let one = convertColumn(stack.pop(), rowIndex);
			if (stopCompute(one)) {
				return one; 
			}
		
			const val = Math.log2(one);
			if (!isFinite(val)) {
				return "!";
			}
			stack.push(val);
		}
		else if (postfix[i] === "negate") {
			let one = convertColumn(stack.pop(), rowIndex);
			if (stopCompute(one)) {
				return one; 
			}
			stack.push(-one);
		}
		else if (postfix[i] === "abs") {
			let one = convertColumn(stack.pop(), rowIndex);
			if (stopCompute(one)) {
				return one; 
			}
			stack.push(Math.abs(one));
		}
		else if (postfix[i] === "sq-root") {
			let one = convertColumn(stack.pop(), rowIndex);
			if (stopCompute(one)) {
				return one; 
			}
			if (!isFinite(one**0.5)) {
				return "!"; 
			}
			stack.push(one**0.5);
		}
		else if (postfix[i] === "sin") {
			let one = convertColumn(stack.pop(), rowIndex);
			if (stopCompute(one)) {
				return one; 
			}
			stack.push(Math.sin(degreesToRadians(one)));
		}
		else if (postfix[i] === "cos") {
			let one = convertColumn(stack.pop(), rowIndex);
			if (stopCompute(one)) {
				return one; 
			}
			stack.push(Math.cos(degreesToRadians(one)));
		}
		else if (postfix[i] === "tan") {
			let one = convertColumn(stack.pop(), rowIndex);
			if (stopCompute(one)) {
				return one; 
			}
			stack.push(Math.tan(degreesToRadians(one)));
		}
		else { 
			const X = stack.pop(); 
			const Y = stack.pop();
			
			if (rowIndex > 1 && rowIndex < numRows - 1) {
				const xPlusVal = convertColumn(X, rowIndex + 1);
				if (stopCompute(xPlusVal)) {
					return xPlusVal
				}
				const xMinusVal = convertColumn(X, rowIndex - 1);
				if (stopCompute(xMinusVal)) {
					return xMinusVal
				}
				const yPlusVal = convertColumn(Y, rowIndex + 1);
				if (stopCompute(yPlusVal)) {
					return yPlusVal
				}
				const yMinusVal = convertColumn(Y, rowIndex - 1);
				if (stopCompute(yMinusVal)) {
					return yMinusVal
				}

				const val = (yPlusVal - yMinusVal)/(xPlusVal - xMinusVal);
				if (!isFinite(val)) { 
					return "!";
				}
				stack.push(val);
			}
			else { //first row and last row won't have slope
				return ""; 
			}
		}
	}
	let lastVal = stack.pop();

	if (isColumn(lastVal)) {
		lastVal = convertColumn(lastVal, rowIndex);
		if (stopCompute(lastVal)) {
			return lastVal;
		}
	}
	return roundToSignificantDigits(lastVal, 5); 
}

function stopCompute(val) {
	return val === "" || val === "!";
}

function convertColumn(poppedElem, rowIndex) {
	const theTable = document.getElementById("table");
	if (typeof poppedElem === 'string') {
		const colIndex = parseInt(poppedElem.slice(3, poppedElem.length)); 
		const cell = theTable.rows[rowIndex].cells[colIndex];
		const input = cell.innerText; 
		
		if (input === "") {
			return "";  
		}
		return checkInput(input) ? parseFloat(input) : "!";
	}
	return poppedElem;
}

function makePostfix(formulaState){ 
	/*
		shunting yard algorithm with validation.
	*/
	const {operators, functions, precedence, association} = getEvaluationUtilities();

	const postfix = []; 
	const operatorStack = []; 
	let expectingOperator = false; 

	if (operators.includes(formulaState.infix[formulaState.infix.length - 1])) {
		return [false, postfix];
	}
	for (let i = 0; i < formulaState.infix.length; i ++) {
		if (!isNaN(formulaState.infix[i])) { //do we have a number?
			if (expectingOperator) {
				return [false, postfix];
			}
			const value = parseFloat(formulaState.infix[i]); 
			postfix.push(value); 
			expectingOperator = true; 
		}
		else {
			if (isColumn(formulaState.infix[i])) {
				if (expectingOperator) {
					return [false, postfix];
				}
				if (!openSlope(i, formulaState.infix, operatorStack)) {
					expectingOperator = true; 
				}
				postfix.push(formulaState.infix[i]);
			}
			else if (functions.includes(formulaState.infix[i])) {
				if (expectingOperator) {
					return [false, postfix];
				}
				operatorStack.push(formulaState.infix[i]); 
				expectingOperator = false;  
			}
			else if (formulaState.infix[i] === "(") {
				if (expectingOperator) {	
					return [false, postfix];
				}
				operatorStack.push(formulaState.infix[i]);
				expectingOperator = false; 
			}
			else if (operators.includes(formulaState.infix[i])) {
				if (!expectingOperator) {
					return [false, postfix];
				}
				while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== "(" && 
				precedence[operatorStack[operatorStack.length - 1]] > precedence[formulaState.infix[i]] || 
				functions.includes(operatorStack[operatorStack.length - 1]) || 
				precedence[operatorStack[operatorStack.length - 1]] === precedence[formulaState.infix[i]] && 
				association[formulaState.infix[i]] === "left") {

					const op = operatorStack.pop();
					postfix.push(op);
				}
				operatorStack.push(formulaState.infix[i]);
				expectingOperator = false; 
			}
			else if (formulaState.infix[i] === ")") {
				if (!expectingOperator) {
					return [false, postfix];
				}
				while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== "(") {
					const op = operatorStack.pop();
					postfix.push(op);
				}
				if (operatorStack.length === 0) {
					return [false, postfix];
				}
				operatorStack.pop(); 
			}
			else { //where we catch multiple decimal points
				return [false, postfix];
			}
		}
	}
	while (operatorStack.length > 0) {
		const op = operatorStack.pop();
		if (op === "(") {
			return [false, postfix];
		}
		postfix.push(op);
	}

	if (postfix.length === 0) { 
		return [false, postfix]; 
	}
	return [true, postfix];
}

function openSlope(i, infix, opStack) {
	/* slope is annoying in that it is the only function that expects two columns to follow.
		helper function to check if the column we are seeing is the first of two slope 
		columns */
	return opStack.length >= 2 && opStack[opStack.length - 2] === "slope" && infix[i - 1] === "(";
}

function isColumn(elem) { 
	const {operators, functions, precedence, association} = getEvaluationUtilities();
	if(elem !== "(" && elem !== ")" && !operators.includes(elem) && !functions.includes(elem)) {
		return true;
	}
	return false;
}

function roundToSignificantDigits(num, n) {
  	if (num === 0) {
      		return 0;
    	}
  	const d = Math.ceil(Math.log10(num < 0 ? -num: num));
  	const power = n - d;
   	const magnitude = Math.pow(10, power);
   	const shifted = Math.round(num * magnitude);
   	return shifted / magnitude;
}