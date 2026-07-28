#!/usr/bin/env python3
"""
Render the §5.9 poster stills for every forged part, offline.

WHY THIS EXISTS
---------------
`/renders`, `/renders/[slug]` and `/products` all show a static image of a
part before (or instead of) a live canvas: it is the no-WebGL fallback, the
reduced-motion fallback, the server-rendered HTML a crawler indexes, and the
placeholder the canvas fades in over. §5.9 requires those stills to be
rendered from the *same rig* as the live scene, so the fade-in is invisible.

The renderer is `scripts/posters/poster.html`, driven here in a headless
Chromium (SwiftShader — no GPU required). This is a one-off developer tool,
deliberately NOT wired into `prebuild`: the output is committed, and a build
that needed a browser would break CI and the static export.

THIS FILE IS THE ONLY MIRROR
---------------------------
`scripts/posters/poster.html` deliberately holds no rig values — it has the
panel geometry and the render call and nothing else, and it throws if a value
is missing. Everything below mirrors `src/components/three/stage-rig.ts`,
which in turn is what `three3/ForgeEnvironment` now uses as its defaults. One
mirror, in one file. Change a number in `stage-rig.ts`, change it here, re-run.

USAGE
-----
    python3 scripts/build-posters.py                  # 11 parts x 2 states
    python3 scripts/build-posters.py part-g           # one part, both states
    python3 scripts/build-posters.py --state machined # one state, all parts
    node scripts/encode-posters.mjs                   # PNG -> webp + avif

Requires: `pip install playwright && playwright install chromium`.
"""

from __future__ import annotations

import base64
import functools
import io
import http.server
import json
import socketserver
import sys
import threading
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage
from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parent.parent
MODELS_DIR = REPO / "public" / "assets" / "models"
OUT_DIR = REPO / "scripts" / "posters" / "out"

# Square, because the same still has to sit in a 1:1 grid tile, a 16:9 stage
# and a 3:4 catalogue tile. On a graphite page with a graphite clear colour
# there is no visible letterbox either way, and `object-cover` on a 3:4 crop
# keeps the full frame height — which is why the part is framed to ~62% of
# the frame and stays inside the 75% safe area of any of those crops.
SIZE = 1000

# Per-part pose. Parts come out of CAD in whatever orientation the customer's
# drawing used, so each one gets an angle chosen by eye for the most legible
# silhouette — the one thing in this file that is taste rather than mirror.
# [x, y, z] radians. The live stage starts from the same pose at scroll 0.
POSES: dict[str, list[float]] = {
    # See stage-rig.ts: 0.55 put the flat face in the saffron rim's mirror
    # direction at the start of the INDEX sweep (29.7% orange -> 2.4%).
    "part-a": [0.75, -0.70, 0.0],
    "part-b": [0.22, -0.70, 0.0],
    "part-c": [0.30, -0.60, 0.0],
    "part-d": [0.55, -0.60, 0.0],
    "part-e": [0.25, -0.65, 0.0],
    "part-f": [0.22, -0.75, 0.0],
    "part-g": [0.35, -0.55, 0.0],
    "part-h": [0.40, -0.50, 0.0],
    "part-i": [0.20, -0.80, 0.0],
    "trunnion-85000103": [0.22, -0.70, 0.0],
    "tvs-1200": [0.28, -0.65, 0.0],
}

# ---------------------------------------------------------------------------
# Environment — mirrors STAGE_ENV in src/components/three/stage-rig.ts, which
# `three3/ForgeEnvironment` now carries as its own defaults.
#
# Two values are the ones that used to be wrong, and both are worth knowing
# about because the failure was silent:
#   · `warmColor` — this colours the roof lights AND the raking strip, which
#     together are most of what a `metalness: 1` surface reflects. At the old
#     peach default the steel rendered bronze: §6.5 says the part is grey
#     steel lit by something orange, never orange steel.
#   · `roomIntensity` — at the old 0.12 the enclosing shell was near-black,
#     so any face not pointing at a panel reflected a void and the part read
#     as a black cutout with chrome edges.
ENV = {
    "keyIntensity": 4.0,
    "rakeIntensity": 2.0,
    "rimIntensity": 1.4,
    "roomIntensity": 1.0,
    "warmColor": "#FFF4E8",
    # A COOL tone, not the forge orange §3.3's prose implies. ForgeEnvironment
    # paints this key as a wall directly behind the part rather than §3.3's
    # small off-axis circle, so an orange value mirrors across whole faces:
    # the Crank measured body R-B +16.5 / 29.9% and the Connecting Rod
    # +21.4 / 25.6% with it warm, both failing §7 check 7. The warmth lives on
    # the rim LIGHT instead, at full strength. See stage-rig.ts.
    "coolColor": "#8FA6BC",
}

