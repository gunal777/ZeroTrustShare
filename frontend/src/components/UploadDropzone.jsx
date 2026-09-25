import { useRef, useState } from "react";
import Icon from "./Icon";
const ACCEPTED = ["pdf", "doc", "docx", "txt"];
export default function UploadDropzone({
  onFileAccepted,
  onValidationError,
  disabled = false,
  progress,
}) {
  const input = useRef(null);
  const [dragging, setDragging] = useState(false);
  function accept(list) {
    if (disabled) return;
    if (list?.length > 1)
      return onValidationError?.("Please upload one file at a time.");
    const file = list?.[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.name.split(".").pop().toLowerCase()))
      return onValidationError?.("Choose a PDF, DOC, DOCX, or TXT file.");
    if (file.size > 25 * 1024 * 1024)
      return onValidationError?.("Files must be 25 MB or smaller.");
    onFileAccepted(file);
  }
  return (
    <div
      className={
        "dropzone" +
        (dragging ? " dropzone--active" : "") +
        (disabled ? " dropzone--busy" : "")
      }
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Choose a file to upload"
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) input.current?.click();
      }}
      onKeyDown={(event) => {
        if (["Enter", " "].includes(event.key)) {
          event.preventDefault();
          if (!disabled) input.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        accept(event.dataTransfer.files);
      }}
    >
      <input
        ref={input}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        hidden
        disabled={disabled}
        onChange={(event) => {
          accept(event.target.files);
          event.target.value = "";
        }}
      />
      <span className="dropzone-icon">
        <Icon name="upload" size={25} />
      </span>
      <div>
        <h3>
          {progress
            ? progress.percent === 100
              ? "Encrypting & saving your file…"
              : "Uploading your file…"
            : "Drop your file here, or browse"}
        </h3>
        <p>
          {progress
            ? progress.name
            : "PDF, DOC, DOCX, or TXT · Up to 25 MB per file"}
        </p>
      </div>
      <span className="dropzone-badge">
        <Icon name="shield" size={16} />
        Private by default
      </span>
      {progress && (
        <div
          className="upload-progress"
          role="progressbar"
          aria-label="Upload progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percent}
        >
          <span style={{ width: progress.percent + "%" }} />
        </div>
      )}
    </div>
  );
}
