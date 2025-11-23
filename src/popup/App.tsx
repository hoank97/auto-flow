import { useState } from 'react';
import { getWorkflowById } from '../workflows/registry';
import { WorkflowStep } from '../workflows/types';

interface BatchProgress {
  current: number;
  total: number;
  currentPrompt?: string;
}

type PromptStatus = 'pending' | 'processing' | 'completed' | 'error';

interface PromptItem {
  text: string;
  status: PromptStatus;
  error?: string;
}

function App() {
  // Batch state
  const [batchInput, setBatchInput] = useState('');
  const [batchPrompts, setBatchPrompts] = useState<PromptItem[]>([]);
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({ current: 0, total: 0 });
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [delayBetweenPrompts, setDelayBetweenPrompts] = useState(2000); // milliseconds

  const runWorkflow = async (workflowId: string, customSteps?: WorkflowStep[]) => {
    const workflow = getWorkflowById(workflowId);
    if (!workflow) return;

    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // Send workflow to content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'EXECUTE_WORKFLOW',
        steps: customSteps || workflow.steps
      });

      if (!response.success) {
        throw new Error(response.error || 'Workflow execution failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const handlePreview = () => {
    const prompts = batchInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(text => ({ text, status: 'pending' as PromptStatus }));
    setBatchPrompts(prompts);
  };

  const handleRunBatch = async () => {
    if (batchPrompts.length === 0) {
      alert('Please preview prompts first');
      return;
    }

    setIsBatchRunning(true);
    setBatchProgress({ current: 0, total: batchPrompts.length });

    // Use "Generate & Download" workflow
    const workflow = getWorkflowById('meta-ai-generate-download');
    if (!workflow) {
      alert('Generate & Download workflow not found');
      setIsBatchRunning(false);
      return;
    }

    // Track which prompts have started
    const startedPrompts = new Set<number>();

    // Create array of promises for parallel execution
    const workflowPromises = batchPrompts.map((prompt, i) => {
      return new Promise<void>(async (resolve) => {
        // Delay start time based on index
        if (i > 0) {
          await new Promise(r => setTimeout(r, delayBetweenPrompts * i));
        }

        // Mark this prompt as started
        startedPrompts.add(i);

        // Update status to processing
        setBatchPrompts(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'processing' as PromptStatus } : p
        ));
        
        setBatchProgress(prev => ({ 
          ...prev, 
          current: Math.max(prev.current, i + 1),
          currentPrompt: prompt.text 
        }));

        // Calculate download button indices
        // Count how many prompts will start AFTER this one
        const promptsAfter = batchPrompts.length - i - 1;
        // Each prompt after this one will add 4 videos, pushing this prompt's videos down
        const baseIndex = promptsAfter * 4;
        
        // Clone workflow steps and modify the prompt and download indices
        const customSteps = workflow.steps.map(step => {
          if (step.type === 'fillInput') {
            return { ...step, value: prompt.text };
          }
          // Update download button indices
          if (step.type === 'click' && step.selector.includes('Download media')) {
            const currentIndex = step.index ?? 0;
            return { ...step, index: baseIndex + currentIndex };
          }
          return step;
        });

        try {
          await runWorkflow(workflow.id, customSteps);
          
          // Update status to completed
          setBatchPrompts(prev => prev.map((p, idx) => 
            idx === i ? { ...p, status: 'completed' as PromptStatus } : p
          ));
        } catch (error) {
          console.error(`Failed to process prompt ${i + 1}:`, error);
          
          // Update status to error
          setBatchPrompts(prev => prev.map((p, idx) => 
            idx === i ? { 
              ...p, 
              status: 'error' as PromptStatus,
              error: error instanceof Error ? error.message : 'Unknown error'
            } : p
          ));
        }
        
        resolve();
      });
    });

    // Wait for all workflows to complete
    await Promise.all(workflowPromises);

    setIsBatchRunning(false);
    setBatchProgress({ current: batchPrompts.length, total: batchPrompts.length });
  };

  return (
    <div className="app">
      <header className="header">
        <h1>⚡ Auto-Flow</h1>
        <p className="subtitle">Meta.AI Batch Processing</p>
      </header>

      <div className="batch-container">
        <div className="batch-input-section">
          <label htmlFor="batch-input">Enter prompts (one per line):</label>
          <textarea
            id="batch-input"
            className="batch-textarea"
            value={batchInput}
            onChange={(e) => setBatchInput(e.target.value)}
            placeholder="a video of a beautiful sunset&#10;a video of a mountain landscape&#10;a video of ocean waves"
            rows={8}
            disabled={isBatchRunning}
          />
          
          <div className="batch-config">
            <label htmlFor="delay-input">Delay between prompts (seconds):</label>
            <input
              id="delay-input"
              type="number"
              min="0"
              max="60"
              step="1"
              value={delayBetweenPrompts / 1000}
              onChange={(e) => setDelayBetweenPrompts(Number(e.target.value) * 1000)}
              disabled={isBatchRunning}
              className="delay-input"
            />
          </div>
          
          <div className="batch-actions">
            <button
              className="btn-preview"
              onClick={handlePreview}
              disabled={isBatchRunning || !batchInput.trim()}
            >
              Preview ({batchInput.split('\n').filter(l => l.trim()).length} prompts)
            </button>
            <button
              className="btn-run-batch"
              onClick={handleRunBatch}
              disabled={isBatchRunning || batchPrompts.length === 0}
            >
              {isBatchRunning ? 'Running...' : 'Run All'}
            </button>
          </div>
        </div>

        {batchPrompts.length > 0 && (
          <div className="batch-preview">
            <h3>Preview ({batchPrompts.length} prompts)</h3>
            <ul className="batch-prompts-list">
              {batchPrompts.map((prompt, index) => {
                const getStatusBadge = (status: PromptStatus) => {
                  switch (status) {
                    case 'pending':
                      return <span className="status-badge pending">⏸️ Pending</span>;
                    case 'processing':
                      return <span className="status-badge processing">⏳ Processing</span>;
                    case 'completed':
                      return <span className="status-badge completed">✅ Downloaded</span>;
                    case 'error':
                      return <span className="status-badge error">❌ Error</span>;
                  }
                };

                return (
                  <li key={index} className={`prompt-item ${prompt.status}`}>
                    <span className="prompt-number">{index + 1}.</span>
                    <span className="prompt-text">{prompt.text}</span>
                    {getStatusBadge(prompt.status)}
                    {prompt.error && (
                      <div className="prompt-error">{prompt.error}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {isBatchRunning && (
          <div className="batch-progress">
            <p>Processing: {batchProgress.current} / {batchProgress.total}</p>
            {batchProgress.currentPrompt && (
              <p className="current-prompt">Current: {batchProgress.currentPrompt}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
