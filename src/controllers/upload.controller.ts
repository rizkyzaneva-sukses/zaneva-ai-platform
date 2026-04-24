import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middlewares/auth';
import { Readable } from 'stream';
import csvParser from 'csv-parser';

interface CSVRow {
  [key: string]: string;
}

export const uploadCSV = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    const { brandId, platform = 'INSTAGRAM' } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No CSV file provided' });
    }

    if (!brandId) {
      return res.status(400).json({ error: 'brandId is required' });
    }

    // Check brand access
    if (req.user!.role !== 'OWNER' && !req.user!.brandIds.includes(brandId)) {
      return res.status(403).json({ error: 'No access to this brand' });
    }

    const rows: CSVRow[] = [];

    // Parse CSV buffer
    await new Promise<void>((resolve, reject) => {
      const stream = Readable.from(file.buffer);
      stream
        .pipe(csvParser())
        .on('data', (row: CSVRow) => rows.push(row))
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err));
    });

    if (rows.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const nativePostId = row['ID Postingan'] || row['Post ID'] || row['id'] || '';
        const permalink = row['Permalink'] || row['permalink'] || row['URL'] || '';

        if (!nativePostId && !permalink) {
          skipped++;
          continue;
        }

        // Map content type
        const rawType = (row['Jenis postingan'] || row['Post Type'] || 'REEL').toUpperCase();
        let contentType: 'REEL' | 'CAROUSEL' | 'IMAGE' | 'VIDEO' = 'REEL';
        if (rawType.includes('CAROUSEL') || rawType.includes('ALBUM')) contentType = 'CAROUSEL';
        else if (rawType.includes('IMAGE') || rawType.includes('FOTO')) contentType = 'IMAGE';
        else if (rawType.includes('VIDEO')) contentType = 'VIDEO';

        // Parse duration
        const durationRaw = row['Durasi'] || row['Duration'] || '';
        let durationSec: number | null = null;
        if (durationRaw) {
          const parts = durationRaw.split(':');
          if (parts.length === 2) {
            durationSec = parseInt(parts[0]) * 60 + parseInt(parts[1]);
          } else if (parts.length === 1) {
            durationSec = parseInt(parts[0]);
          }
        }

        // Parse date
        const publishedRaw = row['Waktu penerbitan'] || row['Published At'] || row['Date'] || '';
        let publishedAt: Date | null = null;
        if (publishedRaw) {
          publishedAt = new Date(publishedRaw);
          if (isNaN(publishedAt.getTime())) publishedAt = null;
        }

        // Upsert content
        const content = await prisma.content.upsert({
          where: { nativePostId: nativePostId || `gen-${Date.now()}-${imported}` },
          create: {
            brandId,
            platform: platform as any,
            contentType,
            nativePostId: nativePostId || `gen-${Date.now()}-${imported}`,
            permalink: permalink || `https://placeholder.com/${Date.now()}-${imported}`,
            caption: row['Deskripsi'] || row['Caption'] || null,
            durationSec,
            publishedAt,
            visualTags: []
          },
          update: {
            caption: row['Deskripsi'] || row['Caption'] || undefined
          }
        });

        // Add metrics
        const metricDate = publishedAt || new Date();
        await prisma.metric.upsert({
          where: {
            contentId_metricDate: {
              contentId: content.id,
              metricDate
            }
          },
          create: {
            contentId: content.id,
            metricDate,
            views: BigInt(parseInt(row['Tayangan'] || row['Views'] || '0') || 0),
            likes: BigInt(parseInt(row['Suka'] || row['Likes'] || '0') || 0),
            shares: BigInt(parseInt(row['Dibagikan'] || row['Shares'] || '0') || 0),
            comments: BigInt(parseInt(row['Komentar'] || row['Comments'] || '0') || 0),
            saves: BigInt(parseInt(row['Disimpan'] || row['Saves'] || '0') || 0),
            reach: BigInt(parseInt(row['Jangkauan'] || row['Reach'] || '0') || 0),
            follows: BigInt(parseInt(row['Mengikuti'] || row['Follows'] || '0') || 0)
          },
          update: {
            views: BigInt(parseInt(row['Tayangan'] || row['Views'] || '0') || 0),
            likes: BigInt(parseInt(row['Suka'] || row['Likes'] || '0') || 0),
            shares: BigInt(parseInt(row['Dibagikan'] || row['Shares'] || '0') || 0),
            comments: BigInt(parseInt(row['Komentar'] || row['Comments'] || '0') || 0),
            saves: BigInt(parseInt(row['Disimpan'] || row['Saves'] || '0') || 0),
            reach: BigInt(parseInt(row['Jangkauan'] || row['Reach'] || '0') || 0),
            follows: BigInt(parseInt(row['Mengikuti'] || row['Follows'] || '0') || 0)
          }
        });

        imported++;
      } catch (rowError: any) {
        errors.push(`Row error: ${rowError.message}`);
        skipped++;
      }
    }

    res.json({
      message: 'CSV import completed',
      imported,
      skipped,
      total: rows.length,
      errors: errors.slice(0, 10) // First 10 errors only
    });
  } catch (error: any) {
    console.error('CSV upload error:', error);
    res.status(500).json({ error: error.message || 'CSV upload failed' });
  }
};
