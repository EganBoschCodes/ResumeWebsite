import React from "react";

import './Counter.scss';


class Counter extends React.Component {
    constructor (props) {
        super(props);
        this.state = { 
            count: 0
        };
    }

    incrementState = (event) => {
        console.log(event);
        this.setState( {count: this.state.count + 1} )
    }

    render = () => {
        return (
            <div className="counter-box" onClick = { this.incrementState }>
                <p>{ this.state.count } </p>
            </div>
        );
    }
}

export default Counter;