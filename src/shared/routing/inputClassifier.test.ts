import { describe, expect, test } from 'vitest';

import { classifyInput } from './inputClassifier';

describe('classifyInput', () => {
  test('returns ambiguous for empty input', () => {
    expect(classifyInput('')).toBe('ambiguous');
    expect(classifyInput('   ')).toBe('ambiguous');
  });

  test('returns english for plain questions', () => {
    expect(classifyInput('Can you review my C++ project?')).toBe('english');
    expect(classifyInput('What does your platform do?')).toBe('english');
  });

  test('returns cpp for code with include directive', () => {
    expect(classifyInput('#include <iostream>\nint main() {}')).toBe('cpp');
  });

  test('returns cpp for code with multiple signals', () => {
    const snippet = `void process(std::vector<int>& data) {
  for (auto& item : data) {
    item *= 2;
  }
}`;
    expect(classifyInput(snippet)).toBe('cpp');
  });

  test('returns english for prose without code signals', () => {
    expect(classifyInput('Can you help me understand memory management?')).toBe(
      'english',
    );
  });
});
