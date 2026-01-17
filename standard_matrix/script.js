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

  	
  	updateVectorContainer("basisContainer", n, n, "b", "basis");
  	updateVectorContainer("imageContainer", n, m, "T(b", "image");
}

function solveMatrix(M) {
	// Treat entirely empty or all-zero/NaN matrices as missing input.
	if (!M || M.length === 0 || !Array.isArray(M)) {
		throw new Error("Please enter input!");
	}
}

function updateVectorContainer(containerId, vectorCount, coordsPerVector, labelPrefix, inputClass) {
    const container = document.getElementById(containerId);

    const dying = container.querySelectorAll('.vector[data-state="dying"]');
    if (dying.length > 0) {
        dying.forEach(v => {
            if (container.children.length > vectorCount + 2) {
                v.remove();
            }
        });
    }

    let activeVectors = Array.from(container.querySelectorAll('.vector:not([data-state="dying"])'));

    if (activeVectors.length > vectorCount) {
        for (let i = activeVectors.length - 1; i >= vectorCount; i--) {
            const v = activeVectors[i];
            v.setAttribute('data-state', 'dying'); 
            v.classList.remove('show');
            
            setTimeout(() => { if(v.parentElement) v.remove(); }, 400);
        }
    }

    if (activeVectors.length < vectorCount) {
        for (let i = activeVectors.length; i < vectorCount; i++) {
            const vectorDiv = document.createElement("div");
            vectorDiv.className = "vector";
            vectorDiv.setAttribute('data-state', 'active');
            
            const label = document.createElement("label");
			if (labelPrefix.includes("T")) {
				label.innerHTML = `T(b<sub>${i + 1}</sub>)`;
			} else {
				label.innerHTML = `b<sub>${i + 1}</sub>`;
			}
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

    const currentActive = container.querySelectorAll('.vector:not([data-state="dying"])');
    
    currentActive.forEach((v) => {
        const inputs = v.querySelectorAll('input:not(.dying-input)');
        
        if (inputs.length < coordsPerVector) {
            for (let k = inputs.length; k < coordsPerVector; k++) {
                const newInput = createAnimatedInput(inputClass);
                v.appendChild(newInput);
                requestAnimationFrame(() => requestAnimationFrame(() => newInput.classList.add('visible')));
            }
        } 
		
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

function appendStep(parent, titleText, matrix) {
    const stepDiv = document.createElement("div");
    stepDiv.className = "step";
    
    const h3 = document.createElement("h3");
    h3.textContent = titleText;
    
    stepDiv.appendChild(h3);
    stepDiv.appendChild(renderMatrix(matrix));
    parent.appendChild(stepDiv);
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

    	// Check if ALL inputs are blank
    	/*const allBasisBlank = Array.from(basisInputs).every(input => input.value.trim() === "");
    	const allImageBlank = Array.from(imageInputs).every(input => input.value.trim() === "");
    	
    	if (allBasisBlank && allImageBlank) {
      		throw new Error("Please enter input.");
    	}*/

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

      solveMatrix(B);
      solveMatrix(C);

    	const B_inv = invertMatrix(B);
    	const A = multiplyMatrices(C, B_inv);

    	output.innerHTML = `<h2>Standard Matrix A</h2>`;
		output.appendChild(renderMatrix(A));

		steps.innerHTML = "";
		appendStep(steps, "Step 1: Basis Matrix B", B);
		appendStep(steps, "Step 2: Inverse B⁻¹", B_inv);
		appendStep(steps, "Step 3: Image Matrix C", C);
		appendStep(steps, "Step 4: Compute A = C · B⁻¹", A);

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
     
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
                maxRow = k;
            }
        }
        
     
        if (maxRow !== i) {
            [M[i], M[maxRow]] = [M[maxRow], M[i]];
            [I[i], I[maxRow]] = [I[maxRow], I[i]];
        }
        
        
        if (Math.abs(M[i][i]) < 1e-10) {
            throw new Error("Basis matrix is not invertible.");
        }
        
        // Gauss-Jordan elimination
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
  	steps.style.display = steps.style.display === "none" ? "flex" : "none";
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

let debounceTimer;

const debouncedGenerate = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(generateInputs, 50);
};

document.getElementById("nInput").addEventListener("input", debouncedGenerate);
document.getElementById("mInput").addEventListener("input", debouncedGenerate);

setupSpinbarLimits();
generateInputs();
