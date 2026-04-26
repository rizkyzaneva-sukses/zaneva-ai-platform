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
        // Priority: dedicated 'Produk'/'Product' column > fallback to hardcoded caption matching
        const productColumnValue = mapping.product
          ? row[mapping.product]
          : (row['Produk'] || row['Product'] || row['Nama Produk'] || '');

        // Collect product names: split by '+' or ',' and trim whitespace
        let productNames: string[] = [];
        if (productColumnValue && productColumnValue.trim()) {
          productNames = productColumnValue.split(/[+,]/).map((p: string) => p.trim()).filter((p: string) => p.length > 0);
        } else {
          // Fallback: match from caption if no dedicated column
          const knownProducts = ['catalina', 'kyra', 'davira', 'mirae', 'sandrine', 'maiza', 'narsha'];
          productNames = knownProducts.filter(p => lowerCaption.includes(p))
            .map(p => p.charAt(0).toUpperCase() + p.slice(1));
        }

        for (const prodName of productNames) {
          if (!prodName) continue;
          const existingProds = await prisma.product.findMany({
            where: { brandId, name: { equals: prodName, mode: 'insensitive' } }
          });
          let product = existingProds[0];
          if (!product) {
            product = await prisma.product.create({
              data: { brandId, name: prodName }
            });
          }
          await prisma.contentProduct.upsert({
            where: { contentId_productId: { contentId: content.id, productId: product.id } },
            create: { contentId: content.id, productId: product.id },
            update: {}
          });
        }

        // 4. Creator Detection - read from dedicated 'Username' column or auto-detect
        const accountHandle = mapping.username
          ? row[mapping.username]
          : (row['Username'] || row['Nama pengguna akun'] || row['Account Username'] || '');
        const displayName = row['Nama akun'] || row['Account Name'] || row['Name'] || accountHandle;

        if (accountHandle && accountHandle.trim()) {
          const handleClean = accountHandle.trim();
          const isBrandOwned = lowerCaption.includes('zaneva') || handleClean.toLowerCase().includes('zaneva');
          const relation = isBrandOwned ? 'BRAND_OWNED' : 'UGC';
          
          let creator = await prisma.creator.findUnique({ where: { handle: handleClean } });
          if (!creator) {
            creator = await prisma.creator.create({
              data: {
                brandId,
                handle: handleClean,
                name: displayName || handleClean,
                category: isBrandOwned ? 'Brand' : 'Micro'
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

export const clearBrandData = async (req: AuthRequest, res: Response) => {
  try {
    const { brandId } = req.body;

    if (!brandId) {
      return res.status(400).json({ error: 'brandId is required' });
    }

    // Only OWNER can clear data
    if (req.user!.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only OWNER can clear data' });
    }

    // Get all content IDs for this brand
    const contents = await prisma.content.findMany({
      where: { brandId },
      select: { id: true }
    });
    const contentIds = contents.map(c => c.id);

    let deletedContents = 0;
    let deletedMetrics = 0;
    let deletedHashtags = 0;
    let deletedProducts = 0;
    let deletedCreators = 0;

    if (contentIds.length > 0) {
      // Delete all related records first (cascade order)
      const metricsResult = await prisma.metric.deleteMany({ where: { contentId: { in: contentIds } } });
      deletedMetrics = metricsResult.count;

      const hashtagsResult = await prisma.contentHashtag.deleteMany({ where: { contentId: { in: contentIds } } });
      deletedHashtags = hashtagsResult.count;

      const productsResult = await prisma.contentProduct.deleteMany({ where: { contentId: { in: contentIds } } });
      deletedProducts = productsResult.count;

      const creatorsResult = await prisma.contentCreator.deleteMany({ where: { contentId: { in: contentIds } } });
      deletedCreators = creatorsResult.count;

      // Delete all AI analyses for these contents
      await prisma.aIAnalysis.deleteMany({ where: { contentId: { in: contentIds } } });

      // Delete contents
      const contentsResult = await prisma.content.deleteMany({ where: { brandId } });
      deletedContents = contentsResult.count;
    }

    res.json({
      message: 'Brand data cleared successfully',
      deleted: {
        contents: deletedContents,
        metrics: deletedMetrics,
        contentHashtags: deletedHashtags,
        contentProducts: deletedProducts,
        contentCreators: deletedCreators
      }
    });
  } catch (error: any) {
    console.error('Clear data error:', error);
    res.status(500).json({ error: error.message || 'Clear data failed' });
  }
};
