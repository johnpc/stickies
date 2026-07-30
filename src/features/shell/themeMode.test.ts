import { describe, expect, it } from 'vitest';
import { dataThemeAttr, parseThemeMode } from './themeMode';

describe('parseThemeMode', () => {
  it('accepts valid modes', () => {
    expect(parseThemeMode('light')).toBe('light');
    expect(parseThemeMode('dark')).toBe('dark');
    expect(parseThemeMode('system')).toBe('system');
  });

  it('defaults unknown/nullish to system', () => {
    expect(parseThemeMode('neon')).toBe('system');
    expect(parseThemeMode(null)).toBe('system');
    expect(parseThemeMode(undefined)).toBe('system');
  });
});

describe('dataThemeAttr', () => {
  it('returns the explicit scheme for light/dark', () => {
    expect(dataThemeAttr('light')).toBe('light');
    expect(dataThemeAttr('dark')).toBe('dark');
  });

  it('returns null for system (let the OS decide)', () => {
    expect(dataThemeAttr('system')).toBeNull();
  });
});
