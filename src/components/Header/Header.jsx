import "./Header.css";

function Header() {
    return (
        <header className="header">
            <div className="header__brand">
                <img className="header__logo" src="logo.svg" alt="" width={40} height={40} decoding="async" />
                <div className="header__titles">
                    <span className="header__kicker">FTC · spline preview</span>
                    <h1 className="header__title">Road Runner Visualizer</h1>
                </div>
            </div>
            <div className="header__rule" aria-hidden />
        </header>
    );
}

export default Header;