# Analytic rig — §3.3's table verbatim, and now identical to what bare
# `<ForgeLights />` renders. (It shipped with the fill and rim temperatures
# inverted; 3d-core fixed that at source, so this is a mirror rather than a
# correction.)
LIGHTS = {
    "ambient": {"color": "#2A2D31", "intensity": 0.12},
    "key": {"color": "#FFF4E8", "intensity": 2.4, "position": [2.6, 3.4, 2.2]},
    "fill": {"color": "#8FA6BC", "intensity": 0.55, "position": [-3.0, 0.6, 1.4]},
    "rim": {"color": "#FF9933", "intensity": 1.6, "position": [-1.2, 1.0, -3.2]},
}

# Mirrors STAGE_CAMERA. fov 32 is the site's; z 5.0 rather than §3.3's 4.2
# because one square master also has to survive a 3:4 catalogue tile.
CAMERA = {"fov": 32, "z": 5.0, "near": 0.1, "far": 100}

# ---------------------------------------------------------------------------
# Material states — §3.2.
#
# Two sets are baked because §3.2 assigns different states to different
# surfaces, and a poster in the wrong state is the §3.6 pop the shared rig
# exists to prevent. The file suffix is the state; `machined` is unsuffixed
# because it is what this lane's own pages use.
#
# `roughness` is raised in BOTH states from §3.2's numbers, for the same
# reason and by the same ratio: §3.2 assumes §3.3's twin large roof
# softboxes, and the environment actually shipped has one narrow raking strip.
# Under it, 0.24 renders as mirror chrome — the thing §6.11 exists to prevent.
# Verified by rendering it, not by reasoning about it.
# Mirrors `src/lib/three/materialStates.ts`, which is the authoritative copy
# and has zero imports precisely so it is readable from anywhere. These exist
# because a Python driver cannot import TypeScript; the §7.7 gate below
# catches a drift that changes how a part reads.
MATERIAL_STATES = {
    # §3.2 B. roughness 0.42, not §3.2's 0.24 — that assumes twin large roof
    # softboxes and the shipped environment has one narrow rake, under which
    # 0.24 renders as mirror chrome (§6.11).
    "machined": {"color": "#8D9298", "metalness": 1.0, "roughness": 0.42, "envMapIntensity": 1.15},
    # §3.2 A. metalness 0.75, not §3.2's 1.0 — three3's amendment: mill scale
    # is an oxide layer and substantially dielectric, and at 1.0 there is no
    # diffuse term, so the base colour could only tint reflections downward.
    "as-forged": {"color": "#43474B", "metalness": 0.75, "roughness": 0.58, "envMapIntensity": 1.0},
}
DEFAULT_STATE = "machined"

# ONE environment and ONE light rig for both states.
#
# An earlier version had a per-state calibration here — exposure x2 and the
# saffron rim at 0.4 for as-forged. It is gone, and the reason is worth
# recording: it was compensating for two problems that were fixed properly
# elsewhere. `coolColor` returning to a cool tone removed the orange cast at
# source (never an as-forged problem — machined had it worse), and
# metalness 1.0 -> 0.75 restored the diffuse term that was making as-forged
# parts dark. Measured with both fixes and NO compensation, body mean R-B /
# share over +30 / mean body luminance:
#
#   part-d  +1.8 / 2.2% / L69      part-f  +2.4 / 0.4% / L53
#   part-i  +2.7 / 2.2% / L51      part-g  -1.3 / 0.1% / L36
#
# With the compensation still on, those luminances were L114 / L77 / L81 /
# L71 — a visibly hotter, rim-poorer section than §3.3 intends, correcting a
# problem that no longer existed.
ENV_INTENSITY = 1.15

