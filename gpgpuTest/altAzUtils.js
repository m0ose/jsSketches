// ********************************************************************************
// Math Utility Functions

// Vector magnitude
export function mag(v) {
    return Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2)
    // return Math.sqrt(x ** 2 + y ** 2 + z ** 2)
}

// Scale vector
export function scale(s, v) {
    return [s * v[0], s * v[1], s * v[2]]
}

// Vector normalize
export function normalize(v) {
    return scale(1.0 / mag(v), v)
}

// Add/Subtract vectors
export function addVectors(v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]]
}
export function subVectors(v1, v2) {
    return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]]
}

// Vector cross product
export function cross(v1, v2) {
    return [v1[1] * v2[2] - v1[2] * v2[1], v1[2] * v2[0] - v1[0] * v2[2], v1[0] * v2[1] - v1[1] * v2[0]]
}

// Vector dot product
export function dot(v1, v2) {
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]
}

// ********************************************************************************
// Arbitray Axis Rotation

// Arbitray axis rotation (rot_vec_start, rot_vec_end, point, angle)
export function pointRotate3D(p1, p2, p0, theta) {
    // const { sqrt, cos, sin } = Math

    // Setup at origin and normalize rotation vector
    let p = subVectors(p0, p1)
    let N = subVectors(p2, p1)
    let n = normalize(N)

    // Matrix common factors
    let c = Math.cos(theta)
    let t = 1 - Math.cos(theta)
    let s = Math.sin(theta)
    let [X, Y, Z] = n

    // Matrix 'M'
    let d11 = t * X * X + c
    let d12 = t * X * Y - s * Z
    let d13 = t * X * Z + s * Y
    let d21 = t * X * Y + s * Z
    let d22 = t * Y * Y + c
    let d23 = t * Y * Z - s * X
    let d31 = t * X * Z - s * Y
    let d32 = t * Y * Z + s * X
    let d33 = t * Z * Z + c

    // Multiply out
    let q = [0.0, 0.0, 0.0]
    q[0] = d11 * p[0] + d12 * p[1] + d13 * p[2]
    q[1] = d21 * p[0] + d22 * p[1] + d23 * p[2]
    q[2] = d31 * p[0] + d32 * p[1] + d33 * p[2]

    // Translate axis and rotated point back to original location
    const result = addVectors(q, p1)
    return result
}

// ********************************************************************************
// Angle/3D/Panosphere Conversion Functions

// Degrees to Radians and Radians to Degrees functions
export function deg2rad(d) {
    return (d / 360) * 2 * Math.PI
}

export function rad2deg(r) {
    return (r / (2 * Math.PI)) * 360
}

// Radian Az/Alt to 3D
// NOTE: PYTHON VERSION - let v2 = pointRotate3D([0, 0, 0], [0, 0, 1], v1, azi);
export function aziAlt2ThreeD(azi, alt) {
    const v0 = [0, 1, 0]
    const v1 = pointRotate3D([0, 0, 0], [1, 0, 0], v0, alt)
    const v2 = pointRotate3D([0, 0, 0], [0, 0, 1], v1, -1*azi) // P5 VERSION
    return v2
}

// 3D to Radian Az/Alt
export function threeD2AziAlt(p) {
    // const { sign, acos } = Math

    let n = [0, 0, 1]
    let a = [0, 1, 0]

    // Project onto Plane nNormal (z-axis)
    let proj = subVectors(p, scale(dot(p, n), n))
    let nrmMag = mag(proj)
    if (nrmMag == 0) {
        // console.log('WARNING: at extrema of alt/az, azimuth unknown')
        return [0, Math.sign(p[2]) * deg2rad(90)]
    }

    // Calculate Angles
    let nrm = scale(1.0 / nrmMag, proj)
    let dotpAzi = dot(nrm, a)
    let dotpAlt = dot(nrm, p)
    let angleAzi = Math.acos(dotpAzi)
    let angleAlt = Math.acos(dotpAlt)
    if (p[0] < 0) {
        angleAzi = -angleAzi
    }
    if (p[2] < 0) {
        angleAlt = -angleAlt
    }
    return [angleAzi, angleAlt]
}

