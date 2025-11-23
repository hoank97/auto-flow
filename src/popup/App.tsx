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
        steps: customSteps || workflow.steps,
        metadata: customSteps ? (customSteps as any).metadata : undefined
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

    // Get workflows
    const submitWorkflow = getWorkflowById('meta-ai-submit-only');
    const downloadWorkflow = getWorkflowById('meta-ai-download-only');
    
    if (!submitWorkflow || !downloadWorkflow) {
      alert('Required workflows not found');
      setIsBatchRunning(false);
      return;
    }

    console.log(`[Batch] Starting ${batchPrompts.length} prompts...`);

    // Process each prompt sequentially
    for (let i = 0; i < batchPrompts.length; i++) {
      const prompt = batchPrompts[i];

      // Update status to processing
      setBatchPrompts(prev => prev.map((p, idx) => 
        idx === i ? { ...p, status: 'processing' as PromptStatus } : p
      ));
      
      setBatchProgress({ 
        current: i + 1,
        total: batchPrompts.length,
        currentPrompt: prompt.text 
      });

      try {
        // Submit prompt and wait for generation
        const submitSteps = submitWorkflow.steps.map(step => {
          if (step.type === 'fillInput') {
            return { ...step, value: prompt.text };
          }
          return step;
        });

        await runWorkflow(submitWorkflow.id, Object.assign(submitSteps, {
          metadata: { promptIndex: i, promptText: prompt.text, phase: 'submit' }
        }));

        // Wait 20 seconds before download
        await new Promise(r => setTimeout(r, 20000));

        // Download results
        await runWorkflow(downloadWorkflow.id, Object.assign(downloadWorkflow.steps, {
          metadata: { promptIndex: i, promptText: prompt.text, phase: 'download' }
        }));
        
        console.log(`[Batch] ✅ Prompt ${i + 1}/${batchPrompts.length} completed`);

        // Update status to completed
        setBatchPrompts(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'completed' as PromptStatus } : p
        ));

        // Delay before next prompt
        if (i < batchPrompts.length - 1) {
          await new Promise(r => setTimeout(r, delayBetweenPrompts));
        }

      } catch (error) {
        console.error(`[Batch] ❌ Prompt ${i + 1} failed:`, error);
        
        // Update status to error
        setBatchPrompts(prev => prev.map((p, idx) => 
          idx === i ? { 
            ...p, 
            status: 'error' as PromptStatus,
            error: error instanceof Error ? error.message : 'Unknown error'
          } : p
        ));
      }
    }

    console.log('[Batch] 🎊 Done!');
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
