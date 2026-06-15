import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());

// Zod schema for validation
const shortenSchema = z.object({
  url: z.string().url("Invalid URL format"),
  slug: z.string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug is too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Slug can only contain letters, numbers, hyphens and underscores")
    .optional(),
});

// POST /api/shorten
app.post('/api/shorten', async (req, res) => {
  try {
    const parsedData = shortenSchema.parse(req.body);
    let { url, slug } = parsedData;

    if (!slug) {
      slug = nanoid(6);
    }

    // Check if slug already exists
    const existingLink = await prisma.link.findUnique({
      where: { slug }
    });

    if (existingLink) {
      return res.status(409).json({ error: "Slug already exists. Please choose a different one." });
    }

    const newLink = await prisma.link.create({
      data: {
        url,
        slug,
      }
    });

    res.status(201).json({
      shortUrl: `${BASE_URL}/api/${newLink.slug}`,
      slug: newLink.slug,
      url: newLink.url,
      clicks: newLink.clicks
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error("Error creating short link:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/links
app.get('/api/links', async (req, res) => {
  try {
    const links = await prisma.link.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit for safety
    });
    
    // add shortUrl to the response items
    const formattedLinks = links.map(link => ({
      ...link,
      shortUrl: `${BASE_URL}/api/${link.slug}`
    }));

    res.json(formattedLinks);
  } catch (error) {
    console.error("Error fetching links:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/analytics
app.get('/api/analytics', async (req, res) => {
  try {
    // Total links count
    const totalLinks = await prisma.link.count();

    // Total clicks (sum)
    const clicksAgg = await prisma.link.aggregate({
      _sum: { clicks: true }
    });
    const totalClicks = clicksAgg._sum.clicks || 0;

    // Top 5 most clicked links
    const topLinks = await prisma.link.findMany({
      orderBy: { clicks: 'desc' },
      take: 5,
      select: { slug: true, url: true, clicks: true }
    });

    // Clicks per day for last 7 days (based on createdAt)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLinks = await prisma.link.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, clicks: true }
    });

    // Group clicks by day
    const clicksByDay = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      clicksByDay[key] = 0;
    }
    recentLinks.forEach(link => {
      const key = link.createdAt.toISOString().split('T')[0];
      if (clicksByDay[key] !== undefined) {
        clicksByDay[key] += link.clicks;
      }
    });

    const clicksPerDay = Object.entries(clicksByDay).map(([date, clicks]) => ({
      date,
      clicks
    }));

    res.json({ totalLinks, totalClicks, topLinks, clicksPerDay });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/:slug
app.get('/api/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const link = await prisma.link.findUnique({
      where: { slug }
    });

    if (!link) {
      return res.status(404).json({ error: "Link not found" });
    }

    // Increment clicks
    await prisma.link.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } }
    });

    res.redirect(link.url);

  } catch (error) {
    console.error("Error redirecting:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/qr/:slug
app.get('/api/qr/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const link = await prisma.link.findUnique({ where: { slug } });
    
    if (!link) {
      return res.status(404).json({ error: "Link not found" });
    }

    const shortUrl = `${BASE_URL}/api/${slug}`;
    const qrDataUrl = await QRCode.toDataURL(shortUrl);
    
    res.json({ qrCode: qrDataUrl });
  } catch (error) {
    console.error("Error generating QR code:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/links/:slug
app.delete('/api/links/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const link = await prisma.link.findUnique({ where: { slug } });
    if (!link) {
      return res.status(404).json({ error: "Link not found" });
    }

    await prisma.link.delete({ where: { slug } });
    res.json({ message: "Link deleted successfully" });
  } catch (error) {
    console.error("Error deleting link:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
