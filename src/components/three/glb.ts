import * as THREE from "three";
import {
  GLTFLoader,
  type GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/**
 * `useLoader(GLTFLoader, url, configureGltfLoader)` — wires the meshopt
 * decoder that gltfpack-compressed GLBs need. `MeshoptDecoder` is bundled
 * (imported from three's examples), so it instantiates WebAssembly from
 * embedded bytes with no external wasm fetch. That embedded-bytes path is
 * why the CSP needs `'wasm-unsafe-eval'` in `script-src` (see
 * public/_headers + vercel.json).
 */
export function configureGltfLoader(loader: GLTFLoader) {
  loader.setMeshoptDecoder(MeshoptDecoder);
}

/**
 * Pulls the first Mesh's geometry out of a loaded glTF scene as a fresh
 * clone, baking the node's world transform onto it. The raw STL path had a
 * single geometry at the origin with no node hierarchy; gltfpack may bake a
 * transform onto the mesh node, so we flatten `matrixWorld` into the geometry
 * BEFORE the caller's center/scale math runs — otherwise a translated or
 * rotated node would throw off the bounding-box centering.
 *
 * The returned BufferGeometry is owned by the caller and must be disposed.
 */
export function extractGeometry(gltf: GLTF): THREE.BufferGeometry {
  gltf.scene.updateMatrixWorld(true);

  let mesh: THREE.Mesh | null = null;
  gltf.scene.traverse((obj) => {
    if (!mesh && obj instanceof THREE.Mesh) {
      mesh = obj;
    }
  });

  if (!mesh) {
    throw new Error("glTF scene contained no mesh geometry");
  }

  const source = mesh as THREE.Mesh;
  const geom = dequantize(source.geometry);
  geom.applyMatrix4(source.matrixWorld);
  return geom;
}

/**
 * gltfpack stores positions as normalized int16 (KHR_mesh_quantization),
 * often interleaved. Transforming such a geometry in place is destructive:
 * applyMatrix4 / translate / scale write world-space floats back through
 * setXYZ into the int16 normalized buffer, clamping every coordinate to
 * [-1, 1] — the mesh collapses to a sliver. Rebuild a plain float32,
 * de-interleaved geometry via the attribute getters (which denormalize),
 * so the caller's transform + center/scale math operates on real floats.
 * Normals are omitted: every caller recomputes them after scaling.
 */
function dequantize(source: THREE.BufferGeometry): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const pos = source.attributes.position;
  const arr = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i += 1) {
    arr[3 * i] = pos.getX(i);
    arr[3 * i + 1] = pos.getY(i);
    arr[3 * i + 2] = pos.getZ(i);
  }
  geom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  if (source.index) geom.setIndex(source.index.clone());
  return geom;
}
