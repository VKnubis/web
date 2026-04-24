
// [COMBO] {"material":"Invert mask","combo":"INVERT","type":"options","default":0}

uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform sampler2D g_Texture1; // {"combo":"OPACITY","default":"util/white","label":"ui_editor_properties_opacity_mask","material":"mask","mode":"opacitymask","paintdefaultcolor":"1 1 1 1"}
uniform float u_strength; // {"material":"Strength","default":1,"range":[0,5]}
uniform float u_radius; // {"material":"Radius","default":1,"range":[0,5]}
uniform vec2 g_TexelSize;

varying vec4 v_TexCoord;

#define Src(a,b) texSample2D(g_Texture0, fragCoord + vec2(a,b) * g_TexelSize)

vec4 sharpen(vec2 fragCoord, float mask) {
	vec4 orig = Src(0, 0);
	vec4 c1 = Src(-u_radius, -u_radius);
	vec4 c2 = Src(0, -u_radius);
	vec4 c3 = Src(u_radius,-u_radius);
	vec4 c4 = Src(-u_radius, 0);
	vec4 c5 = Src(u_radius, 0);
	vec4 c6 = Src(-u_radius, u_radius);
	vec4 c7 = Src(0, u_radius);
	vec4 c8 = Src(u_radius, u_radius);
	vec4 blur = (c1 + c3 + c6 + c8 + 2 * (c2 + c4 + c5 + c7) + 4 * orig)/16;
	vec4 corr = (1 + u_strength * mask) * orig - u_strength * mask * blur;
	return corr;
}

void main() {
	vec4 albedo = texSample2D(g_Texture0, v_TexCoord.xy);
	float mask = texSample2D(g_Texture1, v_TexCoord.xy);
	mask = INVERT ? 1 - mask : mask;
	if (mask > 0.1) albedo = sharpen(v_TexCoord.xy, mask);
	gl_FragColor = albedo;
}