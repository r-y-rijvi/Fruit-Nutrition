import { Color, MeshPhysicalMaterial, type MeshPhysicalMaterialParameters } from "three";

export interface PieceUniforms {
  uDim: { value: number };
  uHighlight: { value: number };
  uSss: { value: Color };
}

export function pieceUniforms(sss: string): PieceUniforms {
  return { uDim: { value: 0 }, uHighlight: { value: 0 }, uSss: { value: new Color(sss) } };
}

const HEADER = "uniform float uDim;\nuniform float uHighlight;\nuniform vec3 uSss;\nuniform float uSssStrength;\n";

// Fresnel-weighted tint fakes light scattering through the skin edge; uDim desaturates unfocused layers.
const INJECT = /* glsl */ `
  float fruitFresnel = pow(1.0 - saturate(abs(dot(normal, normalize(vViewPosition)))), 2.2);
  outgoingLight += uSss * fruitFresnel * uSssStrength;
  outgoingLight += uSss * uHighlight * 0.16;
  float fruitLum = dot(outgoingLight, vec3(0.299, 0.587, 0.114));
  outgoingLight = mix(outgoingLight, vec3(fruitLum) * 0.36, uDim * 0.84);
`;

export function fruitMaterial(params: MeshPhysicalMaterialParameters, u: PieceUniforms, sssStrength: number): MeshPhysicalMaterial {
  const m = new MeshPhysicalMaterial(params);
  const strength = { value: sssStrength };
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uDim = u.uDim;
    shader.uniforms.uHighlight = u.uHighlight;
    shader.uniforms.uSss = u.uSss;
    shader.uniforms.uSssStrength = strength;
    shader.fragmentShader = HEADER + shader.fragmentShader.replace("#include <opaque_fragment>", INJECT + "#include <opaque_fragment>");
  };
  m.customProgramCacheKey = () => "fruit-sss-1";
  return m;
}
