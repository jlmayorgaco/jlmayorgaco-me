import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { 
  generateFrontmatter, 
  saveBlogPost, 
  previewBlogPost, 
  generateSlug,
  type BlogPostData 
} from '../blog-generator';

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
        title: 'Test Post',
        description: 'Test description',
        category: 'Research',
        tags: ['tag1', 'tag2', 'tag3'],
        date: '2024-01-15',
        content: '# Test Content',
        featured: true
      };

      const frontmatter = generateFrontmatter(data);
      
      expect(frontmatter).toContain('---');
      expect(frontmatter).toContain('title: "Test Post"');
      expect(frontmatter).toContain('description: "Test description"');
      expect(frontmatter).toContain('date: "2024-01-15"');
      expect(frontmatter).toContain('category: "Research"');
      expect(frontmatter).toContain('tags: ["tag1", "tag2", "tag3"]');
      expect(frontmatter).toContain('featured: true');
      expect(frontmatter).toContain('# Test Content');
    });

    it('should escape quotes in title', () => {
      const data: BlogPostData = {
        title: 'Post with "quotes" inside',
        description: 'Desc',
        category: 'Test',
        tags: [],
        date: '2024-01-15',
        content: 'Content'
      };

      const frontmatter = generateFrontmatter(data);
      
      expect(frontmatter).toContain('title: "Post with \\"quotes\\" inside"');
    });

    it('should handle empty tags array', () => {
      const data: BlogPostData = {
        title: 'Test',
        description: 'Desc',
        category: 'Test',
        tags: [],
        date: '2024-01-15',
        content: 'Content'
      };

      const frontmatter = generateFrontmatter(data);
      
      expect(frontmatter).toContain('tags: []');
    });

    it('should default featured to false', () => {
      const data: BlogPostData = {
        title: 'Test',
        description: 'Desc',
        category: 'Test',
        tags: [],
        date: '2024-01-15',
        content: 'Content'
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
        description: 'Description',
        category: 'Research',
        tags: ['tag1'],
        date: '2024-01-15',
        content: 'Content here'
      };

      const filePath = await saveBlogPost(data);
      
      expect(filePath).toContain('my-awesome-post-title');
      expect(filePath).toContain('.md');
      
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('My Awesome Post Title');
      expect(content).toContain('Content here');

      // Cleanup
      await fs.unlink(filePath);
    });

    it('should handle Spanish characters in slug', async () => {
      const data: BlogPostData = {
        title: 'Sistemas de Control',
        description: 'Desc',
        category: 'Test',
        tags: [],
        date: '2024-01-15',
        content: 'Content'
      };

      const filePath = await saveBlogPost(data);
      
      expect(filePath).toContain('sistemas-de-control');
      
      // Cleanup
      await fs.unlink(filePath);
    });

    it('should handle duplicate filenames with timestamp', async () => {
      const data: BlogPostData = {
        title: 'Duplicate Post',
        description: 'Desc',
        category: 'Test',
        tags: [],
        date: '2024-01-15',
        content: 'First version'
      };

      const filePath1 = await saveBlogPost(data);
      
      // Modify content and save again
      data.content = 'Second version';
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
        title: 'Test',
        description: 'Desc',
        category: 'Test',
        tags: [],
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
        category: 'Test',
        tags: [],
        date: '2024-01-15',
        content: 'Content'
      };

      const preview = await previewBlogPost(data);
      
      expect(preview).toContain('\\*');
      expect(preview).toContain('\\_');
    });
  });
});
