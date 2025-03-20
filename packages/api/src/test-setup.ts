import { jest } from '@jest/globals';

// Make jest available globally
global.jest = jest;

// Extend the jest.Mock type with the methods we need
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Mock {
      mockResolvedValue(value: any): this;
      mockRejectedValue(error: Error): this;
    }
  }
}