// Radian Azi/Alt to XY (Panosphere)
export function aziAlt2XY(azi, alt, w, h) {
    let x = (azi / Math.PI + 1) * (w / 2)
    let y = (-alt / (Math.PI / 2) + 1) * (h / 2)
    return [(x + w) % w, (y + h) % h]
}

// XY to Radian Azi/Alt (Panosphere)
export function xy2AziAlt(x, y, w, h) {
    let azi = -(1 - (x / w) * 2) * Math.PI
    let alt = (1 - (y / h) * 2) * (Math.PI / 2)
    return [azi, alt]
}

// ********************************************************************************
// Primary Rotation Functions (Roll/Y-Axis | Altitude/X-Axis | Azimuth/Z-Axis)

export function rolRot(xyz, rol) {
    return pointRotate3D([0, 0, 0], [0, 1, 0], xyz, rol)
}
export function altRot(xyz, alt) {
    return pointRotate3D([0, 0, 0], [1, 0, 0], xyz, alt)
}
export function aziRot(xyz, azi) {
    return pointRotate3D([0, 0, 0], [0, 0, 1], xyz, azi)
}

// ********************************************************************************
// Cant Rotation Functions

// Cant Tangent Vector (Normal to Cant Azimuth and Up (Z-Axis)
export function cantTan(cantAzi) {
    return aziAlt2ThreeD(cantAzi + deg2rad(90), 0)
}

// Cant Up Vector (From Cant Azimuth and Cant Altitude)
export function cantUp(cantAzi, cantAlt) {
    // NOTE: PYTHON VERSION - return scale(-1, aziAlt2ThreeD(cantAzi, deg2rad(90) - cantAlt));
    return aziAlt2ThreeD(cantAzi, deg2rad(90) + cantAlt) // P5 VERSION
}

// Rotate about cant "tangent" vector
export function rotCantTan(xyz, cantAzi, cantAlt) {
    return pointRotate3D([0, 0, 0], cantTan(cantAzi), xyz, cantAlt)
}

// Rotate about cant "up" vector (Note: -1 scale to invert rotation)
export function rotCantUp(xyz, cantAzi, cantAlt, cantOff) {
    return pointRotate3D([0, 0, 0], cantUp(cantAzi, cantAlt), xyz, cantOff)
}

// ********************************************************************************
// Complete UV to Azi/Alt functions

// UV to Alt/Az Function via Pinhole Camera Model (FOV and Focal Length)
export function uv2AziAlt(u, v, fH, fV) {
    // Pinhole Camera Model
    let fov = Math.max(fH, fV)
    let fl = 1 / Math.tan(fov / 2)

    // Scale UV to FOV
    let nU = (u * fH) / fov
    let nV = (v * fV) / fov

    // Vector on X/Z plane out (Y Focal Length (fl))
    let v0 = [nU, fl, nV]

    // Normalize and Convert to Azi/Alt
    let v1 = normalize(v0)
    let v2 = threeD2AziAlt(v1)
    return v2
}

// Alt/Az to UV Function via Pinhole Camera Model (FOV and Focal Length)
export function aziAlt2UV(azi, alt, fH, fV) {
    // Pinhole Camera Model
    let fov = Math.max(fH, fV)
    let fl = 1 / Math.tan(fov / 2)

    // Convert to 3D
    let v2 = aziAlt2ThreeD(azi, alt)

    // Check if Negative Y because can't map to UV (Behind Cam)
    if (v2[1] < 0) {
        //console.log("Warning: AziAlt2UV: Negative Y Value, no UV generated");
        return [-999, -999] // GPU.js does not handle NAN so -999 will need to represent NaN
    }

    // Scale Vector to Focal Length
    let v1 = scale(fl / v2[1], v2)

    // Vector on X/Z plane to UV
    let [nU, fl_, nV] = v1
    let u = (nU * fov) / fH
    let v = (nV * fov) / fV
    return [u, v]
}

