import React from 'react';
import PropTypes from 'prop-types';

const Stepper = ({ currentStage, steps }) => {
  return (
    <div className="stepper">
      {steps.map((step, index) => (
        <div key={step} className="step-item">
          {index !== 0 && (
            <div
              className={`step-line ${
                currentStage > index ? 'completed' : ''
              }`}
            ></div>
          )}
          <div
            className={`step-circle ${
              currentStage === index + 1 ? 'active' : ''
            } ${currentStage > index + 1 ? 'completed' : ''}`}
          >
            {currentStage > index + 1 ? '✔' : index + 1}
          </div>
          <p className="step-label">{step}</p>
        </div>
      ))}
    </div>
  );
};

Stepper.propTypes = {
  currentStage: PropTypes.number.isRequired,
  steps: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default Stepper;
