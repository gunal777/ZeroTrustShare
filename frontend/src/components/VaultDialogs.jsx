import { useState } from "react";
import { useVault } from "../context/vault";
import { deleteFile, uploadFile } from "../api/client";
import { useToast } from "./toast";
import Modal from "./Modal";
import ShareModal from "./ShareModal";
import UploadDropzone from "./UploadDropzone";
import Icon from "./Icon";
export default function VaultDialogs() {
  const {
    uploadOpen,
    setUploadOpen,
    shareTarget,
    setShareTarget,
    deleteTarget,
    setDeleteTarget,
    setFiles,
    setLinks,
  } = useVault();
  const notify = useToast();
  const [progress, setProgress] = useState(null);
  const [deleting, setDeleting] = useState(false);
  async function upload(file) {
    if (progress) return;
    setProgress({ name: file.name, percent: 0 });
    try {
      const result = await uploadFile(file, (percent) =>
        setProgress({ name: file.name, percent }),
      );
      setFiles((current) => [result, ...current]);
      notify("File encrypted and stored.", { variant: "success" });
      setUploadOpen(false);
    } catch (err) {
      notify(err.message, { variant: "danger" });
    } finally {
      setProgress(null);
    }
  }
  async function remove() {
    setDeleting(true);
    try {
      await deleteFile(deleteTarget._id);
      setFiles((current) =>
        current.filter((file) => file._id !== deleteTarget._id),
      );
      setLinks((current) =>
        current.filter(
          (link) => (link.file?._id || link.file) !== deleteTarget._id,
        ),
      );
      setDeleteTarget(null);
      notify("File and its share links deleted.", { variant: "success" });
    } catch (err) {
      notify(err.message, { variant: "danger" });
    } finally {
      setDeleting(false);
    }
  }
  return (
    <>
      {uploadOpen && (
        <Modal
          title="Add to your vault"
          description="Your file is encrypted before it is stored."
          onClose={() => setUploadOpen(false)}
          busy={Boolean(progress)}
        >
          <UploadDropzone
            onFileAccepted={upload}
            onValidationError={(message) =>
              notify(message, { variant: "danger" })
            }
            disabled={Boolean(progress)}
            progress={progress}
          />
        </Modal>
      )}
      {shareTarget && (
        <ShareModal file={shareTarget} onClose={() => setShareTarget(null)} />
      )}
      {deleteTarget && (
        <Modal
          title="Delete this file?"
          description={deleteTarget.originalName}
          onClose={() => setDeleteTarget(null)}
          busy={deleting}
        >
          <div className="dialog-notice">
            <Icon name="alert" />
            <p>
              This permanently removes the file and all its share links. This
              cannot be undone.
            </p>
          </div>
          <div className="dialog-actions">
            <button
              className="btn"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Keep file
            </button>
            <button
              className="btn btn--danger"
              onClick={remove}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete file"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
