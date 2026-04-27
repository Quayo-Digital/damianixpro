# Contributing to DamianixPro

Thank you for your interest in contributing to DamianixPro! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Supabase account (for backend services)

### Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/your-username/nigeria-homes.git
   cd nigeria-homes
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Set Up Environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📝 Development Workflow

### Before You Start

1. Check existing issues and PRs
2. Create an issue for major changes
3. Fork the repository
4. Create a feature branch: `git checkout -b feature/amazing-feature`

### Making Changes

1. **Write Code**
   - Follow TypeScript best practices
   - Use the existing code style
   - Add comments for complex logic

2. **Run Linters**

   ```bash
   npm run lint
   npm run type-check
   ```

3. **Format Code**

   ```bash
   npm run format
   ```

4. **Write Tests**

   ```bash
   npm test
   npm run test:coverage
   ```

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:

```
feat: add property search functionality
fix: resolve payment processing error
docs: update API documentation
test: add unit tests for payment service
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Writing Tests

- Write tests for all new features
- Aim for 80%+ code coverage
- Test edge cases and error scenarios
- Use descriptive test names

Example:

```typescript
describe('PaymentService', () => {
  it('should process payment successfully', async () => {
    // Test implementation
  });

  it('should handle network errors gracefully', async () => {
    // Test implementation
  });
});
```

## 📋 Code Standards

### TypeScript

- Use strict typing (avoid `any`)
- Define interfaces for all data structures
- Use type guards for type narrowing
- Prefer `const` over `let`

### React

- Use functional components and hooks
- Extract custom hooks for reusable logic
- Keep components under 300 lines
- Use proper prop types

### Styling

- Use Tailwind CSS utility classes
- Follow existing component patterns
- Ensure responsive design
- Maintain accessibility

### Error Handling

- Use the `errorHandler` utility
- Provide user-friendly error messages
- Log errors appropriately
- Handle edge cases

### Logging

- Use `logger` utility (not `console.log`)
- Use appropriate log levels
- Include context in logs
- Don't log sensitive information

## 🔍 Code Review Process

1. **Create Pull Request**
   - Provide clear description
   - Link related issues
   - Add screenshots for UI changes

2. **Review Checklist**
   - [ ] Code follows style guidelines
   - [ ] Tests pass and coverage is adequate
   - [ ] No console.log statements
   - [ ] Error handling implemented
   - [ ] Documentation updated
   - [ ] Accessibility considered

3. **Address Feedback**
   - Respond to all comments
   - Make requested changes
   - Update PR description if needed

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues
2. Verify it's a bug (not a feature request)
3. Try to reproduce consistently

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**

- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.0.0]

**Additional context**
Add any other context about the problem.
```

## 💡 Feature Requests

### Before Requesting

1. Check if feature already exists
2. Check roadmap and existing issues
3. Consider if it fits the project scope

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other information or screenshots.
```

## 📚 Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex algorithms
- Include usage examples
- Keep comments up to date

### README Updates

- Update README for new features
- Add examples for new APIs
- Update installation instructions if needed
- Keep changelog updated

## 🎯 Project Structure

```
src/
├── components/     # React components
├── pages/          # Page components
├── hooks/          # Custom React hooks
├── services/       # API and business logic
├── utils/          # Utility functions
├── types/          # TypeScript types
└── tests/          # Test utilities
```

## 🤝 Getting Help

- **Documentation:** Check README and inline comments
- **Issues:** Search existing issues
- **Discussions:** Use GitHub Discussions
- **Email:** support@nigeriahomes.com

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to DamianixPro!** 🎉
