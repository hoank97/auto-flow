import { WorkflowStep } from '../workflows/types';



// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {

  if (message.type === 'EXECUTE_WORKFLOW') {
    const metadata = message.metadata;
    executeWorkflow(message.steps, metadata)
      .then(() => {
        console.log('[Auto-Flow Content] ✅ Workflow completed successfully');
        if (metadata) {
          console.log('[Auto-Flow Content] 🎉 PROMPT COMPLETED');
        }
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('[Auto-Flow Content] Workflow failed:', error);
        if (metadata) {
          console.error('[Auto-Flow Content] ❌ PROMPT FAILED');
        }
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
});

// Execute workflow steps sequentially
async function executeWorkflow(steps: WorkflowStep[], _metadata?: any): Promise<void> {
  console.log('[Auto-Flow Content] 📋 Starting workflow');
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    try {
      await executeStep(step);
      await sleep(300);
    } catch (error) {
      throw error;
    }
  }
}

// Execute a single workflow step
async function executeStep(step: WorkflowStep): Promise<void> {
  switch (step.type) {
    case 'fillInput':
      await fillInput(step.selector, step.value);
      break;
    case 'click':
      await clickElement(step.selector, step.index);
      break;
    case 'wait':
      if (step.selector) {
        await waitForElement(step.selector);
      } else if (step.duration) {
        await sleep(step.duration);
      }
      break;
    case 'waitForNewResults':
      await waitForNewResults(step.selector, step.expectedCount);
      break;
    case 'download':
      await clickElement(step.selector, step.index);
      break;
    default:
      throw new Error(`Unknown step type: ${(step as any).type}`);
  }
}

// Fill input field or contentEditable element
async function fillInput(selector: string, value: string): Promise<void> {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  // Check if it's a regular input/textarea
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }
  // Check if it's a contentEditable element (like <p>, <div>, or Lexical editor)
  else if (element instanceof HTMLElement) {
    // Focus the element first
    element.focus();

    // Check if element is inside a contentEditable container (for Lexical Editor)
    const hasContentEditableParent = element.closest('[contenteditable="true"]') !== null;
    const isLexicalNode = element.hasAttribute('data-lexical-text') ||
      element.querySelector('[data-lexical-text]') !== null ||
      hasContentEditableParent;

    if (isLexicalNode || element.isContentEditable || element.hasAttribute('contenteditable')) {
      // Find the contentEditable parent if we're targeting a child element
      let editableElement = element;
      if (!element.isContentEditable && !element.hasAttribute('contenteditable')) {
        const parent = element.closest('[contenteditable="true"]');
        if (parent instanceof HTMLElement) {
          editableElement = parent;
          editableElement.focus();
        }
      }

      // Clear existing content by selecting all
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editableElement);
      selection?.removeAllRanges();
      selection?.addRange(range);

      // Delete existing content
      document.execCommand('delete', false);

      // Wait a bit for Lexical to process the deletion
      await sleep(100);

      // Method 1: Try using execCommand (works with most editors)
      const inserted = document.execCommand('insertText', false, value);

      if (!inserted) {
        // Method 2: Fallback - use clipboard events

        // Create and dispatch paste event
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', value);

        const pasteEvent = new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: dataTransfer
        });

        editableElement.dispatchEvent(pasteEvent);

        // If paste event was prevented, manually insert
        if (pasteEvent.defaultPrevented) {

          // Focus and set cursor at the end
          editableElement.focus();
          const newRange = document.createRange();
          newRange.selectNodeContents(editableElement);
          newRange.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(newRange);

          // Insert text node
          const textNode = document.createTextNode(value);
          newRange.insertNode(textNode);

          // Move cursor to end
          newRange.setStartAfter(textNode);
          newRange.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(newRange);

          // Only dispatch input event for manual insertion
          editableElement.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            cancelable: false,
            inputType: 'insertText',
            data: value
          }));
        }
      }

      // Dispatch final events
      editableElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
    // Regular element fallback
    else {
      element.textContent = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  else {
    throw new Error(`Element ${selector} is not a valid input element`);
  }
}


// Click element
async function clickElement(selector: string, index?: number): Promise<void> {
  if (index !== undefined) {
    // Query all elements and select by index
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) {
      throw new Error(`No elements found: ${selector}`);
    }
    if (index >= elements.length) {
      throw new Error(`Index ${index} out of range. Found ${elements.length} elements for: ${selector}`);
    }
    const element = elements[index] as HTMLElement;
    element.click();
  } else {
    // Query single element
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    element.click();
  }
}

// Wait for element to appear
async function waitForElement(selector: string, timeout: number = 10000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) {
      return;
    }
    await sleep(100);
  }

  throw new Error(`Element not found within ${timeout}ms: ${selector}`);
}

// Wait for new results to appear (count increase)
async function waitForNewResults(selector: string, expectedCount: number, timeout: number = 60000): Promise<void> {
  const initialCount = document.querySelectorAll(selector).length;
  const targetCount = initialCount + expectedCount;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const currentCount = document.querySelectorAll(selector).length;
    if (currentCount >= targetCount) {
      return;
    }
    await sleep(500); // Check every 500ms
  }

  const finalCount = document.querySelectorAll(selector).length;
  throw new Error(`Expected ${expectedCount} new results within ${timeout}ms. Initial: ${initialCount}, Final: ${finalCount}`);
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
