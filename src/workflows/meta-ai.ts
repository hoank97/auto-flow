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
