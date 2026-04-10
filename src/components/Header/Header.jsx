import "./Header.css";

function Header({ onOpenMotion, onOpenExport }) {
    return (
        <header className="header">
            <div className="header__brand">
                <img className="header__logo" src="/logo.png" alt="" width={32} height={32} decoding="async" />
                <div className="header__titles">
                    <h1 className="header__title">RRPathPlanner</h1>
                </div>
            </div>
            
            <div className="header__actions">
                <button 
                    type="button" 
                    className="header__btn"
                    onClick={onOpenMotion}
                    title="Configure motion constraints"
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                        <circle cx="12" cy="12" r="4" />
                    </svg>
                </button>
                <button 
                    type="button" 
                    className="header__btn header__btn--primary"
                    onClick={onOpenExport}
                    title="Export Road Runner code"
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                    </svg>
                </button>
            </div>
        </header>
    );
}

export default Header;
