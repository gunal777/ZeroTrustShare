import { useMemo, useState } from "react";
import { useVault } from "../context/vault";
import Icon from "../components/Icon";
import FileRow from "../components/FileRow";
import { Empty, ErrorState, Loading } from "../components/State";
import UploadDropzone from "../components/UploadDropzone";
import { useToast } from "../components/toast";
import { uploadFile } from "../api/client";

export default function Vault() {
  const { files, setFiles, loading, error, refresh } = useVault();
  const notify = useToast();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("newest");
  const [progress, setProgress] = useState(null);

  const filtered = useMemo(
    () =>
      files
        .filter(
          (file) =>
            file.originalName.toLowerCase().includes(query.toLowerCase()) &&
            (type === "all" ||
              file.originalName.toLowerCase().endsWith("." + type))
        )
        .sort((a, b) =>
          sort === "name"
            ? a.originalName.localeCompare(b.originalName)
            : sort === "size"
              ? b.size - a.size
              : new Date(b.createdAt) - new Date(a.createdAt)
        ),
    [files, query, type, sort]
  );

  async function upload(file) {
    if (progress) return;
    setProgress({ name: file.name, percent: 0 });
    try {
      const result = await uploadFile(file, (percent) =>
        setProgress({ name: file.name, percent })
      );
      setFiles((current) => [result, ...current]);
      notify("File encrypted and added to your vault.", { variant: "success" });
    } catch (err) {
      notify(err.message, { variant: "danger" });
    } finally {
      setProgress(null);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A HOME FOR YOUR IMPORTANT FILES</span>
          <h1>
            My files<span className="heading-period">.</span>
          </h1>
          <p>Keep them close. Share them thoughtfully.</p>
        </div>
        <span className="badge badge--success">
          <Icon name="lock" size={13} />
          Encrypted at rest
        </span>
      </div>
      <UploadDropzone
        onFileAccepted={upload}
        onValidationError={(message) => notify(message, { variant: "danger" })}
        disabled={Boolean(progress)}
        progress={progress}
      />
      {error && <ErrorState message={error} onRetry={refresh} />}
      <section className="panel files-panel">
        <div className="file-toolbar">
          <div className="search-input">
            <Icon name="search" size={18} />
            <input
              type="search"
              placeholder="Search your files…"
              aria-label="Search files"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="toolbar-filters">
            <select
              className="text-input"
              aria-label="File type"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="all">All file types</option>
              <option value="pdf">PDF</option>
              <option value="doc">DOC</option>
              <option value="docx">DOCX</option>
              <option value="txt">TXT</option>
            </select>
            <select
              className="text-input"
              aria-label="Sort files"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="name">Name A–Z</option>
              <option value="size">Largest first</option>
            </select>
          </div>
        </div>
        <div className="list-caption">
          <span>FILE NAME</span>
          <span>
            {filtered.length} {filtered.length === 1 ? "FILE" : "FILES"}
          </span>
        </div>
        {loading ? (
          <Loading />
        ) : filtered.length ? (
          <div role="list">
            {filtered.map((file) => (
              <FileRow key={file._id} file={file} />
            ))}
          </div>
        ) : (
          <Empty
            icon={files.length ? "search" : "folder"}
            title={
              files.length ? "No files found." : "Room for your first file."
            }
            message={
              files.length
                ? "Try a different name or file type."
                : "Drag a document into the upload area above to get started."
            }
          />
        )}
      </section>
      <p className="section-footnote">
        <Icon name="lock" size={14} />
        Only you can see these files unless you create a share link.
      </p>
    </>
  );
}
