import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middlewares/auth';
import { Readable } from 'stream';
import csvParser from 'csv-parser';

interface CSVRow {
  [key: string]: string;
}

export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    const { brandId, platform = 'INSTAGRAM' } = req.body;
    let mapping: Record<string, string> = {};
    try {
      if (req.body.mapping) mapping = JSON.parse(req.body.mapping);
    } catch(e) {}

    if (!file) {
      return res.status(400).json({ error: 'No CSV or XLSX file provided' });
    }

    if (!brandId) {
      return res.status(400).json({ error: 'brandId is required' });
    }

    // Check brand access
    if (req.user!.role !== 'OWNER' && !req.user!.brandIds.includes(brandId)) {
      return res.status(403).json({ error: 'No access to this brand' });
    }

    const rows: CSVRow[] = [];

    // Parse file based on mimetype or file extension
    const isCSV = file.mimetype === 'text/csv' || file.mimetype === 'application/csv' || file.mimetype === 'text/plain' || file.originalname.endsWith('.csv');
    const isXLSX = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.originalname.endsWith('.xlsx');

    if (isCSV) {
      // Parse CSV buffer
      await new Promise<void>((resolve, reject) => {
        const stream = Readable.from(file.buffer);
        stream
          .pipe(csvParser())
          .on('data', (row: CSVRow) => rows.push(row))
          .on('end', () => resolve())
          .on('error', (err: Error) => reject(err));
      });
    } else if (isXLSX) {
      // Parse XLSX buffer
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      rows.push(...jsonData as CSVRow[]);
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Only CSV and XLSX are allowed.' });
    }

    if (rows.length === 0) {
      return res.status(400).json({ error: 'File is empty' });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const nativePostId = mapping.nativePostId ? row[mapping.nativePostId] : (row['ID Postingan'] || row['Post ID'] || row['id'] || '');
        const permalink = mapping.permalink ? row[mapping.permalink] : (row['Permalink'] || row['permalink'] || row['URL'] || '');

        if (!nativePostId && !permalink) {
          skipped++;
          continue;
        }

        // Map content type
        const rawType = (row['Jenis postingan'] || row['Post Type'] || 'VIDEO').toUpperCase();
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
        const publishedRaw = mapping.publishedAt ? row[mapping.publishedAt] : (row['Waktu penerbitan'] || row['Published At'] || row['Date'] || '');
        let publishedAt: Date | null = null;
        if (publishedRaw) {
          publishedAt = new Date(publishedRaw);
          if (isNaN(publishedAt.getTime())) publishedAt = null;
        }

        // --- AUTO-EXTRACTION LOGIC ---
        const captionText = mapping.caption ? row[mapping.caption] : (row['Deskripsi'] || row['Caption'] || '');
        
        // 1. Hook Type Classification
        let hookType = 'Lainnya';
        const lowerCaption = captionText.toLowerCase();
        if (lowerCaption.includes('pov')) hookType = 'POV';
        else if (lowerCaption.includes('tutorial') || lowerCaption.includes('cara ')) hookType = 'Tutorial';
        else if (lowerCaption.includes('?') && lowerCaption.indexOf('?') < 50) hookType = 'Question';
        else if (lowerCaption.includes('promo') || lowerCaption.includes('diskon') || lowerCaption.includes('sale')) hookType = 'Promosi';
        else if (lowerCaption.includes('cerita') || lowerCaption.includes('story')) hookType = 'Story';
        else if (lowerCaption.includes('tips') || lowerCaption.includes('motivasi')) hookType = 'Value/Motivasi';

        // Upsert content
        const content = await prisma.content.upsert({
          where: { nativePostId: nativePostId || `gen-${Date.now()}-${imported}` },
          create: {
            brandId,
            platform: platform as any,
            contentType,
            nativePostId: nativePostId || `gen-${Date.now()}-${imported}`,
            permalink: permalink || `https://placeholder.com/${Date.now()}-${imported}`,
            caption: captionText || null,
            durationSec,
            publishedAt,
            hookType,
            visualTags: []
          },
          update: {
            caption: captionText || undefined,
            hookType
          }
        });

        // 2. Hashtag Extraction
        const hashtags = (captionText.match(/#[a-zA-Z0-9_]+/g) || []).map(t => t.toLowerCase());
        for (const tag of hashtags) {
          const ht = await prisma.hashtag.upsert({
            where: { tag },
            create: { brandId, tag },
            update: {}
          });
          await prisma.contentHashtag.upsert({
            where: { contentId_hashtagId: { contentId: content.id, hashtagId: ht.id } },
            create: { contentId: content.id, hashtagId: ht.id },
            update: {}
          });
        }

        // 3. Product Extraction
        const knownProducts = ['catalina', 'kyra', 'davira', 'mirae', 'sandrine', 'maiza', 'narsha'];
        for (const prodName of knownProducts) {
          if (lowerCaption.includes(prodName)) {
            // Find or create product
            const products = await prisma.product.findMany({
              where: { brandId, name: { equals: prodName, mode: 'insensitive' } }
            });
            let product = products[0];
            if (!product) {
              product = await prisma.product.create({
                data: { brandId, name: prodName.charAt(0).toUpperCase() + prodName.slice(1) }
              });
            }
            await prisma.contentProduct.upsert({
              where: { contentId_productId: { contentId: content.id, productId: product.id } },
              create: { contentId: content.id, productId: product.id },
              update: {}
            });
          }
        }

        // 4. Creator Detection (Brand vs UGC)
        const accountHandle = row['Nama pengguna akun'] || row['Username'] || '';
        if (accountHandle) {
          // Assume brand official handle is 'zanevahijab' (or we can match brand name)
          // For now, if handle contains 'zaneva', it's brand owned, else UGC
          const isBrandOwned = lowerCaption.includes('zaneva') || accountHandle.toLowerCase().includes('zaneva');
          const relation = isBrandOwned ? 'BRAND_OWNED' : 'UGC';
          
          let creator = await prisma.creator.findUnique({ where: { handle: accountHandle } });
          if (!creator) {
            creator = await prisma.creator.create({
              data: {
                brandId,
                handle: accountHandle,
                name: row['Nama akun'] || accountHandle,
                category: isBrandOwned ? 'Brand' : 'Micro' // default
              }
            });
          }
          await prisma.contentCreator.upsert({
            where: { contentId_creatorId: { contentId: content.id, creatorId: creator.id } },
            create: { contentId: content.id, creatorId: creator.id, relation },
            update: { relation }
          });
        }

        // Add metrics
        const metricDate = publishedAt || new Date();
        const views = mapping.views ? row[mapping.views] : (row['Tayangan'] || row['Views']);
        const likes = mapping.likes ? row[mapping.likes] : (row['Suka'] || row['Likes']);
        const shares = mapping.shares ? row[mapping.shares] : (row['Dibagikan'] || row['Shares']);
        const comments = mapping.comments ? row[mapping.comments] : (row['Komentar'] || row['Comments']);
        const saves = mapping.saves ? row[mapping.saves] : (row['Disimpan'] || row['Saves']);
        const reach = mapping.reach ? row[mapping.reach] : (row['Jangkauan'] || row['Reach']);
        const follows = row['Mengikuti'] || row['Follows'];

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
            views: BigInt(parseInt(views || '0') || 0),
            likes: BigInt(parseInt(likes || '0') || 0),
            shares: BigInt(parseInt(shares || '0') || 0),
            comments: BigInt(parseInt(comments || '0') || 0),
            saves: BigInt(parseInt(saves || '0') || 0),
            reach: BigInt(parseInt(reach || '0') || 0),
            follows: BigInt(parseInt(follows || '0') || 0)
          },
          update: {
            views: BigInt(parseInt(views || '0') || 0),
            likes: BigInt(parseInt(likes || '0') || 0),
            shares: BigInt(parseInt(shares || '0') || 0),
            comments: BigInt(parseInt(comments || '0') || 0),
            saves: BigInt(parseInt(saves || '0') || 0),
            reach: BigInt(parseInt(reach || '0') || 0),
            follows: BigInt(parseInt(follows || '0') || 0)
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
