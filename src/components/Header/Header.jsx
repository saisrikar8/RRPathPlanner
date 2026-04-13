import "./Header.css";

function Header({ onOpenMotion, onOpenExport, onOpenImport }) {
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
                    onClick={onOpenImport}
                    title="Import Code"
                >
                    <img src = "/import.svg" style = {{filter: "invert(1)"}}/>
                </button>
                <button 
                    type="button" 
                    className="header__btn"
                    onClick={onOpenMotion}
                    title="Configure motion constraints"
                >
                    <svg width="25px" height="25px" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" strokeWidth="3" stroke="#ffffff" fill="none"><path d="M45,14.67l-2.76,2a1,1,0,0,1-1,.11L37.65,15.3a1,1,0,0,1-.61-.76l-.66-3.77a1,1,0,0,0-1-.84H30.52a1,1,0,0,0-1,.77l-.93,3.72a1,1,0,0,1-.53.65l-3.3,1.66a1,1,0,0,1-1-.08l-3-2.13a1,1,0,0,0-1.31.12l-3.65,3.74a1,1,0,0,0-.13,1.26l1.87,2.88a1,1,0,0,1,.1.89L16.34,27a1,1,0,0,1-.68.63l-3.85,1.06a1,1,0,0,0-.74,1v4.74a1,1,0,0,0,.8,1l3.9.8a1,1,0,0,1,.72.57l1.42,3.15a1,1,0,0,1-.05.92l-2.13,3.63a1,1,0,0,0,.17,1.24L19.32,49a1,1,0,0,0,1.29.09L23.49,47a1,1,0,0,1,1-.1l3.74,1.67a1,1,0,0,1,.59.75l.66,3.79a1,1,0,0,0,1,.84h4.89a1,1,0,0,0,1-.86l.58-4a1,1,0,0,1,.58-.77l3.58-1.62a1,1,0,0,1,1,.09l3.14,2.12a1,1,0,0,0,1.3-.15L50,45.06a1,1,0,0,0,.09-1.27l-2.08-3a1,1,0,0,1-.09-1l1.48-3.43a1,1,0,0,1,.71-.59L53.77,35a1,1,0,0,0,.8-1V29.42a1,1,0,0,0-.8-1l-3.72-.78a1,1,0,0,1-.73-.62l-1.45-3.65a1,1,0,0,1,.11-.94l2.15-3.14A1,1,0,0,0,50,18l-3.71-3.25A1,1,0,0,0,45,14.67Z"/><circle cx="32.82" cy="31.94" r="9.94"/></svg>
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
