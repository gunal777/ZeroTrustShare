const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function parseJsonSafely(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function requestJson(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, options);
  } catch {
    throw new ApiError(
      "Can't reach the server. Check that the backend is running and VITE_API_BASE_URL is correct.",
      0,
      "NETWORK_ERROR",
    );
  }

  const body = await parseJsonSafely(res);

  if (!res.ok) {
    throw new ApiError(body.message || `Request failed (${res.status})`, res.status, body.code);
  }

  return body;
}

function filenameFromDisposition(header) {
  if (!header) return null;
  const match = /filename="?([^"]+)"?/.exec(header);
  return match ? match[1] : null;
}

async function requestBlob(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, options);
  } catch {
    throw new ApiError(
      "Can't reach the server. Check that the backend is running and VITE_API_BASE_URL is correct.",
      0,
      "NETWORK_ERROR",
    );
  }

  if (!res.ok) {
    const body = await parseJsonSafely(res);
    throw new ApiError(body.message || `Request failed (${res.status})`, res.status, body.code);
  }

  const blob = await res.blob();
  const filename = filenameFromDisposition(res.headers.get("Content-Disposition"));
  return { blob, filename };
}

export function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "download";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ---- Files ----

export function listFiles() {
  return requestJson("/files").then((body) => body.files || []);
}

export function getFile(id) {
  return requestJson(`/files/${id}`).then((body) => body.file);
}

export function uploadFile(file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/files/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let body = {};
      try {
        body = JSON.parse(xhr.responseText || "{}");
      } catch {
        // ignore parse failure, handled by status check below
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body.file);
      } else {
        reject(new ApiError(body.message || `Upload failed (${xhr.status})`, xhr.status, body.code));
      }
    };

    xhr.onerror = () => {
      reject(new ApiError("Can't reach the server during upload.", 0, "NETWORK_ERROR"));
    };

    xhr.send(formData);
  });
}

export function downloadFile(id) {
  return requestBlob(`/files/${id}/download`);
}

export function deleteFile(id) {
  return requestJson(`/files/${id}`, { method: "DELETE" });
}

// ---- Share links ----

export function createShareLink({ fileId, expiresAt, password }) {
  return requestJson("/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileId, expiresAt, password: password || undefined }),
  }).then((body) => body.data);
}

export function getShareInfo(token) {
  return requestJson(`/share/${token}`);
}

export function unlockShareLink(token, password) {
  return requestBlob(`/share/${token}/access`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: password || undefined }),
  });
}

export function revokeShareLink(token) {
  return requestJson(`/share/${token}`, { method: "DELETE" });
}

export { ApiError };
