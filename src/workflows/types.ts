// Workflow step types
export type FillInputStep = {
  type: 'fillInput';
  selector: string;
  value: string;
};

export type ClickStep = {
  type: 'click';
  selector: string;
  index?: number; // 0-based index when multiple elements match
};

export type WaitStep = {
  type: 'wait';
  duration?: number; // milliseconds
  selector?: string; // wait for element to appear
};

export type WaitForNewResultsStep = {
  type: 'waitForNewResults';
  selector: string; // selector for result items
  expectedCount: number; // number of new results to wait for
};

export type DownloadStep = {
  type: 'download';
  selector: string; // selector for download button/link
  index?: number; // 0-based index when multiple elements match
};

export type WorkflowStep = FillInputStep | ClickStep | WaitStep | WaitForNewResultsStep | DownloadStep;

// Platform types
export type Platform = 'meta-ai' | 'flow-veo';

// Workflow definition
export interface Workflow {
  id: string;
  name: string;
  description: string;
  platform: Platform;
  steps: WorkflowStep[];
}

// Execution status
export type WorkflowStatus = 'idle' | 'running' | 'success' | 'error';

export interface WorkflowExecutionState {
  status: WorkflowStatus;
  currentStep: number;
  totalSteps: number;
  error?: string;
}
