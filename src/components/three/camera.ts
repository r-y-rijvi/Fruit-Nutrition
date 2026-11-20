/** Shared camera targets; GSAP tweens these and the CameraRig eases the real camera toward them. */
export const CAM_WHOLE = { z: 10.6, lookY: -0.4 };
export const CAM_LAYERS = { z: 9.4, lookY: 0.22 };
export const cam = { z: CAM_WHOLE.z, lookY: CAM_WHOLE.lookY };
export const prog = { split: 0, spread: 0, swap: 1 };
/** Horizontal lens offset so the fruit sits right of the hero copy on wide screens. */
export const stage = { x: 0 };
