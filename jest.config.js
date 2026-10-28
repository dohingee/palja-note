/** 순수 TypeScript 로직(src/saju 등)을 Node에서 시험한다. React Native 화면은 대상이 아니다. */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        // 형 검사는 `npx tsc --noEmit`이 맡고, 여기서는 변환만 한다(isolatedModules).
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'bundler',
          target: 'es2020',
          esModuleInterop: true,
          isolatedModules: true,
          rootDir: __dirname,
        },
      },
    ],
  },
};
