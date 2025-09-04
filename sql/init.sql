-- Auction Web App Database Schema
-- This migration creates the complete database structure for the auction platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE auction_status AS ENUM ('active', 'ended', 'cancelled');
CREATE TYPE bid_status AS ENUM ('active', 'outbid', 'winning', 'won', 'lost');

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CATEGORIES TABLE
-- =============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PRODUCTS TABLE
-- =============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    starting_price DECIMAL(12,2) NOT NULL CHECK (starting_price > 0),
    current_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    reserve_price DECIMAL(12,2), -- Optional minimum price to sell
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status auction_status DEFAULT 'active',
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    image_urls TEXT[] DEFAULT '{}', -- Array of image URLs (1-5 images)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure end_time is in the future for active auctions
    CONSTRAINT valid_end_time CHECK (end_time > created_at),
    -- Ensure current_price is not less than starting_price
    CONSTRAINT valid_current_price CHECK (current_price >= starting_price)
);

-- =============================================
-- BIDS TABLE
-- =============================================
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bid_amount DECIMAL(12,2) NOT NULL CHECK (bid_amount > 0),
    status bid_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure bid amount is higher than 0
    CONSTRAINT valid_bid_amount CHECK (bid_amount > 0)
);

-- =============================================
-- WATCHLIST TABLE (Nice-to-have feature)
-- =============================================
CREATE TABLE watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique user-product combination
    UNIQUE(user_id, product_id)
);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'outbid', 'won', 'auction_ending', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Products indexes
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_winner_id ON products(winner_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_end_time ON products(end_time);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_current_price ON products(current_price);

-- Bids indexes
CREATE INDEX idx_bids_product_id ON bids(product_id);
CREATE INDEX idx_bids_user_id ON bids(user_id);
CREATE INDEX idx_bids_created_at ON bids(created_at);
CREATE INDEX idx_bids_amount ON bids(bid_amount);
CREATE INDEX idx_bids_status ON bids(status);

-- Watchlist indexes
CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX idx_watchlist_product_id ON watchlist(product_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update product current_price when a new bid is placed
CREATE OR REPLACE FUNCTION update_product_current_price()
RETURNS TRIGGER AS $$
DECLARE
    current_highest_bid DECIMAL(12,2);
    product_starting_price DECIMAL(12,2);
BEGIN
    -- Get the product's starting price
    SELECT starting_price INTO product_starting_price
    FROM products 
    WHERE id = NEW.product_id;
    
    -- Get the current highest bid amount (including the new bid)
    SELECT COALESCE(MAX(bid_amount), 0) INTO current_highest_bid
    FROM bids 
    WHERE product_id = NEW.product_id;
    
    -- Use the higher of starting price or highest bid
    current_highest_bid := GREATEST(current_highest_bid, product_starting_price);
    
    -- Update the product's current_price to the new highest bid
    UPDATE products 
    SET current_price = current_highest_bid,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    
    -- Mark all bids except the highest as 'outbid'
    UPDATE bids 
    SET status = 'outbid'
    WHERE product_id = NEW.product_id 
    AND bid_amount < current_highest_bid;
    
    -- Mark the highest bid(s) as 'winning'
    UPDATE bids 
    SET status = 'winning'
    WHERE product_id = NEW.product_id 
    AND bid_amount = current_highest_bid;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update current_price when a bid is placed
CREATE TRIGGER trigger_update_current_price
    AFTER INSERT ON bids
    FOR EACH ROW
    EXECUTE FUNCTION update_product_current_price();

-- Function to check if auction has ended and update status
CREATE OR REPLACE FUNCTION check_auction_end()
RETURNS TRIGGER AS $$
DECLARE
    auction_end_time TIMESTAMP WITH TIME ZONE;
    highest_bidder_id UUID;
BEGIN
    -- Get auction end time
    SELECT end_time INTO auction_end_time
    FROM products 
    WHERE id = NEW.product_id;
    
    -- If auction has ended, update status and determine winner
    IF auction_end_time <= NOW() THEN
        -- Get the highest bidder
        SELECT user_id INTO highest_bidder_id
        FROM bids 
        WHERE product_id = NEW.product_id 
        AND status = 'winning'
        ORDER BY bid_amount DESC, created_at ASC
        LIMIT 1;
        
        -- Update product status and winner
        UPDATE products 
        SET status = 'ended',
            winner_id = highest_bidder_id,
            updated_at = NOW()
        WHERE id = NEW.product_id;
        
        -- Update bid statuses
        UPDATE bids 
        SET status = CASE 
            WHEN user_id = highest_bidder_id THEN 'won'
            ELSE 'lost'
        END
        WHERE product_id = NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check auction end time
CREATE TRIGGER trigger_check_auction_end
    AFTER INSERT ON bids
    FOR EACH ROW
    EXECUTE FUNCTION check_auction_end();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Products policies
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (status = 'active');
CREATE POLICY "Users can view own products" ON products FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Users can create products" ON products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (auth.uid() = seller_id);

-- Function to update current_price (bypasses RLS)
CREATE OR REPLACE FUNCTION update_product_current_price_manual(product_id UUID, new_current_price DECIMAL(12,2))
RETURNS VOID AS $$
BEGIN
    UPDATE products 
    SET current_price = new_current_price,
        updated_at = NOW()
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Use function-based approach for updating current_price

-- Bids policies
CREATE POLICY "Anyone can view bids" ON bids FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create bids" ON bids FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own bids" ON bids FOR SELECT USING (auth.uid() = user_id);

-- Watchlist policies
CREATE POLICY "Users can view own watchlist" ON watchlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert into own watchlist" ON watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own watchlist" ON watchlist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from own watchlist" ON watchlist FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- STORAGE POLICIES
-- =============================================

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Storage policies for product-images bucket
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'products'
);
CREATE POLICY "Users can update own product images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'products'
);
CREATE POLICY "Users can delete own product images" ON storage.objects FOR DELETE USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'products'
);

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample categories
INSERT INTO categories (name, description, slug) VALUES
('Electronics', 'Electronic devices and gadgets', 'electronics'),
('Fashion', 'Clothing and accessories', 'fashion'),
('Art & Collectibles', 'Artwork and collectible items', 'art-collectibles'),
('Home & Garden', 'Home improvement and garden items', 'home-garden'),
('Sports', 'Sports equipment and gear', 'sports'),
('Books', 'Books and literature', 'books'),
('Jewelry', 'Jewelry and watches', 'jewelry'),
('Antiques', 'Vintage and antique items', 'antiques');

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for active auctions with current highest bid info
CREATE VIEW active_auctions AS
SELECT 
    p.*,
    c.name as category_name,
    u.name as seller_name,
    u.avatar_url as seller_avatar,
    b.user_id as highest_bidder_id,
    b.bid_amount as highest_bid_amount,
    b.created_at as last_bid_time,
    EXTRACT(EPOCH FROM (p.end_time - NOW())) as seconds_remaining
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN users u ON p.seller_id = u.id
LEFT JOIN bids b ON p.id = b.product_id AND b.status = 'winning'
WHERE p.status = 'active'
ORDER BY p.created_at DESC;

-- View for user's bidding history
CREATE VIEW user_bidding_history AS
SELECT 
    b.*,
    p.title as product_title,
    p.image_urls[1] as product_image,
    p.status as auction_status,
    p.winner_id,
    CASE 
        WHEN p.winner_id = b.user_id THEN 'won'
        WHEN p.status = 'ended' AND p.winner_id != b.user_id THEN 'lost'
        WHEN b.status = 'winning' THEN 'winning'
        WHEN b.status = 'outbid' THEN 'outbid'
        ELSE 'active'
    END as final_status
FROM bids b
JOIN products p ON b.product_id = p.id
ORDER BY b.created_at DESC;
