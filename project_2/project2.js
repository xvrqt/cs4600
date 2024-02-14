// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{
	/* +-     -+
	 * | s 0 0 |
	 * | 0 s 0 |
	 * | 0 0 1 |
	 * +-     -+
	 */  
	let scaleMatrix = S = Array( scale,0,0,  0,scale,0,  0,0,1 );

	/* +-                -+
	 * | cos(d) -sin(d) 0 |
	 * | sin(d)  cos(d) 0 |
	 * |   0       0    1 |
	 * +-                -+
	 */  
	let d = rotation * Math.PI / 180;
	let sin = Math.sin;
	let cos = Math.cos;
	let rotationMatrix = R = Array( cos(d),sin(d),0,  -sin(d),cos(d),0, 0,0,1);

	/* +-     -+
	 * | 1 0 x |
	 * | 0 1 y |
	 * | 0 0 1 |
	 * +-     -+
	 */  
	let translationMatrix = T = Array( 1,0,0,  0,1,0, positionX,positionY,1);
	
	let SR = ApplyTransform(S,R);

	return ApplyTransform(SR, T);
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform( trans1, trans2 )
{
	/*
	let r = Array.apply(null, Array(trans1.length)).map((j,i) => {
		let col = Math.floor(i / 3);
		let row = i % 3;
		let x = trans2[row];
		let y = trans2[row + 3];
		let z = trans2[row + 6];
		let a = trans1[col];
		let b = trans1[col + 1];
		let c = trans1[col + 2];
		return a*x + b*y + c*z;
	});
	*/
	let r = Array();
	for(i = 0; i < trans1.length; i = i + 3) {
		r.push(gay(trans2, trans1.slice(i, i+3)));
	}
	return r.flat();
}

// Multiplies the vector by the matrix, returns the vector result
// Assumes column-major 1D array of values for each
function gay(m, v) {
	let vout = Array.apply(null, Array(v.length)).map((x,i) => {
		let r = 0;
		for(let j = 0; j < v.length; j++) {
			r += v[j] * m[ i + (v.length * j)];
		};
		//console.log("row: " + i, r);
		//debugger;
		return r;
	});
	return vout;
}

