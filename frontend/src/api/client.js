const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  ""
);

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function responseError(body, status) {
  if (body.code === "UNAUTHENTICATED") {
    window.dispatchEvent(new Event("session-expired"));
  }

  return new ApiError(
    body.message || "Request failed. Please try again.",
    status,
    body.code
  );
}

async function request(path, options = {}, blob = false) {
  let response;

  try {
    response = await fetch(BASE_URL + path, {
      credentials: "include",
      signal: AbortSignal.timeout(30000),
      ...options,
    });
  } catch {
    throw new ApiError(
      "Connection interrupted. Please check your connection and try again.",
      0,
      "NETWORK_ERROR"
    );
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw responseError(body, response.status);
  }

  if (!blob) return response.json();

  const header = response.headers.get("Content-Disposition") || "";
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
  const regular = /filename="([^"]+)"/.exec(header);
  let filename = regular?.[1];

  try {
    if (encoded) {
      filename = decodeURIComponent(encoded[1]);
    }
  } catch {
    /* Use fallback filename. */
  }

  return { blob: await response.blob(), filename };
}

const json = (data) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

export const login = (data) => request("/auth/login", json(data));

export const signup = (data) => request("/auth/signup", json(data));

export const getProfile = () => request("/auth/profile");

export const logout = () => request("/auth/logout", json({}));

export const listFiles = () => request("/files").then((body) => body.files);

export const listShareLinks = () =>
  request("/share").then((body) => body.links);

export const downloadFile = (id) =>
  request("/files/" + encodeURIComponent(id) + "/download", {}, true);

export const deleteFile = (id) =>
  request("/files/" + encodeURIComponent(id), { method: "DELETE" });

export const createShareLink = (data) =>
  request("/share", json(data)).then((body) => body.data);

export const getShareInfo = (token) =>
  request("/share/" + encodeURIComponent(token));

export const unlockShareLink = (token, password) =>
  request(
    "/share/" + encodeURIComponent(token) + "/download",
    json({ password }),
    true
  );

export const previewShareLink = (token, password) =>
  request(
    "/share/" + encodeURIComponent(token) + "/preview",
    json({ password }),
    true
  );

export const revokeShareLink = (token) =>
  request("/share/" + encodeURIComponent(token), { method: "DELETE" });

export function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "download";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function uploadFile(file, onProgress) {
  const form = new FormData();

  const mime = {
    pdf: "application/pdf",
    txt: "text/plain",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  form.append(
    "file",
    file.type
      ? file
      : new Blob([file], {
          type: mime[file.name.split(".").pop().toLowerCase()],
        }),
    file.name
  );

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", BASE_URL + "/files/upload");
    xhr.withCredentials = true;
    xhr.timeout = 120000;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let body = {};

      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* HTTP status determines failure. */
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body.file);
      } else {
        reject(responseError(body, xhr.status));
      }
    };

    xhr.onerror = xhr.ontimeout = () =>
      reject(
        new ApiError(
          "Upload interrupted. Please try again.",
          0,
          "NETWORK_ERROR"
        )
      );

    xhr.send(form);
  });
}
