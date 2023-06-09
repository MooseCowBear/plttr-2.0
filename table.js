function getData(independentCol, dependentCol, independentErr, dependentErr) {
  /*
    function to retrieve data from the table. 
    points are divided into two categories: active and inactive. 
    only active points are used to perfom fit.
  */
  const theTable = document.getElementById("table");
	let independentColIndex, dependentColIndex; 
	let independentErrIndex = "none";
  let dependentErrIndex = "none";
  
	for (let i = 0; i < theTable.rows[0].cells.length; i ++) { //NOT WORKING
		const cellText = theTable.rows[0].cells[i].innerText; 
		if (cellText === independentCol) {
			independentColIndex = i;
		}
		if (cellText === dependentCol) {
			dependentColIndex = i;
		}
		if (cellText === independentErr) {
			independentErrIndex = i;
		}
		if (cellText === dependentErr) {
			dependentErrIndex = i;
		}
	}
	
	const activeXs = [];
	const activeYs = [];

	const inactiveXs = [];
	const inactiveYs = [];

	const activeXerrs = [];
	const activeYerrs = [];

	const inactiveXerrs = [];
	const inactiveYerrs = [];

	for (let i = 1, row; row = theTable.rows[i]; i++) {
		const firstCol = row.cells[0]; 
		const child = firstCol.getElementsByTagName("input");
		const chk = child[0]; //the "exclude" checkbox
		
		if (chk.checked) {
      getPoint(row, independentColIndex, dependentColIndex, independentErrIndex, dependentErrIndex, inactiveXs, inactiveYs, inactiveXerrs, inactiveYerrs);
		}
		else { //active point
      getPoint(row, independentColIndex, dependentColIndex, independentErrIndex, dependentErrIndex, activeXs, activeYs, activeXerrs, activeYerrs);
    }
	}
	return {
    activeX: activeXs, 
    activeY: activeYs, 
    inactiveX: inactiveXs, 
    inactiveY: inactiveYs, 
    activeXerr: activeXerrs, 
    activeYerr: activeYerrs, 
    inactiveXerr: inactiveXerrs, 
    inactiveYerr: inactiveYerrs
  }; 
}

function getPoint(row, xIndex, yIndex, xErrIndex, yErrIndex, xs, ys, xErrs, yErrs) {
  let x = row.cells[xIndex].innerText;
  let y = row.cells[yIndex].innerText;

	if (checkInput(x) && checkInput(y) && x !== "" && y !== "") {
		xs.push(parseFloat(x));
		ys.push(parseFloat(y));

		if (xErrIndex != "none") { 

			let xErr = row.cells[xErrIndex].innerText;

			if (checkInput(xErr) && xErr !== "") {
				xErrs.push(parseFloat(xErr));
			}
			else {
				xErrs.push(0);
			}
		}
		else {
			xErrs.push(0);
		}

		if (yErrIndex != "none") {
    	let yErr = row.cells[yErrIndex].innerText;

    	if (checkInput(yErr) && yErr !== "") {
      	yErrs.push(parseFloat(yErr)); 
    	}
			else {
				yErrs.push(0);
			}
		}
		else {
			yErrs.push(0);
		}
	}
}

function checkInput(input) {
  // either empty table cell or a number counts as valid input. 
	const inp = input.trim(); 

	if(isFinite(inp)){ 
  		return true;
	}
	return false;
}

function addRow(formulaMap) { 
  const theTable = document.getElementById("table"); 
  const row = theTable.insertRow(theTable.rows.length); 

	for (let i = 0; i < theTable.rows[0].cells.length; i++) {
    const cell = row.insertCell(i); 

		if (i === 0) {
			const chk = document.createElement("input");

			chk.setAttribute("type", "checkbox");
      cell.classList.add("exclude", "checkbox");
			cell.appendChild(chk);
		}
   	else if (i > 0 && i < 5) {
			cell.setAttribute("contenteditable", "true");
      cell.classList.add(".edit");
   	}
		else { 
			const formula = formulaMap.get(i); 
			const cellValue = compute(formula, i, theTable.rows.length); 
			cell.innerText = cellValue;
		}
	}
}

