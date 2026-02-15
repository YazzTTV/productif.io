export type TutorialControls = {
  currentStep?: {
    name: string;
    order: number;
    text: string;
  };
  goToNext: () => Promise<void>;
  goToPrev: () => Promise<void>;
  goToNth: (n: number) => Promise<void>;
  stop: () => Promise<void>;
};

type TutorialNextHandler = (controls: TutorialControls) => void;

let nextHandler: TutorialNextHandler | null = null;

export function setTutorialNextHandler(handler: TutorialNextHandler | null) {
  nextHandler = handler;
}

export function runTutorialNextHandler(controls: TutorialControls): boolean {
  if (!nextHandler) return false;
  nextHandler(controls);
  return true;
}
