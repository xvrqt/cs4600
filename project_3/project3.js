class CurveDrawer {
	constructor()
	{
		// Compile the shader program
		this.prog = InitShaderProgram( curvesVS, curvesFS );
		
		// Pointer to the orthographic perspective transformation matrix
		this.mvp = gl.getUniformLocation( this.prog, 'mvp' );
		
		// Pointers to the 4 control points 
        this.p0 = gl.getUniformLocation( this.prog, 'p0');
        this.p1 = gl.getUniformLocation( this.prog, 'p1');
        this.p2 = gl.getUniformLocation( this.prog, 'p2');
        this.p3 = gl.getUniformLocation( this.prog, 'p3');
        this.ctlpts = Array(this.p0, this.p1, this.p2, this.p3);

        // Pointer to the next 't'ime [0,1] of the line segment 
        this.t = gl.getAttribLocation( this.prog, 't');
		// Initialize the attribute buffer
		this.steps = 100;
		var tv = [];
		for ( var i=0; i<this.steps; ++i ) {
			tv.push( i / (this.steps-1) );
		}
		this.buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tv), gl.STATIC_DRAW);
	}
	setViewport( width, height )
	{
        // Ortho transformation matrix
		var ortho = [ 2/width,0,0,0,  0,-2/height,0,0, 0,0,1,0, -1,1,0,1 ];
		gl.useProgram( this.prog );
		gl.uniformMatrix4fv( this.mvp, false, ortho);
	}
	updatePoints( pt )
	{
        gl.useProgram( this.prog );
		for ( let i = 0; i < 4; ++i ) {
			var x = pt[i].getAttribute("cx");
			var y = pt[i].getAttribute("cy");
            gl.uniform2fv( this.ctlpts[i], Array(x,y) );
		}
	}
	draw()
	{
		gl.useProgram( this.prog );
		gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer );
		gl.vertexAttribPointer( this.t, 1, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.t );
		gl.drawArrays( gl.LINE_STRIP, 0, this.steps );
	}
}

// Vertex Shader
var curvesVS = `
	attribute float t;
	uniform mat4 mvp;
	uniform vec2 p0;
	uniform vec2 p1;
	uniform vec2 p2;
	uniform vec2 p3;
	void main()
	{
        vec2 p0p = pow((1.0 - t), 3.0) * p0;
        vec2 p1p = 3.0 * pow((1.0 - t), 2.0) * t * p1;
        vec2 p2p = 3.0 * (1.0 - t) * pow(t, 2.0) * p2;
        vec2 p3p = pow(t, 3.0) * p3;

        vec2 pos = p0p + p1p + p2p + p3p;

		gl_Position = mvp * vec4(pos, 0, 1);
	}
`;

// Fragment Shader
var curvesFS = `precision mediump float;
	void main()
	{
		gl_FragColor = vec4(1,0,0,1);
	}
`;
