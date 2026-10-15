import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  completedSteps: Set<number>;
}

export function ProgressIndicator({ steps, currentStep, completedSteps }: ProgressIndicatorProps) {
  return (
    <div className="w-full py-8">
      <p className="text-sm font-medium sm:hidden">Step {currentStep + 1} of {steps.length}: {steps[currentStep]}</p>
      <div className="hidden sm:flex items-center justify-between mb-2">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={cn(
                "progress-step mb-2",
                currentStep === index && "active",
                completedSteps.has(index) && "completed"
              )}
            >
              {completedSteps.has(index) ? (
                <Check className="w-4 h-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className={cn(
              "text-xs text-center max-w-20 leading-tight",
              currentStep === index ? "text-primary font-medium" : "text-muted-foreground"
            )}>
              {step}
            </span>
          </div>
        ))}
      </div>
      <div className="flex">
        {steps.map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-1 flex-1 mx-1 first:ml-0 last:mr-0 rounded-full transition-all duration-300",
              index < currentStep || completedSteps.has(index)
                ? "bg-primary"
                : "bg-border"
            )}
          />
        ))}
      </div>
    </div>
  );
}