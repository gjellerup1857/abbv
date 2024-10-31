import { describe, expect, it } from 'vitest';
import { updateVersionInConfigContent } from './version-bump.js';

describe('updateVersionInConfigContent', () => { 
  it('updates the version number and preserves the rest of the file', () => {
    const configFile = 
    `export default {
      basename: "adblock",
      version: "6.10.0",
      webpack: {
        // some other config
      }
    }`;

    const result = updateVersionInConfigContent(configFile, "7.0.0");
    expect(result).toContain('version: "7.0.0"');
    expect(result).toContain('basename: "adblock"');
    expect(result).toContain('webpack: {');
    expect(result).toContain('// some other config');
  });
  
  it('throws error if version field not found', () => {
    const configWithoutVersion = 
    `export default {
      basename: "adblock",
      someOtherField: "6.10.0"
    }`;

    expect(() => {
      updateVersionInConfigContent(configWithoutVersion, "7.0.0");
    }).toThrow('Could not find version field in the config file');
  });
});