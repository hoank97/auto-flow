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
  const [_batchProgress, setBatchProgress] = useState<BatchProgress>({ current: 0, total: 0 });
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [delayBetweenPrompts, setDelayBetweenPrompts] = useState(2000); // milliseconds
  const [expandedPrompts, setExpandedPrompts] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState('control');

  const toggleExpand = (index: number) => {
    setExpandedPrompts(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

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

  const handleRunBatch = async (promptsToRun: PromptItem[]) => {
    if (promptsToRun.length === 0) {
      alert('Please enter prompts first');
      return;
    }

    setIsBatchRunning(true);
    setBatchProgress({ current: 0, total: promptsToRun.length });

    // Get workflows
    const submitWorkflow = getWorkflowById('meta-ai-submit-only');
    const downloadWorkflow = getWorkflowById('meta-ai-download-only');
    
    if (!submitWorkflow || !downloadWorkflow) {
      alert('Required workflows not found');
      setIsBatchRunning(false);
      return;
    }

    console.log(`[Batch] Starting ${promptsToRun.length} prompts...`);

    // Process each prompt sequentially
    for (let i = 0; i < promptsToRun.length; i++) {
      const prompt = promptsToRun[i];

      // Update status to processing
      setBatchPrompts(prev => prev.map((p, idx) => 
        idx === i ? { ...p, status: 'processing' as PromptStatus } : p
      ));
      
      setBatchProgress({ 
        current: i + 1,
        total: promptsToRun.length,
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
        
        console.log(`[Batch] ✅ Prompt ${i + 1}/${promptsToRun.length} completed`);

        // Update status to completed
        setBatchPrompts(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'completed' as PromptStatus } : p
        ));

        // Delay before next prompt
        if (i < promptsToRun.length - 1) {
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
    setBatchProgress({ current: promptsToRun.length, total: promptsToRun.length });
  };

  const handleStart = () => {
    const prompts = batchInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(text => ({ text, status: 'pending' as PromptStatus }));
    
    if (prompts.length === 0) {
      alert('Please enter prompts first');
      return;
    }

    setBatchPrompts(prompts);
    handleRunBatch(prompts);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <div className="logo-container">
            🤖
          </div>
          <div className="brand-info">
            <h1>Auto Meta</h1>
            <p>Automation for Meta AI</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-icon" title="Buy Me a Coffee">☕</button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav-tabs">
        {['Control', 'Settings', 'History', 'More Tools'].map((tab) => (
          <button 
            key={tab}
            className={`nav-item ${activeTab === tab.toLowerCase() ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.toLowerCase())}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'control' && (
          <div className="control-panel">
            {/* Input Section */}
            <section className="card">
              <div className="section-header">
                <h2 className="section-title">
                  <span>📝</span> Prompt List
                </h2>
                {batchPrompts.length > 0 && (
                  <span className="status-badge">
                    {batchPrompts.filter(p => p.status === 'completed').length} / {batchPrompts.length} Done
                  </span>
                )}
              </div>

              <div className="input-wrapper">
                <textarea
                  className="prompt-textarea"
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  placeholder="Enter your prompts here (one per line)..."
                  disabled={isBatchRunning}
                />
              </div>

              <div className="controls-area">
                <div className="setting-group">
                  <span className="setting-label">Delay (s):</span>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    className="setting-input"
                    value={delayBetweenPrompts / 1000}
                    onChange={(e) => setDelayBetweenPrompts(Number(e.target.value) * 1000)}
                    disabled={isBatchRunning}
                  />
                </div>

                {!isBatchRunning ? (
                  <button
                    className="btn-primary"
                    onClick={handleStart}
                    disabled={!batchInput.trim()}
                  >
                    <span>▶</span> Start Automation
                  </button>
                ) : (
                  <button className="btn-danger" disabled>
                    <span>⏹</span> Stop
                  </button>
                )}
              </div>
            </section>

            {/* Status List */}
            {batchPrompts.length > 0 && (
              <div className="status-list">
                {batchPrompts.map((prompt, index) => {
                  const isExpanded = expandedPrompts.includes(index);
                  return (
                    <div key={index} className={`status-item ${prompt.status}`}>
                      <div className="status-indicator">
                        {prompt.status === 'completed' ? '✓' : 
                         prompt.status === 'processing' ? '⟳' : 
                         prompt.status === 'error' ? '✕' : (index + 1)}
                      </div>
                      <div className="status-content">
                        <div 
                          className={`prompt-preview ${isExpanded ? 'expanded' : ''}`}
                          onClick={() => toggleExpand(index)}
                        >
                          {prompt.text}
                        </div>
                        <div className="status-badge">
                          {prompt.status.charAt(0).toUpperCase() + prompt.status.slice(1)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
