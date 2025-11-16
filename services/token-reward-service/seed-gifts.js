// Seed sample gifts into database
require('dotenv').config();
const db = require('./src/models');
const { v4: uuidv4 } = require('uuid');

const sampleGifts = [
  {
    name: 'Sổ tay cao cấp',
    description: 'Sổ tay bìa cứng A5, 200 trang giấy kraft chất lượng cao',
    imageUrl: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400',
    tokenPrice: 100,
    stockQuantity: 50,
    category: 'stationery'
  },
  {
    name: 'Bút bi Thiên Long',
    description: 'Bộ 3 bút bi mực xanh, đen, đỏ. Viết mượt, không lem',
    imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400',
    tokenPrice: 50,
    stockQuantity: 100,
    category: 'stationery'
  },
  {
    name: 'Chuột không dây Logitech',
    description: 'Chuột gaming có đèn LED RGB, DPI 3200, kết nối 2.4GHz',
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
    tokenPrice: 500,
    stockQuantity: 20,
    category: 'electronics'
  },
  {
    name: 'Tai nghe Bluetooth Sony',
    description: 'Tai nghe chống ồn chủ động ANC, pin 30h, âm thanh Hi-Res',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    tokenPrice: 800,
    stockQuantity: 15,
    category: 'electronics'
  },
  {
    name: 'Balo laptop chống nước',
    description: 'Balo cao cấp chống nước, ngăn laptop 15.6", thiết kế thời trang',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    tokenPrice: 300,
    stockQuantity: 30,
    category: 'accessories'
  },
  {
    name: 'Voucher Shopee 100K',
    description: 'Mã giảm giá Shopee trị giá 100,000 VNĐ, áp dụng cho đơn từ 0đ',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
    tokenPrice: 200,
    stockQuantity: 100,
    category: 'voucher'
  },
  {
    name: 'Khóa học Udemy',
    description: 'Voucher khóa học Udemy bất kỳ (giá trị tối đa $50)',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
    tokenPrice: 1000,
    stockQuantity: 10,
    category: 'education'
  },
  {
    name: 'Áo thun Code Spark',
    description: 'Áo thun cotton 100%, in logo Code Spark, size M/L/XL',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    tokenPrice: 150,
    stockQuantity: 40,
    category: 'merchandise'
  }
];

async function seedGifts() {
  try {
    console.log('🌱 Starting gift seeding...');
    
    // Sync database (create tables if not exist)
    await db.sequelize.sync();
    console.log('✅ Database synced');

    // Check if gifts already exist
    const existingCount = await db.Gift.count();
    console.log(`📦 Found ${existingCount} existing gifts in database`);

    if (existingCount > 0) {
      console.log('⚠️  Gifts already exist. Delete and re-seed? (y/n)');
      // For automated seeding, we'll skip if data exists
      console.log('Skipping seed. To force re-seed, run: DELETE FROM cm_gifts; in psql');
      process.exit(0);
    }

    // Insert gifts
    console.log(`📝 Inserting ${sampleGifts.length} gifts...`);
    
    for (const gift of sampleGifts) {
      await db.Gift.create(gift);
      console.log(`  ✓ Created gift: ${gift.name} (${gift.tokenPrice} tokens)`);
    }

    console.log('✅ Successfully seeded gifts!');
    console.log(`📊 Total gifts: ${sampleGifts.length}`);
    console.log('\n🎁 Gift Categories:');
    const categories = [...new Set(sampleGifts.map(g => g.category))];
    categories.forEach(cat => {
      const count = sampleGifts.filter(g => g.category === cat).length;
      console.log(`  - ${cat}: ${count} items`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding gifts:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run seed
seedGifts();

