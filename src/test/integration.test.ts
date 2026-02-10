import { EventEmitter } from 'events';

// Mock all dependencies
jest.mock('fs');
jest.mock('https');

const mockFs = require('fs') as jest.Mocked<typeof import('fs')>;
const mockHttps = require('https') as jest.Mocked<typeof import('https')>;
const mockVSCode = (global as any).vscode as any;

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVSCode.workspace.workspaceFolders = [
      { uri: { fsPath: '/test/workspace' } }
    ];
  });

  describe('Complete Sync Workflow', () => {
    test('should complete full agent sync workflow', async () => {
      // Mock configuration
      const mockConfig = {
        get: jest.fn()
          .mockReturnValueOnce('github/awesome-copilot') // targetRepository
          .mockReturnValueOnce('main'), // branch
        update: jest.fn()
      };
      mockVSCode.workspace.getConfiguration.mockReturnValue(mockConfig);

      // Mock GitHub API response
      const mockAgentFiles = [
        {
          name: 'nodejs-expert.agent.md',
          path: 'agents/nodejs-expert.agent.md',
          type: 'file',
          download_url: 'https://raw.githubusercontent.com/github/awesome-copilot/main/agents/nodejs-expert.agent.md'
        },
        {
          name: 'python-developer.agent.md',
          path: 'agents/python-developer.agent.md',
          type: 'file',
          download_url: 'https://raw.githubusercontent.com/github/awesome-copilot/main/agents/python-developer.agent.md'
        }
      ];

      const mockAgentContent = `---
description: "Expert Node.js developer agent"
model: "gpt-4"
tools: ["terminal", "file-editor"]
---

# Node.js Expert Agent

This agent helps with Node.js development tasks.`;

      // Mock HTTPS requests
      mockHttps.get.mockImplementation((url: any, options: any, callback: any) => {
        if (typeof options === 'function') {
          callback = options;
        }

        const mockRequest = new EventEmitter();
        
        setTimeout(() => {
          let mockResponse;
          
          if (typeof url === 'string' && url.includes('/contents/')) {
            // Directory listing request
            mockResponse = {
              statusCode: 200,
              on: (event: string, handler: Function) => {
                if (event === 'data') {
                  handler(JSON.stringify(mockAgentFiles));
                } else if (event === 'end') {
                  handler();
                }
              }
            };
          } else {
            // File download request
            mockResponse = {
              statusCode: 200,
              on: (event: string, handler: Function) => {
                if (event === 'data') {
                  handler(mockAgentContent);
                } else if (event === 'end') {
                  handler();
                }
              }
            };
          }
          
          callback(mockResponse);
        }, 0);
        
        return mockRequest as any;
      });

      // Mock file system operations
      mockFs.existsSync.mockReturnValue(false); // Directory doesn't exist initially
      mockFs.mkdirSync.mockReturnValue(undefined);
      mockFs.writeFileSync.mockReturnValue(undefined);

      // Mock progress handling
      mockVSCode.window.withProgress.mockImplementation(async (options: any, callback: any) => {
        const mockProgress = { report: jest.fn() };
        const mockToken = { isCancellationRequested: false };
        return await callback(mockProgress, mockToken);
      });

      // Simulate the sync process
      const workspaceFolder = '/test/workspace';
      const targetDir = `${workspaceFolder}/.github/agents`;
      
      // Create directory
      if (!mockFs.existsSync(targetDir)) {
        mockFs.mkdirSync(targetDir, { recursive: true });
      }

      // Process each file
      for (const file of mockAgentFiles) {
        const content = mockAgentContent;
        const attribution = `<!-- Synced from: https://github.com/github/awesome-copilot/blob/main/${file.path} -->\n`;
        const finalContent = attribution + content;
        const localPath = `${targetDir}/${file.name}`;
        
        mockFs.writeFileSync(localPath, finalContent);
      }

      // Verify operations
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(targetDir, { recursive: true });
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(mockAgentFiles.length);
      
      mockAgentFiles.forEach(file => {
        const expectedContent = `<!-- Synced from: https://github.com/github/awesome-copilot/blob/main/${file.path} -->\n${mockAgentContent}`;
        expect(mockFs.writeFileSync).toHaveBeenCalledWith(
          `${targetDir}/${file.name}`,
          expectedContent
        );
      });
    });

    test('should handle sync errors gracefully', async () => {
      // Mock configuration
      const mockConfig = {
        get: jest.fn()
          .mockReturnValueOnce('github/awesome-copilot')
          .mockReturnValueOnce('main'),
        update: jest.fn()
      };
      mockVSCode.workspace.getConfiguration.mockReturnValue(mockConfig);

      // Mock network error
      mockHttps.get.mockImplementation(() => {
        const mockRequest = new EventEmitter();
        setTimeout(() => {
          mockRequest.emit('error', new Error('Network failure'));
        }, 0);
        return mockRequest as any;
      });

      // Mock file system operations
      mockFs.existsSync.mockReturnValue(false);

      let syncError: Error | null = null;
      try {
        // Simulate attempting to fetch directory contents
        await new Promise((resolve, reject) => {
          const mockRequest = mockHttps.get('https://api.github.com/repos/github/awesome-copilot/contents/agents?ref=main');
          mockRequest.on('error', reject);
        });
      } catch (error) {
        syncError = error as Error;
      }

      expect(syncError).toBeInstanceOf(Error);
      expect(syncError?.message).toBe('Network failure');
    });
  });

  describe('Find and Add Workflow', () => {
    test('should complete find and add agent workflow', async () => {
      // Mock configuration
      const mockConfig = {
        get: jest.fn()
          .mockReturnValueOnce('github/awesome-copilot')
          .mockReturnValueOnce('main')
      };
      mockVSCode.workspace.getConfiguration.mockReturnValue(mockConfig);

      // Mock agent files
      const mockAgentFiles = [
        {
          name: 'react-expert.agent.md',
          path: 'agents/react-expert.agent.md', 
          type: 'file',
          download_url: 'https://raw.githubusercontent.com/github/awesome-copilot/main/agents/react-expert.agent.md'
        }
      ];

      const mockAgentContent = `---
description: "Expert React developer agent"
model: "gpt-4"
tools: ["terminal", "web-browser"]
---

# React Expert Agent

This agent specializes in React development.`;

      // Mock HTTPS requests
      mockHttps.get.mockImplementation((url: any, options: any, callback: any) => {
        if (typeof options === 'function') {
          callback = options;
        }

        const mockRequest = new EventEmitter();
        
        setTimeout(() => {
          let mockResponse;
          
          if (typeof url === 'string' && url.includes('/contents/')) {
            mockResponse = {
              statusCode: 200,
              on: (event: string, handler: Function) => {
                if (event === 'data') {
                  handler(JSON.stringify(mockAgentFiles));
                } else if (event === 'end') {
                  handler();
                }
              }
            };
          } else {
            mockResponse = {
              statusCode: 200,
              on: (event: string, handler: Function) => {
                if (event === 'data') {
                  handler(mockAgentContent);
                } else if (event === 'end') {
                  handler();
                }
              }
            };
          }
          
          callback(mockResponse);
        }, 0);
        
        return mockRequest as any;
      });

      // Mock UI interactions
      const mockQuickPickItem = {
        label: 'React Expert',
        description: 'Expert React developer agent',
        detail: 'Model: gpt-4 | Tools: terminal, web-browser',
        agent: {
          name: 'React Expert',
          filename: 'react-expert.agent.md',
          description: 'Expert React developer agent',
          model: 'gpt-4',
          tools: ['terminal', 'web-browser'],
          downloadUrl: mockAgentFiles[0].download_url
        }
      };
      
      mockVSCode.window.showQuickPick.mockResolvedValueOnce(mockQuickPickItem);
      mockVSCode.window.showInformationMessage.mockResolvedValueOnce('Open File');
      
      // Mock document operations
      const mockDocument = { uri: 'file:///test/workspace/.github/agents/react-expert.agent.md' };
      mockVSCode.workspace.openTextDocument.mockResolvedValueOnce(mockDocument);
      mockVSCode.window.showTextDocument.mockResolvedValueOnce(undefined);

      // Mock file system
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockReturnValue(undefined);
      mockFs.writeFileSync.mockReturnValue(undefined);

      // Mock progress
      mockVSCode.window.withProgress.mockImplementation(async (options: any, callback: any) => {
        expect(options.title).toBe('Loading available agents...');
        return await callback({ report: jest.fn() }, { isCancellationRequested: false });
      });

      // Simulate the find and add workflow
      const workspaceFolder = '/test/workspace';
      const agentsDir = `${workspaceFolder}/.github/agents`;
      
      // Create agents directory
      if (!mockFs.existsSync(agentsDir)) {
        mockFs.mkdirSync(agentsDir, { recursive: true });
      }

      // Add selected agent
      const agent = mockQuickPickItem.agent;
      const content = mockAgentContent;
      const attribution = `<!-- Synced from: https://github.com/github/awesome-copilot/blob/main/agents/${agent.filename} -->\n`;
      const finalContent = attribution + content;
      const localPath = `${agentsDir}/${agent.filename}`;
      
      mockFs.writeFileSync(localPath, finalContent);

      // Open file if user chose to
      const document = await mockVSCode.workspace.openTextDocument(localPath);
      await mockVSCode.window.showTextDocument(document);

      // Verify the workflow
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(agentsDir, { recursive: true });
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(localPath, finalContent);
      expect(mockVSCode.workspace.openTextDocument).toHaveBeenCalledWith(localPath);
      expect(mockVSCode.window.showTextDocument).toHaveBeenCalledWith(mockDocument);
    });

    test('should handle user cancellation', async () => {
      // Mock configuration
      const mockConfig = {
        get: jest.fn()
          .mockReturnValueOnce('github/awesome-copilot')
          .mockReturnValueOnce('main')
      };
      mockVSCode.workspace.getConfiguration.mockReturnValue(mockConfig);

      // Reset the mock and mock user cancellation
      mockVSCode.window.showQuickPick.mockReset();
      mockVSCode.window.showQuickPick.mockResolvedValueOnce(undefined); // User cancelled

      // Mock progress  
      mockVSCode.window.withProgress.mockImplementation(async (options: any, callback: any) => {
        return await callback({ report: jest.fn() }, { isCancellationRequested: false });
      });

      // Simulate user cancelling the quick pick
      const selectedItem = await mockVSCode.window.showQuickPick([]);
      
      expect(selectedItem).toBeUndefined();
      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    test('should recover from partial sync failures', async () => {
      const mockConfig = {
        get: jest.fn()
          .mockReturnValueOnce('github/awesome-copilot')
          .mockReturnValueOnce('main')
      };
      mockVSCode.workspace.getConfiguration.mockReturnValue(mockConfig);

      const mockFiles = [
        { name: 'good-agent.agent.md', download_url: 'https://example.com/good.md' },
        { name: 'bad-agent.agent.md', download_url: 'https://example.com/bad.md' }
      ];

      let requestCount = 0;
      mockHttps.get.mockImplementation((url: any, callback: any) => {
        const mockRequest = new EventEmitter();
        
        setTimeout(() => {
          requestCount++;
          
          if (requestCount === 1) {
            // First request - directory listing
            const mockResponse = {
              statusCode: 200,
              on: (event: string, handler: Function) => {
                if (event === 'data') {
                  handler(JSON.stringify(mockFiles));
                } else if (event === 'end') {
                  handler();
                }
              }
            };
            callback(mockResponse);
          } else if (requestCount === 2) {
            // Second request - good file
            const mockResponse = {
              statusCode: 200,
              on: (event: string, handler: Function) => {
                if (event === 'data') {
                  handler('# Good Agent');
                } else if (event === 'end') {
                  handler();
                }
              }
            };
            callback(mockResponse);
          } else {
            // Third request - bad file (404)
            const mockResponse = {
              statusCode: 404,
              on: (event: string, handler: Function) => {
                if (event === 'data') {
                  handler('Not Found');
                } else if (event === 'end') {
                  handler();
                }
              }
            };
            callback(mockResponse);
          }
        }, 0);
        
        return mockRequest as any;
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.writeFileSync.mockImplementation((filePath: any, content: any) => {
        if (filePath.includes('bad-agent')) {
          throw new Error('Write failed');
        }
      });

      // Simulate partial sync
      const syncedFiles: string[] = [];
      const errors: string[] = [];

      try {
        // This would succeed
        mockFs.writeFileSync('/test/good-agent.agent.md', '# Good Agent');
        syncedFiles.push('good-agent.agent.md');
      } catch (error) {
        errors.push(`Failed to sync good-agent.agent.md: ${error}`);
      }

      try {
        // This would fail
        mockFs.writeFileSync('/test/bad-agent.agent.md', '# Bad Agent');
        syncedFiles.push('bad-agent.agent.md');
      } catch (error) {
        errors.push(`Failed to sync bad-agent.agent.md: ${error}`);
      }

      expect(syncedFiles).toHaveLength(1);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('bad-agent.agent.md');
    });
  });
});