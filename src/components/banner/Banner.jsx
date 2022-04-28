import React from "react";

import './Banner.scss';


class Banner extends React.Component {
    render() {
        return (
            <section className="banner">
                <img className="banner-image" alt="banner" src={ this.props.src } />
                <span className="banner-text-container"><b className="banner-text">{ this.props.splash }</b></span>
            </section>
        );
    }
}

export default Banner;