// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY)
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
	let rot_XM = Array(1,0,0,0, 0,cos(rx),sin(rx),0, 0,-sin(rx),cos(rx),0, 0,0,0,1); 

    /* Rotation Around Y Axis
	 * +-                          -+
     * |  cos(d)    0     sin(d)  0 | 
	 * |    0       1      0      0 |
	 * | -sin(d)    0     cos(d)  0 |
	 * |    0       0      0      1 |
	 * +-                          -+
	 */  
	let ry = rotationY;
	let rot_YM = Array(cos(ry),0,-sin(ry),0, 0,1,0,0, sin(ry),0,cos(ry),0, 0,0,0,1);
    let rotation_matrix = MatrixMult(rot_YM, rot_XM);

	let translation_matrix = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

    // Move after we rotate, so we don't rotate around former origin
    let transformation_matrix = MatrixMult(translation_matrix, rotation_matrix);

    // Finally, map to perspective of the viewport
    return MatrixMult(projectionMatrix, transformation_matrix);
}

class MeshDrawer
{
	constructor()
	{
		// Create & Compile the Shader Program
		this.prog = InitShaderProgram(this.vertex_shader, this.fragment_shader);
        gl.useProgram(this.prog);

		// Pointer to the viewport perspective transformation matrix
		this.mvp = gl.getUniformLocation(this.prog, 'mvp');

        // Initialize if the model should be flip the Y and Z coordinates
        this.flip_YZ = gl.getUniformLocation(this.prog, 'flip_YZ');
        gl.uniform1i(this.flipYZ, document.getElementById('swap-yz').checked ? 1 : 0);

        // Initialize if we show the texture
        this.show_texture = gl.getUniformLocation(this.prog, 'show_texture');
        gl.uniform1i(this.show_texture, 0);
		
        // Pointer to the vertex attribute
		this.vertex = gl.getAttribLocation(this.prog, 'vertex');
        this.vertex_buffer = gl.createBuffer();

        // Pointer to the texture coordinates attribute
        this.texture_coordinates = gl.getAttribLocation(this.prog, 'texture_coordinates');
        this.texture_coordinates_buffer = gl.createBuffer();
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

        // There should be 2/3'rds as many entries as the vertices, otherwise fake it 
        // (texture won't work, but model will still load)
        let req_length = Math.floor(vertPos.length * 2 / 3);
        if(texCoords.length != req_length) { texCoords = Array(req_length); }

        // Bind the texture coordinates to the buffer inside the program
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texture_coordinates_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        // Bind the vertex positions to the buffer inside the program
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        // Set the total number of triangles we will draw
		this.num_triangles = vertPos.length / 3;
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ(swap)
	{
        gl.useProgram(this.prog);
		gl.uniform1i(this.flip_YZ, swap ? 1 : 0);
	}
	
	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans)
	{
        gl.useProgram(this.prog);

        // Set the texture coordinates array, and attribute pointer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texture_coordinates_buffer);
        gl.vertexAttribPointer(this.texture_coordinates, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.texture_coordinates);

        // Set the vertices array, and attribute pointer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
        gl.vertexAttribPointer(this.vertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vertex);

        // Set the perspective view matrix uniform variable
		gl.uniformMatrix4fv(this.mvp, false, trans);

        // The Show
		gl.drawArrays(gl.TRIANGLES, 0, this.num_triangles);
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img)
	{
        // Create the texture
        const texture = gl.createTexture();
        const mipmaplvl = 0;

        gl.useProgram(this.prog);
        gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, mipmaplvl, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);

        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        // Bind Texture to the the 0th Texture Unit
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        let sampler = gl.getUniformLocation(this.prog, 'texture');
        gl.uniform1i(sampler, 0);
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture(show)
	{
        gl.useProgram(this.prog);

        if (show) { gl.uniform1i(this.show_texture, 1); }
        else {gl.uniform1i(this.show_texture, 0); }
	}
    
    // Vertex Shader GLSL
   vertex_shader = `
        uniform int flip_YZ;
        uniform int show_texture;
        uniform mat4 mvp;

        attribute vec2 texture_coordinates;
        attribute vec3 vertex;

        varying vec2 textureCoord;

        void main()
        {
            // Convert to vec4
            vec4 v = vec4(vertex, 1.0);
            // Flip the Y & Z coordinates if necessary
            if(flip_YZ == 1) { v = vec4(v.x, v.z, v.y, v.w); }

            // Move into the canonical view space
            gl_Position = mvp * v;

            // If we're displaying a texture then pass the texture coordinates to the fragment shader
            if(show_texture == 1) { textureCoord = texture_coordinates; }
        }
    `;
    
    // Fragment Shader GLSL
   fragment_shader = `
        precision mediump float;
        precision highp int;

        uniform sampler2D texture;
        uniform int show_texture;

        varying vec2 textureCoord;

        void main()
        {
            if(show_texture != 0) {
                gl_FragColor = texture2D(texture,textureCoord);
            } else {
              float ndcDepth = (2.0 * gl_FragCoord.z - gl_DepthRange.near - gl_DepthRange.far) / (gl_DepthRange.far - gl_DepthRange.near);
              float clipDepth = ndcDepth / gl_FragCoord.w;
              float c = (clipDepth * 0.5) + 0.5;
              gl_FragColor = vec4(c*c*c,0.0,c*c*c,1);
            }
        }
    `;
}