// ********************************************************************************
// Radial distortion model
export function radialDistortion(u, v, k_1, k_2, k_3, k_4) {
    // Calculate Radius and distortion model value
    let radius = Math.sqrt(u ** 2 + v ** 2) //distance from the center of image
    let m_r =
        1 +
        k_1 * radius +
        k_2 * radius ** 2 +
        k_3 * radius ** 3 +
        k_4 * radius ** 4

    // Apply the model
    let nu = u * m_r
    let nv = v * m_r
    return [nu, nv]
}

// Radial undistortion model
export function radialUndistortion(u, v, k_1, k_2, k_3, k_4) {
    // Calculate Radius and distortion model value
    let radius = Math.sqrt(u ** 2 + v ** 2) //distance from the center of image
    let m_r =
        1 +
        k_1 * radius +
        k_2 * radius ** 2 +
        k_3 * radius ** 3 +
        k_4 * radius ** 4

    // Apply the model
    let nu = u / m_r
    let nv = v / m_r
    return [nu, nv]
}

// ********************************************************************************
// Complete Cant and Un-cant Functions

// Rotate Az/Alt with given camera rotation values
export function cantAziAlt(azi, alt, camAz, camAlt, cantAz, cantAlt, cantOff) {
    // Convert to 3D
    let v0 = aziAlt2ThreeD(azi, alt)

    // Rotate alt/az and cant tan/up
    let v1 = altRot(v0, camAlt)
    let v2 = aziRot(v1, -camAz)
    let v3 = rotCantTan(v2, cantAz, cantAlt)
    let v4 = rotCantUp(v3, cantAz, cantAlt, cantOff)

    // Convert to azi/alt and return
    return threeD2AziAlt(v4)
}

// Un-Rotate Az/Alt with given camera rotation values
export function uncantAziAlt(azi, alt, camAz, camAlt, cantAz, cantAlt, cantOff) {
    // Convert to 3D
    let v4 = aziAlt2ThreeD(azi, alt)

    // Rotate in reverse cant up/tan and az/alt
    let v3 = rotCantUp(v4, cantAz, cantAlt, -cantOff)
    let v2 = rotCantTan(v3, cantAz, -cantAlt)
    let v1 = aziRot(v2, camAz)
    let v0 = altRot(v1, -camAlt)

    // Convert to azi/alt and return
    return threeD2AziAlt(v0)
}

// ********************************************************************************
// UV Canting and Az/Alt Un-Canting

export function cantUV2AziAlt(
    u,
    v,
    fH,
    fV,
    camAz,
    camAlt,
    cantAz,
    cantAlt,
    cantOff,
    r_0,
    r_1,
    r_2,
    r_3
) {
    // Remove radial distortion
    let [nu, nv] = radialUndistortion(u, v, r_0, r_1, r_2, r_3)

    let [azi, alt] = uv2AziAlt(nu, nv, fH, fV)
    let [cAzi, cAlt] = cantAziAlt(
        azi,
        alt,
        camAz,
        camAlt,
        cantAz,
        cantAlt,
        cantOff
    )
    return [cAzi, cAlt]
}

export function uncantAziAlt2UV(
    azi,
    alt,
    fH,
    fV,
    camAz,
    camAlt,
    cantAz,
    cantAlt,
    cantOff,
    r_0 = 0,
    r_1 = 0,
    r_2 = 0,
    r_3 = 0
) {
    let [ucAzi, ucAlt] = uncantAziAlt(
        azi,
        alt,
        camAz,
        camAlt,
        cantAz,
        cantAlt,
        cantOff
    )
    let [u, v] = aziAlt2UV(ucAzi, ucAlt, fH, fV)

    // Apply radial distortion
    let [nu, nv] = radialDistortion(u, v, r_0, r_1, r_2, r_3)
    return [nu, nv]
}
