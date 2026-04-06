/**
 * Image Generation Service
 * Generates cover images for blog posts
 */

import { IImageGenerationService, ImageOptions } from '../../application/ports';
import { Result } from '../../shared/Result';
import { ExternalServiceError } from '../../shared/errors/AppError';
import { logDebug, logError, logInfo } from '../../infrastructure/logging/Logger';
import { withRetry } from '../../shared/retry/RetryPolicy';
import { promises as fs } from 'fs';
import path from 'path';

// Security: Maximum image size (10MB)
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export class DalleImageService implements IImageGenerationService {
  private readonly apiUrl = 'https://api.openai.com/v1/images/generations';

  constructor(private apiKey: string) {}

  async generateImage(prompt: string, options?: ImageOptions): Promise<Result<string, Error>> {
    try {
      logDebug('Generating image with DALL-E', { prompt: prompt.slice(0, 50) });

      const response = await withRetry(async () => {
        const res = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: prompt.slice(0, 1000), // DALL-E has prompt limit
            n: 1,
            size: this.getSize(options?.width, options?.height),
            style: options?.style || 'vivid',
          }),
        });

        if (!res.ok) {
          const error = await res.text();
          throw new Error(`DALL-E API error: ${error}`);
        }

        return res.json();
      }, 'EXTERNAL_API');

      const imageUrl = response.data[0]?.url;
      if (!imageUrl) {
        throw new Error('No image URL in response');
      }

      // Download and save image
      const localPath = await this.downloadImage(imageUrl, prompt);
      
      logInfo('Image generated successfully', { path: localPath });
      return Result.ok(localPath);

    } catch (error) {
      logError('Image generation failed', error as Error);
      return Result.err(
        new ExternalServiceError(
          'Failed to generate image',
          'DALL-E',
          undefined,
          { prompt: prompt.slice(0, 50) }
        )
      );
    }
  }

  private async downloadImage(url: string, prompt: string): Promise<string> {
    const response = await fetch(url);
    
    // Security: Check content length header before downloading
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(`Image too large: ${contentLength} bytes exceeds maximum of ${MAX_IMAGE_SIZE_BYTES}`);
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Security: Verify actual size after download
    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(`Image too large: ${buffer.length} bytes exceeds maximum of ${MAX_IMAGE_SIZE_BYTES}`);
    }

    // Create safe filename from prompt
    const safePrompt = prompt
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .slice(0, 30);
    
    const timestamp = Date.now();
    const filename = `${safePrompt}-${timestamp}.png`;
    const publicPath = path.join(process.cwd(), 'public', 'images', 'generated');
    const filePath = path.join(publicPath, filename);

    // Ensure directory exists
    await fs.mkdir(publicPath, { recursive: true });

    // Save image
    await fs.writeFile(filePath, buffer);

    // Return relative path for blog post
    return `/images/generated/${filename}`;
  }

  private getSize(width?: number, height?: number): string {
    if (width === 1792 && height === 1024) return '1792x1024';
    if (width === 1024 && height === 1792) return '1024x1792';
    return '1024x1024'; // Default square
  }
}

/**
 * Stable Diffusion Service (alternative)
 */
export class StableDiffusionService implements IImageGenerationService {
  constructor(private apiUrl: string, private apiKey?: string) {}

  async generateImage(prompt: string, options?: ImageOptions): Promise<Result<string, Error>> {
    try {
      logDebug('Generating image with Stable Diffusion', { prompt: prompt.slice(0, 50) });

      const response = await withRetry(async () => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (this.apiKey) {
          headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        const res = await fetch(`${this.apiUrl}/generate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            prompt: prompt.slice(0, 1000),
            width: options?.width || 1024,
            height: options?.height || 1024,
            style: options?.style,
          }),
        });

        if (!res.ok) {
          throw new Error(`Stable Diffusion API error: ${await res.text()}`);
        }

        return res.json();
      }, 'EXTERNAL_API');

      const imageUrl = response.image_url || response.images?.[0];
      if (!imageUrl) {
        throw new Error('No image in response');
      }

      const localPath = await this.downloadImage(imageUrl, prompt);
      logInfo('Image generated with Stable Diffusion', { path: localPath });
      
      return Result.ok(localPath);

    } catch (error) {
      logError('Stable Diffusion generation failed', error as Error);
      return Result.err(
        new ExternalServiceError(
          'Failed to generate image',
          'Stable Diffusion',
          undefined,
          { prompt: prompt.slice(0, 50) }
        )
      );
    }
  }

  private async downloadImage(url: string, prompt: string): Promise<string> {
    const response = await fetch(url);
    
    // Security: Check content length header before downloading
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(`Image too large: ${contentLength} bytes exceeds maximum of ${MAX_IMAGE_SIZE_BYTES}`);
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Security: Verify actual size after download
    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(`Image too large: ${buffer.length} bytes exceeds maximum of ${MAX_IMAGE_SIZE_BYTES}`);
    }

    const safePrompt = prompt.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
    const timestamp = Date.now();
    const filename = `${safePrompt}-${timestamp}.png`;
    const publicPath = path.join(process.cwd(), 'public', 'images', 'generated');
    const filePath = path.join(publicPath, filename);

    await fs.mkdir(publicPath, { recursive: true });
    await fs.writeFile(filePath, buffer);

    return `/images/generated/${filename}`;
  }
}

