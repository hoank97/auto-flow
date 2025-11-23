import { Workflow } from './types';

// Meta.AI Workflow: Generate & Download
export const metaAIGenerateDownload: Workflow = {
  id: 'meta-ai-generate-download',
  name: 'Generate & Download',
  description: 'Generate content and download 4 results',
  platform: 'meta-ai',
  steps: [
    {
      type: 'fillInput',
      selector: 'p.x1oj8htv.x2dq9o6.xxzylry.x1mfz1tq.xdj266r.x14z9mp.xat24cr.x1lziwak.xv54qhq',
      value: 'a video of a beautiful sunset over the ocean',
    },
    {
      type: 'click',
      selector: 'div[aria-label="Send"][role="button"]',
    },
    {
      type: 'wait',
      duration: 3000, // Wait 3s for generation to start
    },
    // Wait for new results to appear (4 new <a> tags)
    {
      type: 'waitForNewResults',
      selector: 'a[href^="/create/"]',
      expectedCount: 4, // Expect 4 new results
    },
    // Wait for download buttons to be available (videos finished generating)
    {
      type: 'wait',
      selector: 'div[aria-label="Download media"][role="button"]',
    },
    {
      type: 'wait',
      duration: 2000, // Additional buffer to ensure all 4 videos are ready
    },
    // Download button 1
    {
      type: 'click',
      selector: 'div[aria-label="Download media"][role="button"]',
      index: 0,
    },
    {
      type: 'wait',
      duration: 500, // Small delay between downloads
    },
    // Download button 2
    {
      type: 'click',
      selector: 'div[aria-label="Download media"][role="button"]',
      index: 1,
    },
    {
      type: 'wait',
      duration: 500,
    },
    // Download button 3
    {
      type: 'click',
      selector: 'div[aria-label="Download media"][role="button"]',
      index: 2,
    },
    {
      type: 'wait',
      duration: 500,
    },
    // Download button 4
    {
      type: 'click',
      selector: 'div[aria-label="Download media"][role="button"]',
      index: 3,
    },
  ],
};

// Meta.AI Workflow: Submit Only (for batch processing)
export const metaAISubmitOnly: Workflow = {
  id: 'meta-ai-submit-only',
  name: 'Submit Prompt Only',
  description: 'Submit prompt and wait for results to appear',
  platform: 'meta-ai',
  steps: [
    {
      type: 'fillInput',
      selector: 'p.x1oj8htv.x2dq9o6.xxzylry.x1mfz1tq.xdj266r.x14z9mp.xat24cr.x1lziwak.xv54qhq',
      value: 'a video of a beautiful sunset over the ocean',
    },
    {
      type: 'click',
      selector: 'div[aria-label="Send"][role="button"]',
    },
    {
      type: 'wait',
      duration: 3000, // Wait 3s for generation to start
    },
    // Wait for new results to appear (4 new <a> tags)
    {
      type: 'waitForNewResults',
      selector: 'a[href^="/create/"]',
      expectedCount: 4, // Expect 4 new results
    },
    // Wait for download buttons to be available (videos finished generating)
    {
      type: 'wait',
      selector: 'div[aria-label="Download media"][role="button"]',
    },
    {
      type: 'wait',
      duration: 2000, // Additional buffer to ensure all 4 videos are ready
    },
  ],
};

// Meta.AI Workflow: Download Only (for batch processing)
export const metaAIDownloadOnly: Workflow = {
  id: 'meta-ai-download-only',
  name: 'Download Results Only',
  description: 'Download 4 results without submitting',
  platform: 'meta-ai',
  steps: [
    // Download button 1
    {
      type: 'click',
      selector: 'div[aria-label="Download media"][role="button"]',
      index: 0,
    },
    {
      type: 'wait',
      duration: 500, // Small delay between downloads
    },
    // Download button 2
    {
      type: 'click',
      selector: 'div[aria-label="Download media"][role="button"]',
      index: 1,
    },
    {
      type: 'wait',
      duration: 500,
    },
    // Download button 3
    {
      type: 'click',
      selector: 'div[aria-label="Download media"][role="button"]',
      index: 2,
    },
    {
      type: 'wait',
      duration: 500,
    },
    // Download button 4
    {
      type: 'click',
      selector: 'div[aria-label="Download media"][role="button"]',
      index: 3,
    },
  ],
};