function updateColumnName(column, x = true) {
  /*
    when user updates x, y column names, need to populate throughout.
    if they attempt to change to a name that is already taken or to none, 
    refuse the change and revert to original name.
  */
  let newColName = column.innerText; 
  const index = x ? 1: 2;
	const validName = checkName(newColName, index);

  if (!validName) {
		newColName = x ? "x" : "y"; 
		e.target.innerText = newColName;
	}

  const err = x ? document.getElementById("x-err") : document.getElementById("y-err");
  const formulaBtn = x ? document.getElementById("x-btn") : document.getElementById("y-btn");
  const errFormulaBtn = x ? document.getElementById("x-err-btn") : document.getElementById("y-err-btn");

	const i = err.innerText.indexOf(" ");
	const newErrorColumnName = err.innerText.slice(0, i + 1) + newColName;

  err.innerText = newErrorColumnName; 
  formulaBtn.innerText = newColName;
  errFormulaBtn.innerText = newErrorColumnName; 

  const dropdowns = x ? document.querySelectorAll('.x-dropdown') : document.querySelectorAll('.y-dropdown');
  const errDropdowns = x ? document.querySelectorAll('.x-err-dropdown') : document.querySelectorAll('.y-err-dropdown');

  dropdowns.forEach(elem => {
		const spanElem = elem.querySelector("SPAN");
    spanElem.innerText = newColName;
  });

  errDropdowns.forEach(elem => {
		const spanElem = elem.querySelector("SPAN");
    spanElem.innerText = newErrorColumnName; 
  });
}

function checkName(colName, cellIndex) {
  /*
    need to make sure there are no columns with the same name,
    or that are named none. 
  */
	const strippedColName = colName.trim().toLowerCase();
	if (strippedColName === "none") {
		return false;
	}
  const theTable = document.getElementById("table");

	for (let i = 1; i < theTable.rows[0].cells.length; i++) {
		if (i !== cellIndex && theTable.rows[0].cells[i].innerText === strippedColName) {
			return false;
		}
	}
	return true; 
}

function addFormulaColumn(newColName, formulaMap) {
  const theTable = document.getElementById("table");
	const numRows = theTable.rows.length; 
	const currNumCols = theTable.rows[0].cells.length;  

  for (const [i, row] of [...document.querySelectorAll("#table tr")].entries()) {
    const cell = document.createElement(i ? "td" : "th"); 

		if (cell.nodeName === "TH") {
      cell.innerText = newColName;
    }
		else {
			const formula = formulaMap.get(currNumCols); 
			const cellValue = compute(formula, i, numRows); 
			cell.innerText = cellValue;
		}
    row.appendChild(cell); 
	}
	updateTableStyling(theTable, currNumCols + 1); 
}

function updateTableStyling(table, numCols) { 
	if (numCols > 9) {
		table.classList.add("many-columns");
	}
}


function updateTableValues(event, formulaMap) {
  if (event.target.classList.contains("edit")) {
    const val = event.target.innerText; 
    if (checkInput(val)) { 
      event.target.style.border = "none"; 
    }
    else { 
      event.target.style.border = "2px solid salmon"; 
    }
    const theTable = document.getElementById("table");
    const numRows = theTable.rows.length; 
  
    for (let i = 5; i < theTable.rows[0].cells.length; i ++) {
      for (let row = 1; row < numRows; row ++) {
        const formula = formulaMap.get(i); 
        const computedValue = compute(formula, row, numRows);
        theTable.rows[row].cells[i].innerText = computedValue;
      }
    }
  }
}

function checkInput(input) { 
	const inp = input.trim(); 
	if(isFinite(inp)){ 
  		return true;
	}
	return false;
}