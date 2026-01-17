function generateInputs() {
	const nInput = document.getElementById("nInput");
	const mInput = document.getElementById("mInput");
	
	if (!nInput || !mInput) return;
	
	const n = parseInt(nInput.value);
	const m = parseInt(mInput.value);

	if (!Number.isInteger(n) || !Number.isInteger(m) || n <= 0 || m <= 0) {
    	document.getElementById("basisContainer").innerHTML = "";
    	document.getElementById("imageContainer").innerHTML = "";
    	return;
  	}

  	//updates container for the two grids
  	updateVectorContainer("basisContainer", n, n, "b", "basis");
  	updateVectorContainer("imageContainer", n, m, "T(b", "image");
}

function updateVectorContainer(containerId, vectorCount, coordsPerVector, labelPrefix, inputClass) {
    const container = document.getElementById(containerId);

    // 1. Immediate Cleanup: Remove anything that is already flagged as "dying"
    const dying = container.querySelectorAll('.vector[data-state="dying"]');
    dying.forEach(v => v.remove());

    // 2. Identification: Get currently active vectors
    let activeVectors = Array.from(container.querySelectorAll('.vector:not([data-state="dying"])'));

    // 3. Removal Logic
    if (activeVectors.length > vectorCount) {
        for (let i = activeVectors.length - 1; i >= vectorCount; i--) {
            const v = activeVectors[i];
            v.setAttribute('data-state', 'dying'); // Flag it so logic ignores it
            v.classList.remove('show');
            
            // Instead of just an event listener, we use a timeout safety net
            setTimeout(() => { if(v.parentElement) v.remove(); }, 400);
        }
    }

    // 4. Addition Logic
    if (activeVectors.length < vectorCount) {
        for (let i = activeVectors.length; i < vectorCount; i++) {
            const vectorDiv = document.createElement("div");
            vectorDiv.className = "vector";
            vectorDiv.setAttribute('data-state', 'active');
            
            const label = document.createElement("label");
            label.textContent = labelPrefix.includes("T") ? `${labelPrefix}${i + 1})` : `${labelPrefix}${i + 1}`;
            vectorDiv.appendChild(label);

            for (let j = 0; j < coordsPerVector; j++) {
                const newInput = createAnimatedInput(inputClass);
                vectorDiv.appendChild(newInput);
                requestAnimationFrame(() => requestAnimationFrame(() => newInput.classList.add('visible')));
            }

            container.appendChild(vectorDiv);
            requestAnimationFrame(() => requestAnimationFrame(() => vectorDiv.classList.add('show')));
        }
    }

    // 5. Row Synchronization: Force ALL non-dying vectors to match coordsPerVector
    // We re-query to include the brand new vectors we just added above
    const currentActive = container.querySelectorAll('.vector:not([data-state="dying"])');
    
    currentActive.forEach((v) => {
        const inputs = v.querySelectorAll('input:not(.dying-input)');
        
        // Add Rows
        if (inputs.length < coordsPerVector) {
            for (let k = inputs.length; k < coordsPerVector; k++) {
                const newInput = createAnimatedInput(inputClass);
                v.appendChild(newInput);
                requestAnimationFrame(() => requestAnimationFrame(() => newInput.classList.add('visible')));
            }
        } 
        // Remove Rows
        else if (inputs.length > coordsPerVector) {
            for (let k = inputs.length - 1; k >= coordsPerVector; k--) {
                const inputToRemove = inputs[k];
                inputToRemove.classList.add('dying-input'); // Mark it
                inputToRemove.classList.remove('visible');
                setTimeout(() => { if(inputToRemove.parentElement) inputToRemove.remove(); }, 300);
            }
        }
    });
}

function createAnimatedInput(className) {
  	const input = document.createElement("input");
  	input.type = "text";
  	input.inputMode = "numeric";
  	input.pattern = "-?[0-9]*";
  	input.className = className;
  	forceNumericInput(input);
  	return input;
}

function computeStandardMatrix() {
  	const n = parseInt(document.getElementById("nInput").value);
  	const m = parseInt(document.getElementById("mInput").value);
  	const output = document.getElementById("output");
  	const steps = document.getElementById("steps");

  	output.innerHTML = "";
  	steps.innerHTML = "";

  	try {
    	const basisInputs = document.querySelectorAll(".basis");
    	const imageInputs = document.querySelectorAll(".image");

    	let basis = [];
    	let images = [];

    	for (let i = 0; i < n; i++) {
      		basis.push(
        		Array.from(basisInputs)
          		.slice(i * n, (i + 1) * n)
          		.map(input => parseNumber(input.value))
      		);

      		images.push(
        		Array.from(imageInputs)
          		.slice(i * m, (i + 1) * m)
          		.map(input => parseNumber(input.value))
      		);
    	}

    	if (basis.flat().some(v => isNaN(v)) || images.flat().some(v => isNaN(v))) {
      		throw new Error("All inputs must be valid numbers or fractions.");
    	}

    	const B = Array.from({ length: n }, (_, i) => basis.map(v => v[i]));
    	const C = Array.from({ length: m }, (_, i) => images.map(v => v[i]));

    	const B_inv = invertMatrix(B);
    	const A = multiplyMatrices(C, B_inv);

    	output.innerHTML = `<h2>Standard Matrix A</h2>`;
    	output.appendChild(renderMatrix(A));

    	steps.innerHTML = `<div class="step"><h3>Step 1: Basis Matrix B</h3></div>`;
    	steps.appendChild(renderMatrix(B));
    	steps.innerHTML += `<div class="step"><h3>Step 2: Inverse B⁻¹</h3></div>`;
    	steps.appendChild(renderMatrix(B_inv));
    	steps.innerHTML += `<div class="step"><h3>Step 3: Image Matrix C</h3></div>`;
    	steps.appendChild(renderMatrix(C));
    	steps.innerHTML += `<div class="step"><h3>Step 4: Compute A = C · B⁻¹</h3></div>`;
    	steps.appendChild(renderMatrix(A));

  	} catch (err) {
    	output.textContent = "Error: " + err.message;
  	}
  	document.getElementById("steps").style.display = "none";
}

