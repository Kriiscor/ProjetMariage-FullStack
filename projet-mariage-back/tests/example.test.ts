/**
 * Test d'exemple simple pour vérifier que Jest fonctionne
 * Supprimez ce fichier une fois que vous avez vérifié que tout fonctionne
 */

describe('Jest Configuration', () => {
  it('should run basic test', () => {
    expect(true).toBe(true);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('success');
    expect(result).toBe('success');
  });

  it('should handle numbers correctly', () => {
    expect(2 + 2).toBe(4);
    expect(10 - 5).toBe(5);
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  it('should handle objects', () => {
    const obj = { name: 'Test', value: 42 };
    expect(obj).toHaveProperty('name');
    expect(obj.value).toBe(42);
  });
});

describe('TypeScript Support', () => {
  interface TestInterface {
    id: number;
    name: string;
  }

  it('should work with TypeScript interfaces', () => {
    const testObj: TestInterface = {
      id: 1,
      name: 'Test Object',
    };

    expect(testObj.id).toBe(1);
    expect(testObj.name).toBe('Test Object');
  });

  it('should work with generics', () => {
    const genericFunction = <T>(value: T): T => value;
    
    const result = genericFunction<string>('hello');
    expect(result).toBe('hello');
  });
});

describe('Mocking Basics', () => {
  it('should mock a function', () => {
    const mockFn = jest.fn();
    mockFn('test');
    
    expect(mockFn).toHaveBeenCalled();
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should mock return values', () => {
    const mockFn = jest.fn().mockReturnValue('mocked value');
    
    const result = mockFn();
    expect(result).toBe('mocked value');
  });

  it('should mock async functions', async () => {
    const mockAsyncFn = jest.fn().mockResolvedValue('async result');
    
    const result = await mockAsyncFn();
    expect(result).toBe('async result');
  });
});




