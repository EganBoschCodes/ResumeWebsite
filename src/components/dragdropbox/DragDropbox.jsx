import React from "react";

import './DragDropbox.scss';

class DragDropbox extends React.Component {
    constructor (props) {
        super(props);
        this.state = { 
            pos: props.position,
            rel_coords: [0, 0],
            dragging: false,
            moving_vertical: false
        };
    }
    
    pickup = (event) => {

        //event.dataTransfer.setDragImage(document.createElement("img"), 0, 0);
        
        var bounds = event.target.getBoundingClientRect();
        var x = event.clientX - bounds.left;
        var y = event.clientY - bounds.top;

        this.setState( {rel_coords: [x, y], dragging: true } );

    }

    drop = (event) => {

        var newX = event.pageX - this.state.rel_coords[0];
        var newY = event.pageY- this.state.rel_coords[1];

        var dx = newX - this.state.pos[0];
        var dy = newY - this.state.pos[1];

        if (Math.abs(dx) > Math.abs(dy)) {
            this.setState( {moving_vertical: false} );
        }
        else {
            this.setState( {moving_vertical: true} );
        }

        this.setState( {pos: [event.pageX - this.state.rel_coords[0], event.pageY- this.state.rel_coords[1]], dragging: false} );
        this.setState( { dragging: false } );
    }

    render = () => {
        return (
            <div className="drag-drop-box" draggable="true" 
            style={ {
                top: this.state.pos[1] + "px", 
                left: this.state.pos[0] + "px", 
                cursor: (this.state.dragging ? "grabbing" : "grab"),
                transition: (this.state.moving_vertical ? "top 0.4s cubic-bezier(.31,1.02,.82,.02), left 0.4s linear" : "top 0.4s linear, left 0.4s cubic-bezier(.31,1.02,.82,.02)")
            } } 
            onDragStart = { this.pickup }
            onDragEnd = { this.drop }
            >

            </div>
        );
    }
}

export default DragDropbox;