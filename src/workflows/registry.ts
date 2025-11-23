import { metaAIDownloadOnly, metaAIGenerateDownload, metaAISubmitOnly } from './meta-ai';
import { Workflow } from './types';

// All workflows
export const workflows: Workflow[] = [
  metaAIGenerateDownload,
  metaAISubmitOnly,
  metaAIDownloadOnly,
];

// Helper to get workflow by ID
export function getWorkflowById(id: string): Workflow | undefined {
  return workflows.find(w => w.id === id);
}
