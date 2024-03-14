// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
var steps = 0;
var prev_pos = null;
function SimTimeStep( dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution )
{
    // if(steps > 2) { return; }
    // console.log("Gravity: ", gravity);
    // console.log("particleMass: ", particleMass);
    // Gravity is given as an acceleration vector, so the force is proportional to the mass
    // This initializes our `forces` array with a value we know will always be present
    let g_force = gravity.copy();
    g_force.scale(particleMass);
	let forces = new Array(positions.length).fill(g_force);

    // Calculate spring forces on points
    springs.map((s, i) => {
        // Get the ends of the spring
        let p0 = { pos: positions[s.p0].copy(), vel: velocities[s.p0].copy() };
        let p1 = { pos: positions[s.p1].copy(), vel: velocities[s.p1].copy() };

        // Determine the direction of the spring force 
        let spring_length = p1.pos.sub(p0.pos);
        p0.d = spring_length.copy();
        p0.d.normalize(); // Normalize, because it's scaled by the spring coefficient
        // This is just the inverse of the other
        p1.d = p0.d.copy();
        p1.d.scale(-1.0);
        spring_length = spring_length.len();
        //console.log("Spring Length: ", spring_length);
        // console.log("p0: ", p0);
        // console.log("p1: ", p1);

        // Calculate the force direction scalar
        let spring_diff = spring_length - s.rest;
        let spring_force_scalar = stiffness * spring_diff;
        
        // Add spring force
        p0.force = p0.d.copy();
        p0.force.scale(spring_force_scalar); 
        p1.force = p1.d.copy();
        p1.force.scale(spring_force_scalar); 
        // console.log("p0.force: ", p0.force);
        // console.log("p1.force: ", p1.force);

        forces[s.p0] = forces[s.p0].add(p0.force);
        forces[s.p1] = forces[s.p1].add(p1.force);

        // Calculate the old position of the points, by subtracting their velocities
        p0.vel.scale(-1.0);
        p0.old_pos = p0.pos.add(p0.vel);
        p1.vel.scale(-1.0);
        p1.old_pos = p1.pos.add(p1.vel);

        // Calculate the previous spring length
        let old_sl = p1.old_pos.sub(p0.old_pos);
        old_sl = old_sl.len();
        // console.log("DAMPING: ", damping);
        // console.log("Old Spring Lenth: ", old_sl);

        // Calculate how fast the length is changing
        spring_diff = spring_length - old_sl;
        // console.log("Spring Diff: ", spring_diff);
        let spring_rate = spring_diff;
        // console.log("Spring Rate: ", spring_rate);

        // Calculate the Damping Force
        let spring_damp_scalar = damping * spring_rate;
        p0.force = p0.d.copy();
        p0.force.scale(spring_damp_scalar);
        p1.force = p1.d.copy();
        p1.force.scale(spring_damp_scalar);

        forces[s.p0] = forces[s.p0].add(p0.force);
        forces[s.p1] = forces[s.p1].add(p1.force);
    });
    // We will calculate forces first
    // console.log("Positions: ", positions);
    // console.log("Velocities: ", velocities);
    // console.log("Forces: ", forces);
    // console.log(springs);

    // Update velocities
    velocities.map((v, i) => {
        let force = forces[i].copy();
        // Acceleration = Force / Mass
        let acceleration = force.div(particleMass);
        acceleration.scale(dt);
        // New velocity adds the acceleration that occured of the timestep
        v = v.add(acceleration);
        velocities[i] = v;
    });
 
    // Update positions
    positions.map((p, i) => {
        // New velocity adds the acceleration that occured of the timestep
        let v = velocities[i].copy();
        v.scale(dt);

        p = p.add(v);
        positions[i] = p;
    });
    steps++;
	
    // Check if any position is out of bounds, and "bounce" it instead
    // TODO: Make this more sophisticated, or at least readable lmao
    positions.map((p, i) => {
        let rbce = restitution;
        let diff = {x: Math.abs(p.x) - 1, y: Math.abs(p.y) - 1, z: Math.abs(p.z) - 1}; 
        let rb = {x: rbce * diff.x, y: rbce * diff.y, z: rbce * diff.z};
        if (diff.x > 0) { let a = p.x > 0 ? -1 : 1; positions[i].x = (p.x + (a * diff.x) + (a * rb.x)); velocities[i].x *= -rbce; }
        if (diff.y > 0) { let a = p.y > 0 ? -1 : 1; positions[i].y = (p.y + (a * diff.y) + (a * rb.y)); velocities[i].y *= -rbce; }
        if (diff.z > 0) { let a = p.z > 0 ? -1 : 1; positions[i].z = (p.z + (a * diff.z) + (a * rb.z)); velocities[i].z *= -rbce; }
    });
	
}

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


class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{

		// Compile the shader program
		this.prog = InitShaderProgram(this.vertex_shader, this.fragment_shader);
        gl.useProgram(this.prog);
		