# 'smooth', not 'creased': creased de-indexes the geometry for ~3x the GPU
# buffer, and the live stage would have to pay that at runtime for the poster
# to match. The parts run 24k-100k triangles, where averaged normals still
# hold their edges.
SHADING = "smooth"

# ---------------------------------------------------------------------------
# THE §7.7 GATE — what it guards, and why it exists
#
# V3-DIRECTION §7 check 7 is "the part is grey; if it's orange, the rig is
# wrong". As a screenshot-and-squint check it failed three times in one day,
# in both directions: a shipped `ForgeEnvironment` default rendered every
# lane's steel bronze and nobody caught it; a lane then reported a copper cast
# in the wrong material state; and a single-framing check on this very lane
# read a clean -2.7 / 0.7% while a part sat at +21.2 / 29.7% at the end of its
# own INDEX sweep. Each was invisible to the eye at the framing that happened
# to get looked at.
#
# So it is a number, checked on every bake, and this script exits non-zero
# when it fails. A rig regression cannot reach the posters — and because the
# posters are rendered from the same values the live canvas uses, a rig
# regression that would reach the canvas fails the bake first.
#
# WHAT IT MEASURES, and every clause is load-bearing:
#
#   - The part's ERODED INTERIOR, not every pixel it covers. §3.3 requires a
#     saffron rim and calls it "non-negotiable on a dark site" — it is the
#     only thing drawing a dark part's outline on a dark ground. A metric that
#     counted rim pixels would punish the thing the direction mandates and
#     push the whole site toward flat grey. The body must be neutral; the edge
#     must not be.
#   - TWO numbers. The mean catches an all-over stain; the share over +30
#     catches one copper face on an otherwise grey part. The Crank failed on
#     the share (29.9%) with a mean that alone would not have looked alarming.
#   - BOTH material states, every bake. Machined is the sensitive one: at
#     roughness 0.42 a wall's reflection stays sharp enough to stain a face,
#     where as-forged's 0.58 blurs it. Sampling as-forged alone hides it.
#
# Ceilings are ceilings, not targets. The shipped set sits far under them.
#
# The metric is measured on the part's ERODED INTERIOR, not on every pixel it
# covers, and that distinction is the whole point. §3.3 requires a saffron rim
# and calls it "non-negotiable on a dark site" — it is the only thing drawing
# the outline of a dark part on a dark ground. So warm EDGE pixels are correct
# and a metric that punishes them would push the site toward flat grey. What
# must stay neutral is the BODY. Eroding the mask by 6px drops the rim and
# leaves the faces.
#
# Thresholds are ceilings, not targets. The shipped set sits far under them;
# they exist to catch a regression, not to be tuned against.
ORANGE_MEAN_CEILING = 10.0   # mean (R − B) over interior pixels
ORANGE_SHARE_CEILING = 8.0   # % of interior pixels with (R − B) > 30
GROUND_RGB = np.array([31, 33, 36])


def orange_metric(png: bytes) -> tuple[float, float]:
    """(mean R−B, % of pixels over R−B 30) across the part's interior."""
    a = np.asarray(Image.open(io.BytesIO(png)).convert("RGB")).astype(np.int16)
    part = np.abs(a - GROUND_RGB).sum(axis=2) > 12
    if part.sum() == 0:
        return 0.0, 0.0
    interior = ndimage.binary_erosion(part, np.ones((6, 6)))
    # A part thin enough to erode away entirely (a lever seen edge-on) is all
    # rim and has no body to measure; fall back rather than report nothing.
    if interior.sum() < 50:
        interior = part
    px = a[interior]
    rb = px[:, 0].astype(np.int32) - px[:, 2].astype(np.int32)
    return float(rb.mean()), float(100 * (rb > 30).mean())


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    """Static file server over the repo root — the page needs both
    /node_modules/three/** and /public/assets/models/**."""

    def log_message(self, *args):  # noqa: D102 - silence per-request logging
        pass

    def translate_path(self, path: str) -> str:
        # `/assets/...` is how the app refers to files that live under
        # `public/assets/...`, so mirror Next's public-dir mapping.
        if path.startswith("/assets/"):
            path = "/public" + path
        return super().translate_path(path)


def serve(root: Path) -> tuple[socketserver.TCPServer, int]:
    handler = functools.partial(QuietHandler, directory=str(root))
    httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
    port = httpd.server_address[1]
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, port


