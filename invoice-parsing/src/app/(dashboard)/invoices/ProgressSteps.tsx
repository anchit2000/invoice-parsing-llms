import React from 'react';
import { CheckCircle } from 'lucide-react';

interface Step {
  num: number;
  name: string;
  icon: React.ComponentType<any>;
}

interface ProgressStepsProps {
  currentStep: number;
  steps: Step[];
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ currentStep, steps }) => {
  return (
    <div className="flex justify-center mb-8">
      <div className="flex items-center gap-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.num;
          const isCompleted = currentStep > step.num;
          
          return (
            <React.Fragment key={step.num}>
              <div className="flex items-center gap-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isActive ? 'bg-indigo-600 text-white shadow-lg' :
                  isCompleted ? 'bg-green-600 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {isCompleted ? <CheckCircle size={24} /> : <Icon size={24} />}
                </div>
                <div>
                  <p className={`font-semibold ${isActive ? 'text-indigo-600' : 'text-gray-600'}`}>
                    Step {step.num}
                  </p>
                  <p className="text-sm text-gray-500">{step.name}</p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-16 h-1 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressSteps;