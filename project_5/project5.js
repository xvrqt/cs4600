// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
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
    return MatrixMult(translationMatrix, rotationMatrix);
}


// [TO-DO] Complete the implementation of the following class.

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
        // Pointer to the model-view transformation matrix
        this.mv = gl.getUniformLocation(this.prog, 'mv');

        // Initialize the the flipYZ to the identity matrix
        this.flipYZ = gl.getUniformLocation(this.prog, 'flipYZ');
        let flipYZ_transform = document.getElementById('swap-yz').checked ? this.yz_flip_matrix : this.identity_matrix;
        gl.uniformMatrix4fv(this.flipYZ, false, flipYZ_transform);

        // Initialize if we show the texture
        this.show_texture = gl.getUniformLocation(this.prog, 'show_texture');
        let checked = document.getElementById('show-texture').checked ? 1 : 0;
        gl.uniform1i(this.show_texture, checked);
		
		// Get the ids of the vertex attributes in the shaders
		this.vertex = gl.getAttribLocation(this.prog, 'vertex');
        this.vert_buffer = gl.createBuffer();

        // Pointer to the texture coordinates
        this.txc = gl.getAttribLocation(this.prog, 'txc');
        this.tex_buffer = gl.createBuffer();

        // Pointer to the normals
        this.normal = gl.getAttribLocation(this.prog, 'normal');
        this.normal_buffer = gl.createBuffer();
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.
		this.numTriangles = vertPos.length / 3;
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// [TO-DO] Complete the WebGL initializations before drawing

		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
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
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the light direction.
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the shininess.
	}

    // Convenience
    identity_matrix = Array(1,0,0,0,  0,1,0,0,  0,0,1,0,  0,0,0,1);
    yz_flip_matrix  = Array(1,0,0,0,  0,0,1,0,  0,1,0,0,  0,0,0,1);

    // Vertex Shader GLSL
   vertex_shader = `
        uniform mat4 mv;
        uniform mat4 mvp;
        uniform mat4 flipYZ;

        uniform int show_texture;

        attribute vec2 txc;
        attribute vec3 normal;
        attribute vec3 vertex;

        varying vec2 textureCoord;

        void main()
        {
            // flipYZ will be the identity matrix if swapYZ is not set
            gl_Position = mvp * flipYZ * vec4(vertex,1);
            if(show_texture != 0) { textureCoord = txc; }
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