def main() -> int:
    argv = sys.argv[1:]
    states = list(MATERIAL_STATES)
    if "--state" in argv:
        i = argv.index("--state")
        state = argv[i + 1] if i + 1 < len(argv) else ""
        if state not in MATERIAL_STATES:
            print(f"unknown state {state!r}; expected one of {list(MATERIAL_STATES)}", file=sys.stderr)
            return 1
        states = [state]
        del argv[i : i + 2]

    names = sorted(p.stem for p in MODELS_DIR.glob("*.glb"))
    if argv:
        names = [n for n in names if n in argv]
    if not names:
        print("no models matched", file=sys.stderr)
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    httpd, port = serve(REPO)

    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(
                args=[
                    "--no-sandbox",
                    # SwiftShader is the whole point: this has to run on a
                    # headless box with no GPU and still produce the same
                    # pixels a real driver would.
                    "--enable-unsafe-swiftshader",
                    "--use-angle=swiftshader",
                ]
            )
            page = browser.new_page(viewport={"width": SIZE, "height": SIZE})
            page.on("console", lambda m: print(f"  [console:{m.type}] {m.text}"))
            page.on("pageerror", lambda e: print(f"  [pageerror] {e}"))
            page.goto(f"http://127.0.0.1:{port}/scripts/posters/poster.html")
            page.wait_for_function("() => window.__posterRigReady === true", timeout=30_000)

            report = []
            orange: list[tuple[str, float, float]] = []
            for state in states:
                print(f"\n  --- {state} ---")
                for name in names:
                    result = page.evaluate(
                        "opts => window.renderPart(opts)",
                        {
                            "url": f"/assets/models/{name}.glb",
                            "size": SIZE,
                            "rotation": POSES.get(name, [0.22, -0.70, 0.0]),
                            "shading": SHADING,
                            "env": ENV,
                            "envIntensity": ENV_INTENSITY,
                            "lights": LIGHTS,
                            "material": MATERIAL_STATES[state],
                            "camera": CAMERA,
                        },
                    )
                    png = base64.b64decode(result["dataUrl"].split(",", 1)[1])
                    stem = name if state == DEFAULT_STATE else f"{name}--{state}"
                    (OUT_DIR / f"{stem}.png").write_bytes(png)
                    report.append(
                        {
                            "name": name,
                            "state": state,
                            "file": f"{stem}.png",
                            "triangles": result["triangles"],
                            "extent": result["size"],
                            "png_bytes": len(png),
                        }
                    )
                    mean_rb, share = orange_metric(png)
                    over = mean_rb > ORANGE_MEAN_CEILING or share > ORANGE_SHARE_CEILING
                    if over:
                        orange.append((stem, mean_rb, share))
                    report[-1]["orange_mean_rb"] = round(mean_rb, 2)
                    report[-1]["orange_share_pct"] = round(share, 2)
                    print(
                        f"  {stem:<32} {result['triangles']:>8,} tris  "
                        f"{len(png) / 1024:>4.0f} KB  "
                        f"body R-B {mean_rb:>+5.1f} / {share:>4.1f}%"
                        + ("   <-- OVER §7.7" if over else "")
                    )

            browser.close()
            (OUT_DIR / "report.json").write_text(json.dumps(report, indent=2))
    finally:
        httpd.shutdown()

    print(f"\n{len(names) * len(states)} posters ({len(names)} parts x {len(states)} state(s)) → {OUT_DIR}")

    for state in states:
        rows = [r for r in report if r["state"] == state]
        print(
            f"  {state:<11} body R-B mean {sum(r['orange_mean_rb'] for r in rows) / len(rows):+.1f}"
            f"   share {sum(r['orange_share_pct'] for r in rows) / len(rows):.1f}%"
            f"   (ceilings {ORANGE_MEAN_CEILING:+.0f} / {ORANGE_SHARE_CEILING:.0f}%)"
        )

    if orange:
        print("\n§7 check 7 FAILED — these parts read orange, not grey:", file=sys.stderr)
        for stem, m, sh in orange:
            print(f"    {stem:<34} body R-B {m:+.1f}  share {sh:.1f}%", file=sys.stderr)
        return 1

    print("next: node scripts/encode-posters.mjs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
