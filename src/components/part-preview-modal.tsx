import { useEffect, useRef, useState } from "react";
import { getDownloadUrl } from "@/lib/parts.functions";

type PreviewPart = {
  id: string;
  name: string;
  step_file_name?: string | null;
  stl_file_name?: string | null;
};

export function PartPreviewModal({
  part,
  onClose,
}: {
  part: PreviewPart;
  onClose: () => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unsupported" | "error">("loading");
  const [message, setMessage] = useState("");

  const isStl = !!part.stl_file_name;
  const displayName = part.stl_file_name ?? part.step_file_name ?? "";


  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!isStl) {
      setStatus("unsupported");
      return;
    }
    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const [THREE, { STLLoader }, { OrbitControls }] = await Promise.all([
          import("three"),
          import("three/examples/jsm/loaders/STLLoader.js"),
          import("three/examples/jsm/controls/OrbitControls.js"),
        ]);
        const { url } = await getDownloadUrl({ data: { id: part.id, format: "stl" } });
        const res = await fetch(url);
        if (!res.ok) throw new Error("Could not fetch file");
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

        const geometry = new STLLoader().parse(buffer);
        geometry.computeVertexNormals();
        geometry.center();
        const material = new THREE.MeshStandardMaterial({
          color: 0x6f5a86,
          roughness: 0.55,
          metalness: 0.15,
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        geometry.computeBoundingSphere();
        const radius = geometry.boundingSphere?.radius ?? 50;
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
          geometry.dispose();
          material.dispose();
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
    };
  }, [part.id, isStl]);

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
          {status !== "ready" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
              {status === "loading" && (
                <p className="font-mono text-sm text-muted-foreground">Loading 3D preview…</p>
              )}
              {status === "unsupported" && (
                <>
                  <span className="rounded-sm border border-brass px-3 py-1 font-mono text-xs tracking-widest text-brass-foreground uppercase">
                    {ext || "file"} format
                  </span>
                  <p className="font-display text-xl font-semibold">
                    No in-browser 3D preview for this format
                  </p>
                  <p className="max-w-md text-sm text-muted-foreground">
                    {part.file_name} — STEP and other CAD formats need a desktop CAD or slicer
                    application. Download the file to inspect the geometry.
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
          {part.file_name}
          {isStl ? " · drag to rotate, scroll to zoom" : ""}
        </p>
      </div>
    </div>
  );
}
