import React from "react";

import './Navbar.scss';
import logo from 'assets/face512.png';

class Navbar extends React.Component {
    render() {
        return (
            <div id="navbar-container">
                <section id="navbar">
                    <a className="header-image" href="localhost:3000"><img className="logo" alt="logo" src={logo} draggable="false" /></a>
                    <a className="header-link" href="localhost:3000">Apply</a>
                    <a className="header-link" href="localhost:3000">Classes</a>
                    <a className="header-link" href="localhost:3000">Blog</a>
                    <a className="header-link" href="localhost:3000">Contact Us</a>
                </section>
                <div id="spacer"></div>
            </div>
        );
    }
}

export default Navbar;