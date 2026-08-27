-- Receipt Split App Database Schema
-- Run this in your Supabase SQL Editor

-- Receipts table
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  image_url TEXT, -- DEPRECATED: mirrors image_urls[1], kept for backwards compatibility
  image_urls TEXT[] NOT NULL DEFAULT '{}', -- Ordered list of receipt images (source of truth)
  name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT -- Optional notes/comments about the receipt
);

-- Bill items table (people who owe money)
CREATE TABLE bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  breakdown JSONB -- Optional: stores itemized breakdown from AI analysis
  -- breakdown structure: {items: [{description, amount}], subtotal, tax_share?, tip_share?, shared_items?: [{description, amount, split_with}]}
);

-- Public links table (for shareable URLs)
CREATE TABLE public_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(receipt_id) -- One public link per receipt
);

-- Create indexes for better query performance
CREATE INDEX idx_bill_items_receipt_id ON bill_items(receipt_id);
CREATE INDEX idx_public_links_receipt_id ON public_links(receipt_id);