function multiplyMatrices(A, B) {
  	return A.map(row =>
    	B[0].map((_, j) =>
      	row.reduce((sum, val, i) => sum + val * B[i][j], 0)
    	)
  	);
}

function invertMatrix(matrix) {
  	const n = matrix.length;
  	let I = matrix.map((row, i) => row.map((_, j) => (i === j ? 1 : 0)));
  	let M = matrix.map(row => row.slice());

  	for (let i = 0; i < n; i++) {
    	if (M[i][i] === 0) throw new Error("Basis matrix is not invertible.");
    	let pivot = M[i][i];
    	for (let j = 0; j < n; j++) {
      		M[i][j] /= pivot;
      		I[i][j] /= pivot;
    	}
    	for (let k = 0; k < n; k++) {
      		if (k !== i) {
        		let factor = M[k][i];
        		for (let j = 0; j < n; j++) {
          			M[k][j] -= factor * M[i][j];
          			I[k][j] -= factor * I[i][j];
        		}
      		}
    	}
  	}
  	return I;
}

function renderMatrix(matrix) {
  	const container = document.createElement("div");
  	container.className = "matrix-display";
  	matrix.forEach(row => {
    	const rowDiv = document.createElement("div");
    	rowDiv.className = "matrix-row";
    	row.forEach(value => {
      		const cell = document.createElement("div");
      		cell.className = "matrix-cell";
      		cell.textContent = Number(value).toFixed(2);
		    rowDiv.appendChild(cell);
    	});
    	container.appendChild(rowDiv);
  	});
  	return container;
}

function toggleSteps() {
  	const steps = document.getElementById("steps");
  	steps.style.display = steps.style.display === "none" ? "block" : "none";
}

function resetInputs() {
  	document.querySelectorAll(".basis, .image").forEach(input => input.value = "");
  	document.getElementById("output").innerHTML = "";
  	document.getElementById("steps").innerHTML = "";
}

function randomizeInputs() {
  	const n = parseInt(document.getElementById("nInput").value);
  	const m = parseInt(document.getElementById("mInput").value);
  	let B = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  	for (let k = 0; k < n * 2; k++) {
    	const i = Math.floor(Math.random() * n), j = Math.floor(Math.random() * n);
    	if (i !== j) {
      		const factor = Math.floor(Math.random() * 5) - 2;
      		for (let c = 0; c < n; c++) {
				B[i][c] += factor * B[j][c];
			}
    	}
  	}
  	const basisInputs = document.querySelectorAll(".basis");
  	let index = 0;
  	for (let j = 0; j < n; j++) {
    	for (let i = 0; i < n; i++) {
			basisInputs[index++].value = B[i][j];
		}
  	}
  	document.querySelectorAll(".image").forEach(input => {
    	input.value = (Math.floor(Math.random() * 11) - 5).toString();
  	});
}

function forceNumericInput(input) {
  	input.addEventListener("input", () => {
    	let v = input.value.replace(/[^0-9\-./]/g, "");
    	if (v.includes("-")) {
			v = (v[0] === "-" ? "-" : "") + v.replace(/-/g, "");
		}
		const dotCount = (v.match(/\./g) || []).length;
    	if (dotCount > 1) {
      		const firstDot = v.indexOf(".");
      		v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "");
    	}
    	input.value = v;
  	});
}

function parseNumber(value) {
  	if (value.includes("/")) {
    	const [num, den] = value.split("/").map(Number);
    	return (isNaN(num) || isNaN(den) || den === 0) ? NaN : num / den;
  	}
  	return Number(value);
}

function setupSpinbarLimits() {
  	const inputs = [document.getElementById("nInput"), document.getElementById("mInput")];
	
  	inputs.forEach(input => {
    	input.addEventListener("keydown", (e) => {
      		const allowedKeys = ["1", "2", "3", "4", "5", "Backspace", "ArrowUp", "ArrowDown", "Tab"];
      
      		if (!allowedKeys.includes(e.key)) {
        		e.preventDefault();
      		}
    	});

    	input.addEventListener("input", () => {
      		if (input.value > 5) {
				input.value = 5;
			}
      		if (input.value < 1 && input.value !== "") {
				input.value = 1;
			}
			
      		if (input.value.length > 1) {
        		input.value = input.value.slice(0, 1);
      		}
    	});
  	});
}

document.getElementById("nInput").addEventListener("input", generateInputs);
document.getElementById("mInput").addEventListener("input", generateInputs);

setupSpinbarLimits();
generateInputs();
