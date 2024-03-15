var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diffuse coefficient
	vec3  k_s;	// specular coefficient
	float n;	// specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

bool IntersectRay( inout HitInfo hit, Ray ray );

// Shades the given point and returns the computed color.
vec3 Shade(Material mtl, vec3 position, vec3 normal, vec3 view)
{
    // Final output color is black if we're in complete shadow
    vec3 color = vec3(0.0,0.0,0.0);

    // For every direct light source, see if it contributes to our color
	for (int i = 0; i < NUM_LIGHTS; ++i) {
        // Get our 
        Light light = lights[i];

        // Cast a Shadow Ray to see if we're in shadow
        HitInfo hit;
        Ray shadow_ray;
        shadow_ray.pos = position;
        shadow_ray.dir = light.position - position;

        if(IntersectRay(hit, shadow_ray)) { continue; } // Go Next
        else // Compute the color based off the light and BDRF
        {
            // // Light color / intensity
            // vec4 light_color = vec4(1.0, 1.0, 1.0, 1.0);
            // vec4 ambient_light_color = vec4(0.1, 0.1, 0.1, 1.0);
            //
            // // Geometry Component
            // float cos_theta = dot(new_normal, light);
            // float geometry_term = clamp(cos_theta, 0.0, 1.0);
            //
            // // Diffuse Color Component
            // vec4 kd;
            // // If the teture is enabled, grab color from texture, else use purple
            // if(show_texture) { kd = texture2D(texture,textureCoord); } 
            // else { kd = vec4(0.5, 0.25, 0.8, 1.0); }
            // vec4 diffuse = kd * geometry_term;
            //
            // // Specular Color Component
            // vec3 reflection = 2.0 * dot(normalize(new_normal), light) * new_normal - light;
            // reflection = normalize(reflection);
            // vec3 view  = normalize(vec3(-point));
            //
            // // Angle between view direction and light reflection
            // float cos_phi = dot(reflection, view);
            // cos_phi = clamp(cos_phi, 0.0, 1.0);
            // vec4 ks = light_color;
            // vec4 specular = ks * pow(cos_phi, shininess);
            //
            // // Ambient Light Component
            // vec4 ambient = kd * ambient_light_color;
            //
            // // The Show
            // gl_FragColor = light_color * (diffuse + specular) + ambient;

            // ---------------------

            // Vector to the light, from the intersection position
            vec3 to_light = normalize(light.position - position);

            // Geometry Component
            float cos_theta = dot(to_light, normalize(normal));
            float geometry_term = max(cos_theta, 0.0);

            // Diffuse Color Component
            vec3 diffuse = mtl.k_d * geometry_term;

            // Specular material component
            vec3 reflection = 2.0 * dot(to_light, normalize(normal)) * normal - to_light;
            reflection = normalize(reflection);
            vec3 half_angle = normalize(to_light + view); 
            float cos_phi = clamp(dot(half_angle, normal), 0.0, 1.0);
            vec3 specular = mtl.k_s * pow(cos_phi, mtl.n);

            color += light.intensity * (diffuse + specular);
        }
	}
	return color;
}

// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
	hit.t = 1e30;
	bool foundHit = false;
	for ( int i=0; i<NUM_SPHERES; ++i ) {
        Sphere sphere = spheres[i];
        vec3 d = normalize(ray.dir);
        vec3 p = ray.pos;
        vec3 center = sphere.center;
        float r = sphere.radius;
        float a = dot(d,d);
        float b = dot((2.0 * d), (p - center));
        float c = dot((p - center), (p - center)) - pow(r, 2.0);
        float delta = b*b - 4.0 * a * c;
        // If delta is < 0.0 there is no intersection
        if(delta >= 0.0) {
           delta = sqrt(delta);
           // Always smaller, a is length of d so positive; delta is positive
           float t = (-b - delta) / (2.0 * a);
           // If closer, update the HitInfo
           if (t < hit.t && t > 0.0001) {
             hit.t = t;
             hit.position = p + t * d;
             // Ensure the normal vector is a unit vector
             hit.normal = (hit.position - center) / r;
             hit.mtl = sphere.mtl;
             foundHit = true;
           }
        };
	}
	return foundHit;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer( Ray ray )
{
	HitInfo hit;
	if ( IntersectRay( hit, ray ) ) {
		vec3 view = normalize( -ray.dir );
        // Diffuse Color of the Sphere
		vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
		
		// Compute reflections
		vec3 k_s = hit.mtl.k_s; // Final specular color

        // Loop variables
        Ray r;	// this is the reflection ray
        r.pos = hit.position;
        r.dir = 2.0 * dot(view, hit.normal) * hit.normal - view;
        r.dir = normalize(r.dir);
        HitInfo h;	// reflection hit info

		for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
			if ( bounce >= bounceLimit ) break;
			if ( hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0 ) break;
			
			if ( IntersectRay( h, r ) ) {
                // Shade the point (specular)
                vec3 v = (-r.dir);
                vec3 c = Shade(h.mtl, h.position, h.normal, v);
                clr += k_s * c;
                k_s = h.mtl.k_s;

                // Update Loop variables
                r.pos = h.position;
                r.dir = 2.0 * dot(v,h.normal) * h.normal - v;
                r.dir = normalize(r.dir);
                
			} else {
				// The refleciton ray did not intersect with anything,
				// so we are using the environment color
				clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
				break;	// no more reflections
			}
		}
		return vec4( clr, 1 );	// return the accumulated color, including the reflections
	} else {
		return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );	// return the environment color
	}
}
`;