        // Pointer to the model-view transformation matrix
        this.mv = gl.getUniformLocation(this.prog, 'mv');
		// Pointer to the viewport perspective transformation matrix
		this.mvp = gl.getUniformLocation(this.prog, 'mvp');
        // Pointer to the normal matrix (inverse transpose of 'mv')
        this.mvn = gl.getUniformLocation(this.prog, 'mvn');

        // Pointer to the light direction
        this.light = gl.getUniformLocation(this.prog, 'light');
        this.light_direction = Array(1,1,1);
        gl.uniform3fv(this.light, this.light_direction);
        
        // Pointer to the camera
        this.camera = gl.getUniformLocation(this.prog, 'camera');

        // Pointer to the shininess value
        this.shininess = gl.getUniformLocation(this.prog, 'shininess');
        this.alpha = document.getElementById('shininess-exp').value;
        gl.uniform1f(this.shininess, this.alpha);

        // Initialize the the flipYZ to the identity matrix
        this.flipYZ = gl.getUniformLocation(this.prog, 'flipYZ');
        let flipYZ_transform = this.identity_matrix; 
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
        // Texture
        gl.useProgram(this.prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        // Normals
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        // Vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vert_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
		this.numTriangles = vertPos.length / 3;
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
        gl.useProgram(this.prog);
        let matrix = swap ? this.yz_flip_matrix : this.identity_matrix;
		gl.uniformMatrix4fv(this.flipYZ, false, matrix);
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
        gl.useProgram(this.prog);

        // Set the texture coordinates array, and attribute pointer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tex_buffer);
        gl.vertexAttribPointer(this.txc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.txc);

        // Set the vertices array, and attribute pointer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
        gl.vertexAttribPointer(this.normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.normal);

        // Set the vertices array, and attribute pointer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vert_buffer);
        gl.vertexAttribPointer(this.vertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vertex);

        // Set the perspective, and view-model matrices as uniform variables
		gl.uniformMatrix4fv(this.mv, false, matrixMV);
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
	setTexture( img )
	{
        // Create the texture
        const mipmaplvl = 0;
        const texture = gl.createTexture();
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
	showTexture( show )
	{
        gl.useProgram(this.prog);
        if (show) { gl.uniform1i(this.show_texture, 1); }
        else {gl.uniform1i(this.show_texture, 0); }
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
        this.light_direction = Array(x,y,z);
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
        this.alpha = shininess;
	}

    // Convenience
    identity_matrix = Array(1,0,0,0,  0,1,0,0,  0,0,1,0,  0,0,0,1);
    yz_flip_matrix  = Array(1,0,0,0,  0,0,1,0,  0,1,0,0,  0,0,0,1);

    // Vertex Shader GLSL
   vertex_shader = `
        uniform mat4 mv;
        uniform mat4 mvp;
        uniform mat4 flipYZ;
        uniform mat3 mvn;

        uniform int show_texture;

        attribute vec2 txc;
        attribute vec3 normal;
        attribute vec3 vertex;

        varying vec2 textureCoord;
        varying vec3 new_normal;
        varying vec3 point;

        void main()
        {
            // flipYZ will be the identity matrix if swapYZ is not set
            // Transform the vertex into model-view-projection space
            gl_Position = mvp * flipYZ * vec4(vertex,1);

            // Transform the normal vector, and vertex location into model-view space
            new_normal = mvn * mat3(flipYZ) * normal;
            point = mat3(mv) * mat3(flipYZ) * vertex;

            // If we're showing the texture, pass the texture coordinates to the fragment shader
            if(show_texture != 0) { textureCoord = txc; }
        }
    `;
    
    // Fragment Shader GLSL
   fragment_shader = `
        precision highp int;
        precision mediump float;

        uniform int show_texture;
        uniform float shininess;

        uniform sampler2D texture;

        varying vec2 textureCoord;
        varying vec3 new_normal;
        uniform vec3 light;
        varying vec3 point;

        void main()
        {
            // Light color + intensity
            vec4 light_color = vec4(1,1,1,1);
            vec4 ambient_light_color = vec4(.1,.1,.1,1.0);

            // Geometry Component
            vec3 nn = normalize(new_normal);
            float cos_theta = dot(new_normal, normalize(light + point));
            float geometry_term = clamp(cos_theta, 0.0, 1.0);

            // Diffuse Color Component
            vec4 diffuse_color;
            // If the teture is enabled, grab our base color from the texture
            if(show_texture != 0) { diffuse_color = texture2D(texture,textureCoord); } 
            // Grab a default color
            else { diffuse_color = vec4(0.5,0.25,0.8,1.0); }
            vec4 diffuse = geometry_term * diffuse_color * light_color;

            // Ambient Light Component
            vec4 ambient = ambient_light_color * diffuse_color;

            // Specular material component
            vec3 l = light - point;
            vec3 r = 2.0 * dot(-l, nn) * nn + l;
            r = normalize(r);
            vec3 view = normalize(-point);
            float cos_phi = dot(r, view);
            cos_phi = clamp(cos_phi, 0.0, 1.0);
            vec4 specular = light_color * pow(cos_phi, shininess);

            gl_FragColor = specular + diffuse;
        }
    `;
}

