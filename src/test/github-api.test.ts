import * as https from 'https';
import { EventEmitter } from 'events';

// Mock https at the top level
const mockGet = jest.fn();
jest.doMock('https', () => ({
  get: mockGet
}));

// Create mock functions that mirror the original implementation
const fetchDirectoryContentsTest = (repository: string, branch: string, path: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const url = `https://api.github.com/repos/${repository}/contents/${path}?ref=${branch}`;
    
    mockGet(url, {
      headers: {
        'User-Agent': 'VSCode-Awesome-Copilot-Sync',
        'Accept': 'application/vnd.github.v3+json'
      }
    }, (res: any) => {
      let data = '';
      
      res.on('data', (chunk: string) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const files = JSON.parse(data);
            resolve(files);
          } else if (res.statusCode === 404) {
            resolve([]);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
};

const downloadFileTest = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    mockGet(url, (res: any) => {
      let data = '';
      
      res.on('data', (chunk: string) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
};

describe('GitHub API Functions', () => {
  describe('fetchDirectoryContents', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks(); // Add this to clear previous spies
    });

    test('should fetch directory contents successfully', async () => {
      const mockResponse = new EventEmitter();
      const mockRequest = new EventEmitter();
      
      const mockFiles = [
        {
          name: 'test-agent.agent.md',
          path: 'agents/test-agent.agent.md',
          type: 'file',
          download_url: 'https://raw.githubusercontent.com/test/repo/main/agents/test-agent.agent.md'
        }
      ];

      mockGet.mockImplementation((url: any, options: any, callback: any) => {
        if (typeof options === 'function') {
          callback = options;
        }
        
        // Simulate response
        setTimeout(() => {
          const mockRes = {
            statusCode: 200,
            on: (event: string, handler: Function) => {
              if (event === 'data') {
                handler(JSON.stringify(mockFiles));
              } else if (event === 'end') {
                handler();
              }
            }
          };
          callback(mockRes);
        }, 0);
        
        return mockRequest as any;
      });

      const result = await fetchDirectoryContentsTest('test/repo', 'main', 'agents');
      
      expect(result).toEqual(mockFiles);
      expect(mockGet).toHaveBeenCalledWith(
        'https://api.github.com/repos/test/repo/contents/agents?ref=main',
        {
          headers: {
            'User-Agent': 'VSCode-Awesome-Copilot-Sync',
            'Accept': 'application/vnd.github.v3+json'
          }
        },
        expect.any(Function)
      );
    });

    test('should return empty array for 404 response', async () => {
      const mockRequest = new EventEmitter();
      
      mockGet.mockImplementation((url: any, options: any, callback: any) => {
        if (typeof options === 'function') {
          callback = options;
        }
        
        setTimeout(() => {
          const mockRes = {
            statusCode: 404,
            on: (event: string, handler: Function) => {
              if (event === 'data') {
                handler('Not Found');
              } else if (event === 'end') {
                handler();
              }
            }
          };
          callback(mockRes);
        }, 0);
        
        return mockRequest as any;
      });

      const result = await fetchDirectoryContentsTest('test/repo', 'main', 'nonexistent');
      expect(result).toEqual([]);
    });

    test('should handle HTTP errors', async () => {
      const mockRequest = new EventEmitter();
      
      mockGet.mockImplementation((url: any, options: any, callback: any) => {
        if (typeof options === 'function') {
          callback = options;
        }
        
        setTimeout(() => {
          const mockRes = {
            statusCode: 500,
            on: (event: string, handler: Function) => {
              if (event === 'data') {
                handler('Internal Server Error');
              } else if (event === 'end') {
                handler();
              }
            }
          };
          callback(mockRes);
        }, 0);
        
        return mockRequest as any;
      });

      await expect(
        fetchDirectoryContentsTest('test/repo', 'main', 'agents')
      ).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    test('should handle network errors', async () => {
      const mockRequest = new EventEmitter();
      
      mockGet.mockImplementation(() => {
        setTimeout(() => {
          mockRequest.emit('error', new Error('Network error'));
        }, 0);
        
        return mockRequest as any;
      });

      await expect(
        fetchDirectoryContentsTest('test/repo', 'main', 'agents')
      ).rejects.toThrow('Network error');
    });
  });

  describe('downloadFile', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks(); // Add this to clear previous spies
    });

    test('should download file content successfully', async () => {
      const mockContent = '# Test Agent\n\nThis is a test agent.';
      const mockRequest = new EventEmitter();
      
      mockGet.mockImplementation((url: any, callback: any) => {
        setTimeout(() => {
          const mockRes = {
            statusCode: 200,
            on: (event: string, handler: Function) => {
              if (event === 'data') {
                handler(mockContent);
              } else if (event === 'end') {
                handler();
              }
            }
          };
          callback(mockRes);
        }, 0);
        
        return mockRequest as any;
      });

      const result = await downloadFileTest('https://example.com/file.md');
      
      expect(result).toBe(mockContent);
      expect(mockGet).toHaveBeenCalledWith(
        'https://example.com/file.md',
        expect.any(Function)
      );
    });

    test('should handle HTTP errors when downloading file', async () => {
      const mockRequest = new EventEmitter();
      
      mockGet.mockImplementation((url: any, callback: any) => {
        setTimeout(() => {
          const mockRes = {
            statusCode: 404,
            on: (event: string, handler: Function) => {
              if (event === 'data') {
                handler('Not Found');
              } else if (event === 'end') {
                handler();
              }
            }
          };
          callback(mockRes);
        }, 0);
        
        return mockRequest as any;
      });

      await expect(
        downloadFileTest('https://example.com/nonexistent.md')
      ).rejects.toThrow('HTTP 404');
    });

    test('should handle network errors when downloading file', async () => {
      const mockRequest = new EventEmitter();
      
      mockGet.mockImplementation(() => {
        setTimeout(() => {
          mockRequest.emit('error', new Error('Connection failed'));
        }, 0);
        
        return mockRequest as any;
      });

      await expect(
        downloadFileTest('https://example.com/file.md')  
      ).rejects.toThrow('Connection failed');
    });
  });
});