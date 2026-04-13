import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./ImportModal.css";

function ImportModal({ open, onClose, setDisplayedPaths }) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === "Escape") { setError(''); onClose(); } };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    const getErrorHeader = () => {
        if (!error) return null;
        console.log(error)
        if (error === "Too many requests. Please wait a bit and try again. This is meant to prevent abuse.") {
            return (Math.random() > 0.5) ? "Whoa there, too spicy" : "Take a chill pill";
        }
        return (Math.random() > 0.5) ? "What was he thinking?" : "This ain't roadrunner code..";
    }

    const handleAnalyze = async () => {

        setLoading(true);
        try {
            const res = await fetch('/api/groq/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: code
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.log(errData);
                if (errData.message === "You have reached the maximum number of requests. Please wait and try again.") {
                    setError("Too many requests. Please wait a bit and try again. This is meant to prevent abuse.");
                }
                else{
                    setError("We ran into some trouble analyzing your code. Please try again at a later time or fix your code.");
                }
                return;
            }

            const data = await res.json();
            const raw = data.chat_response;

            let parsed;
            try {
                parsed = JSON.parse(raw);
            } catch {
                // Try extracting JSON array from the response if model added extra text
                const match = raw.match(/\[[\s\S]*\]/);
                if (!match) {
                    setError('Could not parse response as JSON. Try again or check your code.');
                    return;
                }
                try {
                    parsed = JSON.parse(match[0]);
                } catch {
                    setError('Could not parse response as JSON. Try again or check your code.');
                    return;
                }
            }

            if (!Array.isArray(parsed) || parsed.length === 0) {
                setError('No path data found in the response. Make sure the code contains a trajectory.');
                return;
            }
            let count = -1;
            const items = parsed.map((item) => {
                count++;
                return {
                ...item,
                        id: count,
                        waypoints: item.waypoints ?? [],
                }
            });
            console.log(items);
            setDisplayedPaths(items);
            setCode('');
            setError('');
            onClose();
        } catch (err) {
            console.error(err);
            setError("We ran into some trouble analyzing your code. Please try again at a later time or fix your code.");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const dialog = (
        <div className="export-modal">
            <button
                type="button"
                className="export-modal__backdrop"
                aria-label="Close"
                onClick={()=>{setError(''); onClose();}}
            />
            <div
                className="export-modal__panel import-modal__panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="import-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="export-modal__header">
                    <h2 id="import-modal-title" className="export-modal__title">
                        Import from OpMode Code
                    </h2>
                    <button type="button" className="export-modal__close" onClick={()=>{setError(''); onClose();}} aria-label="Close">
                        ×
                    </button>
                </div>

                <div className="export-modal__body">

                    <section className="export-modal__section export-modal__section--code import-modal__section">
                        <div className="export-modal__code-header">
                            <h3 className="export-modal__label">Paste OpMode Java Code</h3>
                        </div>
                        <div className="export-modal__code-wrapper import-modal__code-wrapper">
                            <textarea
                                className="import-modal__code-textarea"
                                placeholder={"// Paste your FTC autonomous OpMode here\n// e.g. drive.actionBuilder(startPose)\n//     .splineTo(new Vector2d(24, 24), Math.toRadians(90))\n//     .build();"}
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                spellCheck={false}
                            />
                        </div>
                        <div className="import-modal__error-container">
                            {error && (
                                <div className="import-modal__error">
                                    <h4 className="import-modal__error-header">{getErrorHeader()}</h4>
                                    <p className="import-modal__error-message">{error}</p>
                                </div>
                            )}
                        </div>
                    </section>

                </div>

                <div className="export-modal__footer import-modal__footer">
                    <button type="button" className="export-modal__done" onClick={()=>{setError(''); onClose();}}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="import-modal__analyze-btn"
                        onClick={handleAnalyze}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="import-modal__spinner" />
                                Analyzing…
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"/>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                </svg>
                                Analyze &amp; Import
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(dialog, document.body);
}

export default ImportModal;