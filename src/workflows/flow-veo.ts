import { Workflow } from './types';

// Flow.Veo Workflow 1: Create Video
export const flowVeoCreateVideo: Workflow = {
  id: 'flow-veo-create-video',
  name: 'Create Video',
  description: 'Create video from prompt',
  platform: 'flow-veo',
  steps: [
    {
      type: 'fillInput',
      selector: 'textarea[placeholder*="prompt"]', // Placeholder - customize this
      value: 'A beautiful sunset over the ocean',
    },
    {
      type: 'click',
      selector: 'button.generate-btn', // Placeholder - customize this
    },
    {
      type: 'wait',
      duration: 5000, // Wait for video generation
    },
  ],
};

// Flow.Veo Workflow 2: Download Result
export const flowVeoDownloadResult: Workflow = {
  id: 'flow-veo-download-result',
  name: 'Download Result',
  description: 'Download generated video',
  platform: 'flow-veo',
  steps: [
    {
      type: 'wait',
      selector: 'video', // Wait for video to appear
    },
    {
      type: 'click',
      selector: 'button.download-video', // Placeholder - customize this
    },
  ],
};
