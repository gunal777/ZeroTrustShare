import { useEffect, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import Icon from "./Icon";
GlobalWorkerOptions.workerSrc = workerUrl;

export default function PdfPreview({ blob }) {
  const host = useRef(null);
  const canvas = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [page, setPage] = useState(1);
  const [width, setWidth] = useState(0);
  const [rendered, setRendered] = useState(0);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  useEffect(() => {
    let active = true;
    let task;
    blob
      .arrayBuffer()
      .then((data) => {
        if (!active) return;
        task = getDocument({
          data: new Uint8Array(data),
          isEvalSupported: false,
          useSystemFonts: true,
          useWasm: false,
        });
        return task.promise;
      })
      .then((document) => {
        if (active && document) {
          setPdf(document);
          setPage(1);
        }
      })
      .catch((err) => {
        if (active)
          setError(
            err.name === "PasswordException"
              ? "This PDF has its own password. Ask the sender for an unlocked copy."
              : "This PDF could not be rendered. Ask the sender for a new copy.",
          );
      });
    return () => {
      active = false;
      task?.destroy().catch(() => {});
    };
  }, [blob]);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(100, Math.floor(entry.contentRect.width - 32))),
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!pdf || !width) return;
    let active = true;
    let render;
    pdf
      .getPage(page)
      .then(async (pdfPage) => {
        if (!active) return;
        const base = pdfPage.getViewport({ scale: 1 });
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = pdfPage.getViewport({
          scale: Math.min(width / base.width, 2),
        });
        const surface = canvas.current;
        surface.width = Math.floor(viewport.width * ratio);
        surface.height = Math.floor(viewport.height * ratio);
        surface.style.width = Math.floor(viewport.width) + "px";
        surface.style.height = Math.floor(viewport.height) + "px";
        render = pdfPage.render({
          canvasContext: surface.getContext("2d"),
          viewport,
          transform: [ratio, 0, 0, ratio, 0, 0],
        });
        await render.promise;
        const content = await pdfPage.getTextContent();
        if (active) {
          setRendered(page);
          setText(content.items.map((item) => item.str).join(" "));
        }
      })
      .catch((err) => {
        if (active && err.name !== "RenderingCancelledException")
          setError(
            "This page could not be rendered. Ask the sender for a new copy.",
          );
      });
    return () => {
      active = false;
      render?.cancel();
    };
  }, [pdf, page, width]);
  return (
    <div className="pdf-preview" ref={host}>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : (
        <>
          {(!pdf || rendered !== page) && (
            <div className="pdf-loading" role="status">
              <span className="spinner" />
              Rendering PDF…
            </div>
          )}
          <div className="pdf-canvas-wrap">
            <canvas
              ref={canvas}
              role="img"
              aria-label={"PDF page " + page}
              data-rendered={rendered === page}
            />
            <p className="sr-only">{text}</p>
          </div>
          {pdf && (
            <div className="pdf-controls">
              <button
                className="icon-btn"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
                aria-label="Previous PDF page"
              >
                <Icon name="chevron" className="rotate-180" />
              </button>
              <span>
                Page {page} of {pdf.numPages}
              </span>
              <button
                className="icon-btn"
                disabled={page >= pdf.numPages}
                onClick={() => setPage((value) => value + 1)}
                aria-label="Next PDF page"
              >
                <Icon name="chevron" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
