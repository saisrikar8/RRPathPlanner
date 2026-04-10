import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./MotionParamsModal.css";

function MotionParamsModal({ open, onClose, motionConstraints, setMotionConstraints }) {
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

    if (!open) return null;

    const onNumberConstraint = (key, min = 0) => (e) => {
        const raw = parseFloat(e.target.value);
        if (!Number.isFinite(raw)) return;
        setMotionConstraints((prev) => ({ ...prev, [key]: Math.max(min, raw) }));
    };

    const onFriction = (e) => {
        const raw = parseFloat(e.target.value);
        if (!Number.isFinite(raw)) return;
        setMotionConstraints((prev) => ({
            ...prev,
            frictionCoefficient: Math.min(2.5, Math.max(0.05, raw)),
        }));
    };

    const dialog = (
        <div className="motion-modal">
            <button
                type="button"
                className="motion-modal__backdrop"
                aria-label="Close motion parameters"
                onClick={onClose}
            />
            <div
                className="motion-modal__panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="motion-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="motion-modal__header">
                    <h2 id="motion-modal-title" className="motion-modal__title">
                        Motion parameters
                    </h2>
                    <button type="button" className="motion-modal__close" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>

                <div className="motion-modal__body">
                    <section className="motion-modal__section">
                        <h3 className="motion-modal__section-title">Translation</h3>
                        <p className="motion-modal__hint">
                            Longitudinal limits along the path. Traction (μ) below caps usable accel before slip.
                        </p>
                        <div className="motion-modal__grid">
                            <label className="motion-modal__field">
                                <span className="motion-modal__label">Max velocity</span>
                                <span className="motion-modal__unit">in/s</span>
                                <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={motionConstraints.maxVel}
                                    onChange={onNumberConstraint("maxVel")}
                                    className="motion-modal__input"
                                />
                            </label>
                            <label className="motion-modal__field">
                                <span className="motion-modal__label">Max acceleration</span>
                                <span className="motion-modal__unit">in/s²</span>
                                <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={motionConstraints.maxAccel}
                                    onChange={onNumberConstraint("maxAccel")}
                                    className="motion-modal__input"
                                />
                            </label>
                            <label className="motion-modal__field motion-modal__field--wide">
                                <span className="motion-modal__label">Max deceleration</span>
                                <span className="motion-modal__unit">in/s²</span>
                                <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={motionConstraints.maxDecel}
                                    onChange={onNumberConstraint("maxDecel")}
                                    className="motion-modal__input"
                                />
                            </label>
                        </div>
                    </section>

                    <section className="motion-modal__section">
                        <h3 className="motion-modal__section-title">Rotation</h3>
                        <div className="motion-modal__grid">
                            <label className="motion-modal__field">
                                <span className="motion-modal__label">Max angular velocity</span>
                                <span className="motion-modal__unit">°/s</span>
                                <input
                                    type="number"
                                    min={0}
                                    step={5}
                                    value={motionConstraints.maxAngVel}
                                    onChange={onNumberConstraint("maxAngVel")}
                                    className="motion-modal__input"
                                />
                            </label>
                            <label className="motion-modal__field motion-modal__field--wide">
                                <span className="motion-modal__label">Max angular acceleration</span>
                                <span className="motion-modal__unit">°/s²</span>
                                <input
                                    type="number"
                                    min={0}
                                    step={10}
                                    value={motionConstraints.maxAngAccel}
                                    onChange={onNumberConstraint("maxAngAccel")}
                                    className="motion-modal__input"
                                />
                            </label>
                        </div>
                    </section>

                    <section className="motion-modal__section">
                        <h3 className="motion-modal__section-title">Traction &amp; drag</h3>
                        <p className="motion-modal__hint">
                            <strong>Friction μ</strong> limits lateral and longitudinal acceleration to about{" "}
                            <span className="motion-modal__mono">μ·g</span> (g ≈ 386 in/s²).{" "}
                            <strong>Rolling resistance</strong> opposes motion when accelerating and adds effective
                            braking when slowing.
                        </p>
                        <div className="motion-modal__grid">
                            <label className="motion-modal__field">
                                <span className="motion-modal__label">Friction coefficient μ</span>
                                <span className="motion-modal__unit">—</span>
                                <input
                                    type="number"
                                    min={0.05}
                                    max={2.5}
                                    step={0.05}
                                    value={motionConstraints.frictionCoefficient}
                                    onChange={onFriction}
                                    className="motion-modal__input"
                                />
                            </label>
                            <label className="motion-modal__field motion-modal__field--wide">
                                <span className="motion-modal__label">Rolling resistance</span>
                                <span className="motion-modal__unit">in/s²</span>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    value={motionConstraints.rollingResistance}
                                    onChange={onNumberConstraint("rollingResistance")}
                                    className="motion-modal__input"
                                />
                            </label>
                        </div>
                    </section>
                </div>

                <div className="motion-modal__footer">
                    <button type="button" className="motion-modal__done" onClick={onClose}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(dialog, document.body);
}

export default MotionParamsModal;
