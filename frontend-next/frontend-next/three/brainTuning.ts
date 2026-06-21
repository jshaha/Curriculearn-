export const YAW_MAX = 0.58; // Increase for wider horizontal follow range.
export const PITCH_MAX = 0.34; // Increase for wider vertical follow range.
export const ROTATION_LERP = 0.11; // Increase for snappier rotation response.
export const FOCUS_BLEND_HOVER = 0.78; // Increase for stronger region lock-on while hovering.
export const FOCUS_YAW_MAX = 0.9; // Max yaw toward hovered region.
export const FOCUS_PITCH_MAX = 0.55; // Max pitch toward hovered region.
export const FOCUS_SLERP = 0.12; // Quaternion slerp factor while focusing.
export const CURSOR_BLEND_WHILE_FOCUS = 0.15; // Cursor influence retained while focus is active.

export const SPRING_K = 0.075; // Increase to tighten spring-back to rest positions.
export const DAMPING = 0.9; // Lower for more motion; higher for faster settling.
export const REPULSE_RADIUS_PX = 88; // Screen-space radius around cursor that receives repulsion.
export const REPULSE_STRENGTH = 0.11; // Repulsion impulse strength in view-plane direction.
export const MAX_DISPLACE = 0.045; // Max local displacement from rest to preserve cortex silhouette.
export const FRONT_THRESHOLD = 0.12; // Higher = stricter front-face-only repulsion.
export const FRONT_DEPTH_WINDOW = 0.34; // Depth slice around camera-facing half (clipW space).

export const POINT_COUNT_TOTAL = 36000; // Higher sampling density for a sharper cortex silhouette.
export const POINT_COUNT = 4200; // Legacy fallback for old procedural data paths.
export const POINT_SIZE = 0.03; // Increase point diameter for chunkier cortex rendering.
export const POINT_OPACITY = 0.82; // Baseline cortex opacity.
export const DIM_FACTOR = 0.34; // Lower values keep highlight color truer by dimming base cloud more.
export const HALO_SCALE = 1.8; // Increase for a wider glow halo.
export const HALO_OPACITY = 0.15; // Increase for a stronger halo layer.
export const HALO_TINT = "#f2f0ea"; // Keep halo neutral so orange remains the only accent.
export const BLENDING_MODE: "additive" | "normal" = "normal"; // Switch glow style.
export const OVERLAY_POINT_SCALE = 1; // Keep highlight points exactly the same size as base points.
export const OVERLAY_OPACITY = 1; // Hover highlight visibility without changing point size.
export const OVERLAY_BLEND: "additive" | "normal" = "normal"; // Use normal blending for true accent color fidelity.
export const OVERLAY_FADE_LERP = 0.2; // Hover overlay fade speed in rAF.
export const SPOT_FRACTION = 0.06; // Fraction of points sampled into each nav spot cluster.

export const CAMERA_DISTANCE = 4.2;
export const CAMERA_FOV = 36;
export const BRAIN_RADIUS = 1.28;
export const TARGET_SIZE = 2.0; // Normalize largest bbox dimension to this size.
export const FOG_NEAR = 7.0; // Keep fog subtle while preserving visibility at camera distance.
export const FOG_FAR = 12.0; // Must be beyond camera-to-center distance to avoid full fade-out.

export const REDUCED_MOTION_ROTATION_SCALE = 0.18;
export const SCROLL_ROTATION_SCALE = 0.45;
export const MODAL_ROTATION_SCALE = 0.08;
export const NAVIGATION_CURSOR_BLEND = 0; // Cursor influence while transitioning to a section route.
export const NAVIGATION_SCALE_TARGET = 1; // Keep landing brain scale stable; route transition is handled by overlay fade.
export const NAVIGATION_Y_TARGET = 0; // Keep landing brain centered during route fade.
export const NAVIGATION_TRANSFORM_LERP = 0.16; // Transform smoothing during route transition.
export const SECTION_HEADER_SCALE = 1; // Final scale for full-brain context header.
export const SECTION_HEADER_Y = 0.08; // Lift the section header brain so the lower lobe does not clip against following text.
export const SECTION_HEADER_CAMERA_Z = 3.1;
export const SECTION_HEADER_CAMERA_FOV = 33;
export const SECTION_HEADER_CAMERA_LERP = 0.1;
export const SECTION_HEADER_TRANSFORM_LERP = 0.1; // Scroll/header transform smoothing on section pages.

export const REPULSION_PLANE_Z = 0;
export const PICK_THRESHOLD = 0.11;
export const ANCHOR_SCREEN_FALLBACK_PX = 16;
export const LABEL_LINE_PX = 84; // Base leader line height for hovered section label.
export const LABEL_OFFSET_PX = 10; // Vertical easing offset for label reveal.
