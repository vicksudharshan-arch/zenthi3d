import { useEffect, useMemo, useRef, useState } from "react";
import { getDownloadUrl } from "@/lib/parts.functions";
import { PREVIEWABLE_EXTS, fileExt, partFileEntries, type PartFileSource } from "@/lib/parts";

type PreviewPart = PartFileSource & {
  id: string;
  name: string;
};

export type PreviewTarget = {
  format: "step" | "stl" | "extra";
  index: number;
  fileName: string;
};

const MESH_EXTS = ["stl", "obj", "ply"];
const IMAGE_EXTS = ["svg"];
const PDF_EXTS = ["pdf"];

function extOf(name: string) {
  return fileExt(name);
}

export function PartPreviewModal({
  part,
  target,
  onClose,
}: {
  part: PreviewPart;
  target?: PreviewTarget | undefined;
  onClose: () => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unsupported" | "error">("loading");
  const [message, setMessage] = useState("");
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const resolved = useMemo(() => {
    const entries = partFileEntries(part);
    let t: PreviewTarget | undefined = target;
    if (!t) {
      const previewable = entries.find((e) => PREVIEWABLE_EXTS.includes(e.ext));
      const pick = previewable ?? entries[0];
      t = pick
        ? { format: pick.group, index: pick.index, fileName: pick.name }
        : { format: "step", index: 0, fileName: "" };
    }
    const fileName = t.fileName;
    const ext = extOf(fileName);
    const kind = MESH_EXTS.includes(ext)
      ? "mesh"
      : IMAGE_EXTS.includes(ext)
        ? "image"
        : PDF_EXTS.includes(ext)
          ? "pdf"
          : "none";
    return { t, fileName, ext, kind } as const;
  }, [part, target]);

  const { t: activeTarget, fileName: displayName, ext, kind } = resolved;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (kind === "none") {
      setStatus("unsupported");
      return;
    }
    let disposed = false;
    let cleanup: (() => void) | undefined;
    let createdUrl: string | null = null;

    const fetchFile = async () => {
      const { url } = await getDownloadUrl({
        data: { id: part.id, format: activeTarget.format, index: activeTarget.index },
      });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Could not fetch file");
      return res;
    };

    (async () => {
      try {
        if (kind === "image" || kind === "pdf") {
          const res = await fetchFile();
          const blob = await res.blob();
          if (disposed) return;
          const typed = new Blob([blob], {
            type: kind === "pdf" ? "application/pdf" : "image/svg+xml",
          });
          createdUrl = URL.createObjectURL(typed);
          setObjectUrl(createdUrl);
          setStatus("ready");
          cleanup = () => {
            if (createdUrl) URL.revokeObjectURL(createdUrl);
          };
          return;
        }

        const [THREE, loaderMod, { OrbitControls }] = await Promise.all([
          import("three"),
          ext === "stl"
            ? import("three/examples/jsm/loaders/STLLoader.js")
            : ext === "obj"
              ? import("three/examples/jsm/loaders/OBJLoader.js")
              : import("three/examples/jsm/loaders/PLYLoader.js"),
          import("three/examples/jsm/controls/OrbitControls.js"),
        ]);
        const res = await fetchFile();
        const buffer = await res.arrayBuffer();
        if (disposed) return;
        const mount = mountRef.current;
        if (!mount) return;

        const width = mount.clientWidth;
        const height = mount.clientHeight;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);
        mount.appendChild(renderer.domElement);

        const material = new THREE.MeshStandardMaterial({
          color: 0x6f5a86,
          roughness: 0.55,
          metalness: 0.15,
        });
        const disposables: { dispose: () => void }[] = [material];
        let object: import("three").Object3D;

        if (ext === "obj") {
          const { OBJLoader } = loaderMod as typeof import("three/examples/jsm/loaders/OBJLoader.js");
          const text = new TextDecoder().decode(buffer);
          object = new OBJLoader().parse(text);
          object.traverse((child) => {
            const mesh = child as import("three").Mesh;
            if (mesh.isMesh) {
              mesh.material = material;
              mesh.geometry.computeVertexNormals();
              disposables.push(mesh.geometry);
            }
          });
        } else {
          const Loader =
            ext === "stl"
              ? (loaderMod as typeof import("three/examples/jsm/loaders/STLLoader.js")).STLLoader
              : (loaderMod as typeof import("three/examples/jsm/loaders/PLYLoader.js")).PLYLoader;
          const geometry = new Loader().parse(buffer as ArrayBuffer);
          geometry.computeVertexNormals();
          geometry.center();
          disposables.push(geometry);
          object = new THREE.Mesh(geometry, material);
        }

        scene.add(object);

        const box = new THREE.Box3().setFromObject(object);
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        object.position.sub(sphere.center);
        const radius = sphere.radius || 50;
        camera.position.set(radius * 2, radius * 1.6, radius * 2.2);
        camera.near = radius / 100;
        camera.far = radius * 100;
        camera.updateProjectionMatrix();

        scene.add(new THREE.AmbientLight(0xffffff, 0.75));
        const key = new THREE.DirectionalLight(0xffffff, 1.1);
        key.position.set(1, 1, 1).multiplyScalar(radius * 3);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xffffff, 0.5);
        fill.position.set(-1, -0.5, -1).multiplyScalar(radius * 3);
        scene.add(fill);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        let frame = 0;
        const animate = () => {
          frame = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
          if (!mount.clientWidth) return;
          camera.aspect = mount.clientWidth / mount.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(mount.clientWidth, mount.clientHeight);
        };
        window.addEventListener("resize", onResize);

        setStatus("ready");
        cleanup = () => {
          cancelAnimationFrame(frame);
          window.removeEventListener("resize", onResize);
          controls.dispose();
          disposables.forEach((d) => d.dispose());
          renderer.dispose();
          if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
        };
      } catch (err) {
        if (disposed) return;
        setMessage(err instanceof Error ? err.message : "Preview failed");
        setStatus("error");
      }
    })();

    return () => {
      disposed = true;
      cleanup?.();
      setObjectUrl(null);
    };
  }, [part.id, kind, ext, activeTarget]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${part.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[80vh] w-full max-w-4xl flex-col rounded-sm border border-border bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <p className="tech-label">File preview</p>
            <h2 className="mt-1 font-display text-lg font-semibold tracking-tight">{part.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-sm border border-border px-4 text-sm font-medium hover:bg-secondary"
          >
            Close
          </button>
        </div>
        <div ref={mountRef} className="relative min-h-0 flex-1 bg-secondary/40">
          {status === "ready" && kind === "image" && objectUrl && (
            <img
              src={objectUrl}
              alt={`Vector preview of ${displayName}`}
              className="absolute inset-0 size-full object-contain p-8"
            />
          )}
          {status === "ready" && kind === "pdf" && objectUrl && (
            <iframe
              src={objectUrl}
              title={`PDF preview of ${displayName}`}
              className="absolute inset-0 size-full"
            />
          )}
          {status !== "ready" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
              {status === "loading" && (
                <p className="font-mono text-sm text-muted-foreground">Loading preview…</p>
              )}
              {status === "unsupported" && (
                <>
                  <span className="rounded-sm border border-brass px-3 py-1 font-mono text-xs tracking-widest text-brass-foreground uppercase">
                    {ext ? `${ext.toUpperCase()} · CAD file` : "CAD file"}
                  </span>
                  <p className="font-display text-xl font-semibold">
                    This file is best inspected in CAD
                  </p>
                  <p className="max-w-md text-sm text-muted-foreground">
                    {displayName || "This format"} can't be rendered in the browser. Formats like
                    STEP, DWG and native CAD files go straight to a machine shop and can be modified
                    in any CAD package — download it to inspect it in CAD or your slicer.
                  </p>
                </>
              )}
              {status === "error" && (
                <p className="max-w-md text-sm text-muted-foreground">
                  Could not render this file. {message}
                </p>
              )}
            </div>
          )}
        </div>
        <p className="border-t border-border px-6 py-3 font-mono text-xs text-muted-foreground">
          {displayName}
          {kind === "mesh" ? " · drag to rotate, scroll to zoom" : ""}
        </p>
      </div>
    </div>
  );
}
