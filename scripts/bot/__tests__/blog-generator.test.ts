import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { 
  generateFrontmatter, 
  saveBlogPost, 
  previewBlogPost, 
  generateSlug,
  type BlogPostData 
} from '../infrastructure/formatting/BlogGenerator';

describe('Blog Generator Module (Production)', () => {
  const testDir = path.join(process.cwd(), 'test-content', 'blog');

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      const files = await fs.readdir(testDir);
      for (const file of files) {
        await fs.unlink(path.join(testDir, file));
      }
      await fs.rmdir(testDir);
      await fs.rmdir(path.dirname(testDir));
    } catch {}
  });

  describe('generateFrontmatter', () => {
it('should generate valid frontmatter', () => {
      const data: BlogPostData = {
        title: 'Test Post Title Here',
        description: 'Test description for the blog post',
        category: 'Research',
        tags: ['tag1', 'tag2', 'tag3'],
        date: '2024-01-15',
        content: '# Test Content\n\nThis is the body of the test post. It needs to be at least 100 characters long to pass validation. Let me add more content here to make sure it meets the minimum length requirement for the content field.',
        featured: true
      };

      const frontmatter = generateFrontmatter(data);
      
      expect(frontmatter).toContain('---');
      expect(frontmatter).toContain('title: "Test Post Title Here"');
      expect(frontmatter).toContain('description: "Test description for the blog post"');
      expect(frontmatter).toContain('date: "2024-01-15"');
      expect(frontmatter).toContain('category: "Research"');
      expect(frontmatter).toContain('tags: ["tag1", "tag2", "tag3"]');
      expect(frontmatter).toContain('featured: true');
      expect(frontmatter).toContain('# Test Content');
    });

    it.skip('should escape quotes in title - schema does not allow quotes in titles', () => {
      // This test is skipped because the BlogPostDataSchema does not allow quotes in titles
      // The validation regex ^[\w\s\-:,.!?()]+$ does not include double quotes
    });

    // This test is skipped because the BlogPostDataSchema requires tags array to have >=1 items
    // Empty tags arrays are not valid according to the schema
    it.skip('should handle empty tags array', () => {
      const data: BlogPostData = {
        title: 'Test Post Title',
        description: 'Test description for the post',
        category: 'Research',
        tags: [],
        date: '2024-01-15',
        content: 'This is test content that is long enough to pass validation. It needs to be at least 100 characters to pass the content length check in the schema.'
      };

      const frontmatter = generateFrontmatter(data);
      
      expect(frontmatter).toContain('tags: []');
    });

    it('should default featured to false', () => {
      const data: BlogPostData = {
        title: 'Test Post Title',
        description: 'Test description for the post',
        category: 'Research',
        tags: ['test'],
        date: '2024-01-15',
        content: 'This is test content that is long enough to pass validation. It needs to be at least 100 characters to pass the content length check in the schema.'
      };

      const frontmatter = generateFrontmatter(data);
      
      expect(frontmatter).toContain('featured: false');
    });

    it('should validate data before generating', () => {
      const invalidData = {
        title: 'Hi', // Too short
        description: 'Desc',
        category: 'InvalidCategory',
        tags: [],
        date: '2024-01-15',
        content: 'Content'
      };

      expect(() => generateFrontmatter(invalidData as BlogPostData)).toThrow('Invalid blog post data');
    });
  });

  describe('generateSlug', () => {
    it('should generate valid slug', () => {
      const result = generateSlug('Hello World');
      expect(result).toBe('hello-world');
    });

    it('should handle Spanish characters correctly', () => {
      const result = generateSlug('Sistemas de Control Avanzado con ESP32');
      expect(result).toBe('sistemas-de-control-avanzado-con-esp32');
    });

    it('should handle special characters', () => {
      const result = generateSlug('Test @#$%^&*() Post');
      expect(result).toBe('test-post');
    });

    it('should truncate long titles', () => {
      const longTitle = 'a'.repeat(100);
      const result = generateSlug(longTitle);
      expect(result.length).toBeLessThanOrEqual(60);
    });

    it('should handle empty string', () => {
      const result = generateSlug('');
      expect(result).toBe('untitled-post');
    });

    it('should handle multiple consecutive spaces', () => {
      const result = generateSlug('Hello    World');
      expect(result).toBe('hello-world');
    });
  });

  describe('saveBlogPost', () => {
    it('should save post with slugified filename', async () => {
      const data: BlogPostData = {
        title: 'My Awesome Post Title',
        description: 'Description for the post',
        category: 'Research',
        tags: ['tag1'],
        date: '2024-01-15',
        content: 'This is test content that is long enough to pass validation. It needs to be at least 100 characters to pass the content length check in the schema.'
      };

      const filePath = await saveBlogPost(data);
      
      expect(filePath).toContain('my-awesome-post-title');
      expect(filePath).toContain('.md');
      
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('My Awesome Post Title');
      expect(content).toContain('This is test content that is long enough to pass validation');

      // Cleanup
      await fs.unlink(filePath);
    });

    it('should handle Spanish characters in slug', async () => {
      const data: BlogPostData = {
        title: 'Sistemas de Control',
        description: 'Description for the post',
        category: 'Research',
        tags: ['control'],
        date: '2024-01-15',
        content: 'This is test content that is long enough to pass validation. It needs to be at least 100 characters to pass the content length check in the schema.'
      };

      const filePath = await saveBlogPost(data);
      
      expect(filePath).toContain('sistemas-de-control');
      
      // Cleanup
      await fs.unlink(filePath);
    });

    it('should handle duplicate filenames with timestamp', async () => {
      const data: BlogPostData = {
        title: 'Duplicate Post Title',
        description: 'Description for the post',
        category: 'Research',
        tags: ['test'],
        date: '2024-01-15',
        content: 'This is the first version of the content that is long enough to pass validation. It needs to be at least 100 characters to pass the content length check in the schema.'
      };

      const filePath1 = await saveBlogPost(data);
      
      // Modify content and save again
      data.content = 'This is the second version of the content that is long enough to pass validation. It needs to be at least 100 characters to pass the content length check in the schema.';
      const filePath2 = await saveBlogPost(data);
      
      expect(filePath1).not.toBe(filePath2);

      // Cleanup
      await fs.unlink(filePath1);
      await fs.unlink(filePath2);
    });
  });

  describe('previewBlogPost', () => {
    it('should generate preview with reading time', async () => {
      const data: BlogPostData = {
        title: 'Test Post',
        description: 'A detailed description of the post',
        category: 'Research',
        tags: ['tag1', 'tag2', 'tag3'],
        date: '2024-01-15',
        content: 'Word '.repeat(400) // 400 words = ~2 min reading
      };

      const preview = await previewBlogPost(data);
      
      expect(preview).toContain('Test Post');
      expect(preview).toContain('Research');
      expect(preview).toContain('tag1, tag2, tag3');
      expect(preview).toContain('A detailed description');
      expect(preview).toMatch(/Reading time.*\d+ min/);
    });

    it('should truncate content preview', async () => {
      const data: BlogPostData = {
        title: 'Test Post Title',
        description: 'Description for test',
        category: 'Research',
        tags: ['test'],
        date: '2024-01-15',
        content: 'a'.repeat(1000)
      };

      const preview = await previewBlogPost(data);
      
      expect(preview).toContain('...');
      expect(preview.length).toBeLessThan(1500);
    });

    it('should escape markdown for Telegram', async () => {
      const data: BlogPostData = {
        title: 'Test *with* markdown',
        description: 'Desc _test_',
        category: 'Research',
        tags: ['test'],
        date: '2024-01-15',
        content: 'This is test content that is long enough to pass validation. It needs to be at least 100 characters to pass the content length check in the schema.'
      };

      const preview = await previewBlogPost(data);
      
      expect(preview).toContain('\\*');
      expect(preview).toContain('\\_');
    });
  });
});

