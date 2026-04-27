import express from 'express';
import { supabaseAdmin } from './supabaseClient.mjs';

const router = express.Router();

router.get('/api/properties/search', async (req, res) => {
  if (!supabaseAdmin) {
    return res
      .status(500)
      .json({ error: 'Property search service not configured. Missing Supabase credentials.' });
  }

  const {
    location,
    min_price,
    max_price,
    bedrooms,
    property_type,
  } = req.query;

  try {
    let query = supabaseAdmin
      .from('properties')
      .select('id, title, location, price, bedrooms, property_type, status')
      .eq('status', 'AVAILABLE');

    if (location && typeof location === 'string') {
      query = query.ilike('location', `%${location}%`);
    }

    if (min_price && !Number.isNaN(Number(min_price))) {
      query = query.gte('price', Number(min_price));
    }

    if (max_price && !Number.isNaN(Number(max_price))) {
      query = query.lte('price', Number(max_price));
    }

    if (bedrooms && !Number.isNaN(Number(bedrooms))) {
      query = query.eq('bedrooms', Number(bedrooms));
    }

    if (property_type && typeof property_type === 'string') {
      query = query.eq('property_type', property_type.toUpperCase());
    }

    const { data, error } = await query.order('price', { ascending: true }).limit(50);

    if (error) {
      console.error('[properties-search] Failed to search properties', error);
      return res.status(500).json({ error: 'Failed to search properties.' });
    }

    const results =
      data?.map((p) => ({
        property_id: p.id,
        title: p.title,
        location: p.location,
        price: Number(p.price ?? 0),
        bedrooms: p.bedrooms,
        property_type: p.property_type,
      })) ?? [];

    return res.json({ data: results });
  } catch (err) {
    console.error('[properties-search] Unexpected error', err);
    return res.status(500).json({ error: 'Unexpected error while searching properties.' });
  }
});

export function createPropertySearchRouter() {
  return router;
}

