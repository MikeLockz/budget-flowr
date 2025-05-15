import { cn } from "@/lib/utils";

interface ImportStepperProps {
  steps: string[];
  currentStep: number;
}

export function ImportStepper({ steps, currentStep }: ImportStepperProps) {
  return (
    <div className="w-full py-4">
      <div className="flex justify-between relative">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center relative z-10">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-medium",
                index < currentStep
                  ? "border-green-500 bg-green-500 text-white"
                  : index === currentStep
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300 bg-gray-100 text-gray-400"
              )}
            >
              {index + 1}
            </div>
            <span className="text-xs mt-1 font-medium">{step}</span>
          </div>
        ))}

        {/* Line connectors */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-300 -z-0"></div>
        <div 
          className="absolute top-4 left-0 h-0.5 bg-green-500 -z-0" 
          style={{ 
            width: `calc(${(Math.min(currentStep, steps.length - 1) / (steps.length - 1)) * 100}%)` 
          }}
        ></div>
      </div>
    </div>
  );
}