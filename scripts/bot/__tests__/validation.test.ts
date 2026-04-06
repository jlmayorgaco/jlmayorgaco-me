import { describe, it, expect } from 'vitest';
import {
  safeValidate,
  UserCommentSchema,
  BlogPostDataSchema,
  FilePathSchema,
  sanitizeForTelegram,
  generateSlug,
} from '../shared/validation';

describe('Validation Module', () => {
  describe('UserCommentSchema', () => {
    it('should validate valid comments', () => {
      const result = safeValidate(UserCommentSchema, 'This is a valid comment');
      expect(result.success).toBe(true);
    });

    it('should reject empty comments', () => {
      const result = safeValidate(UserCommentSchema, '');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Comment cannot be empty');
    });

    it('should reject comments that are too long', () => {
      const longComment = 'a'.repeat(2001);
      const result = safeValidate(UserCommentSchema, longComment);
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('too long');
    });

    it('should reject comments with HTML tags', () => {
      const result = safeValidate(UserCommentSchema, '<script>alert("xss")</script>');
      expect(result.success).toBe(false);
    });

    it('should reject comments with javascript: protocol', () => {
      const result = safeValidate(UserCommentSchema, 'javascript:alert(1)');
      expect(result.success).toBe(false);
    });
  });

  describe('BlogPostDataSchema', () => {
    it('should validate valid blog post data', () => {
      const data = {
        title: 'Test Post Title',
        description: 'A test description',
        category: 'Research',
        tags: ['tag1', 'tag2'],
        date: '2024-01-15',
        content: 'This is a comprehensive test content that meets the minimum length requirement of one hundred characters for blog posts in the system.',
      };
      
      const result = safeValidate(BlogPostDataSchema, data);
      expect(result.success).toBe(true);
    });

    it('should reject title that is too short', () => {
      const data = {
        title: 'Hi',
        description: 'Description',
        category: 'Research',
        tags: ['tag1'],
        date: '2024-01-15',
        content: 'Content',
      };
      
      const result = safeValidate(BlogPostDataSchema, data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid category', () => {
      const data = {
        title: 'Valid Title',
        description: 'Description',
        category: 'InvalidCategory',
        tags: ['tag1'],
        date: '2024-01-15',
        content: 'Content',
      };
      
      const result = safeValidate(BlogPostDataSchema, data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const data = {
        title: 'Valid Title',
        description: 'Description',
        category: 'Research',
        tags: ['tag1'],
        date: '01-15-2024', // Wrong format
        content: 'Content',
      };
      
      const result = safeValidate(BlogPostDataSchema, data);
      expect(result.success).toBe(false);
    });
  });

  describe('FilePathSchema', () => {
    it('should validate safe file paths', () => {
      const result = safeValidate(FilePathSchema, 'src/content/blog/test.md');
      expect(result.success).toBe(true);
    });

    it('should reject path traversal attempts', () => {
      const result = safeValidate(FilePathSchema, '../../../etc/passwd');
      expect(result.success).toBe(false);
    });

    it('should reject paths with shell metacharacters', () => {
      const result = safeValidate(FilePathSchema, 'test; rm -rf /');
      expect(result.success).toBe(false);
    });
  });

  describe('sanitizeForTelegram', () => {
    it('should escape markdown characters', () => {
      const text = 'Hello *world* and _test_';
      const result = sanitizeForTelegram(text);
      
      expect(result).toContain('\\*world\\*');
      expect(result).toContain('\\_test\\_');
    });

    it('should preserve text content', () => {
      const text = 'Hello world';
      const result = sanitizeForTelegram(text);
      
      expect(result).toContain('Hello world');
    });
  });

  describe('generateSlug', () => {
    it('should generate valid slug', () => {
      const result = generateSlug('Hello World');
      expect(result).toBe('hello-world');
    });

    it('should handle Spanish characters', () => {
      const result = generateSlug('Sistemas de Control Avanzado');
      expect(result).toContain('sistemas');
      expect(result).toContain('control');
      expect(result).toContain('avanzado');
    });

    it('should remove special characters', () => {
      const result = generateSlug('Test @#$%^&*() Post');
      expect(result).not.toContain('@');
      expect(result).not.toContain('#');
      expect(result).not.toContain('$');
    });

    it('should truncate long titles', () => {
      const longTitle = 'a'.repeat(100);
      const result = generateSlug(longTitle);
      expect(result.length).toBeLessThanOrEqual(60);
    });
  });
});

