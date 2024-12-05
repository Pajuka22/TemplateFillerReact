import React, { useState } from 'react';
import './ParamEntry.css';

function ParamEntry(props, key) {
	const [isExpanded, setIsExpanded] = useState(false);

	const RenameParam = (e) => {
		props.Rename(props.paramname, window.prompt(`Rename paramater ${props.paramname}`))
	}

	const Highlight = (e) => {
		props.HighlightParam(props.paramname)
	}

	const toggleExpand = () => {
		setIsExpanded(!isExpanded);
	}

	return (
		<div className="paramEntry">
			<div className="paramHeader" onClick={toggleExpand}>
				<span className="triangleIcon">{isExpanded ? "▼" : "▶"}</span>
				<span>{props.paramname}</span>
				<br/>
			</div>
			{isExpanded && (
				<div className="paramControls">
					<button onClick={RenameParam}>Rename Parameter</button>
					<button onClick={Highlight}>Toggle Highlight</button>
				</div>
			)}
		</div>
	)
}

export default ParamEntry;