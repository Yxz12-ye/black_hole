// Simple fullscreen triangle vertex shader
#version 130

out vec2 v_uv;

void main() {
    // Fullscreen triangle in clip space
    const vec2 positions[3] = vec2[3](
        vec2(-1.0, -1.0),
        vec2(3.0, -1.0),
        vec2(-1.0, 3.0)
    );

    vec2 pos = positions[gl_VertexID];
    v_uv = 0.5 * pos + 0.5;
    gl_Position = vec4(pos, 0.0, 1.0);
}

