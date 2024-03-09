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
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
    vec3 color = vec3(0.0,0.0,0.0);
	for ( int i=0; i<NUM_LIGHTS; ++i ) {
        Light light = lights[i];
        bool shadowed = false;

        HitInfo hit;
        Ray shadow_ray;
        shadow_ray.pos = position;
        shadow_ray.dir = light.position - position;

        if(IntersectRay(hit, shadow_ray)) { shadowed = true; }

        if(!shadowed)
        {
            // Geometry Component
            float cos_theta = dot(normalize(light.position), normal);
            float geometry_term = max(cos_theta, 0.0);

            // Diffuse Color Component
            vec3 diffuse = geometry_term * mtl.k_d;

            // Specular material component
            vec3 r = 2.0 * dot(light.position, normal) * normal - light.position;
            r = normalize(r);
            vec3 h = normalize(light.position + view) / (length(light.position + view));
            float cos_phi = max(dot(view, r), 0.0);
            //cos_phi = max(dot(h, normal), 0.0);
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
