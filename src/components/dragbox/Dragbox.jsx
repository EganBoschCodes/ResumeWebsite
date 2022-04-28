import React from "react";

import './Dragbox.scss';

class Dragbox extends React.Component {
    constructor (props) {
        super(props);
        this.state = { 
            pos: props.position,
            rel_coords: [0, 0],
            dragging: false
        };
    }

    updatePosition = (event) => {
        if (! (event.clientX === 0 && event.clientY === 0)) {
            this.setState( {pos: [event.pageX - this.state.rel_coords[0], event.pageY- this.state.rel_coords[1]] } );
        }
    }
    
    disappear = (event) => {

        event.dataTransfer.setDragImage(document.createElement("img"), 0, 0);
        
        var bounds = event.target.getBoundingClientRect();
        var x = event.clientX - bounds.left;
        var y = event.clientY - bounds.top;

        this.setState( {rel_coords: [x, y], dragging: true } );

    }

    reappear = (event) => {
        event.preventDefault();
        this.setState( { dragging: false } );
    }

    render = () => {
        return (
            <div className="drag-box" draggable="true" 
            style={ {top: this.state.pos[1] + "px", left: this.state.pos[0] + "px", cursor: (this.state.dragging ? "grabbing" : "grab") } } 
            onDrag = { this.updatePosition }
            onDragStart = { this.disappear }
            onDragEnd = { this.reappear }
            >

            </div>
        );
    }
}

export default Dragbox;