import React, { useEffect, useState } from "react";
import { FOLDERS, uploadFile } from "../../services/storage";
import FirebaseImg from "../../components/FirebaseImg";

const TestFbImage = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [path, setPath] = useState(null);
    const [progress, setProgress] = useState(0);
    const [downloadURL, setDownloadURL] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        console.log("Uploaded file path:", path);
    }, [path]);

    const onSelectFile = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (!f.type.startsWith("image/")) {
            setError("Only image files allowed");
            return;
        }
        setError("");
        setFile(f);
        setDownloadURL("");
        setProgress(0);
        const url = URL.createObjectURL(f);
        setPreview(url);
    };

    const upload = async () => {
        if (!file) {
            setError("No file selected");
            return;
        }
        setError("");
        const filePath = await uploadFile(file, {
            folder: FOLDERS.INVOICES,
            onProgress: (pct) => setProgress(Math.round(pct)),
        });
        setPath(filePath);
    };

    const reset = () => {
        setFile(null);
        setPreview("");
        setProgress(0);
        setDownloadURL("");
        setError("");
    };

    return (
        <div style={{ fontFamily: "sans-serif", maxWidth: 420 }}>
            <FirebaseImg fileName={path} />
            <h3>Test Firebase Image Upload</h3>
            <input type="file" accept="image/*" onChange={onSelectFile} />
            {preview && (
                <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Preview:</div>
                    <img
                        src={preview}
                        alt="preview"
                        style={{
                            width: "100%",
                            maxHeight: 240,
                            objectFit: "contain",
                            border: "1px solid #ddd",
                            borderRadius: 4,
                        }}
                    />
                </div>
            )}
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button onClick={upload} disabled={!file || (progress > 0 && progress < 100)}>
                    Upload
                </button>
                <button onClick={reset} type="button">
                    Reset
                </button>
            </div>
            {progress > 0 && (
                <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 12 }}>Progress: {progress}%</div>
                    <div style={{ height: 8, background: "#eee", borderRadius: 4, overflow: "hidden" }}>
                        <div
                            style={{
                                height: "100%",
                                width: `${progress}%`,
                                background: "#4caf50",
                                transition: "width .25s",
                            }}
                        />
                    </div>
                </div>
            )}
            {downloadURL && (
                <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 12 }}>Download URL:</div>
                    <a href={downloadURL} target="_blank" rel="noopener noreferrer">
                        {downloadURL}
                    </a>
                </div>
            )}
            {error && <div style={{ color: "crimson", marginTop: 10, fontSize: 13 }}>{error}</div>}
        </div>
    );
};

export default TestFbImage;
