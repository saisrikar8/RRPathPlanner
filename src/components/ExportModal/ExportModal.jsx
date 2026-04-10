import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { JavaHighlight } from "../JavaHighlight.jsx";
import "./ExportModal.css";

function ExportModal({ open, onClose, engine }) {
    const [className, setClassName] = useState("AutonomousOpMode");
    const [copying, setCopying] = useState(false);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    const generatedCode = useMemo(() => {
        if (!engine) return "// Define some paths to see code";
        return engine.generateRoadrunnerCode(className);
    }, [engine, className]);

    if (!open) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedCode);
        setCopying(true);
        setTimeout(() => setCopying(false), 2000);
    };

    const dialog = (
        <div className="export-modal">
            <button
                type="button"
                className="export-modal__backdrop"
                aria-label="Close export menu"
                onClick={onClose}
            />
            <div
                className="export-modal__panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="export-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="export-modal__header">
                    <h2 id="export-modal-title" className="export-modal__title">
                        Generated Code
                    </h2>
                    <button type="button" className="export-modal__close" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>

                <div className="export-modal__body">
                    <section className="export-modal__section">
                        <div className="export-modal__field">
                            <label className="export-modal__label" htmlFor="rr-class-name">
                                OpMode Name
                            </label>
                            <input
                                id="rr-class-name"
                                type="text"
                                value={className}
                                onChange={(e) =>
                                    setClassName(e.target.value.replace(/\s/g, "") || "AutonomousOpMode")
                                }
                                className="export-modal__input"
                                placeholder="e.g. MyAuto"
                            />
                        </div>
                    </section>

                    <section className="export-modal__section export-modal__section--code">
                        <div className="export-modal__code-header">
                            <h3 className="export-modal__label">Generated Code</h3>
                            <button
                                type="button"
                                className={`export-modal__copy-btn ${copying ? 'export-modal__copy-btn--success' : ''}`}
                                onClick={handleCopy}
                            >
                                {copying ? "Copied!" : (
                                    <img width = "15" height = "19" src = "/copy.png"/>)}
                            </button>
                        </div>
                        <div className="export-modal__code-wrapper">
                            <pre className="export-modal__code-block">
                                <code><JavaHighlight code={generatedCode} /></code>
                            </pre>
                        </div>
                    </section>
                </div>

                <div className="export-modal__footer">
                    <button type="button" className="export-modal__done" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(dialog, document.body);
}

export default ExportModal;
