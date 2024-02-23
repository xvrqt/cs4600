// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
{
    // Convenience
	let sin = Math.sin;
	let cos = Math.cos;

    /* Rotation Around X Axis
	 * +-                        -+
     * |   1       0      0     0 | 
	 * |   0     cos(d) -sin(d) 0 |
	 * |   0     sin(d)  cos(d) 0 |
	 * |   0       0      0     1 |
	 * +-                        -+
	 */  
	let rx = rotationX;
	let rotXM= Array(1,0,0,0, 0,cos(rx),sin(rx),0, 0,-sin(rx),cos(rx),0, 0,0,0,1); 

    /* Rotation Around X Axis
	 * +-                          -+
     * |  cos(d)    0     sin(d)  0 | 
	 * |    0       1      0      0 |
	 * | -sin(d)    0     cos(d)  0 |
	 * |    0       0      0      1 |
	 * +-                          -+
	 */  
	let ry = rotationY;
	let rotYM = Array(cos(ry),0,-sin(ry),0, 0,1,0,0, sin(ry),0,cos(ry),0, 0,0,0,1);
    let rotationMatrix = MatrixMult(rotYM, rotXM);

	let translationMatrix = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
    // Move after we rotate, so we don't rotate around former origin
    let transformationMatrix = MatrixMult(translationMatrix, rotationMatrix);

    // Finally, map to perspective of the viewport
    return MatrixMult(projectionMatrix, transformationMatrix);
}

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// Compile the shader program
		this.prog = InitShaderProgram(this.vertex_shader, this.fragment_shader);
        gl.useProgram(this.prog);
		
		// Pointer to the viewport perspective transformation matrix
		this.mvp = gl.getUniformLocation(this.prog, 'mvp');

        // Initialize the the flipYZ to the identity matrix
        this.flipYZ = gl.getUniformLocation(this.prog, 'flipYZ');
        gl.uniformMatrix4fv(this.flipYZ, false, Array(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1));
		
		// Get the ids of the vertex attributes in the shaders
		this.vertex = gl.getAttribLocation(this.prog, 'vertex');

        // Initialist the Buffer
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	setMesh(vertPos, texCoords)
	{
        gl.useProgram(this.prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
		this.numTriangles = vertPos.length / 3;
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ(swap)
	{
        /* Swap Y & Z Axes Matrix
        +-       -+
        | 1 0 0 0 |
        | 0 0 1 0 |
        | 0 1 0 0 |
        | 0 0 0 1 |
        +-       -+ */
        let flipYZ   = Array(1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,1);
        let identity = Array(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1);
        let matrix   = swap ? flipYZ : identity;

        gl.useProgram(this.prog);
		gl.uniformMatrix4fv(this.flipYZ, false, matrix);
	}
	
	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans)
	{
        gl.useProgram(this.prog);

        // Set the vertices array, and attribute pointer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.vertexAttribPointer(this.vertex, 3, gl.FLOAT, false, 0,0);
        gl.enableVertexAttribArray(this.vertex);

        // Set the perspective view matrix uniform variable
		gl.uniformMatrix4fv(this.mvp, false, trans);

        // The Show
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// [TO-DO] Bind the texture

		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
	}
    
    // Vertex Shader GLSL
   vertex_shader = `
        uniform mat4 mvp;
        uniform mat4 flipYZ;
        attribute vec3 vertex;
        void main()
        {
            // flipYZ will be the identity matrix if swapYZ is not set
            gl_Position = mvp * flipYZ * vec4(vertex,1);
        }
    `;
    
    // Fragment Shader GLSL
   fragment_shader = `
        precision mediump float;
        void main()
        {
              float ndcDepth = (2.0 * gl_FragCoord.z - gl_DepthRange.near - gl_DepthRange.far) / (gl_DepthRange.far - gl_DepthRange.near);
              float clipDepth = ndcDepth / gl_FragCoord.w;
              float c = (clipDepth * 0.5) + 0.5;
              gl_FragColor = vec4(c*c*c,0.0,c*c*c,1);
        }
    `;
}
