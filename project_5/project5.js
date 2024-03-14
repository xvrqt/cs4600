// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix(translationX, translationY, translationZ, rotationX, rotationY)
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
	let rot_XM= Array(1,0,0,0, 0,cos(rx),sin(rx),0, 0,-sin(rx),cos(rx),0, 0,0,0,1); 

    /* Rotation Around X Axis
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
    return MatrixMult(translation_matrix, rotation_matrix);
}

class MeshDrawer
{
	constructor()
	{
		// Compile the shader program
		this.prog = InitShaderProgram(this.vertex_shader, this.fragment_shader);
        gl.useProgram(this.prog);
		
        // Pointer to the model-view transformation matrix
        this.mv = gl.getUniformLocation(this.prog, 'mv');
		// Pointer to the viewport perspective transformation matrix
		this.mvp = gl.getUniformLocation(this.prog, 'mvp');
        // Pointer to the normal matrix (inverse transpose of 'mv', the 3x3)
        this.mvn = gl.getUniformLocation(this.prog, 'mvn');

        // Pointer to the light direction, set default light direction
        this.light = gl.getUniformLocation(this.prog, 'light');
        this.light_direction = Array(1,1,1);
        gl.uniform3fv(this.light, this.light_direction);
        
        // Pointer to the shininess value
        this.shininess = gl.getUniformLocation(this.prog, 'shininess');
        this.alpha = document.getElementById('shininess-exp').value;
        gl.uniform1f(this.shininess, this.alpha);

        // Initialize the the flipYZ to the identity matrix
        this.flip_YZ = gl.getUniformLocation(this.prog, 'flip_YZ');
        let flip_YZ_transform = document.getElementById('swap-yz').checked;
        flip_YZ_transform = flip_YZ_transform ? this.yz_flip_matrix : this.identity_matrix;
        gl.uniformMatrix4fv(this.flip_YZ, false, flip_YZ_transform);

        // Initialize if we show the texture
        this.show_texture = gl.getUniformLocation(this.prog, 'show_texture');
        let checked = document.getElementById('show-texture').checked ? 1 : 0;
        gl.uniform1i(this.show_texture, checked);

		// Get the ids of the vertex attributes in the shaders
		this.vertex = gl.getAttribLocation(this.prog, 'vertex');
        this.vertex_buffer = gl.createBuffer();

        // Pointer to the texture coordinates
        this.texture_coordinates = gl.getAttribLocation(this.prog, 'texture_coordinates');
        this.texture_coordinates_buffer = gl.createBuffer();

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
	setMesh(vertPos, texCoords, normals)
	{
        gl.useProgram(this.prog);

        // Texture
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texture_coordinates_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        // Normals
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        // Vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        // Set the total number of triangles we will draw
		this.numTriangles = vertPos.length / 3;
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ(swap)
	{
        gl.useProgram(this.prog);
        let matrix = swap ? this.yz_flip_matrix : this.identity_matrix;
		gl.uniformMatrix4fv(this.flip_YZ, false, matrix);
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw(matrixMVP, matrixMV, matrixNormal) 
	{
        gl.useProgram(this.prog);

        // Set the texture coordinates array, and attribute pointer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texture_coordinates_buffer);
        gl.vertexAttribPointer(this.texture_coordinates, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.texture_coordinates);

        // Set the vertices array, and attribute pointer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
        gl.vertexAttribPointer(this.normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.normal);

        // Set the vertices array, and attribute pointer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
        gl.vertexAttribPointer(this.vertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vertex);

        // Set the perspective, and view-model matrices as uniform variables
		gl.uniformMatrix4fv(this.mv,  false, matrixMV);
		gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
		gl.uniformMatrix3fv(this.mvn, false, matrixNormal);

        // Set the light direction
        gl.uniform3fv(this.light, this.light_direction);

        // Set Camera View Vector
        this.camera_v = Array(matrixMV[0], matrixMV[5], matrixMV[10], matrixMV[15]);
        gl.uniform4fv(this.camera, this.camera_v);

        // Set the alpha term of specular highlighting (aka 'shininess')
        gl.uniform1f(this.shininess, this.alpha);

        // The Show
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img)
	{
        gl.useProgram(this.prog);

        // Create the texture
        const texture = gl.createTexture();
        const mipmaplvl = 0;

        gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, mipmaplvl, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);

        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        // Activate the 0th Texture Unit and Bind our texture to it
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(gl.getUniformLocation(this.prog, 'texture'), 0);
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture(show)
	{
        gl.useProgram(this.prog);

        if (show) { gl.uniform1i(this.show_texture, 1); }
        else { gl.uniform1i(this.show_texture, 0); }
	}
	
	// This method is called to set the incoming light direction
    // This is the omega term, it points *at* the light 
    // This is *ambiguous* in the project notes, and was very confusing!
	setLightDir(x, y, z) { this.light_direction = Array(x,y,z); }
	
	// This method is called to set the shininess of the material
	setShininess(shininess) { this.alpha = shininess; }

    // Convenience matrices
    identity_matrix = Array(1,0,0,0,  0,1,0,0,  0,0,1,0,  0,0,0,1);
    yz_flip_matrix  = Array(1,0,0,0,  0,0,1,0,  0,1,0,0,  0,0,0,1);

    // Vertex Shader GLSL
   vertex_shader = `
        uniform mat4 mv;
        uniform mat4 mvp;
        uniform mat4 flip_YZ;
        uniform mat3 mvn;

        uniform bool show_texture;

        attribute vec2 texture_coordinates;
        attribute vec3 normal;
        attribute vec3 vertex;

        varying vec2 textureCoord;
        varying vec3 new_normal;
        varying vec4 point;

        void main()
        {
            vec4 v = vec4(vertex, 1);

            // flipYZ will be the identity matrix if swapYZ is not set
            // Transform the vertex into model-view-projection space
            gl_Position = mvp * flip_YZ * v;

            // Transform the normal vector, and vertex location into model-view space
            new_normal = mvn * mat3(flip_YZ) * normal;
            point      = mv  *      flip_YZ  * v;

            // If we're showing the texture, pass the texture coordinates to the fragment shader
            if(show_texture) { textureCoord = texture_coordinates; }
        }
    `;
    
    // Fragment Shader GLSL
   fragment_shader = `
        precision highp int;
        precision mediump float;

        uniform bool show_texture;
        uniform float shininess;
        uniform vec3 light; // Normalized (omega term; points at light)

        uniform sampler2D texture;

        varying vec2 textureCoord;
        varying vec3 new_normal;
        varying vec4 point;

        void main()
        {
            // Light color / intensity
            vec4 light_color = vec4(1.0, 1.0, 1.0, 1.0);
            vec4 ambient_light_color = vec4(0.1, 0.1, 0.1, 1.0);

            // Geometry Component
            float cos_theta = dot(new_normal, light);
            float geometry_term = clamp(cos_theta, 0.0, 1.0);

            // Diffuse Color Component
            vec4 kd;
            // If the teture is enabled, grab color from texture, else use purple
            if(show_texture) { kd = texture2D(texture,textureCoord); } 
            else { kd = vec4(0.5, 0.25, 0.8, 1.0); }
            vec4 diffuse = kd * geometry_term;

            // Specular Color Component
            vec3 reflection = 2.0 * dot(normalize(new_normal), light) * new_normal - light;
            reflection = normalize(reflection);
            vec3 view  = normalize(vec3(-point));

            // Angle between view direction and light reflection
            float cos_phi = dot(reflection, view);
            cos_phi = clamp(cos_phi, 0.0, 1.0);
            vec4 ks = light_color;
            vec4 specular = ks * pow(cos_phi, shininess);

            // Ambient Light Component
            vec4 ambient = kd * ambient_light_color;

            // The Show
            gl_FragColor = light_color * (diffuse + specular) + ambient;
        }
    `;
}
