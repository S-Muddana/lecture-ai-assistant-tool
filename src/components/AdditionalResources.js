import React from 'react';

const AdditionalResources = (props) => {
    return (
        <div className="w-1/2">
            <details className="w-full collapse collapse-arrow bg-base-200">
                <summary className="collapse-title text-xl font-medium">Additional Learning Material & Resources</summary>
                <div className="collapse-content"> 
                    <p>{props.resources}</p>
                </div>
            </details>
        </div>
    );
}

export default AdditionalResources;